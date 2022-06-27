import React, { useEffect, useContext } from 'react';

// Router
import { Navigate } from 'react-router-dom';

// Context
import { UserContext } from '../../context/UserContext';

export function RequireAuth({ children }) {
    const context = useContext(UserContext);

    let isAuthenticated = context?.auth?.token;

    useEffect(async () => {
        console.log('require auth');
        if (!context.user?.name) {
            await context.actions.getUser(context.auth);
        }
    }, []);

    return isAuthenticated ? children : <Navigate to="/signin" />;
}
