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
    IconUploadAlternative,
    LoadingCircle,
    Text,
    Checkbox,
} from '@frontify/arcade';

import mockedArtboards from './mocks/artboards';

import { UploadDestinationPicker } from './UploadDestinationPicker';
import { SearchField } from './SearchField';
import { useState, useEffect, useCallback, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';

/**
 * ⚛️ Toolbar
 * ----------------------------------------------------------------------------
 */
export function ArtboardToolbar({
    artboards,
    setShowDestinationPicker,
    showDestinationPicker,
    setUploadDestination,
    uploadDestination,
    loading,
    uploadAll,
    uploadSome,
    uploadArtboards,
}) {
    const context = useContext(UserContext);
    return (
        <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center" separator="top">
            <Flyout
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
                        style="Secondary"
                        onClick={() => {
                            setShowDestinationPicker(true);
                        }}
                        icon={<IconFolder />}
                    >
                        Choose folder …
                    </Button>
                }
            >
                <custom-v-stack padding="small" gap="small">
                    <h2>Destination</h2>
                    <Text>
                        Choose the folder where you want to publish{' '}
                        <strong>{context.currentDocument?.local?.filename}</strong>
                    </Text>
                    <hr />
                    <UploadDestinationPicker
                        onChange={(value) => {
                            setUploadDestination(value);
                        }}
                    ></UploadDestinationPicker>
                    <hr />
                    <Button
                        onClick={() => {
                            uploadArtboards(uploadDestination);
                            setShowDestinationPicker(false);
                        }}
                    >
                        Confirm
                    </Button>
                </custom-v-stack>
            </Flyout>
            <Button style="Primary" onClick={() => uploadSome()} icon={<IconUploadAlternative />}>
                Upload Some
            </Button>
        </custom-h-stack>
    );
}
/**
 * ⚛️ Artboard Item
 * ----------------------------------------------------------------------------
 */
