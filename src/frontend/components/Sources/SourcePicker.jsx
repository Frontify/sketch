import React, { useState, useEffect, useContext } from 'react';
import { CustomDialog } from '../CustomDialog';
import { UploadDestinationPicker } from '../UploadDestinationPicker';
import { Button, Flyout, IconCaretDown, IconAdd, IconFrequentlyUsed, IconFolder, Text } from '@frontify/arcade';

import { RecentDocumentsView } from './RecentDocumentsView';

export function SourcePicker({ children }) {
    // Boolean
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);
    const [showRecentDestinations, setShowRecentDestinations] = useState(false);

    // Destinations
    const [uploadDestination, setUploadDestination] = useState(null);
    const [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);

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
                            disabled={!temporaryUploadDestination || temporaryUploadDestination.type == 'folder'}
                            onClick={() => {
                                setUploadDestination(temporaryUploadDestination);
                                setShowRecentDestinations(false);
                                setTemporaryUploadDestination(null);
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
                <custom-v-stack overflow="hidden">
                    <custom-h-stack padding="small" gap="x-small" separator="bottom">
                        <IconFrequentlyUsed />
                        <Text weight="strong">Recent</Text>
                    </custom-h-stack>
                    <RecentDocumentsView></RecentDocumentsView>
                </custom-v-stack>
            </Flyout>
        </div>
    );
}
