import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentService } from '@/lib/paymentService';
import { Order } from '@/lib/types';

export default function PaymentScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (params.orderId) {
      loadOrder(params.orderId as string);
    }
  }, [params.orderId]);

  const loadOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
    }
  };

  const initializePaymentSheet = async () => {
    if (!order) return;

    try {
      setLoading(true);
      
      // Create payment intent
      const paymentIntent = await PaymentService.createPaymentIntent(order);
      
      const { error } = await initPaymentSheet({
        merchantDisplayName: 'Fuel-Go',
        paymentIntentClientSecret: paymentIntent.client_secret,
        allowsDelayedPaymentMethods: true,
        returnURL: 'fuelgo://payment-return',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Error', presentError.message);
        }
        return;
      }

      // Payment successful
      await handlePaymentSuccess(paymentIntent.id);
      
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update order payment status
      await PaymentService.updateOrderPaymentStatus(order!.id, paymentIntentId, 'success');
      
      // Update order status to confirmed
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order!.id);

      if (error) throw error;

      Alert.alert(
        'Payment Successful!',
        'Your fuel order has been confirmed. You will receive updates on your order status.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(customer)/(tabs)'),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Payment was successful but there was an error updating your order. Please contact support.');
    }
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Complete your fuel order</Text>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Fuel Type:</Text>
          <Text style={styles.detailValue}>{order.fuel_type.toUpperCase()}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity:</Text>
          <Text style={styles.detailValue}>{order.quantity} Liters</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price per Liter:</Text>
          <Text style={styles.detailValue}>₹{order.price_per_liter}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.detailRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{order.total_amount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.paymentMethods}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        <Text style={styles.paymentNote}>
          Secure payment powered by Stripe. Your payment information is encrypted and secure.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <View
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onTouchEnd={loading ? undefined : initializePaymentSheet}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{order.total_amount.toFixed(2)}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  header: {
    marginBottom: 32,
    marginTop: 60,
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
  loadingText: {
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  orderDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 24,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  paymentMethods: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  paymentNote: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  payButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});