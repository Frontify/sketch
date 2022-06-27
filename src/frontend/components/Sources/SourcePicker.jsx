import React, { useState } from 'react';

// Components
import { Button, Flyout, IconAdd, IconFrequentlyUsed, Text } from '@frontify/fondue';

import { CustomDialog } from '../Core/CustomDialog';
import { RecentDocumentsView } from './RecentDocumentsView';
import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';

// Hooks
import { useSketch } from '../../hooks/useSketch';

export function SourcePicker({ children }) {
    // Boolean
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [showRecentDestinations, setShowRecentDestinations] = useState(false);

    // Destinations
    const [uploadDestination, setUploadDestination] = useState(null);
    const [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);

    const [loading, setLoading] = useState(false);

    const checkoutSource = async ({ path, file }) => {
        setLoading(true);
        let { success } = await useSketch('checkout', { path, file });
        if (success) {
            setLoading(false);
            setShowRecentDestinations(false);
            setShowDestinationPicker(false);
        }
    };
    const openSource = async (document) => {
        console.log('open source', document);
        setLoading(true);
        await useSketch('openSource', { path: document.local.path });
        setLoading(false);
        setShowRecentDestinations(false);
    };

    return (
        <div stretch-height="true" style={{ height: '100%' }}>
            {showRecentDestinations && !showDestinationPicker && (
                <custom-dim
                    onClick={() => {
                        setShowRecentDestinations(false);
                    }}
                ></custom-dim>
            )}

            <Flyout
                stretch-height="true"
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
                                        if (value.type == 'file' && value.file.extension == 'sketch') {
                                            checkoutSource({ path: value.path, file: value.file });
                                        }
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
                                        Open
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
                                openSource(temporaryUploadDestination);
                            }}
                        >
                            Open
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
                        style={{ height: '100%' }}
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
                <custom-v-stack overflow="hidden" style={{ minWidth: 'calc(100vw - 1.5rem)' }}>
                    <custom-h-stack padding="small" gap="x-small" separator="bottom">
                        <IconFrequentlyUsed />
                        <Text weight="strong">Recent</Text>
                    </custom-h-stack>
                    <RecentDocumentsView
                        onInput={(value) => {
                            setTemporaryUploadDestination(value);
                        }}
                        onChange={(value) => {
                            setUploadDestination(value);

                            // setShowRecentDestinations(false);
                            setTemporaryUploadDestination(null);
                            openSource(value);
                        }}
                    ></RecentDocumentsView>
                </custom-v-stack>
            </Flyout>
        </div>
    );
}
