import React, { useState } from 'react';

// Components
import { Button, IconAdd, LoadingCircle, Text } from '@frontify/fondue';

import { CustomDialog } from '../Core/CustomDialog';
import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useNavigate } from 'react-router-dom';

export function SourcePicker() {
    // Boolean
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);

    const [temporaryFile, setTemporaryFile] = useState({});

    // Loading:
    const [loading, setLoading] = useState(false);

    // Router
    let navigate = useNavigate();

    const checkoutSource = async ({ path, file }) => {
        setLoading(true);

        let { success } = await useSketch('checkout', { source: file, path });

        if (success) {
            setLoading(false);
            setShowDestinationPicker(false);
            // redirect
            navigate('/source/artboards');
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
                        onInput={(value) => {
                            setTemporaryFile(value);
                        }}
                        onChange={(value) => {
                            if (value && value.file?.ext == 'sketch') {
                                checkoutSource({ path: value.path, file: value.file });
                            }
                        }}
                        disabled={loading}
                    ></UploadDestinationPicker>
                    <custom-h-stack padding="small" gap="small" separator="top">
                        <Button
                            style="Secondary"
                            disabled={true || !temporaryFile}
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
                                setTemporaryFile(null);
                                setShowDestinationPicker(false);
                            }}
                        >
                            Cancel
                        </Button>

                        <Button
                            disabled={loading || temporaryFile == null}
                            onClick={() => {
                                if (temporaryFile && temporaryFile.file?.ext == 'sketch') {
                                    checkoutSource({ path: temporaryFile.path, file: temporaryFile.file });
                                }
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
