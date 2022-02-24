import React from 'react';
import { useState, useEffect } from 'react';
import { queryGraphQLWithAuth } from './graphql';
import { listQuery } from './list.graphql';
import { searchQuery } from './search.graphql';
import { userQuery } from './user.graphql';
import { useLocalStorage } from './hooks/useLocalStorage';

export const UserContext = React.createContext();

import { useSketch } from './hooks/useSketch';

export const UserContextProvider = ({ children }) => {
    const blueprints = {
        auth: {
            domain: '',
            token: '',
        },
        brands: [],
        colorMap: {},
        colorPalettes: [],
        guidelines: [],
        user: { name: '', id: null, email: null, avatar: null },
        selection: {
            artboards: [],
            brand: null,
            document: null,
            guidelines: {},
        },
        textStylePalettes: [],
    };
    let [auth, setAuth] = useLocalStorage('cache.auth', blueprints.auth);

    function isAuthenticated() {
        return auth && auth.domain && auth.token;
    }

    let [selection, setSelection] = useLocalStorage('cache.selection', blueprints.selection);
    let [colorMap, setColorMap] = useLocalStorage('cache.colorMap', blueprints.colorMap);

    // Brands
    // ------------------------------------------------------------------------
    let [brands, setBrands] = useLocalStorage('cache.brands', blueprints.brands);

    // Guidelines
    // ------------------------------------------------------------------------
    let [guidelines, setGuidelines] = useState(blueprints.guidelines);

    // Color Palettes
    // ------------------------------------------------------------------------

    let [colorPalettes, setColorPalettes] = useState(blueprints.colorPalettes);

    async function getColorPalettesForGuideline(guideline) {
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

    // Text Style Palettes
    // ------------------------------------------------------------------------
    let [textStylePalettes, setTextStylePalettes] = useState(blueprints.textStylePalettes);

    async function getTextStylePalettesForGuideline(guideline) {
        return new Promise(async (resolve, reject) => {
            let response = await fetch(`${auth.domain}/v1/typography/styles/${guideline.project_id}`, {
                method: 'GET',
                headers: new Headers({
                    Authorization: 'Bearer ' + auth.token,
                }),
            });
            let { colors, groups } = await response.json();

            // Convert API Object to Array
            let palettes = Object.keys(groups).map((key) => {
                // Mixin "guideline.name" which is missing from the API, but necessary for the UI

                let palette = { ...groups[key], project_name: guideline.name };
                return palette;
            });

            setColorMap(colors);

            resolve(palettes);
        });
    }

    // Documents
    // ------------------------------------------------------------------------

    let [documents, setDocuments] = useState({
        entries: [],
        async getOpenDocuments() {
            let { documents } = await useSketch('getOpenDocuments');
            return documents;
        },
    });

    // User
    // ------------------------------------------------------------------------
    let [user, setUser] = useLocalStorage('cache.user', blueprints.user);

    /**
     * Actions that can be access via {context.actions}, e.g. context.actions.getUser()
     */
    let actions = {
        getLibrariesByType(type) {
            return selection.brand.projects.filter((project) => {
                return project.__typename == type;
            });
        },
        searchLibraryWithQuery({ auth, id, libraryType, page = 1, limit = 50, query = '' }) {
            // search, then return the results
            return queryGraphQLWithAuth({ query: searchQuery(id, libraryType, page, limit, query), auth });
        },
        async fetchGuidelines(brandId) {
            if (isAuthenticated()) {
                let response = await fetch(`${auth.domain}/v1/guidelines/${brandId}`, {
                    method: 'GET',
                    headers: new Headers({
                        Authorization: 'Bearer ' + auth.token,
                    }),
                });
                let json = await response.json();

                /**
                 * After changing the brand, we need to make sure that the correct guideline preferences are set.
                 * a) If it’s the first time that the brand is selected, we activate *all* guidelines.
                 * b) It the guideline preferences have been persisted to local storage, we’ll restore those.
                 */
                let selectedGuidelines = selection.guidelines.hasOwnProperty(brandId)
                    ? selection.guidelines[brandId]
                    : json.data.guidelines.map((guideline) => guideline.project_id);

                setSelection((state) => {
                    return { ...state, guidelines: { ...state.guidelines, [brandId]: selectedGuidelines } };
                });

                // Hydrate the guidelines from the API with an additional client-side only
                // field {active} that is persistet with local storage.
                let guidelines = json.data.guidelines.map((guideline) => {
                    return {
                        active: selectedGuidelines.includes(guideline.project_id), // check if the guideline exists in local storage
                        ...guideline,
                    };
                });

                setGuidelines(guidelines);

                // Fetch palettes

                let guidelineColorPalettes = [];

                // Fetch Color Palettes
                Promise.all(
                    guidelines.map(async (guideline) => {
                        let palettes = await getColorPalettesForGuideline(guideline);

                        guidelineColorPalettes = guidelineColorPalettes.concat(palettes);
                    })
                ).then(() => {
                    setColorPalettes((state) => {
                        return [...guidelineColorPalettes];
                    });
                });

                let guidelineTextStylePalettes = [];

                // Fetch Text Style Palettes
                Promise.all(
                    guidelines.map(async (guideline) => {
                        let palettes = await getTextStylePalettesForGuideline(guideline);
                        palettes = palettes.map((palette) => {
                            return { ...palette, project: guideline.project_id };
                        });

                        guidelineTextStylePalettes = guidelineTextStylePalettes.concat(palettes);
                    })
                ).then(() => {
                    setTextStylePalettes((state) => {
                        return [...guidelineTextStylePalettes];
                    });
                });
            }
        },
        loadMediaLibrary({ auth, id, libraryType, page = 1, limit = 50 }) {
            return queryGraphQLWithAuth({ query: listQuery(id, libraryType, page, limit), auth });
        },
        selectBrand(brand) {
            setSelection((state) => {
                return { ...state, brand };
            });
        },
        setGuidelinesForBrand(guidelines, brand) {
            setSelection((state) => {
                return {
                    ...state,
                    guidelines: {
                        ...state.guidelines,
                        [brand.id]: guidelines
                            .filter((guideline) => guideline.active)
                            .map((guideline) => guideline.project_id),
                    },
                };
            });
            setGuidelines([...guidelines]);
        },
        setAuth(authData) {
            if (authData) {
                setAuth(authData);
            } else {
                console.warn('Trying to call setAuth without authData');
            }
        },
        logout() {
            // Reset state and cached localStorage
            setSelection(blueprints.selection);
            setAuth(blueprints.auth);
            setUser(blueprints.user);
            setBrands(blueprints.brands);
        },
        async getUser(credentials) {
            return new Promise(async (resolve, reject) => {
                if (credentials && credentials.domain && credentials.token) {
                    try {
                        let { data } = await queryGraphQLWithAuth({ query: userQuery, auth: credentials });

                        setUser((state) => {
                            return { ...state, ...data.currentUser };
                        });

                        setBrands(data.brands);

                        actions.selectBrand(selection.brand || data.brands[0]);

                        resolve();
                    } catch (error) {
                        console.error(error);
                    }
                } else {
                    reject('Not authenticated');
                }
            });
        },
    };

    useEffect(async () => {
        if (selection.brand) {
            await actions.fetchGuidelines(selection.brand.id);
        }
    }, [selection.brand]);

    let context = {
        auth,
        actions,
        user,
        brands,
        documents,
        guidelines,
        selection,
        colorPalettes,
        colorMap,
        textStylePalettes,
    };

    return <UserContext.Provider value={context}>{children}</UserContext.Provider>;
};
