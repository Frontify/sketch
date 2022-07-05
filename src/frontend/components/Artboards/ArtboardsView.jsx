import React, { useState, useEffect, useContext } from 'react';

// Components
import {
    Badge,
    Button,
    IconCaretRight,
    IconCaretDown,
    IconCheck,
    IconFolder,
    IconMore,
    IconArrowUp,
    IconCircle,
    IconUploadAlternative,
    LoadingCircle,
    Text,
    IconAddSimple,
    IconCollapse,
    IconExpand,
    IconUnknown,
    IconUnknownSimple,
} from '@frontify/fondue';

import { ArtboardToolbar } from './ArtboardToolbar';
import { EmptyState } from './EmptyState';

// Hooks
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSketch } from '../../hooks/useSketch';
import { useTranslation } from 'react-i18next';

// Context
import { UserContext } from '../../context/UserContext';

/**
 * ⚛️ Artboard Item
 * ----------------------------------------------------------------------------
 */
export function ArtboardItem({ artboard, showPath = true }) {
    return (
        <custom-v-stack>
            <custom-h-stack gap="small" flex padding="small">
                <custom-v-stack flex>
                    <custom-h-stack align-items="center">
                        <custom-v-stack>
                            <Text>
                                <strong>{artboard.name}</strong>
                                <span>.png</span>
                            </Text>
                        </custom-v-stack>
                    </custom-h-stack>

                    {showPath ? (
                        <custom-h-stack align-items="center" flex gap="x-small">
                            {!artboard.destinations.length ? (
                                <custom-h-stack flex>
                                    <Text color="weak">Untracked</Text>
                                    <custom-spacer></custom-spacer>
                                    <Badge style="Progress" icon={<IconAddSimple></IconAddSimple>}></Badge>
                                </custom-h-stack>
                            ) : (
                                <custom-v-stack flex>
                                    {artboard.destinations.map((destination, index) => {
                                        return (
                                            <ArtboardDestinationItem
                                                artboard={artboard}
                                                destination={destination}
                                                key={index}
                                            ></ArtboardDestinationItem>
                                        );
                                    })}
                                </custom-v-stack>
                            )}
                        </custom-h-stack>
                    ) : (
                        ''
                    )}
                </custom-v-stack>
            </custom-h-stack>
        </custom-v-stack>
    );
}

/**
 * ⚛️ Artboard Group Item
 * ----------------------------------------------------------------------------
 */

function ArtboardGroupItem({ group, uploadGroup, open, onOpen, onClose }) {
    return (
        <custom-v-stack padding="x-small" gap="x-small">
            <custom-h-stack gap="xx-small" align-items="center" style={{ marginLeft: '12px' }}>
                <div>
                    {open ? (
                        <Button
                            inverted={true}
                            size="Small"
                            icon={<IconCaretDown></IconCaretDown>}
                            onClick={() => onClose(group.key)}
                        ></Button>
                    ) : (
                        <Button
                            inverted={true}
                            size="Small"
                            icon={<IconCaretRight></IconCaretRight>}
                            onClick={() => onOpen(group.key)}
                        ></Button>
                    )}
                </div>
                <custom-v-stack gap="x-small">
                    <custom-v-stack gap="xx-small">
                        <custom-breadcrumbs>
                            {group.breadcrumbs &&
                                group.breadcrumbs.map((breadcrumb, index) => (
                                    <custom-h-stack gap="x-small">
                                        <Text color="weak" size="small" key={index}>
                                            {breadcrumb}
                                        </Text>
                                        <Text color="weak">/</Text>
                                    </custom-h-stack>
                                ))}
                            <Text padding="small" size="small" weight="strong">
                                {group.title}
                            </Text>
                        </custom-breadcrumbs>
                    </custom-v-stack>
                    {group.selectionCount > 0 && (
                        <Text padding="small" size="x-small">
                            {group.transfer?.status == 'uploading' ? (
                                `Uploading (${group.transfer.remaining} remaining) `
                            ) : group.selectionCount ? (
                                <custom-h-stack align-items="center" gap="x-small">
                                    <Text
                                        size="x-small"
                                        weight="strong"
                                        style={{ color: 'var(--box-selected-strong-color)' }}
                                    >
                                        {group.selectionCount} Modified
                                    </Text>
                                </custom-h-stack>
                            ) : group.key != 'ungrouped' ? (
                                <Text color="weak" size="x-small">
                                    No changes
                                </Text>
                            ) : (
                                <Text color="weak" size="x-small">
                                    To upload, select artboards on the canvas first.
                                </Text>
                            )}
                        </Text>
                    )}
                </custom-v-stack>
                <custom-spacer></custom-spacer>
                <custom-h-stack style={{ flex: 0, alignSelf: 'start' }}>
                    {group.path ? (
                        group.selectionCount ? (
                            <div>
                                <ArtboardGroupTransferAction
                                    group={group}
                                    uploadGroup={uploadGroup}
                                ></ArtboardGroupTransferAction>
                            </div>
                        ) : (
                            ''
                        )
                    ) : (
                        ''
                    )}
                    <div>
                        <Button inverted="true" icon={<IconMore />}></Button>
                    </div>
                </custom-h-stack>
            </custom-h-stack>

            {open
                ? group.children.map((artboard) => {
                      return (
                          <custom-v-stack key={artboard.id} style={{ marginLeft: '16px' }}>
                              {artboard.destinations.map((destination) => {
                                  return (
                                      <ArtboardDestinationItem
                                          artboard={artboard}
                                          display="artboard"
                                          destination={destination}
                                          key={destination.remote_id}
                                      ></ArtboardDestinationItem>
                                  );
                              })}
                          </custom-v-stack>
                      );
                  })
                : ''}
        </custom-v-stack>
    );
}

