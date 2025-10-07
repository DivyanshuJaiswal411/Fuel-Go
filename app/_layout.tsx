import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';

// Conditionally import Stripe only if keys are available
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeMerchantId = process.env.EXPO_PUBLIC_STRIPE_MERCHANT_ID;

let StripeProvider: any = ({ children }: { children: React.ReactNode }) => children;

if (stripePublishableKey && stripeMerchantId) {
  try {
    const { StripeProvider: StripeProviderComponent } = require('@/lib/stripe');
    StripeProvider = StripeProviderComponent;
  } catch (error) {
    console.log('Stripe not configured, using mock payment system');
  }
}

export default function RootLayout() {
  useFrameworkReady();

  const AppContent = () => (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(delivery)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );

  if (stripePublishableKey && stripeMerchantId) {
    return (
      <StripeProvider
        publishableKey={stripePublishableKey}
        merchantIdentifier={stripeMerchantId}
        urlScheme="fuelgo"
      >
        <AppContent />
      </StripeProvider>
    );
  }

  return <AppContent />;
}
