import React, { useContext, useState, useEffect } from 'react';
import { UserContext } from '../UserContext';
import { IconFolder, IconSketch, IconProjects, Text, IconArrowLeft, LoadingCircle, IconFile } from '@frontify/arcade';

import { useSketch } from '../hooks/useSketch';

import { queryGraphQLWithAuth } from '../graphql';

export function UploadDestinationPicker({ onChange }) {
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

    let context = useContext(UserContext);

    // Watch projectID
    useEffect(async () => {
        if (project) fetchProjectFolders(project);
    }, [project]);

    // Watch folderID
    useEffect(async () => {
        if (project && folder) {
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
                    assets(page: 2) {
                      items {
                        id
                        title
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
    }, [folder]);

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
        onChange({ type: 'folder', folder, project });
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

    if (!projects) return <LoadingCircle></LoadingCircle>;

    if (!project)
        return (
            <custom-scroll-view>
                {projects.map((project) => {
                    return (
                        <custom-palette-item
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

    if (project && folders) {
        return (
            <custom-scroll-view>
                <custom-palette-item
                    onDoubleClick={() => {
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
                    <custom-v-stack stretch>
                        {folders.map((folder) => {
                            return (
                                <custom-palette-item selectable key={folder.id} tabindex="-1">
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
                                    <custom-palette-item selectable key={file.id} tabindex="-1">
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
                                        <custom-h-stack
                                            gap="small"
                                            align-items="center"
                                            onDoubleClick={() => pickFile(file)}
                                        >
                                            <IconFile></IconFile>
                                            <Text>
                                                {file.title}
                                                {file.extension ? (
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
