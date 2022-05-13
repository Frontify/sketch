import React, { useState, useEffect } from 'react';
import { CustomDialog } from '../CustomDialog';
import { UploadDestinationPicker } from '../UploadDestinationPicker';
import { Button, Flyout, IconCaretDown, IconAdd, IconFrequentlyUsed, IconFolder, Text } from '@frontify/arcade';

export function SourcePicker({ children }) {
    // Boolean
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [showRecentDestinations, setShowRecentDestinations] = useState(false);

    // Destinations
    const [uploadDestination, setUploadDestination] = useState(null);
    const [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);

    // Folders
    const [sortedUsedFolders, setSortedUsedFolders] = useState([]);

    const [usedFolders, setUsedFolders] = useState(new Map());

    // useEffect that sorts the folders
    useEffect(() => {
        setSortedUsedFolders(() => {
            return new Map(
                [...usedFolders.entries()].sort((a, b) => {
                    return a[1].name > b[1].name ? 1 : -1;
                })
            );
        });
    }, [usedFolders]);

    return (
        <div stretch-height>
            {showRecentDestinations && !showDestinationPicker && (
                <custom-dim
                    onClick={() => {
                        setShowRecentDestinations(false);
                    }}
                ></custom-dim>
            )}
            <Flyout
                stretch-height
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
                                    allowfiles={true}
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
                                            // onCreateFolder(temporaryUploadDestination);
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
                                        disabled={
                                            temporaryUploadDestination == null ||
                                            temporaryUploadDestination.type == 'folder' ||
                                            (temporaryUploadDestination.type == 'file' &&
                                                temporaryUploadDestination.file?.extension != 'sketch')
                                        }
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
                            disabled={!temporaryUploadDestination || temporaryUploadDestination.type == 'folder'}
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
                    <custom-palette-item
                        style={{ height: '100%', borderRadius: 'var(--radius)' }}
                        classNames="tw-m-0"
                        onClick={() => {
                            setTemporaryUploadDestination(null);
                            setShowRecentDestinations(true);
                        }}
                    >
                        {children}
                    </custom-palette-item>
                }
            >
                <custom-h-stack padding="small" gap="x-small">
                    <IconFrequentlyUsed />
                    <Text weight="strong">Recent</Text>
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
                                            folderPath: folder.remote_path.substring(1, folder.remote_path.length - 1),
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
                                            folderPath: folder.remote_path.substring(1, folder.remote_path.length - 1),
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
                        <Text>No recent files.</Text>
                    </custom-v-stack>
                )}
            </Flyout>
        </div>
    );
}
