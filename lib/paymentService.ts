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

export class PaymentService {
  static async createPaymentIntent(order: Order): Promise<PaymentIntent> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: Math.round(order.total_amount * 100), // Convert to cents
          currency: 'inr',
          order_id: order.id,
          customer_id: order.user_id,
        },
      });

      if (error) throw error;

      return {
        id: data.payment_intent_id,
        client_secret: data.client_secret,
        amount: order.total_amount,
        currency: 'inr',
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  static async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: {
          payment_intent_id: paymentIntentId,
        },
      });

      if (error) throw error;

      return {
        success: data.success,
        paymentIntentId: data.payment_intent_id,
        error: data.error,
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: 'Failed to confirm payment',
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
          payment_mode: 'stripe',
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
    try {
      const { data, error } = await supabase.functions.invoke('refund-payment', {
        body: {
          payment_intent_id: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        },
      });

      if (error) throw error;

      return {
        success: data.success,
        paymentIntentId: data.payment_intent_id,
        error: data.error,
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: 'Failed to process refund',
      };
    }
  }
}