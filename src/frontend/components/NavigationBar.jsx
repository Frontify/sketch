import {
    Breadcrumbs,
    IconArrowLeft,
    IconMore,
    IconRefresh,
    IconSketch,
    IconUploadAlternative,
    Text,
    Stack,
    LoadingCircle,
} from '@frontify/arcade';
import React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';

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
                <IconUploadAlternative
                    size="Size20"
                    onClick={() => {
                        actions.pushSource();
                    }}
                ></IconUploadAlternative>
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

                        <Text size="large" weight="strong">
                            {matchedSource.filename}
                        </Text>
                        <Text size="x-small">
                            Last modified {matchedSource.modified_localized_ago} by {matchedSource.modifier_name}
                        </Text>
                        {loading ? (
                            <Text size="x-small">Fetching …</Text>
                        ) : (
                            <Text size="x-small">Last fetched {relativeLastFetched}</Text>
                        )}
                    </custom-v-stack>
                ) : (
                    ''
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
                ''
            )}{' '}
            <button>
                <IconMore size="Size20"></IconMore>
            </button>
        </custom-h-stack>
    );
}
