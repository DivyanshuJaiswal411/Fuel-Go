import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import { MapPin, Clock, User, Phone, X } from 'lucide-react-native';

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const { orderId } = params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          pump:petrol_pumps(*),
          delivery_boy:delivery_boys(*)
        `)
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    if (order.status === 'on_the_way' || order.status === 'delivered') {
      Alert.alert('Cannot Cancel', 'This order is already being delivered or has been delivered.');
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

              if (error) throw error;

              Alert.alert('Success', 'Order cancelled successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to cancel order');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'confirmed':
        return '#3b82f6';
      case 'on_the_way':
        return '#2563eb';
      case 'delivered':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Order Placed';
      case 'confirmed':
        return 'Order Confirmed';
      case 'on_the_way':
        return 'On The Way';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Order</Text>
        <Text style={styles.orderId}>Order #{order.id.substring(0, 8).toUpperCase()}</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <MapPin color="#2563eb" size={64} />
        <Text style={styles.mapText}>Map View</Text>
        <Text style={styles.mapSubtext}>Live tracking coming soon</Text>
      </View>

      <View style={[styles.statusCard, { borderColor: getStatusColor(order.status) }]}>
        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
          {getStatusText(order.status)}
        </Text>
      </View>

      <View style={styles.etaCard}>
        <Clock color="#2563eb" size={32} />
        <Text style={styles.etaTime}>{order.eta_minutes} MIN</Text>
        <Text style={styles.etaLabel}>Estimated Arrival</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fuel Type</Text>
          <Text style={styles.detailValue}>{order.fuel_type.toUpperCase()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{order.quantity} Liters</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValue}>₹{order.total_amount}</Text>
        </View>
      </View>

      {order.pump && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Petrol Pump</Text>
          <Text style={styles.pumpName}>{order.pump.name}</Text>
          <Text style={styles.pumpAddress}>{order.pump.address}</Text>
        </View>
      )}

      {order.delivery_boy && (
        <View style={styles.card}>
          <View style={styles.deliveryBoyHeader}>
            <View>
              <Text style={styles.cardTitle}>Delivery Agent</Text>
              <Text style={styles.deliveryBoyName}>{order.delivery_boy.name}</Text>
            </View>
            <TouchableOpacity style={styles.phoneButton}>
              <Phone color="#2563eb" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.addressCard}>
        <MapPin color="#fff" size={20} />
        <View style={styles.addressContent}>
          <Text style={styles.addressLabel}>Delivery Address</Text>
          <Text style={styles.addressText}>{order.delivery_address.address}</Text>
        </View>
      </View>

      {(order.status === 'pending' || order.status === 'confirmed') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelOrder}
        >
          <X color="#fff" size={20} />
          <Text style={styles.cancelButtonText}>Cancel Order</Text>
        </TouchableOpacity>
      )}

      {order.status === 'delivered' && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    color: '#999',
  },
  mapPlaceholder: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  etaCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  etaTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  etaLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginBottom: 4,
  },
  pumpAddress: {
    fontSize: 14,
    color: '#999',
  },
  deliveryBoyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deliveryBoyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  phoneButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCard: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    color: '#e0e7ff',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 16,
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
