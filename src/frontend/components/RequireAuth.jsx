import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function RequireAuth({ children }) {
    console.log('require auth');
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    console.log({ isAuthenticated });
    return isAuthenticated === true ? children : <Navigate to="/launch" replace state={{ path: location.pathname }} />;
}
