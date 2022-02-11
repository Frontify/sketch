import { useContext } from 'react';
import { UserContext } from '../UserContext';
// Hook
export function useAuth() {
    const context = useContext(UserContext);
    let credentials = localStorage.getItem('cache.auth')
        ? JSON.parse(localStorage.getItem('cache.auth'))
        : { domain: null, token: null };

    if (credentials.domain && credentials.token) {
        context.user.getUser();
        return { isAuthenticated: true };
    } else {
        return { isAuthenticated: false };
    }
}
