import React, { useContext, useEffect, useState } from 'react';

// Components
import { IconSketch, Text, LoadingCircle } from '@frontify/fondue';

// Context
import { UserContext } from '../../context/UserContext';

// Hooks
import { useSketch } from '../../hooks/useSketch';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// GraphQL
import { queryGraphQLWithAuth } from '../../graphql/graphql';

export function RecentDocumentsView({ onInput, onChange }) {
    let [activeScope] = useLocalStorage('cache.activeScope', 'colors');
    let [remoteDocuments, setRemoteDocuments] = useState([]);
    let [mergedDocuments, setMergedDocuments] = useState([]);

    // The recent documents are a global list, including documents across all brands.
    // These are only the recent documents for the current brand only.
    let [recentDocumentsForBrand, setRecentDocumentsForBrand] = useState([]);

    let context = useContext(UserContext);
    let navigate = useNavigate();

    let [loading, setLoading] = useState('');

    let { sources } = useContext(UserContext);

    const { t } = useTranslation();

    const focusSource = (document) => {
        onInput(document);
    };
    const openSource = async (document) => {
        setLoading(document.local.uuid);
        onChange(document);
        // await useSketch('openSource', { path: document.local.path });
    };

    const redirectToDocument = (document) => {
        navigate(`/source/artboards/`);
    };

    useEffect(() => {
        useSketch('requestUpdate');
    }, []);

    useEffect(() => {
        setRecentDocumentsForBrand(() => {
            return context.recentDocuments.filter((doc) => doc.refs?.remote_brand_id == context.selection.brand.id);
        });
    }, [context.recentDocuments]);

    useEffect(async () => {
        // Query GraphQL
        setLoading(true);

        let ids = recentDocumentsForBrand.map((document) => document.refs?.remote_id || null) || [];
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

        /**
         * Here we might get errors:
         *
         * >>> message: "policy 'assets style guide' not fulfilled"
         *
         * This can happen when we try to request assets that don’t belong to this brand.
         */
        console.log('result from graphql', result);

        setRemoteDocuments(result.data.assets);

        let merged = [];

        // Todo: This doesn’t work. Local files don’t know the GraphQL ID...
        const localFileForGraphQLID = (id) => {
            // Todo: ID is an index, but we should find an ID if we have it.
            return (
                recentDocumentsForBrand.find((doc) => doc.refs.remote_graphql_id == id) || recentDocumentsForBrand[id]
            );
        };
        if (result.data?.assets) {
            result.data.assets.forEach((document, index) => {
                merged.push({
                    remote: document,
                    local: localFileForGraphQLID(index),
                });
            });
        }

        merged = merged.sort((a, b) => (a.local.timestamp < b.local.timestamp ? 1 : -1));
        setMergedDocuments(merged);
        setLoading(false);
    }, [recentDocumentsForBrand]);

    if (!mergedDocuments) {
        return (
            <custom-v-stack flex padding="small" align-items="center" justify-content="center">
                <LoadingCircle></LoadingCircle>
            </custom-v-stack>
        );
    }
    if (mergedDocuments.length == 0) {
        return (
            <custom-v-stack flex padding="small" align-items="center" justify-content="center">
                {loading && <LoadingCircle size="Small"></LoadingCircle>}
                {!loading && <Text>No Recent Documents</Text>}
            </custom-v-stack>
        );
    }

    return (
        <custom-v-stack separator="between">
            {/* Recent Documents */}
            {mergedDocuments.map((document) => {
                return (
                    <custom-palette-item
                        overflow="hidden"
                        selectable
                        tabindex="0"
                        key={document.local.uuid}
                        padding-y="medium"
                        padding-x="large"
                        onFocus={() => {
                            focusSource(document);
                        }}
                        onDoubleClick={async () => {
                            await openSource(document);
                            redirectToDocument(document);
                        }}
                    >
                        <custom-h-stack gap="medium" align-items="center">
                            <custom-v-stack gap="xx-small" overflow="hidden">
                                {/* <pre>{new Date(document.local.timestamp).toLocaleString()}</pre> */}
                                <Text color="weak" overflow="truncate">
                                    {document.local.path}
                                </Text>

                                <Text weight="strong">{document.local.filename.replace('.sketch', '')}</Text>

                                {/* <Text size="small" color="weak">
                                    <custom-h-stack gap="x-small">
                                        <span>{document.remote.creator.name}</span>
                                        <span>•</span>
                                        <span>{new Date(document.remote.modifiedAt).toLocaleString()}</span>
                                    </custom-h-stack>
                                </Text> */}
                            </custom-v-stack>
                            <custom-spacer></custom-spacer>
                            <div style={{ minWidth: '24px' }}>
                                {loading == document.local.uuid && (
                                    <LoadingCircle style="Positive" size="Small"></LoadingCircle>
                                )}
                            </div>
                        </custom-h-stack>
                    </custom-palette-item>
                );
            })}
        </custom-v-stack>
    );
}
