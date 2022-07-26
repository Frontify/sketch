import React, { useState, useContext } from 'react';

// Components
import { Button, IconAdd, LoadingCircle, Text } from '@frontify/fondue';

import { CustomDialog } from '../Core/CustomDialog';
import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useNavigate } from 'react-router-dom';

// Context
import { UserContext } from '../../context/UserContext';

export function SourcePicker() {
    const context = useContext(UserContext);

    // Boolean
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);

    const [temporaryFile, setTemporaryFile] = useState({});

    // Loading:
    const [loading, setLoading] = useState(false);

    // create folder
    const [createFolder, setCreateFolder] = useState(false);

    const onCreateFolder = async (folder) => {
        await useSketch('createFolder', folder);
    };

    // Router
    let navigate = useNavigate();

    const checkoutSource = async ({ path, file }) => {
        setLoading(true);

        let { success } = await useSketch('checkout', { source: file, path });

        console.log('checked out', success);

        if (success) {
            setLoading(false);
            setShowDestinationPicker(false);
            // redirect
            navigate('/source/artboards');
        } else {
            // ERROR: Document was not checked out.
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
                        createFolder={createFolder}
                        onCreateFolder={async (folder) => {
                            setCreateFolder(false);
                            await onCreateFolder(folder);
                        }}
                        onCancelCreateFolder={() => {
                            setCreateFolder(false);
                        }}
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
                    <custom-h-stack padding="small" gap="small" separator="top" align-items="center">
                        {loading ? (
                            <custom-h-stack gap="small" align-items="center">
                                <LoadingCircle size="Small"></LoadingCircle>
                                <span figures="tabular" style={{ fontSize: '14px' }}>
                                    {Math.ceil(context.transferMap[temporaryFile?.file?.id]?.progress || 0)} %
                                </span>
                            </custom-h-stack>
                        ) : (
                            ''
                        )}

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
