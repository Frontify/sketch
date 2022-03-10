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
import { useSketch } from '../hooks/useSketch';

export function UploadDestinationPicker({ onChange }) {
    let { actions, selection } = useContext(UserContext);

    // Loading
    let [loading, setLoading] = useState(false);

    // Project
    let [project, setProject] = useState(null);
    let [projects, setProjects] = useState(null);

    // Folders
    let [folders, setFolders] = useState([]);
    let [folder, setFolder] = useState(null);
    let [breadcrumbs, setBreadcrumbs] = useState([]);

    // Watch projectID
    useEffect(async () => {
        console.log('watched projecz', project);
        if (project) await fetchProjectFolders(project);
    }, [project]);

    // Watch folderID
    useEffect(async () => {
        if (project && folder) {
            setLoading(true);
            let result = await useSketch('getProjectFolders', { project, folder: folder?.id });
            // let { success, folders, folder } = await actions.getProjectFolders(project.id, folder.path);
            setFolders(result.folders);
            // GraphQL:
            // setFolders(result.data.node.subFolders.items);
            setLoading(false);
        }
    }, [folder]);

    useEffect(async () => {
        let { projects } = await useSketch('getProjectsForBrand', { brand: selection.brand });
        setProjects(projects);
    }, []);
    const fetchProjectFolders = async (project) => {
        console.log('fetchProjectFolders', project, folder);
        setLoading(true);
        // GraphQL:
        // let result = await actions.getProjectFolders(projectID);
        // let folders = result.data.workspaceProject.browse.subFolders.items;

        let result = await useSketch('getProjectFolders', { project, folder: folder?.id || '' });
        console.log('🚧', result);
        setFolders(result.folders);
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
            fetchProjectFolders(project);
        }
    };

    const enterFolder = (folder) => {
        setFolder(folder);
        setBreadcrumbs((state) => state.concat(folder));
        onChange({ folder, project });
    };

    if (!projects) return <LoadingCircle></LoadingCircle>;

    if (!project)
        return (
            <custom-v-stack>
                {projects.map((project) => {
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
    return <LoadingCircle></LoadingCircle>;
}
