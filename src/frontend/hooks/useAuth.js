// Hook
import { useSketch } from './useSketch';
import { useEffect } from 'react';
export function useAuth() {
    useEffect(async () => {
        let { auth } = await useSketch('getAuth');
        if (auth && auth.domain && auth.token) {
            return true;
        } else {
            return false;
        }
    }, []);
}
