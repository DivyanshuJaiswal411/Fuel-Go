import { supabase } from './supabase';
import { Order } from './types';
import { SimpleNotificationService } from './simpleNotificationService';

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

export class MockPaymentService {
  static async createPaymentIntent(order: Order): Promise<PaymentIntent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret`,
      amount: order.total_amount,
      currency: 'inr',
    };
  }

  static async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 95% success rate
    const isSuccess = Math.random() > 0.05;
    
    if (isSuccess) {
      return {
        success: true,
        paymentIntentId,
      };
    } else {
      return {
        success: false,
        error: 'Payment failed. Please try again.',
      };
    }
  }

  static async updateOrderPaymentStatus(orderId: string, paymentId: string, status: 'success' | 'failed'): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: status,
          payment_id: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          order_id: orderId,
          amount: 0, // Will be updated from order
          payment_mode: 'mock',
          status: status,
          razorpay_payment_id: paymentId,
        });

      if (transactionError) throw transactionError;

      // Send notification
      await SimpleNotificationService.sendPaymentUpdate(order.user_id, orderId, status);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  static async refundPayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      paymentIntentId,
    };
  }
}