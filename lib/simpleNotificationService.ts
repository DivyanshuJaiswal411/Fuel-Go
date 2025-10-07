import { Alert } from 'react-native';
import { supabase } from './supabase';

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'order_update' | 'payment_update' | 'general';
  orderId?: string;
  userId: string;
  read: boolean;
  createdAt: string;
}

export class SimpleNotificationService {
  // Store notifications in Supabase instead of using push notifications
  static async createNotification(
    userId: string,
    title: string,
    body: string,
    type: 'order_update' | 'payment_update' | 'general' = 'general',
    orderId?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          type,
          order_id: orderId,
          read: false,
        });

      if (error) throw error;

      // Show local alert for immediate feedback
      Alert.alert(title, body);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Get user notifications
  static async getUserNotifications(userId: string): Promise<NotificationData[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Get unread count
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Order-specific notifications
  static async sendOrderStatusUpdate(
    userId: string,
    orderId: string,
    status: string
  ): Promise<void> {
    let title = '';
    let body = '';

    switch (status) {
      case 'confirmed':
        title = 'Order Confirmed! 🎉';
        body = 'Your fuel order has been confirmed and will be delivered soon.';
        break;
      case 'on_the_way':
        title = 'Order On The Way! 🚗';
        body = 'Your fuel is being delivered. Track your order for real-time updates.';
        break;
      case 'delivered':
        title = 'Order Delivered! ✅';
        body = 'Your fuel has been successfully delivered. Thank you for choosing Fuel-Go!';
        break;
      case 'cancelled':
        title = 'Order Cancelled ❌';
        body = 'Your fuel order has been cancelled. Refund will be processed within 3-5 business days.';
        break;
      default:
        return;
    }

    await this.createNotification(userId, title, body, 'order_update', orderId);
  }

  // Payment-specific notifications
  static async sendPaymentUpdate(
    userId: string,
    orderId: string,
    status: 'success' | 'failed'
  ): Promise<void> {
    const title = status === 'success' ? 'Payment Successful! 💳' : 'Payment Failed ❌';
    const body =
      status === 'success'
        ? 'Your payment has been processed successfully. Your order is confirmed.'
        : 'Payment could not be processed. Please try again or use a different payment method.';

    await this.createNotification(userId, title, body, 'payment_update', orderId);
  }

  // General notifications
  static async sendGeneralNotification(
    userId: string,
    title: string,
    body: string
  ): Promise<void> {
    await this.createNotification(userId, title, body, 'general');
  }

  // Clean up old notifications (keep last 30 days)
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }
}