import React, { useState } from 'react';

// Components
import { Button, IconAdd, LoadingCircle, Text } from '@frontify/fondue';

import { CustomDialog } from '../Core/CustomDialog';
import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';

// Hooks
import { useSketch } from '../../hooks/useSketch';

export function SourcePicker() {
    // Boolean
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);

    // Destinations
    const [uploadDestination, setUploadDestination] = useState(null);
    const [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);

    // Loading:
    const [loading, setLoading] = useState(false);

    const checkoutSource = async ({ path, file }) => {
        setLoading(true);
        let { success } = await useSketch('checkout', { path, file });
        if (success) {
            setLoading(false);
            setShowDestinationPicker(false);
        }
    };

    return (
        <div stretch-height="true" style={{ height: '100%' }} padding="large">
            <CustomDialog
                open={showDestinationPicker}
                trigger={
                    <Button style="Secondary" hugWidth={false} onClick={() => setShowDestinationPicker(true)}>
                        Browse …
                    </Button>
                }
            >
                <custom-v-stack stretch>
                    <custom-h-stack padding="small" separator="bottom">
                        <Text weight="strong">Sketch Files on Frontify</Text>
                        <custom-spacer></custom-spacer>
                    </custom-h-stack>
                    <UploadDestinationPicker
                        allowfiles={true}
                        paths={uploadDestination ? [uploadDestination] : []}
                        onInput={(value) => {
                            setTemporaryUploadDestination(value);
                        }}
                        onChange={(value) => {
                            if (value && value.type == 'file' && value.file.extension == 'sketch') {
                                checkoutSource({ path: value.path, file: value.file });
                            }
                        }}
                        disabled={loading}
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
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={
                                loading ||
                                temporaryUploadDestination == null ||
                                temporaryUploadDestination.type == 'folder' ||
                                (temporaryUploadDestination.type == 'file' &&
                                    temporaryUploadDestination.file?.extension != 'sketch')
                            }
                            onClick={() => {
                                setShowDestinationPicker(false);
                                setUploadDestination(temporaryUploadDestination);
                            }}
                        >
                            {!loading && 'Open'}

                            {loading && 'Opening …'}
                        </Button>
                    </custom-h-stack>
                </custom-v-stack>
            </CustomDialog>
        </div>
    );
}
