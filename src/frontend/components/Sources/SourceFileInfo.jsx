import React, { useState, useEffect } from 'react';

// Components
import { Breadcrumbs, Button, IconAlert, IconArrowLeft, IconCaretDown, Text, Tooltip } from '@frontify/fondue';

// Router
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';

// i18n
import { useTranslation } from 'react-i18next';

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
            return source.relativePath.split('/').slice(1, -1);
        });
    }, [source.relativePath]);
    return (
        <custom-v-stack gap="xx-small">
            <custom-breadcrumbs overflow="hidden" flex>
                {breadcrumbs.map((breadcrumb, index) => (
                    <custom-h-stack gap="x-small" key={index} overflow="hidden">
                        <Text color="weak" size="small" key={index} overflow="ellipsis" whitespace="nowrap">
                            {breadcrumb}
                        </Text>

                        {index < breadcrumbs.length - 1 && (
                            <Text color="weak">
                                <span style={{ opacity: 0.5 }}>/</span>
                            </Text>
                        )}
                    </custom-h-stack>
                ))}
            </custom-breadcrumbs>
            <Text padding="small" weight="strong" overflow="ellipsis" whitespace="nowrap">
                {source.filename.replace('.sketch', '')}
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
                {source.filename?.replace('.sketch', '')}
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

function RemovedSource({ source }) {
    const { t } = useTranslation();
    return (
        <custom-v-stack gap="xx-small" cursor="default">
            <Tooltip
                hoverDelay={0}
                withArrow
                content={t('error.asset_not_found_description')}
                triggerElement={
                    <custom-h-stack align-items="center" gap="xx-small">
                        <IconAlert></IconAlert>
                        <Text color="weak" size="small">
                            {t('error.asset_not_found_title')}
                        </Text>
                    </custom-h-stack>
                }
            ></Tooltip>
            <Text weight="strong" whitespace="nowrap" overflow="ellipsis">
                {source.filename?.replace('.sketch', '')}
            </Text>
        </custom-v-stack>
    );
}
export function SourceFileInfoText({ source, children }) {
    return (
        <custom-v-stack gap="xx-small" overflow="hidden">
            <custom-h-stack
                gap="xx-small"
                align-items="center"
                style={{ overflow: 'hidden', width: '100%' }}
                title={JSON.stringify(source, null, 2)}
            >
                {/* No open file detected */}
                {!source && <NoSource></NoSource>}
                {source && source.state == 'asset-not-found' && <RemovedSource source={source}></RemovedSource>}
                {/* Tracked remote file */}
                {source && source.remote && source.refs?.remote_id && <RemoteSource source={source}></RemoteSource>}
                {/* Untracked */}
                {source && source.filename && !source.refs?.remote_id && (
                    <UntrackedSource source={source}></UntrackedSource>
                )}
                {/* Unsaved document */}
                {source && !source.filename && <UnsavedSource source={source}></UnsavedSource>}
            </custom-h-stack>
            {children}
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

                <SourceFileInfoText source={source}></SourceFileInfoText>
            </custom-h-stack>
        </custom-h-stack>
    );
}
