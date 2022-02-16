import React from 'react';
import { useState, useEffect, useContext } from 'react';

import { Text } from '@frontify/arcade';
import { UserContext } from '../UserContext';
import { LoadingIndicator } from './LoadingIndicator';
import { SearchField } from './SearchField';

export function GridView({ project }) {
    let context = useContext(UserContext);
    let { actions, auth, selection } = useContext(UserContext);
    const [images, setImages] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(async () => {
        if (project) {
            let result = await actions.loadMediaLibrary({
                auth: auth,
                id: project.id,
                libraryType: project.__typename,
            });
            let library = result.data.project;

            setImages(library.assets.items);
        }
    }, [project]);

    async function performSearch(value) {
        setIsLoading(true);
        let result = await context.actions.searchLibraryWithQuery({
            auth: context.auth,
            id: project.id,
            libraryType: project.__typename,
            query: value,
        });

        setIsLoading(false);
        let library = result.data.project;

        setImages(library.assets.items);
    }
    if (!images) return <Text>No data</Text>;
    if (!images.length)
        return (
            <div>
                <LoadingIndicator></LoadingIndicator>
            </div>
        );

    if (isLoading)
        return (
            <div>
                <LoadingIndicator></LoadingIndicator>
            </div>
        );

    return (
        <custom-v-stack gap="small">
            <SearchField
                onInput={(value) => {
                    setSearch(value);
                }}
                onChange={(value) => {
                    setSearch(value);
                    performSearch(value);
                }}
            ></SearchField>
            <custom-grid gap="small">
                {images.map((image, index) => {
                    return (
                        <custom-grid-item
                            title={image.title}
                            key={image.id}
                            tabindex="0"
                            style={{ animationDelay: `${index * 10}ms` }}
                        >
                            <img
                                src={image.previewUrl}
                                lazy
                                alt={image.title}
                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                        </custom-grid-item>
                    );
                })}
            </custom-grid>
        </custom-v-stack>
    );
}
