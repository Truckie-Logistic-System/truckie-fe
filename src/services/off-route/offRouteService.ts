import httpClient from '../api';
import type { OffRouteEventDetail, ConfirmSafeRequest, CreateIssueRequest } from './types';

const API_PATH = '/off-route-events';

/**
 * Service for off-route event management
 */
const offRouteService = {
  /**
   * Get full details of an off-route event for staff modal
   */
  async getEventDetail(eventId: string): Promise<OffRouteEventDetail> {
    const response = await httpClient.get(`${API_PATH}/${eventId}/detail`);
    return response.data;
  },

  /**
   * Confirm driver is safe after contact
   */
  async confirmSafe(eventId: string, notes?: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post(`${API_PATH}/${eventId}/confirm-safe`, {
      offRouteEventId: eventId,
      notes,
    });
    return response.data;
  },

  /**
   * Confirm contact with driver - driver will return to route
   * This sets status to CONTACTED_WAITING_RETURN and starts grace period
   */
  async confirmContact(eventId: string, notes?: string): Promise<{ success: boolean; message: string; gracePeriodExpiresAt?: string }> {
    const response = await httpClient.post(`${API_PATH}/${eventId}/confirm-contact`, {
      notes,
    });
    return response.data;
  },

  /**
   * Extend grace period for driver to return to route
   */
  async extendGracePeriod(eventId: string, reason?: string): Promise<{ success: boolean; message: string; gracePeriodExpiresAt?: string }> {
    const response = await httpClient.post(`${API_PATH}/${eventId}/extend-grace-period`, {
      reason,
    });
    return response.data;
  },

  /**
   * Mark that driver could not be contacted
   */
  async markNoContact(eventId: string, notes?: string): Promise<{ success: boolean; message: string }> {
    const response = await httpClient.post(`${API_PATH}/${eventId}/mark-no-contact`, {
      notes,
    });
    return response.data;
  },

  /**
   * Create an issue from off-route event
   */
  async createIssue(request: CreateIssueRequest): Promise<{ success: boolean; issueId: string }> {
    const response = await httpClient.post(`${API_PATH}/create-issue`, request);
    return response.data;
  },

  /**
   * Get all active off-route events
   */
  async getActiveEvents(): Promise<any[]> {
    const response = await httpClient.get(`${API_PATH}/active`);
    return response.data;
  },

  /**
   * Get off-route events by order ID
   */
  async getByOrderId(orderId: string): Promise<any[]> {
    const response = await httpClient.get(`${API_PATH}/by-order/${orderId}`);
    return response.data;
  },
};

export default offRouteService;
