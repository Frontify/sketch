import React from 'react';
import { useState } from 'react';

export const UserContext = React.createContext();

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState({
        status: 'signedOut',
        name: 'Shen Zi',
        brand: { name: 'Monobrand' },
        replaceState(newState) {
            setUser((state) => {
                return { ...state, ...newState };
            });
        },
        signIn() {
            setUser((state) => {
                return { ...state, status: 'signedIn' };
            });
        },
        signOut() {
            setUser((state) => {
                return { ...state, status: 'signedOut' };
            });
        },
    });

    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
