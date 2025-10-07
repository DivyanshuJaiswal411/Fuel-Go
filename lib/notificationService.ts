import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    return true;
  }

  static async getExpoPushToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async registerForPushNotifications(userId: string): Promise<void> {
    try {
      const token = await this.getExpoPushToken();
      if (!token) {
        throw new Error('Failed to get push token');
      }

      // Store the token in Supabase
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          expo_push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      console.log('Push token registered successfully');
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  }

  static async sendOrderNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      // Get user's push token
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_push_tokens')
        .select('expo_push_token')
        .eq('user_id', userId)
        .single();

      if (tokenError || !tokenData) {
        console.log('No push token found for user');
        return;
      }

      // Send notification via Expo's push service
      const message = {
        to: tokenData.expo_push_token,
        sound: 'default',
        title,
        body,
        data: data || {},
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async scheduleOrderReminder(
    orderId: string,
    delayMinutes: number = 30
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Order Reminder',
          body: 'Your fuel order is still pending. Tap to check status.',
          data: { orderId },
        },
        trigger: {
          seconds: delayMinutes * 60,
        },
      });
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
  }

  static async cancelOrderReminder(orderId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const reminderNotification = scheduledNotifications.find(
        (notification) => notification.content.data?.orderId === orderId
      );

      if (reminderNotification) {
        await Notifications.cancelScheduledNotificationAsync(reminderNotification.identifier);
      }
    } catch (error) {
      console.error('Error canceling reminder:', error);
    }
  }

  static async sendOrderStatusUpdate(
    userId: string,
    orderId: string,
    status: string
  ): Promise<void> {
    let title = '';
    let body = '';

    switch (status) {
      case 'confirmed':
        title = 'Order Confirmed!';
        body = 'Your fuel order has been confirmed and will be delivered soon.';
        break;
      case 'on_the_way':
        title = 'Order On The Way!';
        body = 'Your fuel is being delivered. Track your order for real-time updates.';
        break;
      case 'delivered':
        title = 'Order Delivered!';
        body = 'Your fuel has been successfully delivered. Thank you for choosing Fuel-Go!';
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        body = 'Your fuel order has been cancelled. Refund will be processed within 3-5 business days.';
        break;
      default:
        return;
    }

    await this.sendOrderNotification(userId, title, body, {
      orderId,
      status,
      type: 'order_update',
    });
  }

  static async sendPaymentUpdate(
    userId: string,
    orderId: string,
    status: 'success' | 'failed'
  ): Promise<void> {
    const title = status === 'success' ? 'Payment Successful!' : 'Payment Failed';
    const body =
      status === 'success'
        ? 'Your payment has been processed successfully. Your order is confirmed.'
        : 'Payment could not be processed. Please try again or use a different payment method.';

    await this.sendOrderNotification(userId, title, body, {
      orderId,
      status,
      type: 'payment_update',
    });
  }
}