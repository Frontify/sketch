import React from 'react';
import { useState } from 'react';
import { Button } from '@frontify/arcade';
import { UploadDestinationPicker } from '../components/UploadDestinationPicker';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { useSketch } from '../hooks/useSketch';

export function RemoteDocumentsView() {
    let [showDestinationPicker, setShowDestinationPicker] = useState(false);

    let navigate = useNavigate();

    const redirectToDocument = () => {
        navigate(`/source/artboards/`);
    };

    const checkout = async ({ path, file }) => {
        let { success } = await useSketch('checkout', { path, file });
        setShowDestinationPicker(false);
        // Navigate to …
        redirectToDocument();
    };

    return (
        <custom-v-stack padding="small" gap="small" stretch overflow="hidden">
            {/* <h2>Checkout a file</h2>
            <Text>Choose a remote file that you want to checkout.</Text> */}

            <custom-v-stack style={{ border: ' 1px solid rgba(0, 0, 0, 0.08)', height: ' 100%', borderRadius: '8px' }}>
                <UploadDestinationPicker
                    stretch
                    onChange={(value) => {
                        if (value.type == 'file' && value.file.extension == 'sketch') {
                            checkout({ path: value.path, file: value.file });
                        }
                    }}
                ></UploadDestinationPicker>
            </custom-v-stack>

            <div>
                <Button
                    hugWidth={false}
                    onClick={() => {
                        setShowDestinationPicker(false);
                    }}
                >
                    Open
                </Button>
            </div>
        </custom-v-stack>
    );
}
