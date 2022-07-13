import React from 'react';
import { useState, useEffect } from 'react';

// GraphQL
import { queryGraphQLWithAuth } from '../graphql/graphql';
import { browseWorkspaceProject } from '../graphql/browse.graphql';
import { foldersQuery } from '../graphql/folders.graphql';
import { listQuery } from '../graphql/list.graphql';
import { searchQuery } from '../graphql/search.graphql';
import { userQuery } from '../graphql/user.graphql';

// Hooks
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSketch } from '../hooks/useSketch';

// Context
export const UserContext = React.createContext();

export const UserContextProvider = ({ children }) => {
    /**
     * This is an overview of available fields.
     * Poorman’s TypeScript replacement. Sorry!
     */
    const blueprints = {
        auth: {
            domain: '',
            token: '',
        },
        brands: [],
        colorMap: {},
        colorPalettes: [],
        currentDocument: {},
        guidelines: [],
        lastFetched: null,
        recentDocuments: [],
        sources: [],
        selection: {
            artboards: [],
            brand: null,
            document: null,
            guidelines: {},
        },
        textStylePalettes: [],
        transferMap: {},
        user: { name: '', id: null, email: null, avatar: null },
    };
    let [tick, setTick] = useState(0);
    let [transferMap, setTransferMap] = useState(blueprints.transferMap);

    let [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        let handler = (event) => {
            let { type, payload } = event.detail.data;

            // We’re using the remote_id for identifying the upload item
            // But we might not know the id until the file is uploaded
            // So we might need to use the Sketch artboard ID instead and combine it with the upload folder id?
            let id = payload.id || payload.id_external;

            switch (type) {
                case 'tick':
                    setTick(payload.value);
                    break;
                case 'progress':
                    switch (payload.status) {
                        case 'upload-failed':
                            setTransferMap((state) => {
                                // Remove the entry from transferMap
                                delete state[id];
                                // Cleanup eventual uploads that had to be tracked by artboard id
                                delete state[payload.target?.for];
                                return { ...state, [id]: payload };
                            });
                            break;
                        case 'upload-complete':
                            setTransferMap((state) => {
                                // Remove the entry from transferMap
                                delete state[id];
                                // Cleanup eventual uploads that had to be tracked by artboard id
                                delete state[payload.target?.for];

                                return { ...state };
                            });

                            break;
                        default:
                            setTransferMap((state) => {
                                return { ...state, [id]: payload };
                            });
                    }

                    break;
                case 'current-document.changed':
                    break;
                case 'refresh':
                    actions.refresh(payload);
                    console.log('REFRESH', payload);
                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

    let [currentDocument, setCurrentDocument] = useState(blueprints.currentDocument);
    let [lastFetched, setLastFetched] = useState(blueprints.lastFetched);

    // Recent Documents
    // ------------------------------------------------------------------------
    let [recentDocuments, setRecentDocuments] = useState(blueprints.recentDocuments);

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

    let [sources, setSources] = useState(blueprints.sources);

    // User
    // ------------------------------------------------------------------------
    let [user, setUser] = useLocalStorage('cache.user', blueprints.user);

    /**
     * Actions that can be access via {context.actions}, e.g. context.actions.getUser()
     */
    const actions = {
        getProjectFolders(project) {
            return queryGraphQLWithAuth({ query: browseWorkspaceProject(project), auth });
        },
        getFolders(folder) {
            return queryGraphQLWithAuth({ query: foldersQuery(folder), auth });
        },
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
        openSource(source) {
            setCurrentDocument(source);
        },

        // todo: Isn’t getCurrentDocument() == refresh() ?
        async getCurrentDocument(force = false) {
            if (refreshing && !force) {
                console.warn('Still refreshing…');
                return;
            }

            setRefreshing(true);

            setLastFetched(new Date().getTime());

            let { currentDocument } = await useSketch('getCurrentDocument');

            setCurrentDocument(currentDocument);

            setRefreshing(false);
        },
        async refresh(payload) {
            if (refreshing) {
                console.warn('Still refreshing…');
                return;
            }

            if (payload?.recentDocuments) {
                setRecentDocuments(payload.recentDocuments);
            }

            let { currentDocument } = await useSketch('getCurrentDocument');

            setCurrentDocument(currentDocument);

            setRefreshing(true);

            // let { sources } = await useSketch('getLocalAndRemoteSourceFiles');

            // setSources(sources.sources);
            setLastFetched(new Date().getTime());

            setRefreshing(false);
        },
        selectBrand(brand) {
            setSelection((state) => {
                return { ...state, brand };
            });
            // window.postMessage('reload');
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
                        let { data, errors } = await queryGraphQLWithAuth({ query: userQuery, auth: credentials });

                        if (errors) {
                            console.error(
                                'Could not load user data from GraphQL, because errors were returned',
                                errors
                            );
                            reject();
                        }

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
        actions,
        auth,
        brands,
        colorMap,
        colorPalettes,
        currentDocument,
        documents,
        guidelines,
        lastFetched,
        refreshing,
        recentDocuments,
        selection,
        sources,
        textStylePalettes,
        tick,
        transferMap,
        user,
    };

    return <UserContext.Provider value={context}>{children}</UserContext.Provider>;
};
