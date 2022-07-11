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
} from '@frontify/fondue';

import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';
import { CustomDialog } from '../Core/CustomDialog';
import { useState, useEffect, useCallback } from 'react';

import PropTypes from 'prop-types';

// i18n
import { useTranslation } from 'react-i18next';

/**
 * ⚛️ Toolbar
 * ----------------------------------------------------------------------------
 */

ArtboardToolbar.propTypes = {
    artboards: PropTypes.array,
    hasSelection: PropTypes.bool,
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
    hasSelection,
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

    let { t } = useTranslation();

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
    const performUpload = useCallback(() => {
        console.log('perform', artboards, uploadDestination);
        console.warn(
            'Selecting a recent folder does not set it as final upload destination -> use temporary destination'
        );
        // uploadDestination?
        let overrideDestination = uploadDestination && uploadDestination.folderPath;
        if (overrideDestination) {
            uploadArtboardsToDestination(artboards);
            return;
        }
        uploadArtboards(artboards);
    });
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
        <custom-h-stack
            padding-x="large"
            padding-y="medium"
            gap="small"
            align-items="center"
            separator="top"
            style={{ width: '100%' }}
        >
            {!loading ? (
                <custom-h-stack gap="small" stretch-children="true" flex>
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
                                                setUploadDestination(value);
                                            }}
                                            onChange={(value) => {
                                                setUploadDestination(value);
                                                performUpload();
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
                                                    performUpload();
                                                }}
                                            >
                                                Upload
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
                                    disabled={!uploadDestination}
                                    style="Primary"
                                    hugWidth={true}
                                    onClick={() => {
                                        setUploadDestination(temporaryUploadDestination);
                                        setShowRecentDestinations(false);
                                        setTemporaryUploadDestination(null);
                                        performUpload();
                                    }}
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
                                disabled={!hasSelection}
                                classNames="tw-m-0"
                                hugWidth={false}
                                style="Secondary"
                                onClick={() => {
                                    setTemporaryUploadDestination(null);
                                    setShowRecentDestinations(true);
                                }}
                            >
                                {t('artboards.upload_selected')} …
                            </Button>
                        }
                    >
                        <custom-h-stack padding="small" gap="x-small">
                            <IconFrequentlyUsed />
                            <Text weight="strong">{t('artboards.used_folders')}</Text>
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
                                                performUpload();
                                            }}
                                        >
                                            <custom-h-stack gap="x-small" align-items="center">
                                                <IconFolder size="Size24"></IconFolder>
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

                    <Button style="Primary" hugWidth={false} onClick={() => uploadSome()}>
                        {t('artboards.update_all')}
                        &nbsp;
                        {modifiedArtboards.length > 0 && <span> ({modifiedArtboards.length})</span>}
                    </Button>
                </custom-h-stack>
            ) : (
                'Uploading …'
            )}
        </custom-h-stack>
    );
}

export { ArtboardToolbar };
