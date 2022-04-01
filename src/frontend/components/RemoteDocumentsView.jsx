import React from 'react';
import { useState } from 'react';
import { Button, Flyout, IconFolder, IconUploadAlternative, Text } from '@frontify/arcade';
import { UploadDestinationPicker } from '../components/UploadDestinationPicker';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { useSketch } from '../hooks/useSketch';

export function RemoteDocumentsView() {
    const { t, i18n } = useTranslation();
    let [showDestinationPicker, setShowDestinationPicker] = useState(false);

    let navigate = useNavigate();
    let [activeScope] = useLocalStorage('cache.activeScope', 'colors');

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
            <h2>Checkout a file</h2>
            <Text>Choose a remote file that you want to checkout.</Text>
            <hr />
            <UploadDestinationPicker
                stretch
                onChange={(value) => {
                    console.log(value);
                    if (value.type == 'file' && value.file.extension == 'sketch') {
                        checkout({ path: value.path, file: value.file });
                    }
                }}
            ></UploadDestinationPicker>
            <hr />
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
