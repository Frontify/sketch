import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react/cjs/react.development';
import { queryGraphQLWithAuth } from './graphql';
import { userQuery } from './user.graphql';
export const UserContext = React.createContext();

console.log(userQuery);

export const UserContextProvider = ({ children }) => {
    // Auth
    let cachedAuth = localStorage.getItem('cache.auth')
        ? JSON.parse(localStorage.getItem('cache.auth'))
        : { domain: null, token: null };

    let [auth, setAuth] = useState(cachedAuth);

    // Brands
    let [brands, setBrands] = useState({
        entries: [],
        selected: null,
        set(brands) {
            entries = brands;
        },
        select(id) {
            setBrands((state) => {
                let brand = this.entries.find((brand) => brand.id == id) || this.entries[0];
                let newState = { ...state, selected: brand };
                localStorage.setItem('cache.brands', JSON.stringify(newState));

                guidelines.fetch(brand.id);
                return newState;
            });
        },
    });

    let [guidelines, setGuidelines] = useState({
        entries: [],
        async fetch(brandId) {
            let response = await fetch(`${auth.domain}/v1/guidelines/${brandId}`, {
                method: 'GET',
                headers: new Headers({
                    Authorization: 'Bearer ' + auth.token,
                }),
            });
            let json = await response.json();
            let guidelines = json.data.guidelines;
            setGuidelines((state) => {
                let newState = { ...state, entries: guidelines };
                return newState;
            });
        },
    });

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
                    return { ...state, entries: data.brands };
                });
            } else {
                console.warn('Not authenticated');
            }
        },
    });
    // Initial Effect: Load Brands from localStorage
    useEffect(() => {
        if (localStorage.getItem('cache.brands')) {
            setBrands((state) => {
                return {
                    ...state,
                    ...JSON.parse(localStorage.getItem('cache.brands')),
                };
            });
        }
    }, []);

    let context = { user, brands, guidelines };

    return <UserContext.Provider value={context}>{children}</UserContext.Provider>;
};
