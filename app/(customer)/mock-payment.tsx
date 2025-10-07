import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { MockPaymentService } from '@/lib/mockPaymentService';
import { Order } from '@/lib/types';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react-native';

export default function MockPaymentScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success' | 'failed'>('details');

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

  const handlePayment = async () => {
    if (!order) return;

    try {
      setLoading(true);
      setPaymentStep('processing');
      
      // Create payment intent
      const paymentIntent = await MockPaymentService.createPaymentIntent(order);
      
      // Simulate payment processing
      const result = await MockPaymentService.confirmPayment(paymentIntent.id);

      if (result.success) {
        setPaymentStep('success');
        await handlePaymentSuccess(paymentIntent.id);
      } else {
        setPaymentStep('failed');
        setTimeout(() => {
          setPaymentStep('details');
          setLoading(false);
        }, 3000);
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('failed');
      setTimeout(() => {
        setPaymentStep('details');
        setLoading(false);
      }, 3000);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Update order payment status
      await MockPaymentService.updateOrderPaymentStatus(order!.id, paymentIntentId, 'success');
      
      // Update order status to confirmed
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order!.id);

      if (error) throw error;

      // Redirect after success
      setTimeout(() => {
        router.replace('/(customer)/(tabs)');
      }, 2000);
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Payment was successful but there was an error updating your order. Please contact support.');
    }
  };

  const retryPayment = () => {
    setPaymentStep('details');
    setLoading(false);
  };

  if (!order) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  const renderPaymentDetails = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Mock Payment</Text>
        <Text style={styles.subtitle}>Test payment system (no real money charged)</Text>
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
        <View style={styles.mockCard}>
          <CreditCard color="#2563eb" size={24} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardNumber}>**** **** **** 1234</Text>
            <Text style={styles.cardType}>Mock Credit Card</Text>
          </View>
        </View>
        <Text style={styles.mockNote}>
          This is a mock payment system for testing. No real money will be charged.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.payButton, loading && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={loading}
        >
          <Text style={styles.payButtonText}>Pay ₹{order.total_amount.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.content}>
      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.processingTitle}>Processing Payment...</Text>
        <Text style={styles.processingText}>Please wait while we process your payment</Text>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.content}>
      <View style={styles.statusContainer}>
        <CheckCircle color="#10b981" size={64} />
        <Text style={styles.statusTitle}>Payment Successful!</Text>
        <Text style={styles.statusText}>
          Your fuel order has been confirmed. You will receive updates on your order status.
        </Text>
        <Text style={styles.redirectText}>Redirecting to home...</Text>
      </View>
    </View>
  );

  const renderFailed = () => (
    <View style={styles.content}>
      <View style={styles.statusContainer}>
        <XCircle color="#ef4444" size={64} />
        <Text style={styles.statusTitle}>Payment Failed</Text>
        <Text style={styles.statusText}>
          Payment could not be processed. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryPayment}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {paymentStep === 'details' && renderPaymentDetails()}
      {paymentStep === 'processing' && renderProcessing()}
      {paymentStep === 'success' && renderSuccess()}
      {paymentStep === 'failed' && renderFailed()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
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
  mockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardInfo: {
    marginLeft: 12,
  },
  cardNumber: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  cardType: {
    fontSize: 14,
    color: '#999',
  },
  mockNote: {
    fontSize: 12,
    color: '#fbbf24',
    fontStyle: 'italic',
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
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
  },
  processingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  redirectText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});