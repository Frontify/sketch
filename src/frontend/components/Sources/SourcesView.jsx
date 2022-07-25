import React, { useContext, useEffect, useState } from 'react';

// Context
import { UserContext } from '../../context/UserContext';

// Router
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import { Button, Flyout, IconCaretDown, Text } from '@frontify/fondue';

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
    let context = useContext(UserContext);
    const navigate = useNavigate();

    let [openDocuments, setOpenDocuments] = useState([]);

    useEffect(async () => {
        await requestOpenDocuments();
    }, []);

    const requestOpenDocuments = async () => {
        setLoading(true);
        let { documents } = await useSketch('getOpenDocumentsMeta');
        setLoading(false);

        setOpenDocuments([...documents]);
    };

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
        setLoading(true);
        await useSketch('openSource', { path: document.path });
        redirectToDocument();
        await context.actions.refresh();
        setLoading(false);
    };

    const openFile = async (document) => {
        setLoading(true);
        await useSketch('openSource', { path: document.path.replaceAll('%20', ' ') });
        redirectToDocument();
        await context.actions.refresh();
        setLoading(false);
    };

    /**
     * Subscription
     */

    useEffect(() => {
        let handler = async (event) => {
            let { type, payload } = event.detail.data;

            switch (type) {
                case 'document-closed':
                case 'document-opened':
                    await requestOpenDocuments();
                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

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
                                Open Files
                            </Text>
                        </custom-v-stack>

                        {openDocuments.length ? (
                            openDocuments.map((openDocument, index) => {
                                return (
                                    <SourceFileEntry
                                        title={context.debug ? JSON.stringify(openDocument, null, 2) : ''}
                                        key={document.id || index}
                                        document={openDocument}
                                        path={openDocument.normalizedRelativePath}
                                        name={openDocument.name}
                                        onClick={() => {
                                            openFile(openDocument);
                                        }}
                                    ></SourceFileEntry>
                                );
                            })
                        ) : (
                            <custom-v-stack padding-y="medium" padding-x="large">
                                <Text color="weak">{t('sources.no_open_documents')}</Text>
                            </custom-v-stack>
                        )}
                    </custom-v-stack>

                    <custom-line></custom-line>

                    <custom-v-stack>
                        <custom-h-stack
                            padding="large"
                            style={{ paddingBottom: '1rem', paddingRight: '1rem' }}
                            align-items="center"
                        >
                            <Text size="large" weight="strong">
                                {t('sources.all_tracked_files')}
                            </Text>
                            <custom-spacer></custom-spacer>
                            <div style={{ marginRight: '-0.5rem' }}>
                                <Flyout
                                    trigger={
                                        <Button inverted="true" size="small">
                                            <custom-h-stack gap="xx-small" align-items="center" padding-x="x-small">
                                                <Text as="span" size="medium">
                                                    Updates First
                                                </Text>
                                                <IconCaretDown></IconCaretDown>
                                            </custom-h-stack>
                                        </Button>
                                    }
                                ></Flyout>
                            </div>
                        </custom-h-stack>

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
