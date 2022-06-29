import React from 'react';

// Context
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

// Router
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// Components
import { Button, Text } from '@frontify/fondue';

import { LoadingIndicator } from '../Core/LoadingIndicator';
import { RecentDocumentsView } from './RecentDocumentsView';
import { Toolbar } from '../App/Toolbar';

// Hooks
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

export function SourcesView() {
    let [activeSourceScope, setActiveSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);
    let location = useLocation();
    const navigate = useNavigate();

    const { t } = useTranslation();

    const redirectToDocument = () => {
        navigate(`/source/artboards/`);
    };

    if (context.user?.name) {
        return (
            <custom-v-stack stretch>
                <Toolbar></Toolbar>
                <custom-line></custom-line>

                <custom-v-stack
                    style={{
                        overflow: 'hidden',
                        height: ' 100%',
                        background: 'white',
                    }}
                >
                    <custom-v-stack>
                        <custom-v-stack padding="large" style={{ paddingBottom: '1rem' }}>
                            <Text size="large" weight="strong">
                                Current File
                            </Text>
                        </custom-v-stack>

                        <custom-palette-item
                            padding-y="medium"
                            padding-x="large"
                            onClick={() => {
                                redirectToDocument();
                            }}
                        >
                            {context.currentDocument && (
                                <custom-v-stack gap="xx-small" overflow="hidden">
                                    <Text color="weak">
                                        {context.currentDocument.remote?.path || context.currentDocument.state}
                                    </Text>
                                    <Text weight="strong">
                                        {context.currentDocument.local?.filename.replace('.sketch', '')}
                                    </Text>
                                </custom-v-stack>
                            )}
                        </custom-palette-item>
                    </custom-v-stack>
                    <custom-line></custom-line>
                    <custom-v-stack>
                        <custom-v-stack padding="large" style={{ paddingBottom: '1rem' }}>
                            <Text size="large" weight="strong">
                                Recent Files
                            </Text>
                        </custom-v-stack>

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
                </custom-v-stack>
            </custom-v-stack>
        );
    } else {
        return <LoadingIndicator />;
    }
}
