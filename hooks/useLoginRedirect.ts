import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useLoginRedirect = (redirectTo: string = '/', enabled: boolean = true) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        if (!enabled || loading || !isAuthenticated) {
            return;
        }

        if (pathname !== redirectTo) {
            navigate(redirectTo, { replace: true });
        }
    }, [enabled, loading, isAuthenticated, navigate, redirectTo, pathname]);

    return { isAuthenticated, loading };
};
