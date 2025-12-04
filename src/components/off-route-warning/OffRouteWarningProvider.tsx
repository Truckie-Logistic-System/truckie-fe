import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useOffRouteWarning } from '../../hooks/useOffRouteWarning';
import OffRouteWarningModal from './OffRouteWarningModal';
import type { OffRouteWarningPayload } from '../../services/off-route/types';
import { useAuth } from '../../context';

interface OffRouteWarningContextValue {
  warnings: OffRouteWarningPayload[];
  hasActiveWarnings: boolean;
  isConnected: boolean;
}

const OffRouteWarningContext = createContext<OffRouteWarningContextValue>({
  warnings: [],
  hasActiveWarnings: false,
  isConnected: false,
});

export const useOffRouteWarningContext = () => useContext(OffRouteWarningContext);

interface OffRouteWarningProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that manages off-route warnings for staff
 * Should be placed at the app level to receive warnings globally
 */
export const OffRouteWarningProvider: React.FC<OffRouteWarningProviderProps> = ({ children }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();
  
  // Check if user is staff using reactive auth state
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  
  // console.log('[OffRouteWarningProvider] Auth state:', { 
  //   userId: user?.id, 
  //   role: user?.role, 
  //   isStaff,
  //   hasUser: !!user 
  // });

  const handleWarning = useCallback((warning: OffRouteWarningPayload) => {
    console.log('[OffRouteWarningProvider] New warning received:', warning.severity);
    // Auto-open modal for new warnings
    setModalVisible(true);
  }, []);

  const {
    warnings,
    currentWarning,
    isConnected,
    confirmContact,
    createIssue,
    dismissWarning,
  } = useOffRouteWarning({
    autoConnect: isStaff, // Only connect for staff users
    onWarning: handleWarning,
  });

  const handleClose = useCallback(() => {
    if (currentWarning) {
      // For yellow warnings, just dismiss
      if (currentWarning.severity === 'YELLOW') {
        dismissWarning(currentWarning.offRouteEventId);
      }
    }
    setModalVisible(false);
  }, [currentWarning, dismissWarning]);

  const handleConfirmContact = useCallback(async (eventId: string, notes?: string) => {
    return await confirmContact(eventId, notes);
  }, [confirmContact]);

  const handleCreateIssue = useCallback(async (eventId: string, description?: string) => {
    return await createIssue(eventId, description);
  }, [createIssue]);

  // Re-open modal if there are still active warnings
  useEffect(() => {
    if (!modalVisible && warnings.length > 0 && currentWarning) {
      // Check if any warning needs attention (RED warnings)
      const hasRedWarning = warnings.some(w => w.severity === 'RED');
      if (hasRedWarning) {
        setModalVisible(true);
      }
    }
  }, [warnings, currentWarning, modalVisible]);

  const contextValue: OffRouteWarningContextValue = {
    warnings,
    hasActiveWarnings: warnings.length > 0,
    isConnected,
  };

  return (
    <OffRouteWarningContext.Provider value={contextValue}>
      {children}
      
      {/* Warning Modal - only render for staff */}
      {isStaff && (
        <OffRouteWarningModal
          warning={currentWarning}
          visible={modalVisible}
          onClose={handleClose}
          onConfirmContact={handleConfirmContact}
          onCreateIssue={handleCreateIssue}
        />
      )}
    </OffRouteWarningContext.Provider>
  );
};

export default OffRouteWarningProvider;
