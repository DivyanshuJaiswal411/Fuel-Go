// Test script to verify your setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Fuel-Go Setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('   Please create .env file from .env.example');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check for required environment variables
const requiredVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'
];

// Optional environment variables
const optionalVars = [
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

const missingVars = [];
const placeholderVars = [];

requiredVars.forEach(varName => {
  const regex = new RegExp(`${varName}=(.+)`);
  const match = envContent.match(regex);
  
  if (!match) {
    missingVars.push(varName);
  } else {
    const value = match[1].trim();
    if (value.includes('your_') || value.includes('_here') || value === '') {
      placeholderVars.push(varName);
    }
  }
});

// Display results
console.log('📋 Setup Status:\n');

if (missingVars.length === 0 && placeholderVars.length === 0) {
  console.log('✅ All environment variables are configured!');
} else {
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  if (placeholderVars.length > 0) {
    console.log('⚠️  Environment variables with placeholder values:');
    placeholderVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
}

console.log('\n📝 Next Steps:');
console.log('1. App is ready to run with mock payment system!');
console.log('2. Optional: Get Stripe keys from stripe.com for real payments');
console.log('3. Push notifications are handled in-app (no external service needed)');
console.log('4. Run: npm run dev to start the app');

console.log('\n🚀 Ready to test? Run: npm run dev');