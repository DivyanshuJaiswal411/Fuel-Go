import { PaymentService } from '../lib/paymentService';
import { Order } from '../lib/types';

const mockOrder: Order = {
  id: 'test-order-id',
  user_id: 'test-user-id',
  fuel_type: 'petrol',
  quantity: 10,
  pump_id: 'test-pump-id',
  delivery_address: {
    lat: 28.6139,
    lng: 77.2090,
    address: 'Test Address',
  },
  price_per_liter: 96.50,
  total_amount: 965.00,
  eta_minutes: 25,
  status: 'pending',
  payment_status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const result = await PaymentService.createPaymentIntent(mockOrder);
      
      expect(result).toEqual({
        id: expect.any(String),
        client_secret: expect.any(String),
        amount: 965.00,
        currency: 'inr',
      });
    });

    it('should handle payment intent creation error', async () => {
      // Mock supabase function to throw error
      const { supabase } = require('../lib/supabase');
      supabase.functions.invoke.mockRejectedValueOnce(new Error('Payment failed'));

      await expect(PaymentService.createPaymentIntent(mockOrder))
        .rejects.toThrow('Failed to create payment intent');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const result = await PaymentService.confirmPayment('test-payment-intent-id');
      
      expect(result).toEqual({
        success: true,
        paymentIntentId: expect.any(String),
        error: undefined,
      });
    });

    it('should handle payment confirmation error', async () => {
      const { supabase } = require('../lib/supabase');
      supabase.functions.invoke.mockRejectedValueOnce(new Error('Confirmation failed'));

      const result = await PaymentService.confirmPayment('test-payment-intent-id');
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to confirm payment',
      });
    });
  });

  describe('updateOrderPaymentStatus', () => {
    it('should update order payment status successfully', async () => {
      await expect(
        PaymentService.updateOrderPaymentStatus('test-order-id', 'test-payment-id', 'success')
      ).resolves.not.toThrow();
    });

    it('should handle update error', async () => {
      const { supabase } = require('../lib/supabase');
      supabase.from().update().eq.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        PaymentService.updateOrderPaymentStatus('test-order-id', 'test-payment-id', 'success')
      ).rejects.toThrow('Update failed');
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const result = await PaymentService.refundPayment('test-payment-intent-id', 100);
      
      expect(result).toEqual({
        success: true,
        paymentIntentId: expect.any(String),
        error: undefined,
      });
    });

    it('should handle refund error', async () => {
      const { supabase } = require('../lib/supabase');
      supabase.functions.invoke.mockRejectedValueOnce(new Error('Refund failed'));

      const result = await PaymentService.refundPayment('test-payment-intent-id');
      
      expect(result).toEqual({
        success: false,
        error: 'Failed to process refund',
      });
    });
  });
});