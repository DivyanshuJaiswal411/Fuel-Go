-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  addresses JSONB DEFAULT '[]'::jsonb,
  vehicle_details JSONB DEFAULT '{}'::jsonb,
  monthly_spending DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create petrol_pumps table
CREATE TABLE IF NOT EXISTS petrol_pumps (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location JSONB NOT NULL, -- {lat: number, lng: number}
  address TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  petrol_price DECIMAL(8,2) NOT NULL,
  diesel_price DECIMAL(8,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery_boys table
CREATE TABLE IF NOT EXISTS delivery_boys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  pump_id UUID REFERENCES petrol_pumps(id) ON DELETE CASCADE,
  current_location JSONB, -- {lat: number, lng: number}
  status TEXT CHECK (status IN ('available', 'busy', 'offline')) DEFAULT 'offline',
  assigned_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fuel_type TEXT CHECK (fuel_type IN ('petrol', 'diesel')) NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  pump_id UUID REFERENCES petrol_pumps(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES delivery_boys(id) ON DELETE SET NULL,
  delivery_address JSONB NOT NULL, -- {lat: number, lng: number, address: string}
  price_per_liter DECIMAL(8,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  eta_minutes INTEGER DEFAULT 25,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'on_the_way', 'delivered', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'success', 'failed')) DEFAULT 'pending',
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_mode TEXT,
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT CHECK (status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT CHECK (type IN ('order_update', 'payment_update', 'general')) DEFAULT 'general',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_status ON delivery_boys(status);
CREATE INDEX IF NOT EXISTS idx_delivery_boys_pump_id ON delivery_boys(pump_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Orders policies
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Public access for petrol pumps and delivery boys (read-only for customers)
CREATE POLICY "Anyone can view petrol pumps" ON petrol_pumps
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view delivery boys" ON delivery_boys
  FOR SELECT USING (true);

-- Insert sample data
INSERT INTO petrol_pumps (name, location, address, contact_number, petrol_price, diesel_price) VALUES
('Shell Petrol Pump', '{"lat": 28.6139, "lng": 77.2090}', 'Connaught Place, New Delhi', '+91-9876543210', 96.50, 89.20),
('HP Petrol Pump', '{"lat": 28.5355, "lng": 77.3910}', 'Gurgaon Sector 29', '+91-9876543211', 95.80, 88.90),
('IOCL Petrol Pump', '{"lat": 28.4595, "lng": 77.0266}', 'Noida Sector 18', '+91-9876543212', 96.20, 89.50);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION get_user_orders(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  fuel_type TEXT,
  quantity DECIMAL,
  total_amount DECIMAL,
  status TEXT,
  payment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  pump_name TEXT,
  pump_address TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.fuel_type,
    o.quantity,
    o.total_amount,
    o.status,
    o.payment_status,
    o.created_at,
    pp.name as pump_name,
    pp.address as pump_address
  FROM orders o
  JOIN petrol_pumps pp ON o.pump_id = pp.id
  WHERE o.user_id = user_uuid
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find nearest pump
CREATE OR REPLACE FUNCTION find_nearest_pump(user_lat DECIMAL, user_lng DECIMAL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  petrol_price DECIMAL,
  diesel_price DECIMAL,
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id,
    pp.name,
    pp.address,
    pp.petrol_price,
    pp.diesel_price,
    ROUND(
      6371 * acos(
        cos(radians(user_lat)) * 
        cos(radians((pp.location->>'lat')::DECIMAL)) * 
        cos(radians((pp.location->>'lng')::DECIMAL) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians((pp.location->>'lat')::DECIMAL))
      )::DECIMAL, 2
    ) as distance_km
  FROM petrol_pumps pp
  WHERE pp.is_active = true
  ORDER BY distance_km
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;