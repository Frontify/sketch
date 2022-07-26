import React, { useState, useEffect, useContext, useCallback } from 'react';

// Components
import {
    Badge,
    Button,
    Flyout,
    IconCaretRight,
    IconCaretDown,
    IconCheck,
    IconExternalLink,
    IconFolder,
    IconMore,
    IconArrowUp,
    IconCircle,
    IconUploadAlternative,
    LoadingCircle,
    MenuItem,
    Text,
    IconAddSimple,
    IconCollapse,
    IconExpand,
    IconUnknown,
    IconUnknownSimple,
    IconCross,
    IconTrash,
    IconMinusCircle,
    IconAlert,
    Tooltip,
    IconRefresh,
} from '@frontify/fondue';

import { ArtboardToolbar } from './ArtboardToolbar';
import { EmptyState } from '../Core/EmptyState';

// Hooks
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSketch } from '../../hooks/useSketch';
import { useTranslation } from 'react-i18next';

// Context
import { UserContext } from '../../context/UserContext';

// GraphQL
import { assetsQuery } from '../../graphql/assets.graphql';
import { queryGraphQLWithAuth } from '../../graphql/graphql';

import { timeAgo } from '../utils.js';

/**
 * ⚛️ Artboard Item
 * ----------------------------------------------------------------------------
 */
