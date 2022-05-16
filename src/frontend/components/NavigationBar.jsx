import {
    Badge,
    Breadcrumbs,
    Button,
    Flyout,
    IconAdd,
    IconAlert,
    IconAngleDown,
    IconArrowLeft,
    IconCaretDown,
    IconDownloadAlternative,
    IconMore,
    IconQuestion,
    IconFolderUp,
    IconRefresh,
    IconSketch,
    IconUploadAlternative,
    LoadingCircle,
    MenuItem,
    Stack,
    Text,
} from '@frontify/arcade';
import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';
import { UploadDestinationPicker } from './UploadDestinationPicker';
import { SourcePicker } from './Sources/SourcePicker';
import { SourceFileInfo } from './Sources/SourceFileInfo';

import { CustomDialog } from './CustomDialog';

import { queryGraphQLWithAuth } from '../graphql';

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
                        <Button
                            style="Secondary"
                            hugWidth={false}
                            onClick={() => setShowDestinationPicker(true)}
                            icon={<IconFolderUp />}
                        >
                            {/* <Text whitespace="nowrap">Publish …</Text> */}
                        </Button>
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
                                disabled={temporaryUploadDestination == null}
                                onClick={() => {
                                    setShowDestinationPicker(false);
                                    setUploadDestination(temporaryUploadDestination);
                                    actions.publish(temporaryUploadDestination);
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

        target.project = destination.project;
        target.path = context.currentDocument.local.path;
        target.set.path = destination.folder.name;

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

    if (!context.currentDocument.local)
        return (
            <custom-h-stack align-items="center">
                <custom-h-stack gap="small" padding="small" align-items="center">
                    <custom-v-stack>
                        <Text weight="strong" size="x-small">
                            No Sketch Document
                        </Text>
                        <Text size="x-small" color="weak">
                            Open a document and refresh.
                        </Text>
                    </custom-v-stack>
                </custom-h-stack>
                <custom-spacer></custom-spacer>
                <div padding="small">
                    <Button
                        style="Secondary"
                        onClick={async () => {
                            await context.actions.getCurrentDocument(true);
                        }}
                    >
                        <custom-h-stack gap="small" align-items="center">
                            <span>Connect</span>
                        </custom-h-stack>
                    </Button>
                </div>
            </custom-h-stack>
        );

    // if (context.currentDocument.state == 'unsaved')
    //     return (
    //         <custom-v-stack padding="medium">
    //             <Text weight="strong">Unsaved document</Text>
    //             <Text>To start tracking this file on Frontify, save it first to your computer.</Text>
    //             <Link to={`/sources/${activeSourceScope}`}>
    //                 <IconArrowLeft size="Size16"></IconArrowLeft>
    //             </Link>
    //         </custom-v-stack>
    //     );

    return (
        <custom-h-stack stretch-children="true" align-items="center" style={{ width: '100%' }}>
            <div style={{ height: '100%', overflow: 'hidden', flex: 1 }}>
                <SourcePicker style={{ height: '100%', overflow: 'hidden' }}>
                    <SourceFileInfo
                        source={context.currentDocument}
                        status={status}
                        loading={loading}
                        transferMap={context.transferMap}
                    ></SourceFileInfo>
                </SourcePicker>
            </div>

            <custom-h-stack padding="small" gap="xx-small" separator="left" style={{ flex: 0 }}>
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
                                {/* <MenuItem
                                    title="View on Frontify"
                                    onClick={() => {
                                        openExternal(documentURL);
                                        setOpen(false);
                                    }}
                                >
                                    View on Frontify
                                </MenuItem> */}
                                <div padding="small">
                                    <Button
                                        onClick={() => {
                                            openExternal(documentURL);
                                            setOpen(false);
                                        }}
                                    >
                                        View on Frontify
                                    </Button>
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
                            <custom-v-stack>
                                <MenuItem title="No actions available">No actions</MenuItem>
                            </custom-v-stack>
                        </Flyout>
                    </div>
                )}
            </custom-h-stack>
        </custom-h-stack>
    );
}
