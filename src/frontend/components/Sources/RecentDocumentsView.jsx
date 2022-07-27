import React, { useContext, useEffect, useState } from 'react';

// Components
import { Text, LoadingCircle } from '@frontify/fondue';
import { SourceFileEntry } from './SourceFileEntry';
import { EmptyState } from '../Core/EmptyState';

// Context
import { UserContext } from '../../context/UserContext';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export function RecentDocumentsView({ onInput, onChange, trackedDocuments }) {
    let context = useContext(UserContext);
    let navigate = useNavigate();

    let [loading, setLoading] = useState('');

    const { t } = useTranslation();

    const openSource = async (document) => {
        setLoading(document.uuid);
        onChange(document);
    };

    const redirectToDocument = (document) => {
        navigate(`/source/artboards/`);
    };

    useEffect(() => {
        useSketch('requestUpdate');
    }, []);

    if (!trackedDocuments) {
        return (
            <custom-v-stack flex padding="small" align-items="center" justify-content="center">
                <LoadingCircle></LoadingCircle>
            </custom-v-stack>
        );
    }
    if (trackedDocuments.length == 0) {
        if (loading) {
            return (
                <custom-v-stack flex align-items="center" justify-content="center" padding-y="medium" padding-x="large">
                    <LoadingCircle size="Small"></LoadingCircle>
                </custom-v-stack>
            );
        } else {
            return (
                <EmptyState
                    title={t('sources.no_tracked_files_title')}
                    description={t('sources.no_tracked_files_description')}
                ></EmptyState>
            );
        }
    }

    return (
        <custom-v-stack>
            {trackedDocuments &&
                trackedDocuments.map((document) => {
                    return (
                        <SourceFileEntry
                            withTooltip={false}
                            document={document}
                            key={document.uuid}
                            file={document}
                            path={document.relativePath?.replace(context.selection?.brand?.name, '') || document.path}
                            name={document.filename?.replace('.sketch', '')}
                            loading={loading == document.uuid}
                            onClick={async () => {
                                await openSource(document);
                                redirectToDocument(document);
                            }}
                        ></SourceFileEntry>
                    );
                })}
        </custom-v-stack>
    );
}
