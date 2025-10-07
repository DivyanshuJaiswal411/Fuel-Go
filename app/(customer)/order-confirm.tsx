import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PetrolPump } from '@/lib/types';
import { SimpleNotificationService } from '@/lib/simpleNotificationService';
import { MapPin, Clock, Fuel } from 'lucide-react-native';

export default function OrderConfirmScreen() {
  const params = useLocalSearchParams();
  const { fuelType, quantity, pumpId, totalAmount } = params;
  const [pump, setPump] = useState<PetrolPump | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadPump();
  }, [pumpId]);

  const loadPump = async () => {
    try {
      const { data, error } = await supabase
        .from('petrol_pumps')
        .select('*')
        .eq('id', pumpId)
        .maybeSingle();

      if (error) throw error;
      setPump(data);
    } catch (error) {
      console.error('Error loading pump:', error);
    }
  };

  const handleConfirmOrder = async () => {
    if (!user || !pump) return;

    if (!user.addresses || user.addresses.length === 0) {
      Alert.alert('Error', 'Please add a delivery address first');
      return;
    }

    setLoading(true);
    try {
      const deliveryAddress = user.addresses[0];

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fuel_type: fuelType,
          quantity: parseFloat(quantity as string),
          pump_id: pump.id,
          delivery_address: {
            lat: deliveryAddress.lat,
            lng: deliveryAddress.lng,
            address: deliveryAddress.address,
          },
          price_per_liter: fuelType === 'petrol' ? pump.petrol_price : pump.diesel_price,
          total_amount: parseFloat(totalAmount as string),
          eta_minutes: 25,
          status: 'pending',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Send order confirmation notification
      await SimpleNotificationService.sendOrderStatusUpdate(
        user.id,
        orderData.id,
        'confirmed'
      );

      // Redirect to mock payment screen
      router.replace({
        pathname: '/(customer)/mock-payment',
        params: { orderId: orderData.id },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const deliveryAddress = user?.addresses?.[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Order</Text>
        <Text style={styles.subtitle}>Review your order details</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Fuel color="#2563eb" size={24} />
          <Text style={styles.cardTitle}>Order Details</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fuel Type</Text>
          <Text style={styles.detailValue}>{(fuelType as string).toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{quantity} Liters</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price per Liter</Text>
          <Text style={styles.detailValue}>
            ₹{pump ? (fuelType === 'petrol' ? pump.petrol_price : pump.diesel_price) : 0}
          </Text>
        </View>
      </View>

      {pump && (
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <MapPin color="#2563eb" size={24} />
            <Text style={styles.cardTitle}>Petrol Pump</Text>
          </View>
          <Text style={styles.pumpName}>{pump.name}</Text>
          <Text style={styles.pumpAddress}>{pump.address}</Text>
        </View>
      )}

      {deliveryAddress && (
        <View style={styles.card}>
          <View style={styles.iconRow}>
            <MapPin color="#2563eb" size={24} />
            <Text style={styles.cardTitle}>Delivery Address</Text>
          </View>
          <Text style={styles.addressLabel}>{deliveryAddress.label}</Text>
          <Text style={styles.addressText}>{deliveryAddress.address}</Text>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.iconRow}>
          <Clock color="#2563eb" size={24} />
          <Text style={styles.cardTitle}>Estimated Time</Text>
        </View>
        <Text style={styles.etaText}>20-30 minutes</Text>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>₹{parseFloat(totalAmount as string).toFixed(2)}</Text>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={handleConfirmOrder}
          disabled={loading}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Processing...' : 'Confirm & Pay'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  pumpName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  pumpAddress: {
    fontSize: 14,
    color: '#999',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#999',
  },
  etaText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  totalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  totalLabel: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
