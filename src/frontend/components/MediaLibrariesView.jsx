import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../UserContext';
import { GridView } from './GridView';
import { Dropdown } from '@frontify/arcade';

export function MediaLibrariesView({ type }) {
    const context = useContext(UserContext);
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [libraries, setLibraries] = useState([]);

    useEffect(() => {
        let libraries = context.actions.getLibrariesByType(type);
        setLibraries(libraries);
        setSelectedLibrary(libraries[0]);
    }, [type]);

    if (!libraries.length) return <div>No Libraries</div>;

    return (
        <custom-v-stack padding="small" gap="small" overflow="hidden">
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

            <GridView project={selectedLibrary}></GridView>
            <custom-status-bar>dsadsa</custom-status-bar>
        </custom-v-stack>
    );
}
