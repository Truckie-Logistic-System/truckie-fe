import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onLogout } from '@/services/api/httpClient';

/**
 * Hook to listen for logout events from httpClient and navigate to login page
 * Should be used in a component that has access to useNavigate
 */
export const useLogoutListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onLogout(() => {
      navigate('/auth/login', { replace: true });
    });

    return unsubscribe;
  }, [navigate]);
};
