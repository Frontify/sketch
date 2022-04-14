import {
    Button,
    Breadcrumbs,
    IconArrowLeft,
    IconMore,
    IconRefresh,
    IconSketch,
    IconUploadAlternative,
    Flyout,
    Text,
    Stack,
    LoadingCircle,
    IconAdd,
    IconDownloadAlternative,
    IconAlert,
    IconAngleDown,
    IconQuestion,
    MenuItem,
} from '@frontify/arcade';
import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';
import { UploadDestinationPicker } from './UploadDestinationPicker';

import { queryGraphQLWithAuth } from '../graphql';

function SourceAction({ status, actions, loading }) {
    let context = useContext(UserContext);
    let [showDestinationPicker, setShowDestinationPicker] = useState(false);
    let [destination, setDestination] = useState(null);

    if (loading || context.refreshing)
        return (
            <Button align-items="center" style={{ minWidth: '52px' }}>
                <LoadingCircle size="Small"></LoadingCircle>
            </Button>
        );

    switch (status) {
        case 'untracked':
            return (
                <Flyout
                    onCancel={() => setShowDestinationPicker(false)}
                    isOpen={showDestinationPicker}
                    onOpenChange={(open) => {
                        if (open) {
                            setShowDestinationPicker(false);
                        } else {
                            setShowDestinationPicker(true);
                        }
                    }}
                    trigger={
                        <Button
                            onClick={() => {
                                setShowDestinationPicker(true);
                            }}
                            icon={<IconUploadAlternative />}
                        >
                            Publish …
                        </Button>
                    }
                >
                    <custom-v-stack padding="small" gap="small">
                        <h2>Destination</h2>
                        <Text>
                            Choose the folder where you want to publish{' '}
                            <strong>{context.currentDocument.local.filename}</strong>
                        </Text>
                        <hr />
                        <UploadDestinationPicker
                            onChange={(value) => {
                                setDestination(value);
                            }}
                        ></UploadDestinationPicker>
                        <hr />
                        <Button
                            onClick={() => {
                                actions.publish(destination);

                                setShowDestinationPicker(false);
                            }}
                        >
                            Confirm
                        </Button>
                    </custom-v-stack>
                </Flyout>
            );
        case 'same':
            return (
                <Button
                    style="Secondary"
                    onClick={async () => {
                        await actions.refresh();
                    }}
                >
                    <custom-h-stack gap="small" align-items="center">
                        <IconRefresh size="Size20"></IconRefresh>
                    </custom-h-stack>
                </Button>
            );

        case 'push':
            return (
                <Button
                    style="Positive"
                    hugWidth={false}
                    onClick={() => {
                        actions.pushSource();
                    }}
                >
                    <custom-h-stack gap="x-small" align-items="center">
                        <IconUploadAlternative size="Size20" />
                        {/* <span>Push</span> */}
                    </custom-h-stack>
                </Button>
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
    return <div>{JSON.stringify(status)}</div>;
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

    const openExternal = (id) => {
        useSketch('openUrl', { url: 'https://company-136571.frontify.com/screens/' + id });
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
                <custom-h-stack gap="small" padding="small">
                    <IconQuestion size="Size24"></IconQuestion>

                    <custom-v-stack>
                        <Text weight="strong">No Sketch Document</Text>
                        <Text size="x-small">Open a document and refresh.</Text>
                    </custom-v-stack>
                </custom-h-stack>
                <custom-spacer></custom-spacer>
                <div padding="small">
                    <Button
                        style="Secondary"
                        onClick={async () => {
                            await refresh();
                        }}
                    >
                        <custom-h-stack gap="small" align-items="center">
                            <span>Connect</span>
                        </custom-h-stack>
                    </Button>
                </div>
            </custom-h-stack>
        );

    if (context.currentDocument.state == 'unsaved')
        return (
            <custom-v-stack padding="medium">
                <Text weight="strong">Unsaved document</Text>
                <Text>To start tracking this file on Frontify, save it first to your computer.</Text>
                <Link to={`/sources/${activeSourceScope}`}>
                    <IconArrowLeft size="Size16"></IconArrowLeft>
                </Link>
            </custom-v-stack>
        );

    return (
        <custom-v-stack>
            <custom-h-stack align-items="center">
                <custom-palette-item
                    flex
                    separator="right"
                    style={{ display: 'flex', height: ' 100%' }}
                    align-items="center"
                >
                    <Link to={`/sources/recent`} style={{ width: '100%' }}>
                        <custom-h-stack gap="small" align-items="center">
                            <IconSketch size="Size24"></IconSketch>
                            <custom-h-stack gap="small" flex align-items="center">
                                {context.currentDocument && context.currentDocument.remote.id ? (
                                    <custom-v-stack gap="small" flex>
                                        <custom-v-stack>
                                            <Text weight="strong">{context.currentDocument.local.filename}</Text>
                                            {context.currentDocument.state == 'same' && !loading ? (
                                                <Text size="x-small">
                                                    Last revision by {context.currentDocument.remote.modifier_name}{' '}
                                                    {context.currentDocument.remote.modified_localized_ago}
                                                </Text>
                                            ) : (
                                                ''
                                            )}
                                            {context.currentDocument.state == 'push' && !loading ? (
                                                <Text size="x-small">Push changes</Text>
                                            ) : (
                                                ''
                                            )}
                                            {loading ? (
                                                status == 'PUSHING' ? (
                                                    <Text size="x-small">
                                                        Pushing …{' '}
                                                        {context.transferMap[context.currentDocument.remote.id]
                                                            ?.progress ? (
                                                            <span style={{ fontFeatureSettings: 'tnum' }}>
                                                                {Math.floor(
                                                                    context.transferMap[
                                                                        context.currentDocument.remote.id
                                                                    ]?.progress
                                                                )}
                                                                %
                                                            </span>
                                                        ) : (
                                                            ''
                                                        )}
                                                    </Text>
                                                ) : '' || status == 'FETCHING' ? (
                                                    <Text size="x-small">Fetching …</Text>
                                                ) : (
                                                    ''
                                                )
                                            ) : (
                                                ''
                                                // <Text size="x-small" color="weak">
                                                //     Last fetched {relativeLastFetched}
                                                // </Text>
                                            )}
                                        </custom-v-stack>
                                        {/* <custom-h-stack flex>
                                            <SourceAction
                                                flex
                                                status={context.currentDocument.state}
                                                actions={{ pushSource, refresh, publish, pullSource }}
                                                loading={loading}
                                            ></SourceAction>
                                        </custom-h-stack> */}
                                    </custom-v-stack>
                                ) : (
                                    <custom-v-stack>
                                        <Text weight="strong">{context.currentDocument.local.filename}</Text>
                                        <Text>Untracked Document</Text>
                                    </custom-v-stack>
                                )}
                            </custom-h-stack>

                            <IconAngleDown size="Size24"></IconAngleDown>
                        </custom-h-stack>
                    </Link>
                </custom-palette-item>

                <custom-h-stack padding="small">
                    <SourceAction
                        flex
                        style={{ flex: 0 }}
                        status={context.currentDocument.state}
                        actions={{ pushSource, refresh, publish, pullSource }}
                        loading={loading}
                    ></SourceAction>

                    <Flyout
                        hug={true}
                        fitContent={true}
                        isOpen={open}
                        onOpenChange={(isOpen) => setOpen(isOpen)}
                        legacyFooter={false}
                        trigger={
                            <Button style="Secondary" onClick={() => setOpen((open) => !open)}>
                                <IconMore size="Size20"></IconMore>
                            </Button>
                        }
                    >
                        <custom-v-stack>
                            <MenuItem
                                title="View on Frontify"
                                onClick={() => {
                                    openExternal(context.currentDocument.refs.remote_id);
                                    setOpen(false);
                                }}
                            >
                                View on Frontify
                            </MenuItem>
                            <div padding="small">
                                {' '}
                                <Button
                                    onClick={() => {
                                        openExternal(context.currentDocument.refs.remote_id);
                                        setOpen(false);
                                    }}
                                >
                                    View on Frontify
                                </Button>
                            </div>
                        </custom-v-stack>
                    </Flyout>
                </custom-h-stack>
            </custom-h-stack>
        </custom-v-stack>
    );
}
