import React from 'react';
import {
    Button,
    Flyout,
    IconCaretDown,
    IconFolder,
    IconUploadAlternative,
    Text,
    IconRevert,
    IconFrequentlyUsed,
    IconAdd,
} from '@frontify/arcade';

import { UploadDestinationPicker } from './UploadDestinationPicker';
import { CustomDialog } from './CustomDialog';
import { useState, useEffect } from 'react';

import PropTypes from 'prop-types';

/**
 * ⚛️ Toolbar
 * ----------------------------------------------------------------------------
 */

ArtboardToolbar.propTypes = {
    artboards: PropTypes.array,
    loading: PropTypes.bool,
    modifiedArtboards: PropTypes.array,
    onCreateFolder: PropTypes.func,
    projectMap: PropTypes.object,
    setShowDestinationPicker: PropTypes.func,
    setShowRecentDestinations: PropTypes.func,
    setUploadDestination: PropTypes.func,
    showDestinationPicker: PropTypes.bool,
    showRecentDestinations: PropTypes.bool,
    uploadArtboards: PropTypes.func,
    uploadArtboardsToDestination: PropTypes.func,
    uploadDestination: PropTypes.object,
    uploadSome: PropTypes.func,
    usedFolders: PropTypes.any,
    withDestinationPicker: PropTypes.bool,
};

