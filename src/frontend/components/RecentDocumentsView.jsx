import React from 'react';
import { useContext, useEffect, useState } from 'react';

import { Link, useNavigate } from 'react-router-dom';
import { SearchField } from './SearchField';

import {
    Button,
    Breadcrumbs,
    Flyout,
    IconSketch,
    Text,
    LoadingCircle,
    IconUploadAlternative,
    IconPen,
    IconOpenLockFilled,
} from '@frontify/arcade';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';

import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';

import { queryGraphQLWithAuth } from '../graphql';
import { FileBrowser } from '../components/FileBrowser';

export function RecentDocumentsView() {
    let [activeScope] = useLocalStorage('cache.activeScope', 'colors');
    let [remoteDocuments, setRemoteDocuments] = useState([]);
    let [mergedDocuments, setMergedDocuments] = useState([]);
    let context = useContext(UserContext);
    let navigate = useNavigate();

    let { sources } = useContext(UserContext);

    const { t } = useTranslation();

    const openSource = async (document) => {
        console.log('open:', document);
        await useSketch('openSource', { path: document.local.path });
    };

    const redirectToDocument = (document) => {
        navigate(`/source/artboards/${activeScope}`);
    };

    useEffect(() => {
        useSketch('requestUpdate');
    }, []);

    useEffect(async () => {
        // Query GraphQL
        console.log(context.recentDocuments);
        let ids = context.recentDocuments.map((document) => document.refs?.remote_id || null) || [];
        let query = `{
            assets(ids: [${ids}]) {
              id
              title
              createdAt
              creator {
                name
                email
              }
              modifiedAt
              modifier {
                  name
                  email
              }
              ...on File {
                downloadUrl
              }
              
            }
          }`;

        let result = await queryGraphQLWithAuth({ query, auth: context.auth });

        setRemoteDocuments(result.data.assets);

        let merged = [];

        // Todo: This doesn’t work. Local files don’t know the GraphQL ID...
        const localFileForGraphQLID = (id) => {
            // Todo: ID is an index, but we should find an ID if we have it.
            return (
                context.recentDocuments.find((doc) => doc.refs.remote_graphql_id == id) || context.recentDocuments[id]
            );
        };
        result.data.assets.forEach((document, index) => {
            console.log('push', document, context.recentDocuments);
            merged.push({
                remote: document,
                local: localFileForGraphQLID(index),
            });
        });
        setMergedDocuments(merged);
    }, [context.recentDocuments]);

    if (!mergedDocuments.length) {
        return (
            <custom-v-stack flex padding="small" align-items="center" justify-content="center">
                <LoadingCircle></LoadingCircle>
            </custom-v-stack>
        );
    }

    return (
        <custom-v-stack stretch overflow="hidden">
            <div padding="small">
                <SearchField></SearchField>
            </div>
            <custom-line></custom-line>

            <custom-scroll-view stretch style={{ overflowX: 'hidden', width: '100%' }}>
                {/* Recent Documents */}
                {mergedDocuments.map((document) => {
                    return (
                        <custom-palette-item
                            key={document.remote.id}
                            separator="bottom"
                            padding="small"
                            onDoubleClick={async () => {
                                await openSource(document);
                                redirectToDocument(document);
                            }}
                        >
                            <custom-h-stack gap="medium" align-items="start">
                                <div>
                                    <IconSketch size="Size24"></IconSketch>
                                </div>

                                <custom-v-stack>
                                    <Text size="small">{document.local.path}</Text>
                                    <div>{document.remote.title}</div>
                                    <Text size="small">
                                        {document.remote.creator.name} ({document.remote.creator.email})
                                    </Text>
                                    <Text size="small">{document.remote.modifiedAt}</Text>
                                    <Text size="small">{JSON.stringify(document.local.refs?.remote_graphql_id)}</Text>
                                </custom-v-stack>
                            </custom-h-stack>
                        </custom-palette-item>
                    );
                })}
            </custom-scroll-view>

            <custom-v-stack>
                <custom-line></custom-line>

                <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center">
                    <FileBrowser
                        onChange={(event) => {
                            console.log('should pull', event);
                        }}
                    ></FileBrowser>
                    <Button style="Primary">{t('sources.sync_all')}</Button>
                </custom-h-stack>
            </custom-v-stack>
        </custom-v-stack>
    );
}
