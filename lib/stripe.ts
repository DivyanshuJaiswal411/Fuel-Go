import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

const stripePublishableKey = Constants.expoConfig?.extra?.stripePublishableKey || process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeMerchantId = Constants.expoConfig?.extra?.stripeMerchantId || process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

export const stripeConfig = {
  publishableKey: stripePublishableKey,
  merchantId: stripeMerchantId,
  urlScheme: 'fuelgo', // This should match your app's URL scheme
};

export { StripeProvider };