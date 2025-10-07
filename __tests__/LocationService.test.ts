import { LocationService } from '../lib/locationService';

describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestLocationPermission', () => {
    it('should return true when permission is granted', async () => {
      const result = await LocationService.requestLocationPermission();
      expect(result).toBe(true);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return location data when permission is granted', async () => {
      const location = await LocationService.getCurrentLocation();
      
      expect(location).toEqual({
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Test Street Test City Test Region 12345',
      });
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const distance = LocationService.calculateDistance(
        28.6139, 77.2090, // Delhi
        28.5355, 77.3910  // Gurgaon
      );
      
      expect(distance).toBeCloseTo(20.5, 1); // Approximately 20.5 km
    });

    it('should return 0 for same coordinates', () => {
      const distance = LocationService.calculateDistance(
        28.6139, 77.2090,
        28.6139, 77.2090
      );
      
      expect(distance).toBe(0);
    });
  });
});