function ArtboardToolbar({
    artboards,
    loading,
    onCreateFolder,
    modifiedArtboards = [],
    projectMap,
    withDestinationPicker,
    showRecentDestinations,
    setShowRecentDestinations,
    setShowDestinationPicker,
    showDestinationPicker,
    setUploadDestination,
    usedFolders,
    uploadDestination,
    uploadArtboards,
    uploadSome,
    uploadArtboardsToDestination,
}) {
    const [computedFolders, setComputedFolders] = useState([]);
    const [computedFolderType, setComputedFolderType] = useState('none');
    const [sortedUsedFolders, setSortedUsedFolders] = useState([]);
    const [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);

    useEffect(() => {
        setSortedUsedFolders(() => {
            return new Map(
                [...usedFolders.entries()].sort((a, b) => {
                    return a[1].name > b[1].name ? 1 : -1;
                })
            );
        });
    }, [usedFolders]);

    // Callback function that starts the upload after pressing the "upload" button in the toolbar
    const performUpload = () => {
        // uploadDestination?
        let overrideDestination = uploadDestination && uploadDestination.folderPath;
        if (overrideDestination) {
            uploadArtboardsToDestination(artboards);
            return;
        }
        uploadArtboards(artboards);
    };
    useEffect(() => {
        setShowDestinationPicker(false);
        setUploadDestination(null);
        setTemporaryUploadDestination(null);
        let union = new Map();
        artboards.forEach((artboard) => {
            if (!artboard.destinations.length) {
                union.set('no destination', '');
                return;
            }
            artboard.destinations.forEach((destination) => {
                union.set(`${projectMap[destination.remote_project_id]?.name}${destination.remote_path}`, destination);
            });
        });

        let type = '';

        switch (union.size) {
            case 1:
                if (union.has('no destination')) {
                    type = 'none';
                } else {
                    type = 'single';
                }

                break;
            case 2:
                type = 'mixed';
                break;
            default:
                type = 'mixed';
                break;
        }
        setComputedFolderType(type);
        setComputedFolders(
            Array.from(union.keys()).map((entry) => {
                let parts = entry.split('/');

                return { name: parts[parts.length - 2], ...union.get(entry) };
            })
        );
    }, [artboards, projectMap]);

    return (
        <custom-h-stack padding="small" gap="small" align-items="center" separator="top" style={{ width: '100%' }}>
            {withDestinationPicker ? (
                <custom-h-stack
                    flex
                    style={{ width: '100%' }}
                    gap="small"
                    justify-content="space-between"
                    stretch-children
                >
                    <Flyout
                        hug={false}
                        fitContent={true}
                        legacyFooter={false}
                        fixedFooter={
                            <custom-h-stack
                                padding="small"
                                separator="top"
                                gap="small"
                                style={{ background: 'white', borderRadius: '0 0 4px 4px' }}
                            >
                                <CustomDialog
                                    open={showDestinationPicker}
                                    trigger={
                                        <Button
                                            style="Secondary"
                                            hugWidth={false}
                                            onClick={() => setShowDestinationPicker(true)}
                                        >
                                            Browse …
                                        </Button>
                                    }
                                >
                                    <custom-v-stack stretch>
                                        <custom-h-stack padding="small" separator="bottom">
                                            <Text weight="strong">Browse</Text>
                                        </custom-h-stack>
                                        <UploadDestinationPicker
                                            allowfiles={false}
                                            paths={uploadDestination ? [uploadDestination] : []}
                                            onInput={(value) => {
                                                setTemporaryUploadDestination(value);
                                            }}
                                            onChange={(value) => {
                                                setTemporaryUploadDestination(value);
                                            }}
                                        ></UploadDestinationPicker>
                                        <custom-h-stack padding="small" gap="small" separator="top">
                                            <Button
                                                style="Secondary"
                                                disabled={true || !temporaryUploadDestination}
                                                icon={<IconAdd></IconAdd>}
                                                onClick={() => {
                                                    onCreateFolder(temporaryUploadDestination);
                                                }}
                                            >
                                                New folder
                                            </Button>
                                            <custom-spacer></custom-spacer>
                                            <Button
                                                style="Secondary"
                                                onClick={() => {
                                                    setShowDestinationPicker(false);
                                                    setShowRecentDestinations(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                disabled={temporaryUploadDestination == null}
                                                onClick={() => {
                                                    setShowDestinationPicker(false);
                                                    setShowRecentDestinations(false);
                                                    setUploadDestination(temporaryUploadDestination);
                                                }}
                                            >
                                                Select
                                            </Button>
                                        </custom-h-stack>
                                    </custom-v-stack>
                                </CustomDialog>
                                <custom-spacer></custom-spacer>
                                <Button
                                    style="Secondary"
                                    onClick={() => {
                                        setShowRecentDestinations(false);
                                    }}
                                >
                                    Cancel
                                </Button>{' '}
                                <Button
                                    disabled={!temporaryUploadDestination}
                                    onClick={() => {
                                        setUploadDestination(temporaryUploadDestination);
                                        setShowRecentDestinations(false);
                                        setTemporaryUploadDestination(null);
                                    }}
                                >
                                    Select
                                </Button>
                            </custom-h-stack>
                        }
                        stretch-children
                        stretch
                        flex
                        onCancel={() => setShowRecentDestinations(false)}
                        isOpen={showRecentDestinations}
                        onOpenChange={(open) => {
                            if (open) {
                                setShowRecentDestinations(false);
                            } else {
                                setShowRecentDestinations(true);
                            }
                        }}
                        trigger={
                            <Button
                                classNames="tw-m-0"
                                hugWidth={false}
                                style="Secondary"
                                onClick={() => {
                                    setTemporaryUploadDestination(null);
                                    setShowRecentDestinations(true);
                                }}
                                icon={<IconFolder />}
                            >
                                <custom-h-stack
                                    align-items="center"
                                    justify-content="space-between"
                                    style={{ width: '100%' }}
                                    gap="x-small"
                                    classNames="tw-w-full"
                                >
                                    <Text size="x-small" classNames="tw-w-full" whitespace="nowrap" overflow="ellipsis">
                                        {!uploadDestination && computedFolderType == 'none' && 'Choose Folder …'}
                                        {!uploadDestination && computedFolderType == 'mixed' && 'Multiple Folders'}
                                        {!uploadDestination &&
                                            computedFolderType == 'single' &&
                                            computedFolders[0].name}
                                        {uploadDestination && uploadDestination.folderPath
                                            ? uploadDestination.name
                                            : ''}
                                    </Text>
                                </custom-h-stack>
                                <IconCaretDown></IconCaretDown>
                            </Button>
                        }
                    >
                        <custom-h-stack padding="small" gap="x-small">
                            <IconFrequentlyUsed />
                            <Text weight="strong">Used in this document</Text>
                        </custom-h-stack>
                        {sortedUsedFolders.size ? (
                            <ul>
                                {[...sortedUsedFolders.keys()].map((key) => (
                                    <li key={key}>
                                        <custom-palette-item
                                            title={key}
                                            selectable
                                            tabindex="-1"
                                            onFocus={() => {
                                                let folder = sortedUsedFolders.get(key);
                                                setTemporaryUploadDestination({
                                                    project: {
                                                        id: folder.remote_project_id,
                                                    },
                                                    name: folder.name,
                                                    folderPath: folder.remote_path.substring(
                                                        1,
                                                        folder.remote_path.length - 1
                                                    ),
                                                });
                                            }}
                                            onDoubleClick={() => {
                                                // TODO:
                                                // The returned object needs to be re-formatted
                                                // usedFolders.get(key) -> (remote_id, remote_project_id)
                                                // -> needs folderPath etc.

                                                let folder = sortedUsedFolders.get(key);

                                                setUploadDestination({
                                                    project: {
                                                        id: folder.remote_project_id,
                                                    },
                                                    name: folder.name,
                                                    folderPath: folder.remote_path.substring(
                                                        1,
                                                        folder.remote_path.length - 1
                                                    ),
                                                });
                                                setShowRecentDestinations(false);
                                                setTemporaryUploadDestination(null);
                                            }}
                                        >
                                            <custom-h-stack gap="x-small" align-items="center">
                                                <IconFolder></IconFolder>
                                                <Text size="small">{sortedUsedFolders.get(key).name}</Text>
                                            </custom-h-stack>
                                        </custom-palette-item>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <custom-v-stack padding="small" align-items="center" justify-content="center">
                                <Text>No previous folders. </Text>
                            </custom-v-stack>
                        )}
                    </Flyout>

                    {/* Upload to chosen destination */}

                    {uploadDestination && (
                        <div style={{ flex: 0 }}>
                            <Button
                                style="Secondary"
                                onClick={() => setUploadDestination(null)}
                                aria-label="Reset"
                                title="Reset"
                            >
                                <IconRevert></IconRevert>
                            </Button>
                        </div>
                    )}

                    <div style={{ flex: 0 }}>
                        <Button
                            disabled={computedFolderType == 'none' && !uploadDestination?.folderPath}
                            style="Primary"
                            hugWidth={true}
                            onClick={() => performUpload(artboards)}
                            icon={
                                <IconUploadAlternative
                                    style={{
                                        color:
                                            modifiedArtboards.length == 0
                                                ? 'inherit'
                                                : 'var(--box-selected-strong-color)',
                                    }}
                                />
                            }
                        >
                            Upload
                        </Button>
                    </div>
                </custom-h-stack>
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
