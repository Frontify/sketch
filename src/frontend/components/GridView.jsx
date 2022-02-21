import React from 'react';
import { useState, useContext, useEffect } from 'react';

import { Text } from '@frontify/arcade';
import { UserContext } from '../UserContext';
import { LoadingIndicator } from './LoadingIndicator';
import { SearchField } from './SearchField';
import { Observer } from './Observer';

export function GridView({ project }) {
    let context = useContext(UserContext);
    let { actions, auth, selection } = useContext(UserContext);

    // This could be a prop, but we'll use it  for all views for now
    const LIMIT = 25;
    const THUMB_WIDTH = 320;

    // Loading state
    let [loading, setLoading] = useState(false);

    // Images, total, current page
    let [images, setImages] = useState([]);
    let [total, setTotal] = useState(Infinity);
    let [page, setPage] = useState(1);

    // We can use the mode to indicate "browse" or "search"
    let [mode, setMode] = useState('browse');

    // Query is used for the search field
    let [query, setQuery] = useState('');

    // When the {project} prop changes, load fresh data
    useEffect(() => {
        setPage(1);
        setImages([]);
    }, [project]);

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
            id: project.id,
            libraryType: project.__typename,
            limit: LIMIT,
            page: nextPage,
        };

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
        let { items, total } = library.assets;

        setImages((state) => {
            // Merge new images
            let newState = state.concat(items || []);

            // Update the total number of items
            setTotal(total);
            return newState;
        });

        setLoading(false);
        setPage((page) => page + 1);
    };

    function handleIntersect() {
        if (loading) return;

        if (images.length >= total) {
            return;
        }

        loadMore(mode);
    }

    return (
        <custom-v-stack gap="small" overflow="hidden">
            <SearchField
                onInput={(value) => {
                    setQuery(value);
                }}
                onChange={(value) => {
                    let newMode = value != '' ? 'search' : 'browse';
                    setQuery(value);
                    loadMore(newMode);
                }}
            ></SearchField>

            <custom-scroll-view>
                <custom-grid gap="small">
                    {images && images.length ? (
                        images.map((image, index) => {
                            return (
                                <custom-grid-item
                                    title={image.title}
                                    key={image.id}
                                    tabindex="0"
                                    style={{ animationDelay: `${index * 10}ms` }}
                                >
                                    <img
                                        src={`${image.previewUrl}?width=${THUMB_WIDTH}`}
                                        alt={image.title}
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                    />
                                </custom-grid-item>
                            );
                        })
                    ) : (
                        <div></div>
                    )}
                    <Observer onIntersect={handleIntersect}></Observer>
                </custom-grid>
            </custom-scroll-view>
        </custom-v-stack>
    );
}
