/**
 * Penalty model representing a driver violation and associated penalty
 */

export interface Penalty {
    id: string;
    violationType: string;
    violationDescription: string;
    penaltyAmount: number;
    penaltyDate: string;
    location: string;
    status: string;
    paymentDate?: string;
    disputeReason?: string;
    driverId: string;
    vehicleAssignmentId: string;
}

export interface PenaltyCreateDto {
    violationType: string;
    violationDescription: string;
    penaltyAmount: number;
    penaltyDate: string;
    location: string;
    status: string;
    driverId: string;
    vehicleAssignmentId: string;
}

export interface PenaltyUpdateDto {
    violationType: string;
    violationDescription: string;
    penaltyAmount: number;
    penaltyDate: string;
    location: string;
    status: string;
    driverId: string;
    vehicleAssignmentId: string;
}

export enum PenaltyStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    DISPUTED = 'DISPUTED',
    RESOLVED = 'RESOLVED',
    CANCELLED = 'CANCELLED'
}

export const penaltyStatusColors = {
    [PenaltyStatus.PENDING]: 'orange',
    [PenaltyStatus.PAID]: 'green',
    [PenaltyStatus.DISPUTED]: 'red',
    [PenaltyStatus.RESOLVED]: 'blue',
    [PenaltyStatus.CANCELLED]: 'gray'
};

export const violationTypes = [
    'Speeding',
    'Illegal Parking',
    'Traffic Signal Violation',
    'Improper Vehicle Documentation',
    'Overloading',
    'Unauthorized Route',
    'Driving Hours Violation',
    'Vehicle Condition Violation',
    'Other'
]; 