export function ArtboardItem({ artboard, showPath = true }) {
    return (
        <custom-v-stack>
            <custom-h-stack gap="small" flex padding="small">
                {/* <custom-artboard-preview></custom-artboard-preview> */}
                <custom-v-stack flex gap="x-small">
                    <custom-h-stack align-items="center">
                        <custom-v-stack gap="x-small">
                            <Text>
                                <strong>{artboard.name}</strong>
                                <span>.png</span>
                            </Text>
                        </custom-v-stack>
                    </custom-h-stack>

                    {showPath ? (
                        <custom-h-stack align-items="center" flex gap="x-small">
                            {!artboard.destinations.length ? (
                                <Badge style="Progress">NEW</Badge>
                            ) : (
                                <custom-v-stack gap="x-small" flex>
                                    {artboard.destinations.map((destination, index) => {
                                        return (
                                            <ArtboardDestinationItem
                                                display="artboard"
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
            <custom-line></custom-line>
        </custom-v-stack>
    );
}

/**
 * ⚛️ Artboard Group Item
 * ----------------------------------------------------------------------------
 */

function ArtboardGroupItem({ group, uploadArtboards }) {
    const [open, setOpen] = useState(false);

    return (
        <custom-v-stack>
            <custom-h-stack gap="small" padding="small">
                {open ? (
                    <IconCaretDown size="Size16" onClick={() => setOpen(false)}></IconCaretDown>
                ) : (
                    <IconCaretRight size="Size16" onClick={() => setOpen(true)}></IconCaretRight>
                )}
                <custom-v-stack gap="x-small">
                    <custom-h-stack align-items="center" gap="x-small">
                        {/* <IconFolder></IconFolder> */}
                        <Text padding="small" weight="strong">
                            {group.title}
                        </Text>
                    </custom-h-stack>
                    <Text padding="small" size="x-small">
                        {group.transfer?.status == 'uploading' ? (
                            `Uploading (${group.transfer.completed.length + 1} / ${group.children.length}) … ${
                                group.transfer.progress
                            }%`
                        ) : group.selectionCount ? (
                            <custom-h-stack align-items="center" gap="x-small">
                                <IconUploadAlternative
                                    size="Size20"
                                    style={{ color: 'var(--box-selected-strong-color)' }}
                                />
                                {/* <Badge style="Progress"> {group.selectionCount} </Badge> */}
                                <Text size="x-small" style={{ color: 'var(--box-selected-strong-color)' }}>
                                    Upload changes ({group.selectionCount})
                                </Text>
                            </custom-h-stack>
                        ) : (
                            <Text color="weak" size="x-small">
                                No changes
                            </Text>
                        )}
                    </Text>
                </custom-v-stack>
                <custom-spacer></custom-spacer>
                {group.path ? (
                    group.selectionCount ? (
                        <ArtboardGroupTransferAction
                            group={group}
                            uploadArtboards={uploadArtboards}
                        ></ArtboardGroupTransferAction>
                    ) : (
                        ''
                    )
                ) : (
                    ''
                )}
                <IconMore size="Size24"></IconMore>
            </custom-h-stack>

            {open
                ? group.children.map((artboard) => {
                      return (
                          <custom-v-stack
                              key={artboard.id}
                              padding="small"
                              separator="top"
                              style={{ marginLeft: '28px' }}
                          >
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
        <custom-h-stack gap="x-small" style={{ width: '100%' }}>
            {!destination.remote_id ? <Text>NEW</Text> : ''}
            {display == 'artboard' ? (
                <custom-h-stack gap="x-small">
                    <Checkbox
                        state={destination.selected ? 'Checked' : 'Unchecked'}
                        label={`${artboard.name}.png`}
                        onChange={() => {
                            destination.selected = !destination.selected;
                        }}
                    >
                        <Text color={artboard.sha != destination.sha ? 'default' : 'weak'}>{artboard.name}.png</Text>
                    </Checkbox>
                </custom-h-stack>
            ) : (
                <custom-h-stack size="small" color="weak" gap="x-small">
                    <IconFolder></IconFolder>
                    <Text color="weak">/</Text>
                    <Text color="weak">{destination.remote_project_id}</Text>
                    <Text color="weak">/</Text>
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

            {transfer && transfer.status == 'upload-complete' ? (
                <custom-h-stack style={{ marginRight: '10px' }}>
                    <IconCheck size="Size16" classnames="tw-fill-positive-strong"></IconCheck>
                </custom-h-stack>
            ) : (
                ''
            )}

            {transfer && transfer.status == 'upload-queued' ? '' : ''}
        </custom-h-stack>
    );
}

export function ArtboardGroupTransferAction({ group, uploadArtboards }) {
    switch (group.transfer.status) {
        case 'idle':
            return (
                <Button
                    icon={<IconUploadAlternative />}
                    inverted="true"
                    onClick={() => {
                        uploadArtboards(group.children);
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
    const [selection] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [groupedArtboards, setGroupedArtboards] = useState({});

    const [uploadDestination, setUploadDestination] = useState({});

    const [currentSource, setCurrentSource] = useState({});
    const { t } = useTranslation();

    const uploadSome = async () => {
        let matchedGroups = groupedArtboards.filter((group) => group.selectionCount > 0);
        console.log(matchedGroups);
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

    const uploadAll = async () => {
        setLoading(true);
        await useSketch('uploadArtboards', { artboards });
        setLoading(false);
    };

    const requestArtboards = async () => {
        console.log('request artboards');
        let response = await useSketch('getSelectedArtboards');

        setArtboards(response.artboards);
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
                let selectionCount = 0;
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
                    total: 0,
                    progress: 0,
                    completed: [],
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
                                transfer.completed.push(transferEntry);
                            }
                            transfer.totalProgress += context.transferMap[destination.remote_id].progress;
                            transfer.total += 100;
                        }
                    });
                });
                transfer.progress = Math.ceil((transfer.totalProgress / transfer.total) * 100);
                if (transfer.progress > 0 && transfer.progress < 100) {
                    transfer.status = 'uploading';
                }
                if (transfer.progress == 100) {
                    transfer.status = 'done';
                    transfer.progress = 0;
                }
                if (transfer.progress == 0) {
                    transfer.status = 'idle';
                }

                group.transfer = transfer;
            });

            groups.forEach((group) => {
                if (group.transfer == 'done') {
                    requestArtboards();
                }
            });

            setGroupedArtboards(groups);
        }
    }, [artboards, context.transferMap]);

    const uploadArtboards = async (artboards) => {
        console.log('upload artboards', artboards);
        setLoading(true);
        await useSketch('uploadArtboards', { artboards });
        setLoading(false);
    };

    useEffect(async () => {
        let response = await useSketch('getSelectedArtboards');

        setArtboards(response.artboards);
        // setArtboards(mockedArtboards);
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
                    // setArtboards(mockedArtboards);
                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

    if (artboards && artboards.length) {
        return (
            <custom-v-stack gap="small" flex stretch>
                <custom-scroll-view>
                    <custom-v-stack>
                        {groupedArtboards.map((group) => {
                            return (
                                <custom-v-stack key={group.key} separator="top">
                                    <ArtboardGroupItem
                                        group={group}
                                        uploadArtboards={uploadArtboards}
                                    ></ArtboardGroupItem>
                                </custom-v-stack>
                            );
                        })}
                    </custom-v-stack>
                </custom-scroll-view>

                <ArtboardToolbar
                    artboards={artboards}
                    setShowDestinationPicker={setShowDestinationPicker}
                    showDestinationPicker={showDestinationPicker}
                    setUploadDestination={setUploadDestination}
                    uploadDestination={uploadDestination}
                    loading={loading}
                    uploadAll={uploadAll}
                    uploadSome={uploadSome}
                    uploadArtboards={uploadArtboards}
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
