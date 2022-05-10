import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../UserContext';
import { IconFolder, IconSketch, IconProjects, Text, IconArrowLeft, LoadingCircle, IconFile } from '@frontify/arcade';

import { useSketch } from '../hooks/useSketch';

import { queryGraphQLWithAuth } from '../graphql';

export function UploadDestinationPicker({ onChange, onInput, allowfiles = false, paths = [] }) {
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

    const [projectMap, setProjectMap] = useState({});

    let context = useContext(UserContext);

    useEffect(() => {
        console.log('use effect with {paths}', paths);
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

    // Watch folderID

    const refreshFolder = async () => {
        if (folder) {
            setLoading(true);

            // Todo: Use workspace query

            /***
             * 
             * 
             * {
  node(id: "eyJpZGVudGlmaWVyIjoxOTEyNzcsInR5cGUiOiJwcm9qZWN0In0=") {
    ... on Workspace {
      id
      __typename
      browse {
        subFolders {
          items {
            name
          }
        }
      }
      assets(
        query: { inFolder: {id: "eyJpZGVudGlmaWVyIjoxMDQ1NDYsInR5cGUiOiJmb2xkZXIifQ=="}}
      ) {
        items {
          __typename
          title
          ... on File {
            extension
            modifiedAt
          }
        }
      }
    }
  }
}

             */
            let query = `{
                node(id: "${folder.id}") {
                  __typename
                  id
                  ...on SubFolder {
                    id
                    name
                    assets(page: 1) {
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
                      }
                    }
                    subFolders {
                      items {
                        id
                        name
                      }
                    }
                    
                 } 
                  
                }
              }`;

            let graphQLresult = await queryGraphQLWithAuth({ query, auth: context.auth });

            let files = graphQLresult.data.node.assets.items;
            let folders = graphQLresult.data.node.subFolders.items;

            // let { success, folders, folder } = await actions.getProjectFolders(project.id, folder.path);
            setFiles(files);
            setFolders(folders);

            // GraphQL:
            // setFolders(result.data.node.subFolders.items);
            setLoading(false);
        }
    };

    useEffect(async () => {
        refreshFolder();
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
        return {
            type: 'folder',
            folder,
            project,
            name: folder.name,
            breadcrumbs,
            folderPath: []
                .concat(breadcrumbs.map((breadcrumb) => breadcrumb.name))
                .concat(folder.name)
                .join('/'),
            path: [selection.brand.name, project.name]
                .concat(breadcrumbs.map((breadcrumb) => breadcrumb.name))
                .concat(folder.name)
                .join('/'),
        };
    };

    // Back
    const browseBack = () => {
        const shouldEnterRoot = !breadcrumbs || breadcrumbs.length == 0;

        if (shouldEnterRoot) {
            setProject(null);
            setFolder(null);
        }

        const shouldEnterFolder = breadcrumbs && breadcrumbs.length > 0;

        if (shouldEnterFolder) {
            breadcrumbs.pop();
            let previous = breadcrumbs[breadcrumbs.length - 1];

            if (previous) {
                enterFolder(previous);
            } else {
                enterProject(project);
            }
            setBreadcrumbs((breadcrumbs) => breadcrumbs.splice(0, breadcrumbs.length - 1));
        }
    };

    const enterProject = (project) => {
        fetchProjectFolders(project);
    };
    const focusFolder = (folder) => {
        if (onInput) {
            onInput(wrappedFolder(folder));
        }
    };

    const enterFolder = (folder) => {
        setFolder(folder);
        setBreadcrumbs((state) => {
            if (state) {
                return state.concat(folder);
            } else {
                return [];
            }
        });
        onChange(wrappedFolder(folder));
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

    if (!projects)
        return (
            <custom-v-stack align-items="center" justify-content="center" stretch>
                <LoadingCircle></LoadingCircle>
            </custom-v-stack>
        );

    if (!project && !folder)
        return (
            <custom-scroll-view>
                {projects.map((project) => {
                    return (
                        <custom-palette-item
                            selectable
                            tabindex="-1"
                            onDoubleClick={() => {
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
            </custom-scroll-view>
        );

    if (project) {
        return (
            <custom-scroll-view>
                <custom-palette-item
                    onDoubleClick={() => {
                        browseBack();
                    }}
                >
                    <custom-h-stack gap="small">
                        <IconArrowLeft></IconArrowLeft>
                        <Text>Back</Text>
                    </custom-h-stack>
                </custom-palette-item>{' '}
                {loading ? (
                    <custom-v-stack align-items="center" justify-content="center" stretch>
                        <LoadingCircle></LoadingCircle>
                    </custom-v-stack>
                ) : (
                    <custom-v-stack stretch>
                        {!files.length && !folders.length && (
                            <custom-v-stack separator="top" stretch align-items="center" justify-content="center">
                                <Text color="weak">”{folder?.name}” is empty</Text>
                            </custom-v-stack>
                        )}
                        {folders.map((folder) => {
                            return (
                                <custom-palette-item
                                    selectable
                                    key={folder.id}
                                    tabindex="-1"
                                    onFocus={() => focusFolder(folder)}
                                >
                                    <custom-h-stack
                                        gap="small"
                                        align-items="center"
                                        onDoubleClick={() => enterFolder(folder)}
                                    >
                                        <IconFolder></IconFolder>
                                        <Text>{folder.name}</Text>
                                    </custom-h-stack>
                                </custom-palette-item>
                            );
                        })}

                        {files.map((file) => {
                            if (file.extension == 'sketch') {
                                return (
                                    <custom-palette-item selectable key={file.id} tabindex="-1" disabled={allowfiles}>
                                        <custom-h-stack
                                            gap="small"
                                            align-items="center"
                                            onDoubleClick={() => pickFile(file)}
                                        >
                                            <IconSketch></IconSketch>
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
                                            <IconFile></IconFile>
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
        );
    }
    return <LoadingCircle></LoadingCircle>;
}
