import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react/cjs/react.development';
import { queryGraphQLWithAuth } from './graphql';
import { userQuery } from './user.graphql';

export const UserContext = React.createContext();

export const UserContextProvider = ({ children }) => {
    // Auth
    // ------------------------------------------------------------------------
    let cachedAuth = localStorage.getItem('cache.auth')
        ? JSON.parse(localStorage.getItem('cache.auth'))
        : { domain: null, token: null };

    let [auth, setAuth] = useState(cachedAuth);

    // Brands
    // ------------------------------------------------------------------------
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

    // Guidelines
    // ------------------------------------------------------------------------
    let [guidelines, setGuidelines] = useState({
        entries: [],
        set(guidelines) {
            setGuidelines((state) => {
                return { ...state, entries: [...guidelines] };
            });
        },
        async fetch(brandId) {
            let response = await fetch(`${auth.domain}/v1/guidelines/${brandId}`, {
                method: 'GET',
                headers: new Headers({
                    Authorization: 'Bearer ' + auth.token,
                }),
            });
            let json = await response.json();
            let guidelines = json.data.guidelines.map((guideline) => {
                return {
                    active: true,
                    ...guideline,
                };
            });

            setGuidelines((state) => {
                let newState = { ...state, entries: guidelines };
                return newState;
            });

            // Fetch palettes

            let guidelinePalettes = [];

            Promise.all(
                guidelines.map(async (guideline) => {
                    let palettes = await getPalettesForGuideline(guideline);

                    guidelinePalettes = guidelinePalettes.concat(palettes);
                })
            ).then(() => {
                setPalettes((state) => {
                    return { ...state, entries: guidelinePalettes };
                });
            });
        },
    });

    // Palettes
    // ------------------------------------------------------------------------

    let [palettes, setPalettes] = useState({
        entries: [],
    });

    async function getPalettesForGuideline(guideline) {
        return new Promise(async (resolve, reject) => {
            let response = await fetch(`${auth.domain}/v1/color/library/${guideline.project_id}`, {
                method: 'GET',
                headers: new Headers({
                    Authorization: 'Bearer ' + auth.token,
                }),
            });
            let result = await response.json();

            // reverse order of palettes and colors
            let palettes = result.palettes;
            palettes.reverse();

            palettes.forEach((palette) => {
                palette.colors = palette.colors.reverse();
            });
            resolve(palettes);
        });
    }

    // User
    // ------------------------------------------------------------------------
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
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (localStorage.getItem('cache.brands')) {
            let cachedBrands = JSON.parse(localStorage.getItem('cache.brands'));
            setBrands((state) => {
                return {
                    ...state,
                    ...cachedBrands,
                };
            });
            if (cachedBrands.selected?.id) {
                guidelines.fetch(cachedBrands.selected.id);
            }
        }
    }, []);

    let context = { user, brands, guidelines, palettes };

    return <UserContext.Provider value={context}>{children}</UserContext.Provider>;
};
