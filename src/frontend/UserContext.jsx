import React from 'react';
import { useState } from 'react';

export const UserContext = React.createContext();
export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState({
        name: 'Shen Zi',
        brand: { name: 'Monobrand' },
        signIn() {
            setUser((state) => {
                return { ...state, name: 'Shen Zi' };
            });
        },
        signOut() {
            setUser((state) => {
                return { ...state, name: 'Signed Out' };
            });
        },
    });

    return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
