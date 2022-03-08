import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../UserContext';
import {
    Button,
    IconBackward5Seconds,
    IconFolder,
    IconProjects,
    Text,
    Breadcrumbs,
    IconArrowLeft,
    LoadingCircle,
} from '@frontify/arcade';

export function UploadDestinationPicker() {
    let { actions, selection } = useContext(UserContext);

    // Loading
    let [loading, setLoading] = useState(false);

    // Project
    let [project, setProject] = useState('');

    // Folders
    let [folders, setFolders] = useState([]);
    let [folder, setFolder] = useState(null);
    let [breadcrumbs, setBreadcrumbs] = useState([]);

    // Watch projectID
    useEffect(async () => {
        await fetchProjectFolders(project.id);
    }, [project]);

    // Watch folderID
    useEffect(async () => {
        if (folder && folder.id) {
            setLoading(true);
            let result = await actions.getFolders(folder.id);
            setFolders(result.data.node.subFolders.items);
            setLoading(false);
        }
    }, [folder]);

    const fetchProjectFolders = async (projectID) => {
        setLoading(true);
        let result = await actions.getProjectFolders(projectID);
        let folders = result.data.workspaceProject.browse.subFolders.items;
        setFolders(folders);
        setLoading(false);
    };

    // Back
    const browseBack = () => {
        let previous = breadcrumbs[breadcrumbs.length - 2];
        setBreadcrumbs((b) => b.filter((_, i) => i !== b.length - 1));

        if (previous) {
            setFolder(previous);
        }
        if (!previous) {
            setProject(null);
            setFolder(null);
            fetchProjectFolders(project.id);
        }
    };

    const enterFolder = (folder) => {
        setFolder(folder);
        setBreadcrumbs((state) => state.concat(folder));
    };

    if (!project)
        return (
            <custom-v-stack>
                {selection.brand?.workspaceProjects?.items.map((project) => {
                    return (
                        <custom-palette-item
                            onClick={() => {
                                setProject(project);
                            }}
                            key={project.id}
                        >
                            <custom-h-stack gap="small">
                                <IconProjects></IconProjects>
                                <Text>{project.name}</Text>
                            </custom-h-stack>
                        </custom-palette-item>
                    );
                })}
            </custom-v-stack>
        );

    if (project && folders) {
        return (
            <custom-v-stack>
                <custom-palette-item
                    onClick={() => {
                        browseBack();
                    }}
                >
                    {breadcrumbs && breadcrumbs.length ? (
                        <custom-h-stack gap="small">
                            <IconArrowLeft></IconArrowLeft>
                            <Text>{breadcrumbs[breadcrumbs.length - 1].name}</Text>
                        </custom-h-stack>
                    ) : (
                        <custom-h-stack gap="small">
                            <IconArrowLeft></IconArrowLeft>
                            <Text>{project.name}</Text>
                        </custom-h-stack>
                    )}
                </custom-palette-item>

                {loading ? (
                    <custom-palette-item>
                        <LoadingCircle size="Small"></LoadingCircle>
                    </custom-palette-item>
                ) : (
                    folders.map((folder) => {
                        return (
                            <custom-palette-item key={folder.id}>
                                <custom-h-stack gap="small" align-items="center" onClick={() => enterFolder(folder)}>
                                    <IconFolder></IconFolder>
                                    <Text>{folder.name}</Text>
                                </custom-h-stack>
                            </custom-palette-item>
                        );
                    })
                )}
            </custom-v-stack>
        );
    }
}
