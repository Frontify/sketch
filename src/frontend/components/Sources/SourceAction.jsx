import React, { useContext, useEffect, useState } from 'react';

// Context
import { UserContext } from '../../context/UserContext';

// i18n
import { useTranslation } from 'react-i18next';

// Hooks
import { useSketch } from '../../hooks/useSketch';

// Components
import { CustomDialog } from '../Core/CustomDialog';
import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';

import {
    Button,
    IconAdd,
    IconAlert,
    IconCheckMarkCircle,
    IconUploadAlternative,
    IconDownloadAlternative,
    IconRejectCircle,
    IconPlus,
    LoadingCircle,
    Text,
    Tooltip,
    IconQuestion,
    IconQuestionMark,
    IconQuestionMarkCircle,
} from '@frontify/fondue';

export function SourceAction({ status, actions, loading }) {
    let context = useContext(UserContext);

    // i18n
    const { t, i18n } = useTranslation();

    // State
    let [documentURL, setDocumentURL] = useState(null);
    let [showConflictDialog, setShowConflictDialog] = useState(false);
    let [showDestinationPicker, setShowDestinationPicker] = useState(false);
    let [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);
    let [uploadDestination, setUploadDestination] = useState(null);

    // Document URL
    useEffect(() => {
        if (context.currentDocument) {
            setDocumentURL(() => {
                return `${context.auth.domain}/screens/${context.currentDocument?.refs?.remote_id}/comparerevision`;
            });
        }
    }, [context.currentDocument]);

    // openExternal
    const openExternal = (url) => {
        useSketch('openUrl', { url });
    };

    // create folder
    const [createFolder, setCreateFolder] = useState(false);

    const onCreateFolder = async (folder) => {
        await useSketch('createFolder', folder);
    };

    if (loading || context.refreshing)
        return (
            <custom-v-stack
                style={{ minWidth: '39px', minHeight: '40px' }}
                align-items="center"
                justify-content="center"
            >
                <Tooltip
                    content={
                        <span figures="tabular" style={{ fontSize: '14px' }}>
                            {context.transferMap[context.currentDocument.refs?.remote_id]
                                ? `${Math.ceil(
                                      context.transferMap[context.currentDocument.refs?.remote_id]?.progress
                                  )} %`
                                : 'Fetching …'}
                        </span>
                    }
                    withArrow
                    hoverDelay={0}
                    triggerElement={
                        <div>
                            <LoadingCircle size="Small"></LoadingCircle>
                        </div>
                    }
                />
            </custom-v-stack>
        );

    switch (status) {
        case 'file-not-found':
            return (
                <Tooltip
                    content={t('sources.status_file_not_found')}
                    withArrow
                    hoverDelay={0}
                    triggerElement={
                        <custom-sync-button variant="error">
                            <IconQuestionMarkCircle
                                size="Size24"
                                style={{ color: 'var(--box-warning-inverse-color)' }}
                            />
                        </custom-sync-button>
                    }
                />
            );

        default:
        case 'untracked':
            return (
                <CustomDialog
                    open={showDestinationPicker}
                    trigger={
                        <Tooltip
                            content={t('sources.status_untracked')}
                            withArrow
                            hoverDelay={0}
                            triggerElement={
                                <custom-sync-button variant="add" onClick={() => setShowDestinationPicker(true)}>
                                    <IconPlus size="Size24" />
                                </custom-sync-button>
                            }
                        />
                    }
                >
                    <custom-v-stack stretch>
                        <custom-h-stack padding="small" separator="bottom">
                            <Text weight="strong">Publish on Frontify</Text>
                        </custom-h-stack>
                        <UploadDestinationPicker
                            createFolder={createFolder}
                            onCreateFolder={async (folder) => {
                                setCreateFolder(false);
                                await onCreateFolder(folder);
                            }}
                            onCancelCreateFolder={() => {
                                setCreateFolder(false);
                            }}
                            allowfiles={false}
                            paths={uploadDestination ? [uploadDestination] : []}
                            onInput={(value) => {
                                setTemporaryUploadDestination(value);
                            }}
                            onChange={(value) => {
                                setUploadDestination(value);
                            }}
                        ></UploadDestinationPicker>
                        <custom-h-stack padding="small" gap="small" separator="top">
                            <Button
                                style="Secondary"
                                disabled={!temporaryUploadDestination}
                                icon={<IconAdd></IconAdd>}
                                onClick={() => {
                                    setCreateFolder(true);
                                }}
                            >
                                New folder
                            </Button>
                            <custom-spacer></custom-spacer>
                            <Button
                                style="Secondary"
                                onClick={() => {
                                    setShowDestinationPicker(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={uploadDestination == null}
                                onClick={() => {
                                    setShowDestinationPicker(false);
                                    setUploadDestination(uploadDestination);
                                    actions.publish(uploadDestination);
                                }}
                            >
                                Publish
                            </Button>
                        </custom-h-stack>
                    </custom-v-stack>
                </CustomDialog>
            );
        case 'same':
            return (
                <Tooltip
                    content={t('sources.status_same')}
                    withArrow
                    hoverDelay={0}
                    triggerElement={
                        <custom-sync-button variant="same" onClick={() => actions.fetchAndRefresh()}>
                            <IconCheckMarkCircle style={{ color: 'var(--box-positive-inverse-color)' }} size="Size24" />
                        </custom-sync-button>
                    }
                />
            );

        case 'push':
            return (
                <Tooltip
                    content={t('sources.status_push')}
                    withArrow
                    hoverDelay={0}
                    triggerElement={
                        <custom-sync-button variant="push" onClick={() => actions.pushSource({ force: false })}>
                            <IconUploadAlternative
                                style={{ color: 'var(--box-selected-inverse-color)' }}
                                size="Size24"
                            />
                        </custom-sync-button>
                    }
                />
            );

        case 'pull':
            return (
                <Tooltip
                    content={t('sources.status_pull')}
                    withArrow
                    hoverDelay={0}
                    triggerElement={
                        <custom-sync-button variant="pull" onClick={() => actions.pullSource()}>
                            <IconDownloadAlternative
                                style={{ color: 'var(--box-selected-inverse-color)' }}
                                size="Size24"
                            />
                        </custom-sync-button>
                    }
                />
            );

        case 'conflict':
            return (
                <CustomDialog
                    open={showConflictDialog}
                    trigger={
                        <Tooltip
                            content={t('sources.status_conflict')}
                            withArrow
                            hoverDelay={0}
                            triggerElement={
                                <custom-sync-button variant="conflict" onClick={() => setShowConflictDialog(true)}>
                                    <IconAlert style={{ color: 'var(--box-warning-inverse-color)' }} size="Size24" />
                                </custom-sync-button>
                            }
                        />
                    }
                >
                    <custom-v-stack stretch>
                        <custom-v-stack padding="large" gap="large">
                            <custom-h-stack align-items="center" gap="small">
                                <IconAlert size="Size32"></IconAlert>
                                <Text size="large" weight="strong">
                                    This file has local and remote changes.
                                </Text>
                            </custom-h-stack>

                            <custom-v-stack padding="small" style={{ background: '#fcf8ee' }} gap="small">
                                <Text weight="strong">Remote changes</Text>

                                <Text>
                                    <pre>{new Date(context.currentDocument.remote?.modifiedAt).toLocaleString()} </pre>
                                </Text>
                                <Text>
                                    <pre>{context.currentDocument.remote?.modifier_name}</pre>
                                </Text>

                                <a onClick={() => openExternal(documentURL)} target="_blank">
                                    <Text color="interactive">{t('sources.view_revisions')}</Text>
                                </a>
                            </custom-v-stack>

                            <p>You have two options:</p>

                            <custom-palette-item
                                border="true"
                                onClick={() => {
                                    setShowConflictDialog(false);
                                    actions.pushSource({ force: true });
                                }}
                            >
                                <custom-v-stack gap="small" padding="small">
                                    <custom-h-stack align-items="center" gap="x-small">
                                        <IconUploadAlternative size="Size20"></IconUploadAlternative>
                                        <Text weight="strong" size="large">
                                            Force Push
                                        </Text>
                                    </custom-h-stack>

                                    <Text color="weak">
                                        {' '}
                                        Your local changes will be pushed, but any remote changes will be lost.
                                    </Text>
                                </custom-v-stack>
                            </custom-palette-item>
                            <custom-palette-item
                                border="true"
                                onClick={() => {
                                    setShowConflictDialog(false);
                                    actions.pullSource();
                                }}
                            >
                                <custom-v-stack gap="small" padding="small">
                                    <custom-h-stack align-items="center" gap="x-small">
                                        <IconRejectCircle size="Size20"></IconRejectCircle>
                                        <Text weight="strong" size="large">
                                            Discard Changes{' '}
                                        </Text>
                                    </custom-h-stack>

                                    <Text color="weak">
                                        Your local changes will be discarded. The latest remote file will be pulled.
                                    </Text>
                                </custom-v-stack>
                            </custom-palette-item>

                            <a onClick={() => openExternal(t('general.help_link_url'))}>
                                <Text color="interactive">{t('sources.resolve_conflict_link_title')}</Text>
                            </a>
                        </custom-v-stack>
                        <custom-v-stack separator="top" padding="large">
                            <Button
                                style="Secondary"
                                onClick={() => {
                                    setShowConflictDialog(false);
                                }}
                            >
                                Cancel
                            </Button>
                        </custom-v-stack>
                    </custom-v-stack>
                </CustomDialog>
            );
    }
    return <div></div>;
}
