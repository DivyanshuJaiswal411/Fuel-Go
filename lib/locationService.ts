import * as Location from 'expo-location';
import { supabase } from './supabase';
import { PetrolPump } from './types';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export class LocationService {
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      const address = await this.getAddressFromCoordinates(latitude, longitude);

      return {
        latitude,
        longitude,
        address,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  static async getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        return `${address.street || ''} ${address.city || ''} ${address.region || ''} ${address.postalCode || ''}`.trim();
      }
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }

  static async findNearestPump(userLat: number, userLng: number): Promise<PetrolPump | null> {
    try {
      const { data, error } = await supabase.rpc('find_nearest_pump', {
        user_lat: userLat,
        user_lng: userLng,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const pumpData = data[0];
        return {
          id: pumpData.id,
          name: pumpData.name,
          location: {
            lat: userLat, // This would be the actual pump location in a real implementation
            lng: userLng,
          },
          address: pumpData.address,
          contact_number: '', // Would be fetched from pump data
          petrol_price: pumpData.petrol_price,
          diesel_price: pumpData.diesel_price,
          is_active: true,
          created_at: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error finding nearest pump:', error);
      return null;
    }
  }

  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  static async watchLocation(
    callback: (location: LocationData) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        async (location) => {
          const { latitude, longitude } = location.coords;
          const address = await this.getAddressFromCoordinates(latitude, longitude);
          
          callback({
            latitude,
            longitude,
            address,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }
}