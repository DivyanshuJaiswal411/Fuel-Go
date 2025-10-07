# Fuel-Go Production Deployment Guide

This guide will help you deploy the Fuel-Go app to production with all necessary configurations.

## Prerequisites

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
3. **Stripe Account**: Sign up at [stripe.com](https://stripe.com)
4. **Google Cloud Console**: For Google Maps API
5. **Apple Developer Account**: For iOS deployment
6. **Google Play Console**: For Android deployment

## Step 1: Environment Setup

### 1.1 Install EAS CLI
```bash
npm install -g @expo/eas-cli
eas login
```

### 1.2 Configure Environment Variables
Update `.env` file with your production values:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_production_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
EXPO_PUBLIC_STRIPE_MERCHANT_ID=merchant.com.fuelgo.app

# App Configuration
EXPO_PUBLIC_APP_NAME=Fuel-Go
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=production

# Google Maps API
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Push Notifications
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=your_push_notification_key
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2.2 Set up Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Run the SQL from `supabase-schema.sql`
3. Enable Row Level Security (RLS) policies

### 2.3 Configure Authentication
1. Go to Authentication > Settings
2. Configure email templates
3. Set up OAuth providers if needed
4. Configure redirect URLs

### 2.4 Set up Edge Functions (for Stripe)
Create the following edge functions in Supabase:

#### create-payment-intent
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, order_id, customer_id } = await req.json()
    
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2022-11-15',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        order_id,
        customer_id,
      },
    })

    return new Response(
      JSON.stringify({
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
```

## Step 3: Stripe Setup

### 3.1 Create Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Get your publishable and secret keys

### 3.2 Configure Webhooks
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 3.3 Set up Apple Pay & Google Pay
1. Configure Apple Pay in Stripe Dashboard
2. Set up Google Pay for Android
3. Update merchant identifiers in app.json

## Step 4: Google Maps Setup

### 4.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Maps JavaScript API, Places API, and Geocoding API

### 4.2 Generate API Key
1. Go to Credentials
2. Create API Key
3. Restrict the key to your app's bundle ID

## Step 5: Push Notifications Setup

### 5.1 Configure Expo Push Notifications
1. Go to your Expo project settings
2. Configure push notification settings
3. Upload your APNs certificate (iOS)
4. Configure FCM (Android)

## Step 6: Build and Deploy

### 6.1 Configure EAS Build
```bash
eas build:configure
```

### 6.2 Build for Development
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### 6.3 Build for Production
```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

### 6.4 Submit to App Stores
```bash
eas submit --platform android
eas submit --platform ios
```

## Step 7: Monitoring and Analytics

### 7.1 Set up Crashlytics
1. Add Firebase to your project
2. Configure crash reporting
3. Set up performance monitoring

### 7.2 Set up Analytics
1. Configure Expo Analytics
2. Set up custom event tracking
3. Monitor user engagement

## Step 8: Security Checklist

- [ ] Environment variables are properly configured
- [ ] API keys are restricted and secure
- [ ] Database RLS policies are enabled
- [ ] Stripe webhooks are properly configured
- [ ] Push notification certificates are valid
- [ ] App signing certificates are properly configured
- [ ] All sensitive data is encrypted

## Step 9: Testing

### 9.1 Test Payment Flow
1. Test with Stripe test cards
2. Verify webhook handling
3. Test refund functionality

### 9.2 Test Location Services
1. Test GPS functionality
2. Verify pump location accuracy
3. Test address geocoding

### 9.3 Test Push Notifications
1. Test on both iOS and Android
2. Verify notification delivery
3. Test deep linking

## Step 10: Launch

### 10.1 Pre-launch Checklist
- [ ] All features tested
- [ ] Performance optimized
- [ ] Security audit completed
- [ ] App store assets ready
- [ ] Support documentation ready

### 10.2 Launch Strategy
1. Soft launch in limited markets
2. Monitor crash reports and user feedback
3. Gradual rollout to all markets
4. Marketing campaign launch

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check EAS build logs
   - Verify environment variables
   - Update dependencies

2. **Payment Issues**
   - Verify Stripe configuration
   - Check webhook endpoints
   - Test with different payment methods

3. **Location Issues**
   - Verify Google Maps API key
   - Check location permissions
   - Test on physical devices

4. **Push Notification Issues**
   - Verify certificates
   - Check Expo push token
   - Test notification delivery

## Support

For additional support:
- Check Expo documentation
- Supabase documentation
- Stripe documentation
- Create issues in the project repository

## Maintenance

### Regular Tasks
- Monitor app performance
- Update dependencies
- Review security configurations
- Monitor user feedback
- Update app store listings

### Monthly Tasks
- Review analytics data
- Update pump prices
- Check for security updates
- Review crash reports
- Update documentation