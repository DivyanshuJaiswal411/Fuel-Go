export interface User {
  id: string;
  name: string;
  phone: string;
  addresses: Address[];
  vehicle_details: VehicleDetails;
  monthly_spending: number;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface VehicleDetails {
  type?: string;
  number_plate?: string;
  fuel_preference?: 'petrol' | 'diesel';
}

export interface PetrolPump {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  contact_number: string;
  petrol_price: number;
  diesel_price: number;
  is_active: boolean;
  created_at: string;
}

export interface DeliveryBoy {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  pump_id: string;
  current_location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'busy' | 'offline';
  assigned_order_id?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  fuel_type: 'petrol' | 'diesel';
  quantity: number;
  pump_id: string;
  delivery_boy_id?: string;
  delivery_address: {
    lat: number;
    lng: number;
    address: string;
  };
  price_per_liter: number;
  total_amount: number;
  eta_minutes: number;
  status: 'pending' | 'confirmed' | 'on_the_way' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'success' | 'failed';
  payment_id?: string;
  created_at: string;
  updated_at: string;
  delivered_at?: string;
  pump?: PetrolPump;
  delivery_boy?: DeliveryBoy;
}

export interface Transaction {
  id: string;
  user_id: string;
  order_id: string;
  amount: number;
  payment_mode?: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  status: 'success' | 'failed' | 'pending';
  receipt_url?: string;
  created_at: string;
  order?: Order;
}
