import React from 'react';
import { Button, Flyout, IconCaretDown, IconMore, LoadingCircle, Text } from '@frontify/arcade';

import { SearchField } from './SearchField';
import { useState, useEffect, useCallback, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';

export function ArtboardsView() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
    const [currentSource, setCurrentSource] = useState({});
    const { t } = useTranslation();

    const [artboards, setArtboards] = useState([]);

    useEffect(async () => {
        let response = await useSketch('getSelectedArtboards');

        setArtboards(response.artboards);
    }, []);

    /**
     * Subscription
     */

    useEffect(() => {
        let handler = (event) => {
            let { type, payload } = event.detail.data;

            switch (type) {
                case 'artboards-changed':
                    setArtboards(payload.artboards);
                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

    const context = useContext(UserContext);

    const [selection] = useState([]);

    const [sources] = useState([
        {
            id: 'S1',
            title: 'workspace_template-chooser',
            path: 'Arcade / Inventory / Graphics / Illustrations',
            artboards: [
                {
                    id: 'A1',
                    title: 'Baby rose - Rosa multiflora',
                    updated: '2 minutes ago',
                    updated_by: 'you',
                },
                {
                    id: 'A2',
                    title: 'Maize - Zea mays',
                    updated: '2 minutes ago',
                    updated_by: 'Susanne Müller',
                },
                {
                    id: 'A3',
                    title: 'Maize - Zea mays',
                    updated: '2 minutes ago',
                    updated_by: 'Susanne Müller',
                },
                {
                    id: 'A4',
                    title: 'Maize - Zea mays',
                    updated: '2 minutes ago',
                    updated_by: 'Susanne Müller',
                },
                {
                    id: 'A5',
                    title: 'Maize - Zea mays',
                    updated: '2 minutes ago',
                    updated_by: 'Susanne Müller',
                },
            ],
        },
    ]);

    useEffect(() => {
        setCurrentSource(sources[0]);
    }, []);

    if (artboards.length) {
        return (
            <custom-v-stack gap="small" padding="small" justify-content="center" align-items="center">
                <custom-line></custom-line>
                {loading ? <LoadingCircle></LoadingCircle> : ''}
                {artboards &&
                    artboards.length &&
                    artboards.map((artboard) => {
                        return (
                            <custom-palette-item
                                onClick={async () => {
                                    setLoading(true);
                                    await useSketch('uploadArtboards', { artboards });
                                    setLoading(false);
                                }}
                                key={artboard.id}
                            >
                                {artboard.name}
                            </custom-palette-item>
                        );
                    })}

                <custom-line></custom-line>
                {selection.length ? (
                    <Button>Upload ({selection.length}) artboards to … </Button>
                ) : (
                    <Button disabled>No Artboards Selected</Button>
                )}
            </custom-v-stack>
        );
    }

    if (!sources.length) {
        return (
            <custom-v-stack gap="small" padding="small" justify-content="center" align-items="center">
                <Text size="large" weight="strong">
                    No artboards uploaded
                </Text>
                <Text>Select some artboards in Sketch and click the button to add them to Frontify.</Text>
            </custom-v-stack>
        );
    }

    return (
        <custom-scroll-view stretch>
            <custom-v-stack stretch>
                <div padding="small">
                    <SearchField placeholder="Search Artboards" onChange={() => {}}></SearchField>
                </div>
                <div style={{ width: '100%' }}>
                    <details>
                        <summary>View Payload</summary>
                        <pre>{JSON.stringify(context.currentDocument, null, 2)}</pre>
                    </details>
                </div>
                <div padding="small">
                    <custom-h-stack padding="small" style={{ background: 'rgba(0, 0, 0, 0.1)' }}>
                        <Text color="weak">
                            If artboards were uploaded before the recent plugin improvements you won’t see them here
                            until they’re next updated. Don’t worry, they’re still on Frontify.
                        </Text>
                    </custom-h-stack>
                </div>
                <custom-line></custom-line>
                <h2>Upload targets (3)</h2>
                <custom-scroll-view>
                    {sources.map((source) => {
                        return (
                            <custom-v-stack key={source.id} gap="medium" padding="small">
                                <custom-h-stack gap="x-small" align-items="center">
                                    <IconCaretDown size="Size16"></IconCaretDown>
                                    <Text size="x-small">{source.path}</Text>
                                    <custom-spacer></custom-spacer>
                                    <Flyout
                                        trigger={
                                            <Button
                                                icon={<IconMore />}
                                                inverted
                                                onClick={() => setOpen((open) => !open)}
                                            ></Button>
                                        }
                                        isOpen={open}
                                        onOpenChange={(isOpen) => setOpen(isOpen)}
                                        legacyFooter={false}
                                    >
                                        <div padding="small">Flyout Content</div>
                                    </Flyout>
                                </custom-h-stack>
                                <custom-v-stack gap="small">
                                    {source.artboards.map((artboard) => {
                                        return (
                                            <custom-h-stack gap="small" key={artboard.id}>
                                                <custom-artboard-preview></custom-artboard-preview>
                                                <custom-v-stack gap="x-small">
                                                    <Text>{artboard.title}</Text>
                                                    <Text size="small" color="weak">
                                                        {artboard.updated} by {artboard.updated_by}
                                                    </Text>
                                                </custom-v-stack>
                                            </custom-h-stack>
                                        );
                                    })}
                                </custom-v-stack>
                            </custom-v-stack>
                        );
                    })}
                </custom-scroll-view>

                <custom-v-stack>
                    <custom-line></custom-line>

                    <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center">
                        <Flyout
                            trigger={
                                <Button
                                    style="Secondary"
                                    onClick={() => {
                                        setDestinationPickerOpen((destinationPickerOpen) => !destinationPickerOpen);
                                    }}
                                >
                                    {t('sources.upload_selection')}
                                </Button>
                            }
                            isOpen={destinationPickerOpen}
                            onOpenChange={(isOpen) => setDestinationPickerOpen(isOpen)}
                            legacyFooter={false}
                        >
                            <custom-v-stack padding="small" gap="small">
                                <Text>{currentSource.path}</Text>
                                <Text>Other …</Text>
                            </custom-v-stack>
                        </Flyout>
                        <Button style="Primary">{t('sources.update_artboards')}</Button>
                    </custom-h-stack>
                </custom-v-stack>
            </custom-v-stack>
            )
        </custom-scroll-view>
    );
}
