import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { UserContext } from '../UserContext';
import { GridView } from './GridView';

export function IconLibrariesView() {
    const context = useContext(UserContext);
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [libraries, setLibraries] = useState([]);
    useEffect(() => {
        let libraries = context.actions.getLibrariesByType('IconLibrary');
        setLibraries(libraries);
        setSelectedLibrary(libraries[0]);
    }, []);

    if (!libraries.length) return <div>No Libraries</div>;

    return (
        <custom-v-stack padding="small" gap="small">
            <select
                name=""
                id=""
                selected={selectedLibrary.id}
                onChange={() => {
                    let library = libraries.find((library) => library.id == event.target.value);
                    setSelectedLibrary(library);
                }}
            >
                {libraries.map((library) => {
                    return <option value={library.id}>{library.name}</option>;
                })}
            </select>
            <GridView project={selectedLibrary}></GridView>
        </custom-v-stack>
    );
}
