import React, { useContext, useEffect, useState } from 'react';

// Components

import {
    Button,
    Flyout,
    IconAdd,
    IconAlert,
    IconArrowLeft,
    IconDownloadAlternative,
    IconExternalLink,
    IconMore,
    IconPlus,
    IconPlus16,
    IconRefresh,
    IconUploadAlternative,
    IconView,
    LoadingCircle,
    MenuItem,
    Text,
} from '@frontify/fondue';

import { CustomDialog } from '../Core/CustomDialog';
import { SourceFileInfo } from '../Sources/SourceFileInfo';
import { UploadDestinationPicker } from '../Core/UploadDestinationPicker';

// Hooks
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useSketch } from '../../hooks/useSketch';

// Context
import { UserContext } from '../../context/UserContext';

// i18n
import { useTranslation } from 'react-i18next';

// GraphQL
import { queryGraphQLWithAuth } from '../../graphql/graphql';

// Router
import { Link } from 'react-router-dom';

function SourceAction({ status, actions, loading }) {
    let context = useContext(UserContext);
    let [showDestinationPicker, setShowDestinationPicker] = useState(false);
    let [destination, setDestination] = useState(null);
    let [temporaryUploadDestination, setTemporaryUploadDestination] = useState(null);
    let [uploadDestination, setUploadDestination] = useState(null);

    if (loading || context.refreshing)
        return (
            <custom-v-stack
                style={{ minWidth: '36px', minHeight: '100%' }}
                align-items="center"
                justify-content="center"
            >
                <LoadingCircle size="Small"></LoadingCircle>
            </custom-v-stack>
        );

    switch (status) {
        case 'untracked':
            return (
                <CustomDialog
                    open={showDestinationPicker}
                    trigger={
                        <custom-sync-button variant="add" onClick={() => setShowDestinationPicker(true)}>
                            <IconPlus size="Size20" />
                        </custom-sync-button>
                    }
                >
                    <custom-v-stack stretch>
                        <custom-h-stack padding="small" separator="bottom">
                            <Text weight="strong">Publish on Frontify</Text>
                        </custom-h-stack>
                        <UploadDestinationPicker
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
                                disabled={true || !temporaryUploadDestination}
                                icon={<IconAdd></IconAdd>}
                                onClick={() => {
                                    onCreateFolder(temporaryUploadDestination);
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
                <Button
                    style="Secondary"
                    hugWidth={false}
                    onClick={async () => {
                        await actions.refresh();
                    }}
                    icon={<IconRefresh />}
                ></Button>
            );

        case 'push':
            return (
                <Button
                    style="Secondary"
                    hugWidth={false}
                    onClick={() => {
                        actions.pushSource();
                    }}
                    icon={<IconUploadAlternative />}
                ></Button>
            );

        case 'pull':
            return (
                <Button
                    inverted={true}
                    icon={<IconDownloadAlternative />}
                    onClick={() => {
                        actions.pullSource();
                    }}
                >
                    Pull
                </Button>
            );

        case 'conflict':
            return (
                <custom-h-stack>
                    <Button
                        icon={<IconAlert />}
                        onClick={() => {
                            actions.pushSource();
                        }}
                    >
                        Force Push
                    </Button>
                    <Button
                        icon={<IconAlert />}
                        onClick={() => {
                            actions.pullSource();
                        }}
                    >
                        Pull
                    </Button>
                </custom-h-stack>
            );
    }
    return <div></div>;
}

export function NavigationBar() {
    let [activeSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);
    let [documentPath, setDocumentPath] = useState([]);
    let [matchedSource, setMatchedSource] = useState(null);
    let [loading, setLoading] = useState(false);
    let [relativeLastFetched, setRelativeLastFetched] = useState('just now');
    let [status, setStatus] = useState('PENDING');
    let [open, setOpen] = useState(false);

    // i18n
    const { t, i18n } = useTranslation();

    let [documentURL, setDocumentURL] = useState('');

    useEffect(() => {
        if (context.currentDocument) {
            setDocumentURL(() => {
                return `${context.auth.domain}/screens/${context.currentDocument?.remote?.id}`;
            });
        }
    }, [context.currentDocument]);

    let target = {
        brand: context.selection.brand,
        project: { id: 190741 },
        // ${brand.name}/Projects/${project.name}/${folder.name}
        path: '/Users/florians/Frontify/Super Brand/Projects/Annual Report/Test/',
        set: {
            path: '/Test/',
            id: 102196,
            name: 'Test',
            folders: ['Test'],
        },
        set_sources: {},
        target_changed: false,
    };

    const openExternal = (url) => {
        useSketch('openUrl', { url });
    };

    const publish = async (destination) => {
        setLoading(true);
        console.log('Publish', destination);

        target.project = destination.project;
        target.path = context.currentDocument.local.path;
        // target.set.path = destination.folder.name;
        target.set.path = destination.folderPath;

        /**
         * This is the legacy data model "target" that was used to cache
         * the destination for *any* source/artboard related action.
         * With the new plugin, the "target" needs to be linked to the actual
         * asset and not global.
         */

        // 1. Upload to Frontify
        let response = await useSketch('addSource', { source: context.currentDocument.local, target });

        // 2. Move the current file to the local Frontify folder
        await useSketch('moveCurrent', {
            brand: context.selection.brand,
            project: destination.project,
            folder: target.set.path,
        });

        // 3. Refresh
        context.actions.refresh();
        setLoading(false);
    };

    const pushSource = async () => {
        setLoading(true);
        setStatus('PUSHING');
        // Set correct local path
        target.path = context.currentDocument.local.path;

        await useSketch('pushSource', { source: context.currentDocument.remote, target });
        setStatus('FETCHING');
        await context.actions.refresh();
        setStatus('PENDING');
        setLoading(false);
    };

    const pullSource = async () => {
        setLoading(true);
        setStatus('PULLING');
        // Set correct local path
        target.path = context.currentDocument.local.path;

        // await useSketch('pullSource', { source: context.currentDocument.remote });

        // 1. Get downloadUrl via GraphQL

        let query = `{
            asset(id: ${context.currentDocument.refs.remote_id}) {
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
        let response = await queryGraphQLWithAuth({ query, auth: context.auth });
        let asset = response.data.asset;

        let args = {
            path: context.currentDocument.local.path,
            useFullPath: true,
            file: {
                filename: context.currentDocument.local.filename,
                downloadUrl: asset.downloadUrl,
            },
        };
        await useSketch('checkout', args);
        setStatus('FETCHING');
        await context.actions.refresh();
        setStatus('PENDING');
        setLoading(false);
    };

    const refresh = async () => {
        setLoading(true);
        setStatus('FETCHING');
        await context.actions.getCurrentDocument();
        setStatus('PENDING');
        setLoading(false);
    };
    useEffect(() => {
        // Update the relative time display every minute
        const intervalInMilliseconds = 60000;

        let interval = setInterval(() => {
            let timeAgo = '';

            // Time differences
            let diff = new Date().getTime() - context.lastFetched;
            let minutesAgo = Math.round(diff / 1000 / 60);

            // These constants help us to convert the time difference from milliseconds to minutes
            const minute = 60000;
            const twoMinutes = minute * 2;
            const oneHour = minute * 60;

            // 2 Minutes, so we don’t have to pluralize, ha ha.
            let displayJustNow = diff < twoMinutes;
            let displayMinutesAgo = diff > twoMinutes;
            let displayExactDate = diff > oneHour;

            // Here we decide what text should be displayed depending on the time difference
            if (displayJustNow) timeAgo = 'just now';
            if (displayMinutesAgo) timeAgo = `${minutesAgo} minutes ago`;
            if (displayExactDate) timeAgo = new Date(context.lastFetched).toLocaleString();

            setRelativeLastFetched(timeAgo);
        }, intervalInMilliseconds);
        return () => {
            clearInterval(interval);
        };
    }, [context.lastFetched]);

    useEffect(() => {
        if (context.currentDocument && context.currentDocument?.localpath) {
            let pathArray = decodeURI(context.currentDocument.localpath)
                .split('/')
                .map((item) => {
                    return { label: item };
                });

            setDocumentPath(pathArray);
            setMatchedSource(
                context.sources.find((source) => source.localpath == context.currentDocument.remote.localpath)
            );
        }
    }, [context.currentDocument]);

    // Without open document:
    if (!context.currentDocument.local)
        return (
            <custom-h-stack align-items="center">
                <custom-h-stack stretch-children="true" align-items="center" style={{ width: '100%' }}>
                    <div style={{ height: '100%', overflow: 'hidden', flex: 1 }}>
                        <SourceFileInfo
                            source={context.currentDocument}
                            status={status}
                            loading={loading}
                            transferMap={context.transferMap}
                        ></SourceFileInfo>
                    </div>
                </custom-h-stack>
                <custom-h-stack padding="small" gap="xx-small" style={{ flex: 0 }}>
                    <button
                        onClick={() => {
                            window.postMessage('reload');
                        }}
                    >
                        <IconRefresh icon="Refresh" size="Size20" />
                    </button>

                    <div style={{ flex: 0 }}>
                        <Flyout
                            hug={false}
                            fitContent={true}
                            isOpen={open}
                            onOpenChange={(isOpen) => setOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button
                                    inverted={true}
                                    icon={<IconMore />}
                                    onClick={() => setOpen((open) => !open)}
                                ></Button>
                            }
                        >
                            <div
                                tabIndex={0}
                                role="menuitem"
                                aria-label={`Learn more …`}
                                onClick={() => {
                                    setOpen(false);
                                    openExternal('https://www.frontify.com/de/support/');
                                }}
                            >
                                <MenuItem decorator={<IconExternalLink />} title={'Get Help'}>
                                    Learn more …
                                </MenuItem>
                            </div>
                        </Flyout>
                    </div>
                </custom-h-stack>
            </custom-h-stack>
        );

    // With open document:
    return (
        <custom-h-stack stretch-children="true" align-items="center" style={{ width: '100%' }}>
            <div style={{ height: '100%', overflow: 'hidden', flex: 1 }}>
                <SourceFileInfo
                    source={context.currentDocument}
                    status={status}
                    loading={loading}
                    transferMap={context.transferMap}
                ></SourceFileInfo>
            </div>

            <custom-h-stack padding="small" gap="xx-small" style={{ flex: 0 }}>
                {context.currentDocument.state != 'unsaved' && (
                    <SourceAction
                        style={{ flex: 0 }}
                        status={context.currentDocument.state}
                        actions={{ pushSource, refresh, publish, pullSource }}
                        loading={loading}
                    ></SourceAction>
                )}

                {context.currentDocument.state == 'same' ||
                context.currentDocument.state == 'push' ||
                context.currentDocument.state == 'pull' ? (
                    <div style={{ flex: 0 }}>
                        <Flyout
                            hug={false}
                            fitContent={true}
                            isOpen={open}
                            onOpenChange={(isOpen) => setOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button
                                    inverted={true}
                                    icon={<IconMore />}
                                    onClick={() => setOpen((open) => !open)}
                                ></Button>
                            }
                        >
                            <custom-v-stack>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={`View on Frontify`}
                                    onClick={() => {
                                        openExternal(documentURL);
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem decorator={<IconExternalLink />} title={'View on Frontify'}>
                                        View on Frontify
                                    </MenuItem>
                                </div>
                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={`Reveal in Finder`}
                                    onClick={() => {
                                        // We only have access to the full path including the filename.
                                        // But macOS Finder can only reveal folders. So we need to strip
                                        // the filename and only send the folder to the handler on the
                                        // Sketch side of things.
                                        useSketch('reveal', {
                                            path: context.currentDocument.local.path.replace(
                                                `/${context.currentDocument.local.filename}`,
                                                ''
                                            ),
                                        });
                                        // Close the Flyout
                                        setOpen(false);
                                    }}
                                >
                                    <MenuItem decorator={<IconView />} title={'Reveal in Finder'}>
                                        Reveal in Finder
                                    </MenuItem>
                                </div>
                            </custom-v-stack>
                        </Flyout>
                    </div>
                ) : (
                    <div style={{ flex: 0 }}>
                        <Flyout
                            hug={false}
                            fitContent={true}
                            isOpen={open}
                            onOpenChange={(isOpen) => setOpen(isOpen)}
                            legacyFooter={false}
                            trigger={
                                <Button
                                    inverted={true}
                                    icon={<IconMore />}
                                    onClick={() => setOpen((open) => !open)}
                                ></Button>
                            }
                        >
                            <div
                                tabIndex={0}
                                role="menuitem"
                                aria-label={`Learn more …`}
                                onClick={() => {
                                    setOpen(false);
                                    openExternal('https://www.frontify.com/de/support/');
                                }}
                            >
                                <MenuItem decorator={<IconExternalLink />} title={'Get Help'}>
                                    Learn more …
                                </MenuItem>
                            </div>
                        </Flyout>
                    </div>
                )}
            </custom-h-stack>
        </custom-h-stack>
    );
}
