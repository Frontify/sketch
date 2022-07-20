import React, { useContext, useState, useEffect } from 'react';

// Components
import {
    Button,
    IconFolder,
    IconSketch,
    IconProjects,
    Text,
    IconArrowLeft,
    LoadingCircle,
    IconFile,
} from '@frontify/fondue';

// Context
import { UserContext } from '../../context/UserContext';

// Hooks
import { useSketch } from '../../hooks/useSketch';

// GraphQL
import { queryGraphQLWithAuth } from '../../graphql/graphql';

export function UploadDestinationPicker({ onChange, onInput, allowfiles = false, paths = [], disabled }) {
    let { actions, selection } = useContext(UserContext);

    // Loading
    let [loading, setLoading] = useState(false);

    // Project
    let [project, setProject] = useState(null);
    let [projects, setProjects] = useState(null);

    // Folders
    let [folders, setFolders] = useState([]);
    let [files, setFiles] = useState([]);
    let [folder, setFolder] = useState(null);
    let [breadcrumbs, setBreadcrumbs] = useState([]);

    // Pagination
    let [currentPage, setCurrentPage] = useState(0);

    const [projectMap, setProjectMap] = useState({});

    let context = useContext(UserContext);

    useEffect(() => {
        if (paths && paths.length) {
            if (paths.length == 1) {
                // single
                let complexPathObject = paths[0];
                if (!complexPathObject.folder) return;

                setFolder(complexPathObject.folder);
                setBreadcrumbs(complexPathObject.breadcrumb);
                setProject(complexPathObject.project);
            }

            if (paths.length > 1) {
                // multiple …
            }
        }
    }, []);

    // Watch projectID
    useEffect(async () => {
        if (project) fetchProjectFolders(project);
    }, [project]);

    // Run this when the currentPage changes
    useEffect(() => {
        if (folder && currentPage != 0) loadMore();
    }, [currentPage]);

    const loadMore = async () => {
        setLoading(true);

        let query = `{
            node(id: "${folder.id || folder.folder.id}") {
              __typename
              id
              ...on SubFolder {
                id
                name
                assets(page: ${currentPage}) {
                    hasNextPage
                    page
                    total
                  items {
                    
                    id
                    title
                    __typename
                    ...on File {
                      filename
                      extension
                      externalId
                      downloadUrl
                    }
                    ...on Image {
                        filename
                        extension
                        externalId
                        downloadUrl
                      }
                  }
                }
                subFolders(page: ${currentPage}) {
                    hasNextPage
                    total
                    limit
                    page
                  items {
                    id
                    name
                  }
                }
                
             } 
              
            }
          }`;

        // Example: total (31), page (1), limit (25)

        // 1. Fetch
        let graphQLresult = await queryGraphQLWithAuth({ query, auth: context.auth });
        let subFolders = graphQLresult.data.node.subFolders;
        let folderFiles = graphQLresult.data.node.assets;

        // 2. Concat folders
        let newFolders = folders.concat(subFolders.items);

        // 3. Sort
        newFolders = newFolders.sort(function (a, b) {
            return a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: 'base',
            });
        });

        setFolders(newFolders);

        // 4. Files
        let newFiles = files.concat(folderFiles.items);
        newFiles = newFiles.sort(function (a, b) {
            return a?.title?.localeCompare(b?.title, undefined, {
                numeric: true,
                sensitivity: 'base',
            });
        });
        setFiles(newFiles);

        // 3. Check if there are more pages
        let done = newFolders.length == subFolders.total && newFiles.length == folderFiles.total;

        if (!done) {
            // This will trigger the effect to run and load more items
            setCurrentPage(currentPage + 1);
        } else {
            setLoading(false);
        }
    };

    useEffect(async () => {
        setFolders([]);
        setFiles([]);
        setCurrentPage(0);
    }, [folder]);

    useEffect(async () => {
        if (projects) {
            let map = {};
            projects.forEach((project) => {
                map[project.id] = project;
            });

            setProjectMap(map);
        }
    }, [projects]);

    useEffect(async () => {
        let { projects } = await useSketch('getProjectsForBrand', { brand: selection.brand });

        setProjects(projects);
    }, []);
    const fetchProjectFolders = async (project) => {
        setLoading(true);
        // GraphQL:
        let graphQLresult = await actions.getProjectFolders(project.id);

        let files = graphQLresult.data.workspaceProject.browse.assets.items;
        let folders = graphQLresult.data.workspaceProject.browse.subFolders.items;

        setFiles(files);
        setFolders(folders);

        setLoading(false);
    };

    const wrappedFolder = (folder) => {
        if (!breadcrumbs) breadcrumbs = [];

        if (folder) {
            return {
                type: 'folder',
                folder,
                project,
                name: folder.name,
                breadcrumbs,
                folderPath: [].concat(breadcrumbs.map((breadcrumb) => breadcrumb.name)).join('/'),
                path: [selection.brand.name, project?.name || folder.project.name]
                    .concat(breadcrumbs.map((breadcrumb) => breadcrumb.name))
                    .join('/'),
            };
        }
    };

    // Back
    const browseBack = () => {
        setFiles([]);
        setFolders([]);

        const shouldEnterRoot = !breadcrumbs || breadcrumbs.length == 0;

        if (shouldEnterRoot) {
            setProject(null);
            setFolder(null);
            onChange(null);
        }

        const shouldEnterFolder = breadcrumbs && breadcrumbs.length > 0;
        let previous = null;
        if (shouldEnterFolder) {
            // breadcrumbs.pop();
            previous = breadcrumbs[breadcrumbs.length - 2];

            if (previous) {
                setFolder(previous);
            } else {
                enterProject(project);
            }
            setBreadcrumbs((breadcrumbs) => breadcrumbs.splice(0, breadcrumbs.length - 1));
        }
        if (previous) setCurrentPage(1);
    };

    const enterProject = (project) => {
        setCurrentPage(0);
        let root = {
            type: 'folder',
            folder: {
                id: project.id,
                name: project.name,
            },
            project,
            name: project.name,
            breadcrumbs,
            folderPath: [],
            path: '/',
        };
        fetchProjectFolders(project);
        setFolder(root);
        setProject(project);

        onChange(wrappedFolder(root));
    };
    const focusFolder = (newFolder) => {
        if (onInput) {
            onInput(wrappedFolder(newFolder));
            onChange(wrappedFolder(newFolder));
        }
    };

    const enterFolder = (newFolder) => {
        setFolders([]);
        setFiles([]);
        setFolder(newFolder);
        setCurrentPage(1);

        // Add the folder to the breadcrumbs
        setBreadcrumbs((state) => {
            if (state) {
                return state.concat(newFolder);
            } else {
                return [];
            }
        });
    };

    useEffect(() => {
        onInput(wrappedFolder(folder));
        onChange(wrappedFolder(folder));
    }, [breadcrumbs]);

    const focusFile = (file) => {
        onInput({
            type: 'file',
            file,
            project,
            breadcrumbs,
            path: [selection.brand.name, project.name]
                .concat(breadcrumbs.map((breadcrumb) => breadcrumb.name))
                .join('/'),
        });
    };

    const pickFile = (file) => {
        onChange({
            type: 'file',
            file,
            project,
            breadcrumbs,
            path: [selection.brand.name, project.name]
                .concat(breadcrumbs.map((breadcrumb) => breadcrumb.name))
                .join('/'),
        });
    };

    /**
     * Case 1: No projects loaded
     */
    if (!projects)
        return (
            <custom-v-stack align-items="center" justify-content="center" stretch>
                <LoadingCircle></LoadingCircle>
            </custom-v-stack>
        );

    /**
     * Case 2: No projects exist for this user
     */
    if (projects.length == 0)
        return (
            <custom-v-stack align-items="center" justify-content="center" stretch>
                <Text>No Projects</Text>
            </custom-v-stack>
        );

    /**
     * Case 3: No project has been selected
     */
    if (!project && !folder)
        return (
            <custom-scroll-view>
                <custom-h-stack padding="small" separator="bottom">
                    <Text weight="strong">Projects</Text>
                </custom-h-stack>

                {projects.map((project) => {
                    return (
                        <custom-palette-item
                            selectable
                            tabindex="-1"
                            cursor="pointer"
                            onFocus={() => {
                                enterProject(project);
                            }}
                            key={project.id}
                        >
                            <custom-h-stack gap="small" align-items="center">
                                <IconProjects size="Size20"></IconProjects>
                                <Text>{project.name}</Text>
                            </custom-h-stack>
                        </custom-palette-item>
                    );
                })}
            </custom-scroll-view>
        );

    /**
     * Case 4: Project has been selected, folders are shown
     */
    if (project) {
        return (
            <custom-v-stack stretch overflow="hidden">
                <custom-h-stack
                    gap="small"
                    separator="bottom"
                    padding="small"
                    align-items="center"
                    justify-content="space-between"
                >
                    <Button
                        disabled={disabled}
                        icon={<IconArrowLeft></IconArrowLeft>}
                        size="Small"
                        style="Secondary"
                        onClick={() => {
                            browseBack();
                        }}
                    ></Button>

                    <Text weight="strong">{folder?.name || project?.name}</Text>
                </custom-h-stack>

                <custom-scroll-view>
                    {loading ? (
                        <custom-v-stack align-items="center" justify-content="center" stretch>
                            <LoadingCircle></LoadingCircle>
                        </custom-v-stack>
                    ) : (
                        <custom-v-stack stretch>
                            {!files.length && !folders.length && (
                                <custom-v-stack stretch align-items="center" justify-content="center">
                                    {!folder && <Text color="weak">This project has no folders</Text>}
                                    {folder && !folder.name && <Text color="weak">This folder is empty</Text>}
                                    {folders.length == 0 && files.length == 0 && (
                                        <Text color="weak">This folder has no files.</Text>
                                    )}
                                </custom-v-stack>
                            )}
                            {folders.map((folder) => {
                                return (
                                    <custom-palette-item
                                        disabled={disabled}
                                        cursor="pointer"
                                        selectable
                                        key={folder.id}
                                        tabindex="-1"
                                        onFocus={() => enterFolder(folder)}
                                    >
                                        <custom-h-stack gap="small" align-items="center">
                                            <IconFolder size="Size20"></IconFolder>
                                            <Text>{folder.name}</Text>
                                        </custom-h-stack>
                                    </custom-palette-item>
                                );
                            })}

                            {files.map((file) => {
                                if (file == null) return '';
                                if (file.extension == 'sketch') {
                                    return (
                                        <custom-palette-item
                                            selectable
                                            key={file.id}
                                            tabindex="-1"
                                            disabled={!allowfiles || disabled}
                                            onFocus={() => focusFile(file)}
                                        >
                                            <custom-h-stack
                                                gap="small"
                                                align-items="center"
                                                onDoubleClick={() => pickFile(file)}
                                            >
                                                <IconSketch size="Size20"></IconSketch>
                                                <Text>
                                                    {file.title}
                                                    <span style={{ opacity: 0.5 }}>.{file.extension}</span>
                                                </Text>
                                            </custom-h-stack>
                                        </custom-palette-item>
                                    );
                                }

                                if (file.extension != 'sketch') {
                                    return (
                                        <custom-palette-item key={file.id} disabled>
                                            <custom-h-stack gap="small" align-items="center">
                                                <IconFile size="Size20"></IconFile>
                                                <Text>
                                                    {file.title}
                                                    {file.__typename ? (
                                                        <span style={{ opacity: 0.5 }}>.{file.extension}</span>
                                                    ) : (
                                                        ''
                                                    )}
                                                </Text>
                                            </custom-h-stack>
                                        </custom-palette-item>
                                    );
                                }
                            })}
                        </custom-v-stack>
                    )}
                </custom-scroll-view>
            </custom-v-stack>
        );
    }
    return <LoadingCircle></LoadingCircle>;
}
