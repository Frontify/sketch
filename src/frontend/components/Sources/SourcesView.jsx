import React, { useContext, useState } from 'react';

// Context
import { UserContext } from '../../context/UserContext';

// Router
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

// Components
import { Button, Badge, Text } from '@frontify/fondue';

import { LoadingIndicator } from '../Core/LoadingIndicator';
import { RecentDocumentsView } from './RecentDocumentsView';
import { SourcesViewToolbar } from './SourcesViewToolbar';

import { Toolbar } from '../App/Toolbar';

import { SourceFileEntry } from './SourceFileEntry';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

export function SourcesView() {
    let [loading, setLoading] = useState(false);
    let [activeSourceScope, setActiveSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);
    let location = useLocation();
    const navigate = useNavigate();

    const { t } = useTranslation();

    /**
     * Method: redirectToDocument
     */
    const redirectToDocument = () => {
        navigate(`/source/artboards/`);
    };

    /**
     * Method: openSource
     */

    const openSource = async (document) => {
        console.log('open source', document);
        setLoading(true);
        await useSketch('openSource', { path: document.local.path });
        context.actions.refresh();
        setLoading(false);
    };

    if (context.user?.name) {
        return (
            <custom-v-stack stretch>
                <Toolbar></Toolbar>
                <custom-line></custom-line>

                <custom-v-stack
                    style={{
                        overflow: 'auto',
                        height: ' 100%',
                        background: 'white',
                    }}
                >
                    <custom-v-stack style={{ paddingBottom: '1rem' }}>
                        <custom-v-stack padding="large" style={{ paddingBottom: '1rem' }}>
                            <Text size="large" weight="strong">
                                Current File
                            </Text>
                        </custom-v-stack>
                        {context.currentDocument.local ? (
                            <SourceFileEntry
                                document={context.currentDocument}
                                path={context.currentDocument.remote?.path || 'Untracked'}
                                name={context.currentDocument.local?.filename.replace('.sketch', '')}
                                onClick={() => {
                                    redirectToDocument();
                                }}
                            ></SourceFileEntry>
                        ) : (
                            <custom-v-stack padding-y="medium" padding-x="large">
                                <Text color="weak">{t('sources.no_open_document')}</Text>
                            </custom-v-stack>
                        )}
                    </custom-v-stack>

                    <custom-line></custom-line>

                    <custom-v-stack>
                        <custom-v-stack padding="large" style={{ paddingBottom: '1rem' }}>
                            <Text size="large" weight="strong">
                                Recent Files
                            </Text>
                        </custom-v-stack>

                        <RecentDocumentsView
                            onInput={(value) => {}}
                            onChange={(value) => {
                                openSource(value);
                            }}
                        ></RecentDocumentsView>
                    </custom-v-stack>
                </custom-v-stack>
                <SourcesViewToolbar></SourcesViewToolbar>
            </custom-v-stack>
        );
    } else {
        return <LoadingIndicator />;
    }
}
