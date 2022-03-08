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
} from '@frontify/arcade';
import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';
import { UploadDestinationPicker } from './UploadDestinationPicker';

function SourceAction({ status, actions }) {
    switch (status) {
        case 'same':
            return (
                <IconRefresh
                    size="Size20"
                    onClick={() => {
                        actions.refresh();
                    }}
                ></IconRefresh>
            );

        case 'push':
            return (
                <Button
                    icon={<IconUploadAlternative />}
                    onClick={() => {
                        actions.pushSource();
                    }}
                >
                    Push changes
                </Button>
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
    let [relativeLastFetched, setRelativeLastFetched] = useState(null);
    let [showDestinationPicker, setShowDestinationPicker] = useState(false);

    const addCurrentFile = async () => {
        setLoading(true);

        await useSketch('moveCurrent');
        await useSketch('addSource');
        context.actions.refresh();
        setLoading(false);
    };

    const pushSource = async () => {
        setLoading(true);

        let result = await useSketch('pushSource', { source: matchedSource });
        context.actions.refresh();
        setLoading(false);
    };

    const refresh = async () => {
        setLoading(true);
        await context.actions.refresh();
        setLoading(false);
    };
    useEffect(() => {
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
        }, 1000);
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
            console.log(pathArray);
            setDocumentPath(pathArray);
            setMatchedSource(context.sources.find((source) => source.localpath == context.currentDocument.localpath));
        }
    }, [context.currentDocument]);

    return (
        <custom-h-stack gap="small" padding="small" align-items="center">
            <Link to={`/sources/${activeSourceScope}`}>
                <IconArrowLeft size="Size16"></IconArrowLeft>
            </Link>
            <custom-h-stack align-items="center" gap="small">
                <div style={{ flex: 0 }}>
                    <IconSketch size="Size24"></IconSketch>
                </div>

                {matchedSource ? (
                    <custom-v-stack>
                        {/* <Text size="x-small" color="weak">
                            {matchedSource.localpath}
                        </Text> */}

                        <Text weight="strong">{matchedSource.filename}</Text>

                        {matchedSource.state == 'same' ? (
                            <Text size="x-small">
                                Last revision by {matchedSource.modifier_name} {matchedSource.modified_localized_ago}
                            </Text>
                        ) : (
                            ''
                        )}

                        {matchedSource.state == 'push' ? <Text size="x-small">Push changes</Text> : ''}

                        {loading ? (
                            <Text size="x-small">Fetching …</Text>
                        ) : (
                            <Text size="x-small" color="weak">
                                Last fetched {relativeLastFetched}
                            </Text>
                        )}
                    </custom-v-stack>
                ) : (
                    <custom-v-stack>
                        <Text weight="strong">{context.currentDocument.filename}</Text>
                        <Text>Untracked Document</Text>
                    </custom-v-stack>
                )}
            </custom-h-stack>
            <custom-spacer></custom-spacer>
            {matchedSource ? (
                <button>
                    {loading ? (
                        <LoadingCircle size="Small"></LoadingCircle>
                    ) : (
                        <SourceAction status={matchedSource.state} actions={{ pushSource, refresh }}></SourceAction>
                    )}
                </button>
            ) : (
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
                            <strong>{context.currentDocument.filename}</strong>
                        </Text>
                        <hr />
                        <UploadDestinationPicker></UploadDestinationPicker>
                        <hr />
                        <Button
                            onClick={() => {
                                addCurrentFile();
                            }}
                        >
                            Confirm
                        </Button>
                    </custom-v-stack>
                </Flyout>
            )}{' '}
            <button>
                <IconMore size="Size20"></IconMore>
            </button>
        </custom-h-stack>
    );
}
