import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { User, LogOut, MapPin, Car, ChevronDown, ChevronUp } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showVehicle, setShowVehicle] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: '', address: '', lat: 0, lng: 0 });
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)/login');
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleAddAddress = async () => {
    if (!newAddress.label || !newAddress.address) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    try {
      const addresses = user?.addresses || [];
      const updatedAddresses = [
        ...addresses,
        {
          id: Date.now().toString(),
          ...newAddress,
          lat: 28.6139 + Math.random() * 0.1,
          lng: 77.2090 + Math.random() * 0.1,
        },
      ];

      const { error } = await supabase
        .from('users')
        .update({ addresses: updatedAddresses })
        .eq('id', user?.id);

      if (error) throw error;

      Alert.alert('Success', 'Address added successfully');
      setAddingAddress(false);
      setNewAddress({ label: '', address: '', lat: 0, lng: 0 });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <User color="#2563eb" size={48} />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userPhone}>{user.phone}</Text>
      </View>

      <View style={styles.spendingCard}>
        <Text style={styles.spendingLabel}>This Month Spending</Text>
        <Text style={styles.spendingValue}>₹{user.monthly_spending.toFixed(2)}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowVehicle(!showVehicle)}
        >
          <View style={styles.sectionTitleRow}>
            <Car color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Vehicle Details</Text>
          </View>
          {showVehicle ? (
            <ChevronUp color="#666" size={20} />
          ) : (
            <ChevronDown color="#666" size={20} />
          )}
        </TouchableOpacity>

        {showVehicle && (
          <View style={styles.sectionContent}>
            {user.vehicle_details && Object.keys(user.vehicle_details).length > 0 ? (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{user.vehicle_details.type || 'Not set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Number Plate</Text>
                  <Text style={styles.detailValue}>{user.vehicle_details.number_plate || 'Not set'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fuel Preference</Text>
                  <Text style={styles.detailValue}>
                    {user.vehicle_details.fuel_preference?.toUpperCase() || 'Not set'}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.emptyText}>No vehicle details added</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setShowAddress(!showAddress)}
        >
          <View style={styles.sectionTitleRow}>
            <MapPin color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
          </View>
          {showAddress ? (
            <ChevronUp color="#666" size={20} />
          ) : (
            <ChevronDown color="#666" size={20} />
          )}
        </TouchableOpacity>

        {showAddress && (
          <View style={styles.sectionContent}>
            {user.addresses && user.addresses.length > 0 ? (
              user.addresses.map((address) => (
                <View key={address.id} style={styles.addressItem}>
                  <Text style={styles.addressLabel}>{address.label}</Text>
                  <Text style={styles.addressText}>{address.address}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No addresses saved</Text>
            )}

            {addingAddress ? (
              <View style={styles.addAddressForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Label (e.g., Home, Office)"
                  value={newAddress.label}
                  onChangeText={(text) => setNewAddress({ ...newAddress, label: text })}
                  placeholderTextColor="#666"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Address"
                  value={newAddress.address}
                  onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
                  placeholderTextColor="#666"
                  multiline
                />
                <View style={styles.addAddressButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setAddingAddress(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleAddAddress}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setAddingAddress(true)}
              >
                <Text style={styles.addButtonText}>+ Add Address</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut color="#fff" size={20} />
        <Text style={styles.signOutButtonText}>Sign Out</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#999',
  },
  spendingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  spendingLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  spendingValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sectionContent: {
    padding: 20,
    paddingTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  addressItem: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#999',
  },
  addAddressForm: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  addAddressButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
