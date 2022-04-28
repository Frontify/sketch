import React from 'react';
import {
    Badge,
    Button,
    Flyout,
    IconCaretRight,
    IconCaretDown,
    IconCheck,
    IconFolder,
    IconMore,
    IconArrowUp,
    IconCircle,
    IconPlus,
    IconPen,
    IconTriangle,
    IconUploadAlternative,
    LoadingCircle,
    Text,
    Checkbox,
    IconAddSimple,
    IconAdd,
} from '@frontify/arcade';

import mockedArtboards from './mocks/artboards';

import { UploadDestinationPicker } from './UploadDestinationPicker';
import { SearchField } from './SearchField';
import { useState, useEffect, useCallback, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';
import PropTypes from 'prop-types';

/**
 * ⚛️ Toolbar
 * ----------------------------------------------------------------------------
 */

ArtboardToolbar.propTypes = {
    artboards: PropTypes.array,
    loading: PropTypes.bool,
    modifiedArtboards: PropTypes.array,
    withDestinationPicker: PropTypes.bool,
    setShowDestinationPicker: PropTypes.func,
    showDestinationPicker: PropTypes.bool,
    setUploadDestination: PropTypes.func,
    uploadDestination: PropTypes.object,
    uploadSome: PropTypes.func,
    uploadArtboards: PropTypes.func,
    uploadArtboardsToDestination: PropTypes.func,
};

function ArtboardToolbar({
    artboards,
    loading,
    modifiedArtboards = [],
    withDestinationPicker,
    setShowDestinationPicker,
    showDestinationPicker,
    setUploadDestination,
    uploadSome,
    uploadArtboardsToDestination,
}) {
    const context = useContext(UserContext);
    return (
        <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center" separator="top">
            {withDestinationPicker ? (
                <Flyout
                    style={{ width: '100%' }}
                    onCancel={() => setShowDestinationPicker(false)}
                    isOpen={showDestinationPicker}
                    onOpenChange={(open) => {
                        if (open) {
                            setShowDestinationPicker(false);
                        } else {
                            setShowDestinationPicker(true);
                        }
                    }}
                    trigger={
                        <Button
                            hugWidth={false}
                            inverted={true}
                            onClick={() => {
                                setShowDestinationPicker(true);
                            }}
                            icon={<IconFolder />}
                        >
                            Upload to …
                        </Button>
                    }
                >
                    <custom-v-stack padding="small" gap="small">
                        <h2>Destination</h2>
                        <Text>Choose the folder where you want to upload your artboards.</Text>
                        <hr />
                        <UploadDestinationPicker
                            onChange={(value) => {
                                setUploadDestination(value);
                            }}
                        ></UploadDestinationPicker>
                        <hr />
                        <Button
                            onClick={() => {
                                uploadArtboardsToDestination(artboards);
                                setShowDestinationPicker(false);
                            }}
                        >
                            Confirm
                        </Button>
                    </custom-v-stack>
                </Flyout>
            ) : !loading ? (
                <Button
                    disabled={modifiedArtboards.length == 0}
                    style="Secondary"
                    hugWidth={false}
                    onClick={() => uploadSome()}
                    icon={
                        <IconUploadAlternative
                            style={{
                                color: modifiedArtboards.length == 0 ? 'inherit' : 'var(--box-selected-strong-color)',
                            }}
                        />
                    }
                >
                    Upload changes
                </Button>
            ) : (
                'Uploading …'
            )}
        </custom-h-stack>
    );
}

export { ArtboardToolbar };
/**
 * ⚛️ Artboard Item
 * ----------------------------------------------------------------------------
 */
export function ArtboardItem({ artboard, showPath = true }) {
    return (
        <custom-v-stack>
            <custom-h-stack gap="small" flex padding="small">
                {/* <custom-artboard-preview></custom-artboard-preview> */}
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

function ArtboardGroupItem({ group, uploadGroup }) {
    const [open, setOpen] = useState(true);

    return (
        <custom-v-stack padding="x-small" gap="x-small">
            <custom-h-stack gap="x-small">
                {open ? (
                    <IconCaretDown size="Size12" onClick={() => setOpen(false)}></IconCaretDown>
                ) : (
                    <IconCaretRight size="Size12" onClick={() => setOpen(true)}></IconCaretRight>
                )}
                <custom-v-stack gap="x-small">
                    <custom-h-stack gap="x-small">
                        {/* <IconFolder></IconFolder> */}
                        <Text padding="small" weight="strong">
                            {group.title}
                        </Text>
                    </custom-h-stack>
                    <Text padding="small" size="x-small">
                        {group.transfer?.status == 'uploading' ? (
                            `Uploading (${group.transfer.remaining} remaining) `
                        ) : group.selectionCount ? (
                            <custom-h-stack align-items="center" gap="x-small">
                                <Text size="x-small" style={{ color: 'var(--box-selected-strong-color)' }}>
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
                </custom-v-stack>
                <custom-spacer></custom-spacer>
                <custom-h-stack>
                    {group.path ? (
                        group.selectionCount ? (
                            <ArtboardGroupTransferAction
                                group={group}
                                uploadGroup={uploadGroup}
                            ></ArtboardGroupTransferAction>
                        ) : (
                            ''
                        )
                    ) : (
                        ''
                    )}
                    <Button inverted="true" icon={<IconMore />}></Button>
                </custom-h-stack>
            </custom-h-stack>

            {open
                ? group.children.map((artboard) => {
                      return (
                          <custom-v-stack key={artboard.id} style={{ marginLeft: '20px' }}>
                              {artboard.destinations.length == 0 ? (
                                  <UntrackedArtboardItem artboard={artboard}></UntrackedArtboardItem>
                              ) : (
                                  ''
                              )}
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
            <Badge style="Progress" emphasis="Strong">
                +
            </Badge>
            <Text size="x-small">{artboard.name}.png</Text>
        </custom-h-stack>
    );
}

export function ArtboardDestinationStatusIcon({ destination, transfer }) {
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
        setTransfer(context.transferMap[destination.remote_id]);
    }, [context.transferMap]);
    return (
        <custom-h-stack
            gap="x-small"
            style={{
                width: '100%',
            }}
        >
            {display == 'artboard' ? (
                <custom-h-stack gap="x-small" align-items="center">
                    {/* Modified */}
                    <ArtboardDestinationStatusIcon
                        destination={destination}
                        transfer={transfer}
                    ></ArtboardDestinationStatusIcon>

                    <Text
                        size="x-small"
                        weight={destination.selected && transfer?.status != 'upload-complete' ? 'strong' : 'default'}
                    >
                        {artboard.name}.png
                    </Text>
                </custom-h-stack>
            ) : (
                <custom-h-stack size="small" color="weak" gap="x-small">
                    <ArtboardDestinationStatusIcon
                        destination={destination}
                        transfer={transfer}
                    ></ArtboardDestinationStatusIcon>

                    <Text color="weak">/</Text>
                    <Text color="weak">{destination.remote_project_id}</Text>
                    <Text color="weak">{destination.remote_path}</Text>
                </custom-h-stack>
            )}

            <custom-spacer></custom-spacer>

            {/* context.transferMap[destination.remote_id]?.progress &&
            context.transferMap[destination.remote_id]?.progress != 100 */}

            {transfer && transfer.status == 'uploading' ? (
                <custom-h-stack gap="small" align-items="center" style={{ marginRight: '8px' }}>
                    <Text size="small">
                        <span style={{ fontSize: '12px' }} style={{ fontFeatureSettings: 'tnum' }}>
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
                ></Button>
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
    const [view, setView] = useState('all');
    const [selection] = useState([]);
    const [total, setTotal] = useState(0);
    const [hasSelection, setHasSelection] = useState(false);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
    const [modifiedArtboards, setModifiedArtboards] = useState([]);
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [groupedArtboards, setGroupedArtboards] = useState({});

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

    const uploadGroup = (group) => {
        uploadSome([group]);
    };

    const requestArtboards = async () => {
        let response = await useSketch('getSelectedArtboards');

        setArtboards(response.artboards);
        setTotal(response.total);
        setHasSelection(response.hasSelection);
        // setArtboards(mockedArtboards);
    };

    /**
     * Grouped Artboards
     */

    useEffect(async () => {
        let map = {
            ungrouped: {
                key: 'ungrouped',
                title: 'Untracked',
                path: null,
                project_id: null,
                children: [],
            },
        };

        let groups = [map['ungrouped']];

        if (artboards) {
            artboards.forEach((artboard) => {
                if (!artboard.destinations || artboard.destinations.length == 0) {
                    map['ungrouped'].children.push(artboard);
                    return;
                }

                artboard.destinations.forEach((destination) => {
                    let key = `${destination.remote_project_id}${destination.remote_path}`;
                    if (!map[key]) {
                        map[key] = {
                            key: key,
                            title: key,
                            path: destination.remote_path,
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
                return a.title > b.title ? 1 : -1;
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

                        let transferEntry = context.transferMap[destination.remote_id];
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
    }, [artboards, context.transferMap, view]);

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
    };

    const uploadArtboards = async (artboards) => {
        console.log('upload!', artboards);
        setLoading(true);
        await useSketch('uploadArtboards', { artboards });
        setLoading(false);
    };

    useEffect(async () => {
        let response = await useSketch('getSelectedArtboards');

        setArtboards(response.artboards);
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
    if (artboards && artboards.length && !hasSelection) {
        return (
            <custom-v-stack flex stretch overflow="hidden">
                <custom-h-stack padding="small" gap="small">
                    {['all', 'modified'].map((item) => {
                        return view == item ? (
                            <Badge
                                emphasis="Strong"
                                style="Progress"
                                onClick={() => {
                                    setView(item);
                                }}
                            >
                                {item}
                            </Badge>
                        ) : (
                            <Badge
                                emphasis="None"
                                style="Primary"
                                onClick={() => {
                                    setView(item);
                                }}
                            >
                                {item}
                            </Badge>
                        );
                    })}
                </custom-h-stack>
                <custom-scroll-view>
                    {groupedArtboards.length ? (
                        <custom-v-stack flex stretch>
                            {groupedArtboards.map((group) => {
                                return (
                                    <custom-v-stack key={group.key} separator="top">
                                        <ArtboardGroupItem group={group} uploadGroup={uploadGroup}></ArtboardGroupItem>
                                    </custom-v-stack>
                                );
                            })}
                        </custom-v-stack>
                    ) : (
                        <custom-v-stack flex stretch>
                            <custom-v-stack
                                gap="small"
                                padding="small"
                                separator="top"
                                flex
                                stretch
                                align-items="center"
                                justify-content="center"
                            >
                                <Text size="large">No changes</Text>
                                <Text color="weak">
                                    Use this view to update artboards that are already tracked on Frontify.
                                </Text>
                            </custom-v-stack>
                        </custom-v-stack>
                    )}
                </custom-scroll-view>
                <ArtboardToolbar
                    artboards={artboards}
                    loading={loading}
                    modifiedArtboards={modifiedArtboards}
                    withDestinationPicker={hasSelection}
                    setShowDestinationPicker={setShowDestinationPicker}
                    showDestinationPicker={showDestinationPicker}
                    setUploadDestination={setUploadDestination}
                    uploadDestination={uploadDestination}
                    uploadSome={uploadSome}
                    uploadArtboards={uploadArtboards}
                    uploadArtboardsToDestination={uploadArtboardsToDestination}
                ></ArtboardToolbar>
            </custom-v-stack>
        );
    }

    if (artboards && artboards.length && hasSelection) {
        return (
            <custom-v-stack stretch>
                <custom-h-stack padding="small" separator="bottom">
                    <Text color="weak" size="x-small">
                        Selected Artboards ( {artboards.length} )
                    </Text>
                </custom-h-stack>
                <custom-scroll-view flex>
                    <custom-v-stack>
                        {artboards.map((artboard) => {
                            return (
                                <custom-v-stack key={artboard.key}>
                                    <ArtboardItem artboard={artboard} showPath={false}></ArtboardItem>
                                    <custom-v-stack style={{ marginLeft: '8px' }}>
                                        {artboard.destinations.map((destination) => {
                                            return (
                                                <ArtboardDestinationItem
                                                    key={destination.remote_id}
                                                    artboard={artboard}
                                                    destination={destination}
                                                    display="path"
                                                ></ArtboardDestinationItem>
                                            );
                                        })}
                                    </custom-v-stack>
                                </custom-v-stack>
                            );
                        })}
                    </custom-v-stack>
                </custom-scroll-view>
                <ArtboardToolbar
                    artboards={artboards}
                    loading={loading}
                    withDestinationPicker={hasSelection}
                    setShowDestinationPicker={setShowDestinationPicker}
                    showDestinationPicker={showDestinationPicker}
                    setUploadDestination={setUploadDestination}
                    uploadDestination={uploadDestination}
                    uploadSome={uploadSome}
                    uploadArtboards={uploadArtboards}
                    uploadArtboardsToDestination={uploadArtboardsToDestination}
                ></ArtboardToolbar>
            </custom-v-stack>
        );
    }

    return (
        <custom-scroll-view stretch>
            <custom-v-stack stretch>
                <div padding="small">
                    <SearchField placeholder="Search Artboards" onChange={() => {}}></SearchField>
                </div>

                <div padding="small">
                    <custom-h-stack padding="small" style={{ background: 'rgba(0, 0, 0, 0.1)' }}>
                        <Text color="weak">
                            If artboards were uploaded before the recent plugin improvements you won’t see them here
                            until they’re next updated. Don’t worry, they’re still on Frontify.
                        </Text>
                    </custom-h-stack>
                </div>
            </custom-v-stack>
            )
        </custom-scroll-view>
    );
}
