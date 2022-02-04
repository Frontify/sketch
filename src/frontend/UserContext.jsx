import React from 'react';
import { useState } from 'react';
import { queryGraphQLWithAuth } from './graphql';
export const UserContext = React.createContext();

let userQuery = `{
    currentUser {
        name
        id
        email
        avatar
    }
    brands {
        name
        id
        color
        avatar
        projects(types: [MEDIA_LIBRARY, ICON_LIBRARY, LOGO_LIBRARY]) {
            ... on MediaLibrary {
            id
            name
            __typename
            }
            ... on IconLibrary {
            id
            name
            __typename
            }
            ... on LogoLibrary {
            id
            name
            __typename
            }
        }
      }
}`;

export const UserContextProvider = ({ children }) => {
    // Auth
    let cachedAuth = localStorage.getItem('cache.auth')
        ? JSON.parse(localStorage.getItem('cache.auth'))
        : { domain: null, token: null };

    let [auth, setAuth] = useState(cachedAuth);

    // Brands
    let [brands, setBrands] = useState({});

    // User
    let [user, setUser] = useState({
        name: '',
        id: null,
        email: null,
        avatar: null,

        replaceState(newState) {
            setUser((state) => {
                return { ...state, ...newState };
            });
        },
        getAuth() {
            return auth;
        },
        setAuth(authData) {
            setAuth(authData);
            localStorage.setItem('cache.auth', JSON.stringify(authData));
        },
        async getUser() {
            const isAuthenticated = auth.domain && auth.token;
            if (isAuthenticated) {
                let { data } = await queryGraphQLWithAuth({ query: userQuery, auth });

                setUser((state) => {
                    return data.currentUser;
                });
                setBrands((state) => {
                    return data.brands;
                });
            } else {
                console.warn('Not authenticated');
            }
        },
    });

    let context = { user, brands };

    return <UserContext.Provider value={context}>{children}</UserContext.Provider>;
};
