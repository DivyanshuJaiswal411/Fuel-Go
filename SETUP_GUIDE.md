# Fuel-Go Setup Guide

This guide will help you complete the setup for your Fuel-Go app with all the necessary API keys and configurations.

## 🔑 Required API Keys

### 1. Expo Push Notifications

**Steps to get Expo Push Notification Key:**

1. **Create Expo Account:**
   - Go to [expo.dev](https://expo.dev)
   - Sign up for a free account
   - Verify your email

2. **Create New Project:**
   - Click "Create a new project"
   - Choose "Blank" template
   - Name: "Fuel-Go"
   - Choose your organization

3. **Get Push Notification Key:**
   - In your Expo dashboard, go to your project
   - Navigate to "Settings" → "Push Notifications"
   - Copy your push notification key (looks like: `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`)

4. **Update .env file:**
   ```env
   EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=ExponentPushToken[your_actual_key_here]
   ```

### 2. Stripe Payment Gateway

**Steps to get Stripe Keys:**

1. **Create Stripe Account:**
   - Go to [stripe.com](https://stripe.com)
   - Sign up for a free account
   - Complete account verification

2. **Get API Keys:**
   - In Stripe Dashboard, go to "Developers" → "API keys"
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

3. **Update .env file:**
   ```env
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
   ```

4. **For Supabase Edge Functions (you'll need this later):**
   - In your Supabase project, go to "Settings" → "API"
   - Add your Stripe secret key as an environment variable:
     - Name: `STRIPE_SECRET_KEY`
     - Value: `sk_test_your_actual_secret_key_here`

### 3. Google Maps API (Already Done ✅)
You already have this configured in your .env file.

## 🚀 EAS CLI Setup

**EAS CLI is already installed!** You can use it with:

```bash
npx eas-cli [command]
```

**Login to EAS:**
```bash
npx eas-cli login
```

**Initialize EAS in your project:**
```bash
npx eas-cli build:configure
```

## 📱 Complete .env File Template

Here's your complete .env file with all the placeholders:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://qcinytnqdtnwndxciotu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjaW55dG5xZHRud25keGNpb3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODU2MDYsImV4cCI6MjA3MTM2MTYwNn0.N6QUxU82EokRkF5dcMWye-uFpuap8DtWUyUgSbetLCg

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
EXPO_PUBLIC_STRIPE_MERCHANT_ID=merchant.com.fuelgo.app

# App Configuration
EXPO_PUBLIC_APP_NAME=Fuel-Go
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_ENVIRONMENT=development

# Google Maps API
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCZmFLi8Ghu8gzFsGAirf_bSARtnTlzgfg

# Push Notifications
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=ExponentPushToken[your_expo_push_token_here]
```

## 🔧 Next Steps After Getting Keys

### 1. Update Your .env File
Replace the placeholder values with your actual keys.

### 2. Test the App
```bash
npm run dev
```

### 3. Set up Supabase Database
1. Go to your Supabase project dashboard
2. Go to "SQL Editor"
3. Run the SQL from `supabase-schema.sql`

### 4. Configure Stripe Webhooks (For Production)
1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Add endpoint: `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 5. Build for Testing
```bash
npx eas-cli build --profile development --platform android
```

## 🆘 Troubleshooting

### EAS CLI Issues
If you have issues with EAS CLI, try:
```bash
# Use npx instead of global install
npx eas-cli [command]

# Or install locally
npm install eas-cli
npx eas-cli [command]
```

### Stripe Issues
- Make sure you're using test keys (pk_test_ and sk_test_)
- Test with Stripe's test card numbers
- Check Stripe dashboard for any errors

### Expo Push Notifications
- Make sure you're using the correct push token format
- Test notifications on a physical device
- Check Expo dashboard for delivery status

## 📞 Support

If you need help:
1. Check the troubleshooting section above
2. Review Expo documentation: [docs.expo.dev](https://docs.expo.dev)
3. Check Stripe documentation: [stripe.com/docs](https://stripe.com/docs)
4. Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)

## ✅ Checklist

- [ ] Expo account created and push token obtained
- [ ] Stripe account created and API keys obtained
- [ ] .env file updated with all keys
- [ ] EAS CLI working (using npx)
- [ ] App runs locally without errors
- [ ] Supabase database schema applied
- [ ] Stripe webhooks configured (for production)

Once you complete these steps, your Fuel-Go app will be fully configured and ready for development and testing!