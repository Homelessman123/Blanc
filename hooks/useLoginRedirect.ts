import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useLoginRedirect = (redirectTo: string = '/', enabled: boolean = true) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('=== useLoginRedirect EFFECT ===');
        console.log('Enabled:', enabled, 'Loading:', loading, 'IsAuthenticated:', isAuthenticated);
        console.log('RedirectTo:', redirectTo);
        console.log('Current URL:', window.location.href);

        if (!enabled || loading) {
            console.log('Redirect skipped - enabled:', enabled, 'loading:', loading);
            return;
        }

        if (isAuthenticated) {
            console.log('🚀 useLoginRedirect: User is authenticated, redirecting to:', redirectTo);

            // Use immediate navigation without delay
            try {
                navigate(redirectTo, { replace: true });
                console.log('✅ Navigation called successfully');
            } catch (error) {
                console.error('❌ Navigation failed:', error);
            }

            // Also try with a small delay as backup
            const timeoutId = setTimeout(() => {
                if (isAuthenticated) {
                    console.log('🔄 useLoginRedirect: Backup redirect executing...');
                    try {
                        navigate(redirectTo, { replace: true });
                        console.log('✅ Backup navigation called successfully');
                    } catch (error) {
                        console.error('❌ Backup navigation failed:', error);
                    }
                }
            }, 150);

            return () => {
                console.log('🧹 Cleanup redirect timeout');
                clearTimeout(timeoutId);
            };
        } else {
            console.log('⏳ User not authenticated yet, waiting...');
        }

        console.log('=== useLoginRedirect EFFECT END ===');
    }, [isAuthenticated, loading, navigate, redirectTo, enabled]);

    return { isAuthenticated, loading };
};
