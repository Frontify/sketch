import React, { useContext, useEffect, useState } from 'react';

// Components

import {
    Button,
    Flyout,
    IconArrowSync,
    IconExternalLink,
    IconMore,
    IconRefresh,
    IconView,
    MenuItem,
} from '@frontify/fondue';

import { SourceAction } from '../Sources/SourceAction';
import { SourceFileInfo } from '../Sources/SourceFileInfo';

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
import { t } from 'i18next';

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
                return `${context.auth.domain}/screens/${context.currentDocument?.refs?.remote_id}`;
            });
        }
    }, [context.currentDocument]);

    // payload expected by the function on the backend
    let target = {
        project: null,
        path: '',
        set: {
            path: '',
        },
    };

    const openExternal = (url) => {
        useSketch('openUrl', { url });
    };

    const publish = async (destination) => {
        setLoading(true);

        target.project = destination.project;
        target.path = context.currentDocument.path;
        // target.set.path = destination.folder.name;
        target.set.path = destination.folderPath;

        /**
         * This is the legacy data model "target" that was used to cache
         * the destination for *any* source/artboard related action.
         * With the new plugin, the "target" needs to be linked to the actual
         * asset and not global.
         */

        // 1. Upload to Frontify
        let response = await useSketch('addSource', { source: context.currentDocument, target });

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

    const pushSource = async ({ force = false }) => {
        console.log('pushSource');
        setLoading(true);
        setStatus('PUSHING');
        // Set correct local path

        let target = {
            set: { path: '' },
            path: context.currentDocument.path,
            project: { id: context.currentDocument.refs.remote_id },
        };

        let source = {
            id: context.currentDocument.refs.remote_id,
            ...context.currentDocument,
        };

        /**
         * It’s possible that a new revision has been uploaded in the meantime.
         * We need to fetch the latest API data first before pushing.
         * If we see a new revision, we’ve got a conflict.
         */

        let { currentDocument } = await useSketch('refreshCurrentAsset');

        if (currentDocument.state == 'push' || force) {
            await useSketch('pushSource', { source, target });
            setStatus('FETCHING');
            await context.actions.refresh();
            setStatus('PENDING');
        } else {
            // Conflict!
            console.warn('conflict');
            refresh();
        }

        setLoading(false);
    };

    const pullSource = async () => {
        setLoading(true);
        setStatus('PULLING');

        // Set correct local path
        target.path = context.currentDocument.path;

        await useSketch('pullSource', { source: context.currentDocument, path: context.currentDocument.path });

        setStatus('FETCHING');
        // await context.actions.refresh();
        setStatus('PENDING');
        setLoading(false);
    };

    const fetchAndRefresh = async () => {
        await useSketch('refreshCurrentAsset');
        refresh();
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
        if (context.currentDocument && context.currentDocument?.path) {
            let pathArray = decodeURI(context.currentDocument.path)
                .split('/')
                .map((item) => {
                    return { label: item };
                });

            setDocumentPath(pathArray);
            setMatchedSource(context.sources.find((source) => source.path == context.currentDocument.path));
        }
    }, [context.currentDocument]);

    /**
     * Subscription
     */

    useEffect(() => {
        let handler = async (event) => {
            let { type } = event.detail.data;

            switch (type) {
                case 'document-closed':
                case 'document-opened':
                    refresh();
                    break;
                case 'document-pulled':
                    refresh();
                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

    // Without open document:
    if (!context.currentDocument)
        return (
            <custom-h-stack align-items="center">
                <SourceFileInfo
                    source={context.currentDocument}
                    status={status}
                    loading={loading}
                    transferMap={context.transferMap}
                ></SourceFileInfo>
                <custom-h-stack padding="small" gap="xx-small" style={{ flex: 0 }} align-items="center">
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
                                aria-label={`Get Help`}
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
        <custom-h-stack
            stretch-children="true"
            align-items="center"
            style={{ width: '100%' }}
            title={context.debug ? JSON.stringify(context.currentDocument, null, 2) : ''}
        >
            <div style={{ height: '100%', overflow: 'hidden', flex: 1 }}>
                <SourceFileInfo
                    source={context.currentDocument}
                    status={status}
                    loading={loading}
                    transferMap={context.transferMap}
                ></SourceFileInfo>
            </div>

            <custom-h-stack padding="small" gap="xx-small" style={{ flex: 0 }} align-items="center">
                {context.currentDocument.state != 'unsaved' && (
                    <SourceAction
                        style={{ flex: 0 }}
                        status={context.currentDocument.state}
                        actions={{ pushSource, refresh, fetchAndRefresh, publish, pullSource }}
                        loading={loading}
                    ></SourceAction>
                )}

                {context.currentDocument.state == 'same' ||
                context.currentDocument.state == 'push' ||
                context.currentDocument.state == 'pull' ||
                context.currentDocument.state == 'conflict' ? (
                    <div style={{ flex: 0 }} align-items="center">
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
                                            path: context.currentDocument.path.replace(
                                                `/${context.currentDocument.filename}`,
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
                                <custom-line></custom-line>

                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={`Fetch Again`}
                                    onClick={() => {
                                        setOpen(false);
                                        fetchAndRefresh();
                                    }}
                                >
                                    <MenuItem decorator={<IconArrowSync />} title={'Fetch Again'}></MenuItem>
                                </div>

                                <div
                                    tabIndex={0}
                                    role="menuitem"
                                    aria-label={`Reload Plugin`}
                                    onClick={() => {
                                        setOpen(false);
                                        window.postMessage('reload');
                                    }}
                                >
                                    <MenuItem decorator={<IconRefresh />} title={'Reload Plugin'}></MenuItem>
                                </div>

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
                                aria-label={`Reload Plugin`}
                                onClick={() => {
                                    setOpen(false);
                                    window.postMessage('reload');
                                }}
                            >
                                <MenuItem decorator={<IconRefresh />} title={'Reload Plugin'}></MenuItem>
                            </div>

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
