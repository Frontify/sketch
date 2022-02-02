import {
    Breadcrumbs,
    Heading,
    IconArrowLeft,
    IconMore,
    IconSketch,
    IconUploadAlternative,
    Stack,
} from '@frontify/arcade';
import React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function NavigationBar() {
    const [path, setPath] = useState([
        { title: 'Arcade', url: '/' },
        { title: 'Inventory', url: '/inventory' },
    ]);
    const [source, setSource] = useState({ title: ' workspace_template-chooser' });

    return (
        <custom-h-stack gap="small" padding="small" align-items="center">
            <Link to="/">
                <IconArrowLeft size="Size16"></IconArrowLeft>
            </Link>
            <custom-h-stack align-items="center" gap="small">
                <IconSketch size="Size24"></IconSketch>
                <Stack direction="column">
                    <Breadcrumbs
                        items={[
                            { label: 'Arcade' },
                            { label: 'inventory' },
                            { bold: true, label: 'workspace_template-chooser' },
                        ]}
                    ></Breadcrumbs>
                    {/* <custom-breadcrumbs>
                        {path.map((entry) => {
                            return (
                                <Link key={entry.url} to={entry.url}>
                                    {entry.title}
                                </Link>
                            );
                        })}
                    </custom-breadcrumbs> */}
                </Stack>
            </custom-h-stack>
            <custom-spacer></custom-spacer>
            <button>
                <IconUploadAlternative size="Size20"></IconUploadAlternative>
            </button>
            <button>
                <IconMore size="Size20"></IconMore>
            </button>
        </custom-h-stack>
    );
}
