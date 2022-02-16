import React from 'react';

import { useLocation, useNavigate, Navigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useSketch } from '../hooks/useSketch';
import { useEffect, useState, useContext } from 'react';
import { UserContext } from '../UserContext';

export function RequireAuth({ children }) {
    const context = useContext(UserContext);

    let isAuthenticated = context?.auth?.token;

    useEffect(async () => {
        if (!context.user?.name) {
            await context.actions.getUser(context.auth);
        }
    }, []);

    return isAuthenticated ? children : <Navigate to="/signin" />;
}
