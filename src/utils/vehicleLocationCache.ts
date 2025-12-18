import type { VehicleLocationMessage } from '../hooks/useVehicleTracking';
import { webStorage } from './webStorage';

/**
 * Cache utility để lưu trữ vị trí cuối cùng của vehicle
 * Đảm bảo markers không bao giờ bị mất dù có mất kết nối
 */
class VehicleLocationCache {
  private static instance: VehicleLocationCache;
  private cache = new Map<string, VehicleLocationMessage>();
  private storageKey = 'vehicle_location_cache';

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): VehicleLocationCache {
    if (!VehicleLocationCache.instance) {
      VehicleLocationCache.instance = new VehicleLocationCache();
    }
    return VehicleLocationCache.instance;
  }

  /**
   * Lưu hoặc cập nhật vị trí vehicle
   */
  updateVehicleLocation(vehicleId: string, location: VehicleLocationMessage): void {
    const existing = this.cache.get(vehicleId);
    
    // Chỉ cập nhật nếu có tọa độ hợp lệ hoặc timestamp mới hơn
    if (this.isValidLocation(location) || !existing || this.isNewerTimestamp(location, existing)) {
      this.cache.set(vehicleId, {
        ...location,
        // Giữ lại tọa độ cuối cùng hợp lệ nếu tọa độ hiện tại không hợp lệ
        latitude: this.isValidCoordinate(location.latitude) ? location.latitude : (existing?.latitude || null),
        longitude: this.isValidCoordinate(location.longitude) ? location.longitude : (existing?.longitude || null),
      });
      
      this.saveToStorage();
      
    }
  }

  /**
   * Cập nhật nhiều vehicle cùng lúc
   */
  updateMultipleVehicles(vehicles: VehicleLocationMessage[]): void {
    vehicles.forEach(vehicle => {
      this.updateVehicleLocation(vehicle.vehicleId, vehicle);
    });
  }

  /**
   * Lấy vị trí của một vehicle (ưu tiên cache nếu có)
   */
  getVehicleLocation(vehicleId: string): VehicleLocationMessage | null {
    return this.cache.get(vehicleId) || null;
  }

  /**
   * Lấy tất cả vehicle locations từ cache
   */
  getAllVehicleLocations(): VehicleLocationMessage[] {
    return Array.from(this.cache.values());
  }

  /**
   * Lấy vehicles cho một order cụ thể (dựa trên trackingCode hoặc vehicleAssignmentId)
   */
  getVehiclesForOrder(orderId: string): VehicleLocationMessage[] {
    // Lọc vehicles dựa trên trackingCode chứa orderId hoặc các logic khác
    return Array.from(this.cache.values()).filter(vehicle => 
      vehicle.trackingCode?.includes(orderId) || 
      vehicle.vehicleAssignmentId?.includes(orderId)
    );
  }

  /**
   * Xóa vehicle khỏi cache
   */
  removeVehicle(vehicleId: string): void {
    this.cache.delete(vehicleId);
    this.saveToStorage();
  }

  /**
   * Xóa toàn bộ cache
   */
  clearCache(): void {
    this.cache.clear();
    this.saveToStorage();
  }

  /**
   * Kiểm tra vị trí có hợp lệ không
   */
  private isValidLocation(location: VehicleLocationMessage): boolean {
    return this.isValidCoordinate(location.latitude) && this.isValidCoordinate(location.longitude);
  }

  /**
   * Kiểm tra tọa độ có hợp lệ không
   */
  private isValidCoordinate(coord: number | null): boolean {
    return coord !== null && 
           !isNaN(coord) && 
           isFinite(coord) &&
           Math.abs(coord) > 0.000001; // Loại bỏ các giá trị gần 0
  }

  /**
   * Kiểm tra timestamp có mới hơn không
   */
  private isNewerTimestamp(newLocation: VehicleLocationMessage, existing: VehicleLocationMessage): boolean {
    if (!newLocation.lastUpdated || !existing.lastUpdated) {
      return !!newLocation.lastUpdated; // Ưu tiên có timestamp hơn không có
    }
    
    try {
      const newTime = new Date(newLocation.lastUpdated).getTime();
      const existingTime = new Date(existing.lastUpdated).getTime();
      return newTime > existingTime;
    } catch (error) {
      console.warn('[VehicleCache] Error comparing timestamps:', error);
      return false;
    }
  }

  /**
   * Lưu cache vào localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      webStorage.setItem(this.storageKey, JSON.stringify(data), 'session');
    } catch (error) {
      console.warn('[VehicleCache] Failed to save to localStorage:', error);
    }
  }

  /**
   * Tải cache từ localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = webStorage.getItem(this.storageKey, 'session');
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          // Chỉ tải dữ liệu trong vòng 24 giờ qua
          const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
          
          data.forEach(([vehicleId, location]) => {
            if (location.lastUpdated) {
              const locationTime = new Date(location.lastUpdated).getTime();
              if (locationTime > oneDayAgo) {
                this.cache.set(vehicleId, location);
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn('[VehicleCache] Failed to load from localStorage:', error);
      // Xóa dữ liệu lỗi
      webStorage.removeItem(this.storageKey, 'session');
    }
  }

  /**
   * Merge vehicle locations từ WebSocket với cache
   * Đảm bảo luôn có marker hiển thị dù mất kết nối
   */
  mergeWithWebSocketData(webSocketVehicles: VehicleLocationMessage[]): VehicleLocationMessage[] {
    // Cập nhật cache với dữ liệu mới từ WebSocket
    this.updateMultipleVehicles(webSocketVehicles);

    // Lấy tất cả vehicles từ cache (bao gồm cả những vehicle có thể đã mất kết nối)
    const allCachedVehicles = this.getAllVehicleLocations();

    // Tạo map để dễ lookup
    const webSocketVehicleMap = new Map(
      webSocketVehicles.map(v => [v.vehicleId, v])
    );

    // Merge dữ liệu: ưu tiên WebSocket nếu có, fallback về cache
    const mergedVehicles = allCachedVehicles.map(cachedVehicle => {
      const webSocketVehicle = webSocketVehicleMap.get(cachedVehicle.vehicleId);
      
      if (webSocketVehicle && this.isValidLocation(webSocketVehicle)) {
        // Có dữ liệu mới và hợp lệ từ WebSocket
        return webSocketVehicle;
      } else if (webSocketVehicle) {
        // Có dữ liệu từ WebSocket nhưng tọa độ không hợp lệ, merge với cache
        return {
          ...webSocketVehicle,
          latitude: this.isValidCoordinate(webSocketVehicle.latitude) ? 
            webSocketVehicle.latitude : cachedVehicle.latitude,
          longitude: this.isValidCoordinate(webSocketVehicle.longitude) ? 
            webSocketVehicle.longitude : cachedVehicle.longitude,
        };
      } else {
        // Không có dữ liệu từ WebSocket, dùng cache (với indicator là dữ liệu cũ)
        return {
          ...cachedVehicle,
          lastUpdated: cachedVehicle.lastUpdated, // Giữ nguyên timestamp cũ để nhận biết
        };
      }
    });

    return mergedVehicles.filter(vehicle => this.isValidLocation(vehicle));
  }

  /**
   * Kiểm tra vehicle có đang online không (dựa trên timestamp)
   */
  isVehicleOnline(vehicle: VehicleLocationMessage, timeoutMinutes: number = 5): boolean {
    if (!vehicle.lastUpdated) return false;
    
    try {
      const lastUpdate = new Date(vehicle.lastUpdated).getTime();
      const now = Date.now();
      const timeout = timeoutMinutes * 60 * 1000;
      
      return (now - lastUpdate) < timeout;
    } catch {
      return false;
    }
  }
}

export default VehicleLocationCache;
