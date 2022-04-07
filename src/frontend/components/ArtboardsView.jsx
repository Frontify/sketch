import React from 'react';
import {
    Badge,
    Button,
    Flyout,
    IconCaretDown,
    IconMinus,
    IconImage,
    IconUploadAlternative,
    IconMore,
    IconFolder,
    IconPlus,
    LoadingCircle,
    Text,
} from '@frontify/arcade';

import { UploadDestinationPicker } from '../components/UploadDestinationPicker';
import { SearchField } from './SearchField';
import { useState, useEffect, useCallback, useContext } from 'react';

import { useTranslation } from 'react-i18next';
import { UserContext } from '../UserContext';
import { useSketch } from '../hooks/useSketch';

export function ArtboardsView() {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [destinationPickerOpen, setDestinationPickerOpen] = useState(false);
    const [showDestinationPicker, setShowDestinationPicker] = useState(false);

    const [uploadDestination, setUploadDestination] = useState({});

    const [currentSource, setCurrentSource] = useState({});
    const { t } = useTranslation();

    const [artboards, setArtboards] = useState([]);

    const uploadAll = async () => {
        setLoading(true);
        await useSketch('uploadArtboards', { artboards });
        setLoading(false);
    };

    const uploadArtboards = async () => {
        console.log('upload to…', artboards, uploadDestination);
        hack();
    };

    useEffect(async () => {
        let response = await useSketch('getSelectedArtboards');

        setArtboards(response.artboards);
    }, []);

    /**
     * Subscription
     */

    const hack = () => {
        setArtboards((artboards) => {
            return artboards.map((artboard) => {
                return {
                    ...artboard,
                    destinations: [
                        {
                            remote_project_id: uploadDestination.project.id,
                            remote_id: null,
                            remote_path: `/${uploadDestination.folderPath}/`,
                        },
                    ],
                };
            });
        });
    };

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

    if (artboards.length) {
        return (
            <custom-v-stack gap="small" flex stretch>
                {/* <custom-scope-bar-wrapper padding="small">
                    <custom-h-stack align-items="center" gap="x-small">
                        <custom-scope-button className="tw-round">
                            <label>
                                <input type="radio" name="activeView" value="recent" onChange={(event) => {}} />
                                <Text>Changes (2)</Text>
                            </label>
                        </custom-scope-button>
                        <custom-scope-button
                            className="tw-round"
                            active={location.pathname.includes('/sources/remote')}
                        >
                            <label>
                                <input type="radio" name="activeView" value="remote" onChange={(event) => {}} />
                                <Text size="x-small">Untracked (1)</Text>
                            </label>
                        </custom-scope-button>
                        <custom-spacer></custom-spacer>
                    </custom-h-stack>
                </custom-scope-bar-wrapper> */}

                <custom-line></custom-line>

                <custom-scroll-view>
                    <custom-v-stack>
                        {artboards.map((artboard) => {
                            return (
                                <custom-v-stack key={artboard.id}>
                                    <custom-h-stack gap="small" flex padding="small">
                                        {/* <custom-artboard-preview></custom-artboard-preview> */}
                                        <custom-v-stack flex gap="x-small">
                                            <custom-h-stack align-items="center">
                                                <custom-v-stack gap="x-small">
                                                    <Text>
                                                        <strong>{artboard.name}</strong>
                                                        <span>.png</span>
                                                    </Text>
                                                </custom-v-stack>
                                            </custom-h-stack>

                                            <custom-h-stack align-items="center" flex gap="x-small">
                                                {!artboard.destinations.length ? (
                                                    <Badge style="Progress">NEW</Badge>
                                                ) : (
                                                    ''
                                                )}

                                                {artboard.destinations.map((destination, index) => {
                                                    return (
                                                        <custom-h-stack key={index} gap="x-small">
                                                            {!destination.remote_id ? <Text>NEW</Text> : ''}
                                                            <Text size="small" color="weak">
                                                                <IconImage></IconImage>
                                                                {destination.remote_id} → <IconFolder></IconFolder>/
                                                                {destination.remote_project_id}
                                                                {destination.remote_path}
                                                            </Text>
                                                            {context.transferMap[destination.remote_id]?.progress ? (
                                                                <span style={{ fontFeatureSettings: 'tnum' }}>
                                                                    {Math.floor(
                                                                        context.transferMap[destination.remote_id]
                                                                            ?.progress
                                                                    )}
                                                                    %
                                                                </span>
                                                            ) : (
                                                                ''
                                                            )}
                                                        </custom-h-stack>
                                                    );
                                                })}
                                                <custom-spacer></custom-spacer>
                                                {/* <Button inverted="true" icon={<IconMinus />}></Button> */}
                                            </custom-h-stack>
                                        </custom-v-stack>
                                    </custom-h-stack>
                                    <custom-line></custom-line>
                                </custom-v-stack>
                            );
                        })}
                    </custom-v-stack>
                </custom-scroll-view>

                <custom-line></custom-line>
                <custom-v-stack>
                    <custom-h-stack padding="small" gap="small" align-items="center" justify-content="center">
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
                                    style="Secondary"
                                    onClick={() => {
                                        setShowDestinationPicker(true);
                                    }}
                                    icon={<IconFolder />}
                                >
                                    Choose folder …
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
                                        setUploadDestination(value);
                                    }}
                                ></UploadDestinationPicker>
                                <hr />
                                <Button
                                    onClick={() => {
                                        uploadArtboards(uploadDestination);

                                        setShowDestinationPicker(false);
                                    }}
                                >
                                    Confirm
                                </Button>
                            </custom-v-stack>
                        </Flyout>
                        <Button style="Primary" onClick={() => uploadAll()} icon={<IconUploadAlternative />}>
                            Upload ({artboards.length})
                        </Button>
                        {loading ? <LoadingCircle></LoadingCircle> : ''}
                        {/* <Button style="Primary" onClick={() => hack()}>
                            Hack
                        </Button> */}
                    </custom-h-stack>
                </custom-v-stack>
            </custom-v-stack>
        );
    }

    return (
        <custom-scroll-view stretch>
            <custom-v-stack stretch>
                <div padding="small">
                    <SearchField placeholder="Search Artboards" onChange={() => {}}></SearchField>
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
