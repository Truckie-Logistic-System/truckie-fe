export enum VehicleAssignmentEnum {
    UNASSIGNED = 'UNASSIGNED',        // Vehicle not assigned to any driver/route
    ASSIGNED_TO_DRIVER = 'ASSIGNED_TO_DRIVER', // Assigned directly to a driver
    ASSIGNED_TO_ROUTE = 'ASSIGNED_TO_ROUTE',  // Assigned to a route or trip
    RESERVED = 'RESERVED',           // Reserved for upcoming assignment
    IN_TRANSIT = 'IN_TRANSIT',         // Currently on an active trip
    ON_STANDBY = 'ON_STANDBY',         // Idle but ready for assignment
    MAINTENANCE_HOLD = 'MAINTENANCE_HOLD',   // Blocked due to maintenance
    DECOMMISSIONED = 'DECOMMISSIONED',      // Permanently retired, cannot be reassigned
    COMPLETE = 'COMPLETE',
    ASSIGNED = 'ASSIGNED',
    AVAILABLE = 'AVAILABLE',
    IN_TRIP = 'IN_TRIP',
    COMPLETED = 'COMPLETED'
}

export const VehicleAssignmentColors = {
    [VehicleAssignmentEnum.UNASSIGNED]: 'bg-gray-400 text-white',
    [VehicleAssignmentEnum.ASSIGNED_TO_DRIVER]: 'bg-blue-500 text-white',
    [VehicleAssignmentEnum.ASSIGNED_TO_ROUTE]: 'bg-indigo-500 text-white',
    [VehicleAssignmentEnum.RESERVED]: 'bg-purple-500 text-white',
    [VehicleAssignmentEnum.IN_TRANSIT]: 'bg-green-600 text-white',
    [VehicleAssignmentEnum.ON_STANDBY]: 'bg-yellow-500 text-white',
    [VehicleAssignmentEnum.MAINTENANCE_HOLD]: 'bg-orange-500 text-white',
    [VehicleAssignmentEnum.DECOMMISSIONED]: 'bg-red-700 text-white',
    [VehicleAssignmentEnum.COMPLETE]: 'bg-green-500 text-white',
    [VehicleAssignmentEnum.ASSIGNED]: 'bg-blue-500 text-white',
    [VehicleAssignmentEnum.AVAILABLE]: 'bg-green-500 text-white',
    [VehicleAssignmentEnum.IN_TRIP]: 'bg-yellow-500 text-white',
    [VehicleAssignmentEnum.COMPLETED]: 'bg-green-500 text-white'
};

export const VehicleAssignmentLabels = {
    [VehicleAssignmentEnum.UNASSIGNED]: 'Chưa phân công',
    [VehicleAssignmentEnum.ASSIGNED_TO_DRIVER]: 'Đã giao cho tài xế',
    [VehicleAssignmentEnum.ASSIGNED_TO_ROUTE]: 'Đã giao cho tuyến đường',
    [VehicleAssignmentEnum.RESERVED]: 'Đã đặt trước',
    [VehicleAssignmentEnum.IN_TRANSIT]: 'Đang di chuyển',
    [VehicleAssignmentEnum.ON_STANDBY]: 'Đang chờ',
    [VehicleAssignmentEnum.MAINTENANCE_HOLD]: 'Đang bảo trì',
    [VehicleAssignmentEnum.DECOMMISSIONED]: 'Đã ngừng hoạt động',
    [VehicleAssignmentEnum.COMPLETE]: 'Hoàn thành',
    [VehicleAssignmentEnum.ASSIGNED]: 'Đã giao cho tài xế',
    [VehicleAssignmentEnum.AVAILABLE]: 'Có sẵn',
    [VehicleAssignmentEnum.IN_TRIP]: 'Đang di chuyển',
    [VehicleAssignmentEnum.COMPLETED]: 'Hoàn thành'
}; 