export function ArtboardItem({ artboard, showPath = true, requestArtboards, uploadArtboards }) {
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
                                                key={destination.remote_id}
                                                requestArtboards={requestArtboards}
                                                uploadArtboards={uploadArtboards}
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

function ArtboardGroupItem({ group, uploadGroup, open, onOpen, onClose, requestArtboards, uploadArtboards }) {
    return (
        <custom-v-stack>
            <custom-h-stack gap="x-small" align-items="center" style={{ marginLeft: '16px' }} padding="xx-small">
                <div>
                    {open ? (
                        <Button
                            inverted={false}
                            style="Secondary"
                            solid={false}
                            size="Small"
                            icon={<IconCaretDown></IconCaretDown>}
                            onClick={() => onClose(group.key)}
                        ></Button>
                    ) : (
                        <Button
                            inverted={false}
                            style="Secondary"
                            solid={false}
                            size="Small"
                            icon={<IconCaretRight></IconCaretRight>}
                            onClick={() => onOpen(group.key)}
                        ></Button>
                    )}
                </div>
                <custom-v-stack
                    gap="x-small"
                    overflow="hidden"
                    flex
                    style={{ cursor: 'default' }}
                    title={`${group.breadcrumbs?.join(' / ')} / ${group.title}`}
                >
                    <custom-v-stack gap="xx-small">
                        <custom-breadcrumbs overflow="hidden" flex>
                            {group.breadcrumbs &&
                                group.breadcrumbs.map((breadcrumb, index) => (
                                    <custom-h-stack gap="x-small" key={index} overflow="hidden">
                                        <Text
                                            color="weak"
                                            size="small"
                                            key={index}
                                            overflow="ellipsis"
                                            whitespace="nowrap"
                                        >
                                            {breadcrumb}
                                        </Text>
                                        <Text color="weak">
                                            <span style={{ opacity: 0.5 }}>/</span>
                                        </Text>
                                    </custom-h-stack>
                                ))}
                            <Text padding="small" size="small" weight="strong" overflow="ellipsis" whitespace="nowrap">
                                {group.title}
                            </Text>
                        </custom-breadcrumbs>
                    </custom-v-stack>
                </custom-v-stack>

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
                    <div style={{ marginRight: '12px', flex: 0 }}>
                        {/* <Button inverted={false} style="Secondary" solid={false} icon={<IconMore />}></Button> */}
                    </div>
                </custom-h-stack>
            </custom-h-stack>

            {open
                ? group.children.map((artboard) => {
                      return (
                          <custom-v-stack key={artboard.id}>
                              {artboard.destinations.map((destination) => {
                                  return (
                                      <ArtboardDestinationItem
                                          artboard={artboard}
                                          display="artboard"
                                          destination={destination}
                                          key={destination.remote_id}
                                          requestArtboards={requestArtboards}
                                          uploadArtboards={uploadArtboards}
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

export function ArtboardDestinationItem({
    artboard,
    destination,
    display = 'path',
    requestArtboards,
    uploadArtboards,
}) {
    const [open, setOpen] = useState(false);
    const context = useContext(UserContext);
    const [transfer, setTransfer] = useState({});

    const { t } = useTranslation();

    useEffect(() => {
        if (destination) setTransfer(context.transferMap[destination.remote_id || artboard.id]);
    }, [context.transferMap]);

    const openExternal = (url) => {
        useSketch('openUrl', { url });
    };

    const base = context.auth.domain;

    const frontifyUrl = `${base}/screens/${destination.remote_id}`;

    return (
        <custom-palette-item hover="off" gap="x-small">
            <custom-h-stack gap="small" align-items="center" padding-x="small">
                {/* Modified */}

                <custom-artboard-thumbnail
                    title={t('artboards.view_on_frontify')}
                    onClick={() => {
                        openExternal(frontifyUrl);
                        setOpen(false);
                    }}
                >
                    {destination.api?.previewUrl && <img src={`${destination.api?.previewUrl}?width=96`} alt="" />}
                </custom-artboard-thumbnail>

                <custom-v-stack gap="xx-small">
                    <custom-h-stack align-items="center" gap="x-small">
                        <Text
                            color={destination.selected ? '' : '    '}
                            weight={
                                destination.selected && transfer?.status != 'upload-complete' ? 'strong' : 'default'
                            }
                        >
                            {artboard.name}
                        </Text>
                        <div show-on-hover="true" cursor="pointer">
                            <IconExternalLink
                                title={t('artboards.view_on_frontify')}
                                onClick={() => openExternal(frontifyUrl)}
                            />
                        </div>
                    </custom-h-stack>
                    <Text
                        size="small"
                        color={destination.selected ? '' : 'weak'}
                        weight={destination.selected && transfer?.status != 'upload-complete' ? 'strong' : 'default'}
                    >
                        {/* {new Date(destination.api?.modifiedAt).toLocaleString()} */}
                        {transfer?.status != 'upload-failed' && timeAgo(new Date(destination.api?.modifiedAt))}
                    </Text>
                    {transfer?.status == 'upload-failed' && transfer?.error && (
                        <Tooltip
                            content={t(`error.artboard_error_code_${transfer.error}`)}
                            withArrow
                            hoverDelay={0}
                            triggerElement={
                                <custom-h-stack gap="x-small" align-items="center">
                                    <IconAlert></IconAlert>
                                    <Text
                                        size="small"
                                        weight={
                                            destination.selected && transfer?.status != 'upload-complete'
                                                ? 'strong'
                                                : 'default'
                                        }
                                    >
                                        {t('error.upload_failed')}
                                    </Text>
                                </custom-h-stack>
                            }
                        />
                    )}
                </custom-v-stack>

                <custom-spacer></custom-spacer>

                <custom-h-stack align-items="center">
                    {destination.selected && !transfer && (
                        <Button
                            style="Secondary"
                            icon={
                                <IconUploadAlternative
                                    size="Size20"
                                    style={{ color: 'var(--box-selected-strong-color)' }}
                                />
                            }
                            inverted={false}
                            solid={false}
                            hugWidth={true}
                            onClick={() => {
                                uploadArtboards([artboard]);
                            }}
                        ></Button>
                    )}
                    {transfer && transfer.status == 'upload-failed' && (
                        <Tooltip
                            content={t('general.retry')}
                            withArrow
                            hoverDelay={0}
                            triggerElement={
                                <Button
                                    style="Secondary"
                                    icon={<IconRefresh size="Size20" />}
                                    inverted={false}
                                    solid={false}
                                    hugWidth={true}
                                    onClick={async () => {
                                        let patched = JSON.parse(JSON.stringify(artboard));
                                        patched.destinations.forEach((destination) => {
                                            destination.remote_id = null;
                                        });
                                        await uploadArtboards([patched]);
                                        requestArtboards();
                                    }}
                                ></Button>
                            }
                        />
                    )}
                    {transfer && transfer.status == 'upload-queued' && (
                        <div style={{ marginRight: '8px' }}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="9" cy="9" r="8" stroke="rgba(0,0, 0,0.16)" strokeWidth="2" />
                            </svg>
                        </div>
                    )}
                    {transfer && transfer.status == 'uploading' && (
                        <div style={{ marginRight: '8px' }}>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                style={{ transform: 'rotate(-90deg)' }}
                            >
                                <circle cx="9" cy="9" r="8" stroke="rgba(0,0, 0,0.16)" strokeWidth="2" />
                                <circle
                                    style={{
                                        transition: 'all 0.25s ease',
                                        strokeDasharray: `${(transfer ? transfer.progress / 100 : 0) * 50} 50`,
                                    }}
                                    cx="9"
                                    cy="9"
                                    r="8"
                                    stroke="var(--box-selected-strong-color)"
                                    strokeWidth="2"
                                />
                            </svg>
                        </div>
                    )}
                    <div show-on-hover="false" style={{ marginRight: '-8px' }}>
                        <Flyout
                            hug={false}
                            fitContent={true}
                            isOpen={open}
                            onOpenChange={(isOpen) => setOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button
                                    style="Secondary"
                                    solid={false}
                                    inverted={false}
                                    icon={<IconMore />}
                                    onClick={() => setOpen((open) => !open)}
                                ></Button>
                            }
                        >
                            <custom-v-stack>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={t('artboards.view_on_frontify')}
                                    onClick={() => {
                                        openExternal(frontifyUrl);
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem
                                        decorator={<IconExternalLink />}
                                        title={t('artboards.view_on_frontify')}
                                    ></MenuItem>
                                </div>
                                <custom-line></custom-line>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={`Remove`}
                                    onClick={() => {
                                        useSketch('removeDestination', {
                                            id: artboard.id,
                                            brandID: context.selection.brand.id,
                                            destination,
                                        });
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem decorator={<IconMinusCircle />} title={'Remove'}>
                                        Remove
                                    </MenuItem>
                                </div>
                            </custom-v-stack>
                        </Flyout>
                    </div>
                </custom-h-stack>

                {/* <ArtboardDestinationStatusIcon
                destination={destination}
                transfer={transfer}
            ></ArtboardDestinationStatusIcon> */}
            </custom-h-stack>

            <custom-spacer></custom-spacer>

            {/* context.transferMap[destination.remote_id]?.progress &&
            context.transferMap[destination.remote_id]?.progress != 100 */}

            {transfer && transfer.status == 'upload-queued' ? '' : ''}
        </custom-palette-item>
    );
}

export function ArtboardGroupTransferAction({ group, uploadGroup }) {
    switch (group.transfer.status) {
        case 'idle':
            return (
                <custom-h-stack gap="x-small" align-items="center">
                    {/* <Text classNames="">{group.selectionCount}</Text> */}
                    {/* <Button
                        style="Secondary"
                        inverted={false}
                        solid={false}
                        hugWidth={true}
                        onClick={() => {
                            uploadGroup(group);
                        }}
                        icon={
                            <IconUploadAlternative
                                size="Size20"
                                style={{ color: 'var(--box-selected-strong-color)' }}
                            />
                        }
                    ></Button> */}
                </custom-h-stack>
            );

        case 'done':
            return <IconCheck></IconCheck>;
        case 'upload-complete':
            return '';

        case 'uploading':
            return (
                <custom-h-stack padding="x-small">{/* <LoadingCircle size="Small"></LoadingCircle> */}</custom-h-stack>
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
    const [artboardsMap, setArtboardsMap] = useState(new Map());
    const [canCancel, setCanCancel] = useState(true);
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
    const [uploadStatus, setUploadStatus] = useState({});

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
    };

    /**
     * Grouped Artboards
     */

    useEffect(async () => {
        let map = {};

        let groups = [];

        if (artboards) {
            /**
             * Note: This used to be artboards.forEach which would reflect the selection
             * By using "documentArtboards" we’ll always use all artboards, but still filter
             * out the ones that have never been uploaded.
             *
             */
            documentArtboards.forEach((artboard) => {
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

            groups.forEach(async (group) => {
                let transfer = {
                    status: 'idle',
                    totalProgress: 0,
                    remaining: 0,
                    total: 0,
                    progress: 0,
                    completed: 0,
                };
                group.children.forEach((artboard) => {
                    artboard.destinations.forEach(async (destination) => {
                        // Pre-select the item for upload based on the diff

                        destination.selected = artboard.sha != destination.sha;
                        if (destination.remote_id) {
                            destination.api = artboardsMap.get(destination.remote_id);
                        }

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

                                // Patch
                                destination.remote_id = transferEntry.target.remote_id;
                                await fetchArtboardsFromAPI([artboard]);
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
                    // Group done
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

            /**
             * We can derive the total upload progress by summing up all the
             * numbers that we have previously calculated for each folder/group.
             * We can then use that to display it in the toolbar.
             */
            setUploadStatus({
                status: 'unknown',
                totalProgress: groups.reduce((total, group) => total + group.transfer?.totalProgress, 0),
                remaining: groups.reduce((total, group) => total + group.transfer?.remaining, 0),
                total: groups.reduce((total, group) => total + group.transfer?.total, 0),
                progress: groups.reduce((total, group) => total + group.transfer?.progress, 0),
                completed: groups.reduce((total, group) => total + group.transfer?.completed, 0),
            });
        }
    }, [artboards, artboardsMap, projectMap, context.transferMap, view]);

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

        if (documentArtboards.length) fetchArtboardsFromAPI(documentArtboards);
    }, [documentArtboards]);

    /**
     * This function overrides any existing destinations
     */
    const uploadArtboardsToDestination = (artboards) => {
        let patchedArtboards = artboards.map((artboard) => {
            /**
             * 2 possible scenarios:
             *
             * A) The artboard has no existing destinations:
             *      -> add the new destination
             * B) The artboard has existing destinations:
             *      && the "remote_project_id" and the "remote_path" are:
             *          -> same: return
             *          -> different: replace the existing destinations with the new destination
             */

            let newDestination = {
                remote_project_id: uploadDestination.project.id,
                remote_id: null,
                remote_path: `/${uploadDestination.folderPath}/`,
            };

            // By default, we assign a single new destination.
            // But in case that we find an existing destination, we’ll use the original destinations.
            let patchedDestinations = [newDestination];
            let existingDestinations = artboard.destinations.length > 0;

            if (existingDestinations) {
                // Compare
                let match = false;
                artboard.destinations.forEach((destination) => {
                    let sameProject = destination.remote_project_id == uploadDestination.project.id;
                    let samePath = destination.remote_path == `/${uploadDestination.folderPath}/`;
                    if (sameProject && samePath) {
                        // keep it
                        match = true;
                        return;
                    }
                });

                /**
                 * If the location already exists, then we keep it -> this will replace the asset
                 */

                if (match) patchedDestinations = artboard.destinations;

                if (!match) {
                    /**
                     * In theory, we could just push the new destination
                     * This would result in *multiple* destinations.
                     * The asset would be uploaded to one or more folders.
                     *
                     * NOTE: We don’t support multiple destinations right now.
                     * There are a few open UX questions to be answered and
                     * it makes everything more complex. The data structure supports it
                     * (destinations is an Array) and the upload also works.
                     * The grouping doesn’t work correctly, as the asset will be
                     * displayed mutiple times per group.
                     */
                    // patchedDestinations.push(...artboard.destinations);
                }
            }
            return {
                ...artboard,
                destinations: patchedDestinations,
            };
        });

        uploadArtboards(patchedArtboards);
        requestArtboards();
    };

    /**
     * Tracks the transfer items and when there are no more things to upload, stop the loading.
     */
    useEffect(() => {
        let artboardsOnly = Object.keys(context.transferMap).filter((key) => {
            let entry = context.transferMap[key];
            // check type (GraphQL) or ext (Legacy API)
            return entry.type == 'Artboard' || entry.ext == 'png';
        });

        if (artboardsOnly.length == 0) setLoading(false);
        if (artboardsOnly.length > 0) setLoading(true);
    }, [context.transferMap]);

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
        return new Promise((resolve, reject) => {
            setCanCancel(true);
            if (artboards.length) {
                useSketch('uploadArtboards', { artboards, brandID: context.selection.brand.id }).then(() => {
                    resolve();
                });
            }
        });
    };

    useEffect(async () => {
        let response = await useSketch('getSelectedArtboards', context.selection.brand.id);

        setArtboards(response.artboards);
        setDocumentArtboards(response.documentArtboards);

        setTotal(response.total);
        setHasSelection(response.hasSelection);
    }, []);

    const fetchArtboardsFromAPI = useCallback(async (artboards) => {
        let ids = [];
        // React can’t detect deep changes to ES6 Map, so we’ll clone it first.
        // Otherwise, React would only see the same reference and not trigger re-renders.
        let artboardsMetadataMap = new Map(artboardsMap) || new Map();

        artboards.forEach((artboard) => {
            artboard.destinations.forEach((destination) => {
                ids.push(destination.remote_id);
            });
        });

        /**
         * Fetch artboards data, including name, thumbnail, modifiedAt, …
         * Then, we assign the received data to a lookup Map.
         * Using the Map, we can access the data for an artboard by its ID.
         */

        if (ids && ids.length) {
            let query = assetsQuery({ ids });
            let result = await queryGraphQLWithAuth({ query, auth: context.auth });

            result.data.assets.forEach((entry, index) => {
                artboardsMetadataMap.set(ids[index], entry);
            });

            setArtboardsMap(artboardsMetadataMap);
        }
    });

    /**
     * Subscription
     */

    useEffect(() => {
        let handler = async (event) => {
            let { type, payload } = event.detail.data;

            switch (type) {
                case 'artboards-changed':
                    /**
                     * Note: We used to filter the view by setting it to the selected artboards only
                     * But now we’ll always include all artboards that have been previously uploaded.
                     */
                    // setArtboards(payload.artboards);
                    setArtboards(payload.artboards);
                    setDocumentArtboards(payload.documentArtboards);
                    setTotal(payload.total);
                    setHasSelection(payload.hasSelection);

                    // fetchArtboardsFromAPI(payload.documentArtboards);

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
                <custom-scroll-view class="tw-bg-black-0">
                    {groupedArtboards.length ? (
                        <custom-v-stack flex stretch="true" separator="between">
                            {groupedArtboards.map((group) => {
                                return (
                                    <custom-v-stack
                                        key={group.key}
                                        style={{
                                            paddingBottom:
                                                !groupsMap[group.key] || groupsMap[group.key]?.open ? '8px' : 0,
                                        }}
                                    >
                                        <ArtboardGroupItem
                                            onOpen={onOpen}
                                            onClose={onClose}
                                            open={groupsMap[group.key] ? groupsMap[group.key]?.open : true}
                                            group={group}
                                            requestArtboards={requestArtboards}
                                            uploadGroup={uploadGroup}
                                            uploadArtboards={uploadArtboards}
                                        ></ArtboardGroupItem>
                                    </custom-v-stack>
                                );
                            })}
                        </custom-v-stack>
                    ) : (
                        <custom-v-stack flex stretch="true">
                            {!hasSelection && (
                                <EmptyState
                                    title={t('artboards.no_selection_title')}
                                    description={t('artboards.no_selection_description')}
                                ></EmptyState>
                            )}

                            {hasSelection && (
                                <EmptyState
                                    title={t('artboards.upload_selected_title')}
                                    description={t('artboards.upload_selected_description')}
                                ></EmptyState>
                            )}
                        </custom-v-stack>
                    )}
                </custom-scroll-view>
                <ArtboardToolbar
                    artboards={artboards}
                    canCancel={canCancel}
                    onCancel={() => setCanCancel(false)}
                    uploadStatus={uploadStatus}
                    hasSelection={hasSelection}
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
