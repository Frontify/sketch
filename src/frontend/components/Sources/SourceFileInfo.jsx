import React, { useState, useEffect } from 'react';

// Components
import { Breadcrumbs, Button, IconArrowLeft, IconCaretDown, Text } from '@frontify/fondue';
import { SourceStatusIcon } from './SourceStatusIcon';

// Router
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

// i18n
import { useTranslation } from 'react-i18next';

function SourceStateInfo({ source, loading, transferMap }) {
    return (
        <div>
            {source.state == 'same' && !loading ? (
                <Text size="x-small" color="weak" whitespace="nowrap" overflow="ellipsis">
                    Last revision by {source.remote?.modifier_name} {source.remote?.modified_localized_ago}
                </Text>
            ) : (
                ''
            )}
            {source.state == 'push' && !loading ? (
                <custom-h-stack align-items="center" gap="xx-small">
                    <Text size="x-small" color="weak">
                        Push changes
                    </Text>
                </custom-h-stack>
            ) : (
                ''
            )}
            {loading ? (
                status == 'PUSHING' ? (
                    <Text size="x-small" color="weak">
                        Pushing …{' '}
                        {transferMap[source.remote?.id]?.progress ? (
                            <span style={{ fontFeatureSettings: 'tnum' }}>
                                {Math.floor(transferMap[source.remote?.id]?.progress)}%
                            </span>
                        ) : (
                            ''
                        )}
                    </Text>
                ) : '' || status == 'FETCHING' ? (
                    <Text size="x-small" color="weak">
                        Fetching …
                    </Text>
                ) : (
                    ''
                )
            ) : (
                ''
                // <Text size="x-small" color="weak">
                //     Last fetched {relativeLastFetched}
                // </Text>
            )}
        </div>
    );
}

/**
 * No Document
 * ----------------------------------------------------------------------------
 */
function NoSource() {
    const { t } = useTranslation();
    return (
        <custom-v-stack style={{ overflow: 'hidden' }} gap="xx-small">
            <Text color="weak" size="small">
                {t('sources.no_open_document')}
            </Text>
            <custom-h-stack align-items="center">
                <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                    {t('sources.no_open_document_description')}
                </Text>
            </custom-h-stack>
        </custom-v-stack>
    );
}

/**
 * Remote
 * ----------------------------------------------------------------------------
 */
function RemoteSource({ source }) {
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    useEffect(() => {
        setBreadcrumbs(() => {
            // remove leading and trailing slash from the path
            return source.remote?.path.split('/').slice(1, -1);
        });
    }, [source.remote.path]);
    return (
        <custom-v-stack gap="xx-small">
            <custom-breadcrumbs overflow="hidden" flex>
                {breadcrumbs.map((breadcrumb, index) => (
                    <custom-h-stack gap="x-small" key={index} overflow="hidden">
                        <Text color="weak" size="small" key={index} overflow="ellipsis" whitespace="nowrap">
                            {breadcrumb}
                        </Text>

                        <Text color="weak">
                            <span style={{ opacity: 0.5 }}>/</span>
                        </Text>
                    </custom-h-stack>
                ))}
            </custom-breadcrumbs>
            <Text padding="small" weight="strong" overflow="ellipsis" whitespace="nowrap">
                {source.local.filename.replace('.sketch', '')}
            </Text>
        </custom-v-stack>
    );
}

/**
 * Untracked
 * ----------------------------------------------------------------------------
 */

function UntrackedSource({ source }) {
    const { t } = useTranslation();
    return (
        <custom-v-stack gap="xx-small">
            <Text color="weak" size="small">
                {t('sources.untracked')}
            </Text>
            <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                {source.local?.filename?.replace('.sketch', '')}
            </Text>
        </custom-v-stack>
    );
}

/**
 * Unsaved
 * ----------------------------------------------------------------------------
 */
function UnsavedSource({ source }) {
    return (
        <custom-v-stack gap="xx-small">
            <Text color="weak" size="small">
                Unsaved File
            </Text>
            <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                (No information available)
            </Text>
        </custom-v-stack>
    );
}

export function SourceFileInfo({ status, source, transferMap, loading }) {
    const { t } = useTranslation();

    return (
        <custom-h-stack flex style={{ height: '100%' }} align-items="center" stretch-children-height="true">
            <custom-h-stack
                padding-x="small"
                gap="medium"
                align-items="center"
                style={{ height: '100%', overflow: 'hidden', width: '100%' }}
            >
                <Link to="/sources">
                    <Button inverted="true" icon={<IconArrowLeft size="Size24"></IconArrowLeft>}></Button>
                </Link>

                <custom-h-stack gap="xx-small" align-items="center" style={{ overflow: 'hidden', width: '100%' }}>
                    {/* No open file detected */}
                    {!source.local && <NoSource></NoSource>}

                    {/* Tracked remote file */}
                    {source && source.remote?.id && <RemoteSource source={source}></RemoteSource>}

                    {/* Untracked */}
                    {source.local && source.local.filename && !source.remote?.id && (
                        <UntrackedSource source={source}></UntrackedSource>
                    )}

                    {/* Unsaved document */}
                    {source.local && !source.local.filename && <UnsavedSource source={source}></UnsavedSource>}
                </custom-h-stack>
            </custom-h-stack>
        </custom-h-stack>
    );
}