export function UntrackedArtboardItem({ artboard }) {
    return (
        <custom-h-stack gap="x-small" style={{ width: '100%' }} align-items="center">
            <Badge style="Primary" icon={<IconUnknownSimple />}></Badge>
            <Text size="x-small">{artboard.name}.png</Text>
        </custom-h-stack>
    );
}

export function ArtboardDestinationStatusIcon({ destination, transfer }) {
    if (!destination) return <Badge style="Primary" icon={<IconUnknownSimple></IconUnknownSimple>}></Badge>;

    let isModified = destination.selected;
    let noChanges = !destination.selected;
    let isReadyForUpload =
        (destination.selected && !transfer) ||
        (destination.selected && transfer && transfer?.status == 'upload-complete');
    let isUploaded = !destination.selected && transfer?.status == 'upload-complete';
    let isUploading = transfer && transfer.status != 'upload-complete';

    if (noChanges) {
        return <Badge style="Positive" emphasis="Strong" icon={<IconCheck></IconCheck>}></Badge>;
    }

    if (isModified) {
        if (isReadyForUpload) {
            return <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconCircle></IconCircle>}></Badge>;
        }

        if (isUploaded) {
            return <Badge style="Positive" emphasis="Strong" icon={<IconCheck></IconCheck>}></Badge>;
        }

        if (isUploading) {
            return <Badge style="Warning" size="Small" emphasis="Strong" icon={<IconArrowUp></IconArrowUp>}></Badge>;
        }
    }
}

/**
 * ⚛️ Destination Item
 * ----------------------------------------------------------------------------
 */

export function ArtboardDestinationItem({ artboard, destination, display = 'path' }) {
    const context = useContext(UserContext);
    const [transfer, setTransfer] = useState({});
    useEffect(() => {
        if (destination) setTransfer(context.transferMap[destination.remote_id || artboard.id]);
    }, [context.transferMap]);
    return (
        <custom-h-stack
            gap="x-small"
            style={{
                width: '100%',
            }}
        >
            {display == 'artboard' ? (
                <custom-h-stack gap="small" align-items="center">
                    {/* Modified */}
                    {/* <ArtboardDestinationStatusIcon
                        destination={destination}
                        transfer={transfer}
                    ></ArtboardDestinationStatusIcon> */}

                    <custom-artboard-thumbnail></custom-artboard-thumbnail>
                    <custom-v-stack gap="x-small">
                        <Text
                            color={destination.selected ? '' : '    '}
                            weight={
                                destination.selected && transfer?.status != 'upload-complete' ? 'strong' : 'default'
                            }
                        >
                            {artboard.name}
                        </Text>
                        <Text size="small" color="weak">
                            ??? ago
                        </Text>
                    </custom-v-stack>
                </custom-h-stack>
            ) : (
                <custom-h-stack size="small" color="weak" gap="x-small" align-items="center">
                    <ArtboardDestinationStatusIcon
                        destination={destination}
                        transfer={transfer}
                    ></ArtboardDestinationStatusIcon>

                    {destination ? (
                        <custom-h-stack align-items="center">
                            <Text color="weak" size="x-small">
                                /
                            </Text>
                            <Text color="weak" size="x-small">
                                {destination.remote_project_name}
                            </Text>
                            <Text color="weak" size="x-small">
                                {destination.remote_path}
                            </Text>
                        </custom-h-stack>
                    ) : (
                        <Text color="weak" size="x-small">
                            Not yet uploaded
                        </Text>
                    )}
                </custom-h-stack>
            )}

            <custom-spacer></custom-spacer>

            {/* context.transferMap[destination.remote_id]?.progress &&
            context.transferMap[destination.remote_id]?.progress != 100 */}

            {transfer && transfer.status == 'uploading' ? (
                <custom-h-stack gap="small" align-items="center" style={{ marginRight: '8px' }}>
                    <Text size="small">
                        <span style={{ fontSize: '12px', fontFeatureSettings: 'tnum' }}>
                            {Math.floor(transfer.progress)}%
                        </span>
                    </Text>
                    {/* <LoadingCircle size="Small"></LoadingCircle> */}
                </custom-h-stack>
            ) : (
                ''
            )}

            {transfer && transfer.status == 'upload-queued' ? '' : ''}
        </custom-h-stack>
    );
}

