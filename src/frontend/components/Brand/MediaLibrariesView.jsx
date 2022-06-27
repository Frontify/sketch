import React, { useState, useContext, useEffect } from 'react';

// Components
import { Dropdown, LoadingCircle, Text } from '@frontify/fondue';

import { GridView } from './GridView';
import { SearchField } from '../Core/SearchField';

// Context
import { UserContext } from '../../context/UserContext';

export function MediaLibrariesView({ type }) {
    const context = useContext(UserContext);
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [libraries, setLibraries] = useState([]);

    let { actions, auth } = useContext(UserContext);

    // This could be a prop, but we'll use it  for all views for now
    const LIMIT = 25;
    const THUMB_WIDTH = 320;

    // Loading state
    let [loading, setLoading] = useState(false);

    // Images, total, current page
    let [images, setImages] = useState([]);
    let [totalImages, setTotalImages] = useState(Infinity);
    let [page, setPage] = useState(1);

    // Image selection
    let [selection, setSelection] = useState([]);

    // We can use the mode to indicate "browse" or "search"
    let [mode, setMode] = useState('browse');

    // Query is used for the search field
    let [query, setQuery] = useState('');

    // When the {project} prop changes, load fresh data
    useEffect(() => {
        reset();
    }, [selectedLibrary]);

    const reset = () => {
        setTotalImages(Infinity);
        setPage(1);
        setImages([]);
    };

    // Depending on the {newMode}, we’ll load more assets, either by
    // either using {loadMediaLibrary} or {searchMediaLibrary}.
    const loadMore = async (newMode) => {
        let nextPage = page;
        if (newMode != mode) {
            setPage(1);
            nextPage = 1;
            setMode(newMode);
            // clear items
            setImages([]);
        }
        setLoading(true);

        let result = null;

        // These parameters are used by both API requests.
        // The only difference is the {query} parameter for search.
        let sharedRequestParameters = {
            auth: auth,
            id: selectedLibrary.id,
            libraryType: selectedLibrary.__typename,
            limit: LIMIT,
            page: nextPage,
        };

        // Add placeholder items

        setImages((state) => {
            if (totalImages == Infinity) return state;

            let placeholders = Array(Math.min(LIMIT, totalImages - images.length))
                .fill(0)
                .map((entry) => {
                    return {
                        extension: 'png',
                        __typename: 'placeholder',
                        id: 'placeholder' + Math.random(),
                    };
                });

            return state.concat(placeholders);
        });

        switch (newMode) {
            case 'browse':
                result = await actions.loadMediaLibrary({
                    ...sharedRequestParameters,
                });
                break;
            case 'search':
                result = await context.actions.searchLibraryWithQuery({
                    ...sharedRequestParameters,
                    query: query,
                });
        }

        let library = result.data.project;
        if (!library?.assets) {
            // No assets?
            setLoading(false);
            setTotalImages(0);
            // Early return
            return;
        }
        let { items, total } = library.assets;

        setImages((state) => {
            // Merge new images

            let oldState = state.filter((entry) => entry.__typename != 'placeholder');

            let newState = oldState.concat(items || []);

            // Update the total number of items
            setTotalImages(total);
            return newState;
        });

        setLoading(false);
        setPage((page) => page + 1);
    };

    function handleIntersect() {
        if (loading) return;

        if (images.length >= totalImages) {
            return;
        }
        setLoading(true);
        loadMore(mode);
    }

    function handleSelect(selection) {
        setSelection(selection);
    }

    // React to changes of the library type
    useEffect(() => {
        let libraries = context.actions.getLibrariesByType(type);
        setLibraries(libraries);
        setSelectedLibrary(libraries[0]);
    }, [type]);

    if (!libraries.length)
        return (
            <custom-v-stack stretch="true" align-items="center" justify-content="center">
                <Text color="weak">No Libraries</Text>
            </custom-v-stack>
        );

    return (
        <custom-v-stack overflow="hidden" flex>
            <custom-v-stack padding="small" gap="small" separator="bottom">
                <Dropdown
                    activeItemId={selectedLibrary.id}
                    menuBlocks={[
                        {
                            ariaLabel: 'First section',
                            id: 'block1',
                            menuItems: libraries.map((library) => {
                                return { id: library.id, title: library.name };
                            }),
                        },
                    ]}
                    onChange={(id) => {
                        let library = libraries.find((library) => library.id == id);
                        setSelectedLibrary(library);
                    }}
                ></Dropdown>
                <SearchField
                    onInput={(value) => {
                        setQuery(value);
                    }}
                    onChange={(value) => {
                        let newMode = value != '' ? 'search' : 'browse';
                        reset();
                        setQuery(value);
                        loadMore(newMode);
                    }}
                    onClear={() => {
                        setQuery('');
                        loadMore('browse');
                    }}
                ></SearchField>
            </custom-v-stack>

            <custom-scroll-view padding="small" flex>
                <GridView
                    images={images}
                    thumbWidth="320"
                    onIntersect={handleIntersect}
                    onSelect={handleSelect}
                ></GridView>
            </custom-scroll-view>

            <custom-status-bar padding="small" separator="top">
                <custom-h-stack align-items="center" justify-content="center">
                    <div style={{ width: '24px' }}></div>
                    {images ? (
                        <custom-h-stack style={{ width: '100%' }} justify-content="center">
                            <Text size="x-small">
                                {selection && selection.length == 1
                                    ? selection[0].title
                                    : `${images.length} / ${totalImages}`}
                            </Text>
                        </custom-h-stack>
                    ) : (
                        ''
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '24px' }}>
                        {loading && <LoadingCircle size="ExtraSmall" />}
                    </div>
                </custom-h-stack>
            </custom-status-bar>
        </custom-v-stack>
    );
}
