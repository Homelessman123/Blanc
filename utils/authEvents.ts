import { useEffect } from 'react';

// Auth events for coordinating authentication state across components
export class AuthEvents {
    private static listeners: Set<() => void> = new Set();

    static subscribe(callback: () => void) {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    static emit() {
        this.listeners.forEach(callback => callback());
    }

    static login() {
        // Emit login event
        this.emit();
        // Also trigger a storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'auth-change',
            newValue: 'login',
        }));
    }

    static logout() {
        // Emit logout event
        this.emit();
        // Also trigger a storage event for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'auth-change',
            newValue: 'logout',
        }));
    }
}

// Hook to use auth events
export const useAuthEvents = (callback: () => void) => {
    useEffect(() => {
        return AuthEvents.subscribe(callback);
    }, [callback]);
};