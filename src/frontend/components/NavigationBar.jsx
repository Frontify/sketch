import {
    Breadcrumbs,
    IconArrowLeft,
    IconMore,
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

export function NavigationBar() {
    let [activeSourceScope] = useLocalStorage('cache.activeSourceScope', 'open');
    let context = useContext(UserContext);
    let [documentPath, setDocumentPath] = useState([]);
    let [matchedSource, setMatchedSource] = useState(null);
    let [loading, setLoading] = useState(false);

    const pushSource = async () => {
        setLoading(true);

        let result = await useSketch('pushSource', { source: matchedSource });
        context.actions.refresh();
        setLoading(false);
    };

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
                        <Text size="x-small" color="weak">
                            {matchedSource.localpath}
                        </Text>
                        <Text size="large">{matchedSource.filename}</Text>
                        <Text size="x-small">Last fetched {context.lastFetched}</Text>
                        <Text size="x-small">
                            Last modified {matchedSource.modified_localized_ago} by {matchedSource.modifier_name}
                        </Text>
                        {loading ? <LoadingCircle></LoadingCircle> : ''}
                    </custom-v-stack>
                ) : (
                    ''
                )}
            </custom-h-stack>
            <custom-spacer></custom-spacer>

            <button>
                <IconUploadAlternative
                    size="Size20"
                    onClick={() => {
                        pushSource();
                    }}
                ></IconUploadAlternative>
            </button>
            <button>
                <IconMore size="Size20"></IconMore>
            </button>
        </custom-h-stack>
    );
}