export function ArtboardGroupTransferAction({ group, uploadGroup }) {
    switch (group.transfer.status) {
        case 'idle':
            return (
                <Button
                    icon={<IconUploadAlternative style={{ color: 'var(--box-selected-strong-color)' }} />}
                    inverted="true"
                    onClick={() => {
                        uploadGroup(group);
                    }}
                >
                    <Text classNames="">{group.selectionCount}</Text>
                </Button>
            );

        case 'done':
            return <IconCheck></IconCheck>;

        case 'uploading':
            return (
                <custom-h-stack padding="x-small">
                    <LoadingCircle size="Small"></LoadingCircle>
                </custom-h-stack>
            );

        case 'pending':
            return '';
        default:
            return '';
    }
}

/**
 * ⚛️ Artboards View
 * ----------------------------------------------------------------------------
 */

export function ArtboardsView() {
    const context = useContext(UserContext);

    const [artboards, setArtboards] = useState([]);
    const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
    const [documentArtboards, setDocumentArtboards] = useState([]);
    const [groupedArtboards, setGroupedArtboards] = useState({});
    const [hasSelection, setHasSelection] = useState(false);
    const [loading, setLoading] = useState(false);
    const [modifiedArtboards, setModifiedArtboards] = useState([]);
    const [open, setOpen] = useState(false);
    const [showRecentDestinations, setShowRecentDestinations] = useState(false);
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [total, setTotal] = useState(0);
    const [usedFolders, setUsedFolders] = useState(new Map());

    // Legacy: We used to have "all" and "modified" views.
    // Now, there’s only a view of "all" which excludes untracked artboards.

    const [view, setView] = useState('all');

    const [groupsExpansionState, setGroupsExpansionState] = useLocalStorage('cache.groupsExpansionState', 'collapsed');

    const [groupsMap, setGroupsMap] = useLocalStorage('cache.groupsMap', {});

    const [projectMap, setProjectMap] = useState({});

    const onOpen = (key) => {
        let clone = Object.assign({}, groupsMap);
        if (!clone[key]) clone[key] = {};
        clone[key].open = true;
        setGroupsMap(clone);
    };
    const onClose = (key) => {
        let clone = Object.assign({}, groupsMap);
        if (!clone[key]) clone[key] = {};
        clone[key].open = false;
        setGroupsMap(clone);
    };

    useEffect(async () => {
        let { projects } = await useSketch('getProjectsForBrand', { brand: context.selection.brand });

        let map = {};
        projects.forEach((project) => {
            map[project.id] = project;
        });

        // if (context.selection?.workspaceProjects) {
        //     context.selection.workspaceProjects.forEach((workspaceProject) => {
        //         projectMap[workspaceProject.id] = workspaceProject;
        //     });
        // }
        setProjectMap(map);
    }, []);

    const [uploadDestination, setUploadDestination] = useState({});

    const [currentSource, setCurrentSource] = useState({});
    const { t } = useTranslation();

    const uploadSome = async (groups = groupedArtboards) => {
        let matchedGroups = groups.filter((group) => group.selectionCount > 0);

        let someArtboards = [];
        matchedGroups.forEach((group) => {
            group.children.forEach((artboard) => {
                artboard.destinations.forEach((destination) => {
                    if (destination.sha != artboard.sha) {
                        someArtboards.push(artboard);
                    }
                });
            });
        });

        uploadArtboards(someArtboards);
    };

    const onCreateFolder = async (folder) => {
        let payload = {
            project: folder.project.id,
            folder: folder.folderPath,
            name: 'New Folder',
        };
        let response = await useSketch('createFolder', payload);
    };

    const uploadGroup = (group) => {
        uploadSome([group]);
    };

    const collapseGroups = () => {
        setGroupsExpansionState('collapsed');
        setGroupsMap((state) => {
            let clone = Object.assign({}, state);
            Object.keys(clone).forEach((key) => {
                clone[key].open = false;
            });
            return clone;
        });
    };
    const expandGroups = () => {
        setGroupsExpansionState('expanded');
        setGroupsMap((state) => {
            let clone = Object.assign({}, state);
            Object.keys(clone).forEach((key) => {
                clone[key].open = true;
            });
            return clone;
        });
    };

    const requestArtboards = async () => {
        let response = await useSketch('getSelectedArtboards', context.selection.brand.id);

        setArtboards(response.artboards);
        setDocumentArtboards(response.documentArtboards);
        setTotal(response.total);
        setHasSelection(response.hasSelection);
        // setArtboards(mockedArtall);
    };

    /**
     * Grouped Artboards
     */

    useEffect(async () => {
        let map = {};

        let groups = [];

        if (artboards) {
            artboards.forEach((artboard) => {
                if (!artboard.destinations || artboard.destinations.length == 0) {
                    // Do nothing
                    // map['ungrouped'].children.push(artboard);
                    return;
                }

                artboard.destinations.forEach((destination) => {
                    let projectName = projectMap[destination.remote_project_id]?.name;
                    let key = `${destination.remote_project_id}${destination.remote_path}`;
                    let parts = destination.remote_path.split('/');
                    let title = parts[parts.length - 2];
                    if (!map[key]) {
                        map[key] = {
                            key: key,
                            title: title,
                            path: destination.remote_path,
                            breadcrumbs: [projectName, ...parts.splice(1, parts.length - 3)],
                            fullPath: `${title}${destination.remote_path}`,
                            project_id: destination.remote_project_id,
                            children: [],
                            selectionCount: 0,
                        };

                        groups.push(map[key]);
                    }

                    map[key].children.push(artboard);
                });
            });
            // Sort and filter empty groups
            groups.sort((a, b) => {
                return a.title > b.title && b.title != 'No Folder' ? 1 : -1;
            });
            groups = groups.filter((group) => group.children.length);
            // Include transfer status

            groups.forEach((group) => {
                let transfer = {
                    status: 'idle',
                    totalProgress: 0,
                    remaining: 0,
                    total: 0,
                    progress: 0,
                    completed: 0,
                };
                group.children.forEach((artboard) => {
                    artboard.destinations.forEach((destination) => {
                        // Pre-select the item for upload based on the diff

                        destination.selected = artboard.sha != destination.sha;
                        if (destination.selected) group.selectionCount++;

                        let transferEntry = context.transferMap[destination.remote_id || artboard.id];
                        if (transferEntry) {
                            if (transferEntry.status == 'uploading') {
                                transfer.status = 'uploading';
                            }
                            if (transferEntry.progress == 100) {
                                transfer.completed++;

                                // this will mark it with a "check" icon
                                destination.sha = artboard.sha;
                                // destination.selected = false;
                                // group.selectionCount--;
                            }
                            transfer.totalProgress += transferEntry.progress;
                            if (destination.selected) {
                                transfer.total += 100;
                            } else {
                                transfer.completed++;
                            }
                        } else {
                            transfer.completed++;
                        }
                    });
                });
                transfer.progress = Math.ceil((transfer.totalProgress / transfer.total) * 100);
                if (transfer.remaining > 0) {
                    transfer.status = 'uploading';
                }
                if (transfer.progress == 100) {
                    transfer.status = 'upload-complete';
                    // transfer.progress = 0;
                }
                if (transfer.progress == 0) {
                    transfer.status = 'idle';
                }

                transfer.remaining = group.children.length - transfer.completed;

                if (transfer.remaining > 0) {
                    transfer.status = 'uploading';
                }

                group.transfer = transfer;
            });

            // Only show groups that include modified artboards

            if (view == 'modified') {
                groups = groups
                    .map((group) => {
                        return {
                            ...group,
                            children: group.children.filter(
                                (artboard) => artboard.destinations.filter((destination) => destination.selected).length
                            ),
                        };
                    })
                    .filter((group) => group.children.length);
            }

            setModifiedArtboards(() => {
                let result = [];
                groups.forEach((group) => {
                    group.children.forEach((artboard) =>
                        artboard.destinations.forEach((destination) => {
                            if (destination.selected) {
                                result.push(artboard);
                            }
                        })
                    );
                });
                return result;
            });

            groups.forEach((group) => {
                if (group.transfer == 'done') {
                    requestArtboards();
                }
            });

            setGroupedArtboards(groups);
        }
    }, [artboards, projectMap, context.transferMap, view]);

    // Computed used folders
    useEffect(() => {
        if (!artboards) return;
        let usedFolders = new Map();
        documentArtboards.forEach((artboard) => {
            if (!artboard.destinations) return;
            artboard.destinations.forEach((destination) => {
                let parts = destination.remote_path.split('/');

                usedFolders.set(`${destination.remote_project_id}${destination.remote_path}`, {
                    ...destination,
                    name: parts[parts.length - 2],
                });
            });

            setUsedFolders(usedFolders);
        });
    }, [documentArtboards]);

    const uploadArtboardsToDestination = (artboards) => {
        let patchedArtboards = artboards.map((artboard) => {
            return {
                ...artboard,
                destinations: [
                    {
                        remote_project_id: uploadDestination.project.id,
                        remote_id: null,
                        remote_path: `/${uploadDestination.folderPath}/`,
                    },
                ],
            };
        });

        uploadArtboards(patchedArtboards);
        requestArtboards();
    };

    useEffect(() => {
        if (artboards) {
            artboards.forEach((artboard) => {
                artboard.destinations.forEach((destination) => {
                    destination.remote_project_name = projectMap[destination.remote_project_id]?.name;
                });
            });
        }
        setArtboards(artboards);
    }, [documentArtboards, projectMap]);

    const uploadArtboards = async (artboards) => {
        setLoading(true);
        await useSketch('uploadArtboards', { artboards, brandID: context.selection.brand.id });
        setLoading(false);
    };

    useEffect(async () => {
        let response = await useSketch('getSelectedArtboards', context.selection.brand.id);

        setArtboards(response.artboards);
        setDocumentArtboards(response.documentArtboards);

        setTotal(response.total);
        setHasSelection(response.hasSelection);
    }, []);

    /**
     * Subscription
     */

    useEffect(() => {
        let handler = (event) => {
            let { type, payload } = event.detail.data;

            switch (type) {
                case 'artboards-changed':
                    setArtboards(payload.artboards);
                    setDocumentArtboards(payload.documentArtboards);
                    setTotal(payload.total);
                    setHasSelection(payload.hasSelection);

                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

    // All Artboards
    if (artboards && artboards.length) {
        return (
            <custom-v-stack flex stretch="true" overflow="hidden">
                <custom-scroll-view>
                    {groupedArtboards.length ? (
                        <custom-v-stack flex stretch="true" separator="between">
                            {groupedArtboards.map((group) => {
                                return (
                                    <custom-v-stack key={group.key} style={{ paddingBottom: '8px' }}>
                                        <ArtboardGroupItem
                                            onOpen={onOpen}
                                            onClose={onClose}
                                            open={groupsMap[group.key]?.open}
                                            group={group}
                                            uploadGroup={uploadGroup}
                                        ></ArtboardGroupItem>
                                    </custom-v-stack>
                                );
                            })}
                        </custom-v-stack>
                    ) : (
                        <custom-v-stack flex stretch="true">
                            <EmptyState
                                title={t('artboards.no_selection_title')}
                                description={t('artboards.no_selection_description')}
                            ></EmptyState>
                        </custom-v-stack>
                    )}
                </custom-scroll-view>
                <ArtboardToolbar
                    artboards={artboards}
                    loading={loading}
                    projectMap={projectMap}
                    usedFolders={usedFolders}
                    onCreateFolder={onCreateFolder}
                    modifiedArtboards={modifiedArtboards}
                    withDestinationPicker={hasSelection}
                    showRecentDestinations={showRecentDestinations}
                    setShowRecentDestinations={setShowRecentDestinations}
                    setShowDestinationPicker={setShowDestinationPicker}
                    showDestinationPicker={showDestinationPicker}
                    setUploadDestination={setUploadDestination}
                    uploadDestination={uploadDestination}
                    uploadArtboards={uploadArtboards}
                    uploadSome={uploadSome}
                    uploadArtboardsToDestination={uploadArtboardsToDestination}
                ></ArtboardToolbar>
            </custom-v-stack>
        );
    }

    return (
        <custom-scroll-view stretch>
            <EmptyState
                title={t('artboards.no_selection_title')}
                description={t('artboards.no_selection_description')}
            ></EmptyState>
        </custom-scroll-view>
    );
}
