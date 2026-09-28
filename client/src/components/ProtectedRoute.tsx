import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/context/useAuth';

export function ProtectedRoute() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export function GuestRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/content-manager" replace />;
    }

    return children;
}