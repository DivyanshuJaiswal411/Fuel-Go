import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { PetrolPump } from '@/lib/types';

export default function OrderFuelScreen() {
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
  const [quantity, setQuantity] = useState('5');
  const [loading, setLoading] = useState(false);
  const [nearestPump, setNearestPump] = useState<PetrolPump | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadNearestPump();
  }, []);

  const loadNearestPump = async () => {
    try {
      const { data, error } = await supabase
        .from('petrol_pumps')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setNearestPump(data);
    } catch (error) {
      console.error('Error loading pump:', error);
    }
  };

  const calculatePrice = () => {
    if (!nearestPump || !quantity) return 0;
    const price = fuelType === 'petrol' ? nearestPump.petrol_price : nearestPump.diesel_price;
    return price * parseFloat(quantity);
  };

  const handleOrderNow = () => {
    if (!nearestPump) {
      Alert.alert('Error', 'No nearby pump available. Please try again later.');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!user?.addresses || user.addresses.length === 0) {
      Alert.alert('Error', 'Please add a delivery address in your profile first');
      return;
    }

    router.push({
      pathname: '/(customer)/order-confirm',
      params: {
        fuelType,
        quantity,
        pumpId: nearestPump.id,
        totalAmount: calculatePrice().toString(),
      },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Fuel</Text>
        <Text style={styles.subtitle}>Quick delivery to your doorstep</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Select Fuel Type</Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.typeButton, fuelType === 'petrol' && styles.typeButtonActive]}
            onPress={() => setFuelType('petrol')}
          >
            <Text style={[styles.typeButtonText, fuelType === 'petrol' && styles.typeButtonTextActive]}>
              Petrol
            </Text>
            {nearestPump && (
              <Text style={[styles.priceText, fuelType === 'petrol' && styles.priceTextActive]}>
                ₹{nearestPump.petrol_price}/L
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeButton, fuelType === 'diesel' && styles.typeButtonActive]}
            onPress={() => setFuelType('diesel')}
          >
            <Text style={[styles.typeButtonText, fuelType === 'diesel' && styles.typeButtonTextActive]}>
              Diesel
            </Text>
            {nearestPump && (
              <Text style={[styles.priceText, fuelType === 'diesel' && styles.priceTextActive]}>
                ₹{nearestPump.diesel_price}/L
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Quantity (Liters)</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity((prev) => Math.max(1, parseFloat(prev) - 1).toString())}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.quantityInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => setQuantity((prev) => (parseFloat(prev) + 1).toString())}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {nearestPump && (
        <View style={styles.card}>
          <Text style={styles.label}>Nearest Pump</Text>
          <View style={styles.pumpInfo}>
            <Text style={styles.pumpName}>{nearestPump.name}</Text>
            <Text style={styles.pumpAddress}>{nearestPump.address}</Text>
            <Text style={styles.eta}>Estimated delivery: 20-30 mins</Text>
          </View>
        </View>
      )}

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Estimated Price</Text>
        <Text style={styles.priceValue}>₹{calculatePrice().toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.orderButton, loading && styles.orderButtonDisabled]}
        onPress={handleOrderNow}
        disabled={loading}
      >
        <Text style={styles.orderButtonText}>Order Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  typeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  priceText: {
    fontSize: 14,
    color: '#666',
  },
  priceTextActive: {
    color: '#e0e7ff',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    backgroundColor: '#2563eb',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
  },
  quantityInput: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pumpInfo: {
    gap: 8,
  },
  pumpName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  pumpAddress: {
    fontSize: 14,
    color: '#999',
  },
  eta: {
    fontSize: 14,
    color: '#2563eb',
    marginTop: 4,
  },
  priceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  priceLabel: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  orderButton: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  orderButtonDisabled: {
    opacity: 0.6,
  },
  orderButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
