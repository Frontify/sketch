import React, { useState, useContext, useEffect } from 'react';

// Components
import {
    Button,
    Flyout,
    IconCaretDown,
    IconCheck,
    IconImage,
    IconQuestionMarkCircle,
    LoadingCircle,
    Text,
    Tooltip,
    MenuItem,
} from '@frontify/fondue';

import { EmptyState } from '../Core/EmptyState';
import { GridView } from './GridView';
import { LibrariesSwitcher } from './LibrariesSwitcher';
import { SearchField } from '../Core/SearchField';

// Hooks
import { useTranslation } from 'react-i18next';
import { useSketch } from '../../hooks/useSketch';

// Context
import { UserContext } from '../../context/UserContext';

export function MediaLibrariesView({ type, useResolutions = false }) {
    const context = useContext(UserContext);
    const [selectedLibrary, setSelectedLibrary] = useState(null);
    const [libraries, setLibraries] = useState([]);

    // i18n
    const { t, i18n } = useTranslation();

    let { actions, auth } = useContext(UserContext);

    // This could be a prop, but we'll use it  for all views for now
    const LIMIT = 25;
    const THUMB_WIDTH = 320;

    // Loading state
    let [loading, setLoading] = useState(false);

    // Images, total, current page
    let [images, setImages] = useState([]);
    let [totalImages, setTotalImages] = useState(Infinity);
    let [page, setPage] = useState(1);

    // Resolutions Flyout
    let [open, setOpen] = useState(false);

    // Image selection
    let [selection, setSelection] = useState([]);
    let [selectedFrame, setSelectedFrame] = useState(null);
    let [sketchSelectionChanged, setSketchSelectionChanged] = useState(null);

    // We can use the mode to indicate "browse" or "search"
    let [mode, setMode] = useState('browse');

    let resolutions = [256, 512, 768, 1024, 1536, 2048];
    let [desiredResolution, setDesiredResolution] = useState(null);

    // Query is used for the search field
    let [query, setQuery] = useState('');

    // When the {project} prop changes, load fresh data
    useEffect(() => {
        document.scrollingElement.scrollTop = 0;
        reset();
        loadMore('browse');
    }, [selectedLibrary]);

    const reset = () => {
        setLoading(false);
        setTotalImages(Infinity);
        setPage(1);
        setImages([]);
    };

    // Depending on the {newMode}, we’ll load more assets, either by
    // either using {loadMediaLibrary} or {searchMediaLibrary}.
    const loadMore = async (newMode) => {
        if (!selectedLibrary) return;
        let nextPage = page;
        if (newMode != mode) {
            setPage(1);
            nextPage = 1;
            setMode(newMode);
            // clear items
            setImages([]);
        }
        setLoading(true);

        let result = null;

        // These parameters are used by both API requests.
        // The only difference is the {query} parameter for search.
        let sharedRequestParameters = {
            auth: auth,
            id: selectedLibrary.id,
            libraryType: selectedLibrary.__typename,
            limit: LIMIT,
            page: nextPage,
        };

        // Add placeholder items

        setImages((state) => {
            if (totalImages == Infinity) return state;
            let count = Math.max(0, Math.min(LIMIT, totalImages - images.length));
            let placeholders = Array(count)
                .fill(0)
                .map((entry) => {
                    return {
                        extension: 'png',
                        __typename: 'placeholder',
                        id: 'placeholder' + Math.random(),
                    };
                });

            return state.concat(placeholders);
        });

        switch (newMode) {
            case 'browse':
                result = await actions.loadMediaLibrary({
                    ...sharedRequestParameters,
                });
                break;
            case 'search':
                result = await context.actions.searchLibraryWithQuery({
                    ...sharedRequestParameters,
                    query: query,
                });
        }
        console.log(result);

        let library = result.data.project;
        if (!library?.assets) {
            // No assets?
            setLoading(false);
            setTotalImages(0);
            // Early return
            return;
        }
        let { items, total } = library.assets;

        setImages((state) => {
            // Merge new images

            let oldState = state.filter((entry) => entry.__typename != 'placeholder');

            let newState = oldState.concat(items || []);

            // Update the total number of items
            setTotalImages(total);
            return newState;
        });

        setLoading(false);
        setPage((page) => page + 1);
    };

    function handleIntersect() {
        if (loading) return;

        if (images.length >= totalImages) {
            return;
        }
        setLoading(true);
        loadMore(mode);
    }

    function handleSelect(selection) {
        setSelection(selection);
    }

    const selectLibrary = (library) => {
        if (selectedLibrary.id != library.id) {
            context.actions.setLibrariesForBrand({
                ...context.selection.libraries,
                [type]: library,
            });
            reset();
        }
    };

    /**
     * Subscription
     */

    useEffect(() => {
        let handler = async (event) => {
            let { type, payload } = event.detail.data;

            switch (type) {
                case 'selection-changed':
                    setSketchSelectionChanged(true);
                    break;
            }
        };

        window.addEventListener('message-from-sketch', handler);

        return () => {
            window.removeEventListener('message-from-sketch', handler);
        };
    }, []);

    const restoreFrameAfterDrop = async () => {
        if (selectedFrame) {
            await useSketch('resizeLayer', { width: selectedFrame.width, height: selectedFrame.height });
        }
    };

    const applyAsset = async () => {
        await useSketch('applyLibraryAsset', {
            asset: selection[0],
            width: useResolutions ? desiredResolution || selection[0].width : null,
        });
    };

    // React to changes of the library type
    useEffect(async () => {
        let libraries = await context.actions.getLibrariesByType(type);

        setLibraries(libraries);

        setSelectedLibrary(
            context.selection.libraries && context.selection.libraries[type]
                ? context.selection.libraries[type]
                : libraries[0]
        );
        reset();
    }, [type, context.selection.libraries]);

    if (!libraries.length) return <EmptyState title={t('emptyStates.no_libraries')}></EmptyState>;

    return (
        <custom-v-stack overflow="hidden" flex>
            <custom-h-stack stretch-children padding-x="large" padding-bottom="medium">
                <custom-combo-field>
                    <SearchField
                        disabled={loading}
                        placeholder={t('general.search') + ' ' + selectedLibrary?.name}
                        onInput={(value) => {
                            setQuery(value);
                        }}
                        onChange={(value) => {
                            let newMode = value != '' ? 'search' : 'browse';
                            reset();
                            setQuery(value);
                            loadMore(newMode);
                        }}
                        onClear={() => {
                            setQuery('');
                            loadMore('browse');
                        }}
                    ></SearchField>

                    <div style={{ flex: 0 }}>
                        {libraries.length ? (
                            <LibrariesSwitcher
                                disabled={loading}
                                type={type}
                                libraries={libraries}
                                selection={selectedLibrary}
                                onChange={(value) => {
                                    selectLibrary(value);
                                }}
                            ></LibrariesSwitcher>
                        ) : (
                            ''
                        )}
                    </div>
                </custom-combo-field>
            </custom-h-stack>

            <custom-line></custom-line>

            <custom-scroll-view padding-x="large" padding-top="medium" padding-bottom="small" flex>
                {images.length ? (
                    <GridView
                        images={images}
                        thumbWidth="320"
                        onIntersect={handleIntersect}
                        onSelect={handleSelect}
                        onApply={async () => {
                            await applyAsset();
                        }}
                        onDragStart={async () => {
                            /**
                             * This is trickery way to figure out if an image has been dropped
                             * onto the canvas.
                             *
                             * What happens on drag & drop?
                             *
                             * 1. The image is dropped in the original size (e.g. 320 x 240)
                             * 2. The new image layer is selected (-> selectionChanged)
                             * 3. The dragEnd event is fired
                             *
                             * We assume that in between dragStart and dragEnd, it is unlikely
                             * that the selection in Sketch changes.
                             *
                             * That means that if the selection changes in between drag start end end
                             * we know that this must be a layer that Sketch created (the placed image).
                             *
                             * Whenever the selection changes, we ask Sketch for the frame (x, y, width, height).
                             *
                             * When we then detect that the selection in between drag start and end did not change.
                             *
                             */

                            let { frames } = await useSketch('getSelectedLayerFrames');
                            if (frames && frames.length == 1) {
                                setSelectedFrame(frames[0]);
                            } else {
                                setSelectedFrame(null);
                            }
                            setSketchSelectionChanged(false);
                        }}
                        onDrop={async () => {
                            let dropTarget = sketchSelectionChanged ? 'canvas' : 'selection';

                            switch (dropTarget) {
                                case 'canvas':
                                    /**
                                     * Drops the image in Sketch at a higher resolution than the thumbnail.
                                     *
                                     * The default behavior is that the preview image (small resolution thumbnail) would be
                                     * placed in Sketch. What we want though is a higher resolution:
                                     *
                                     * 1. The small thumbnail is placed in Sketch (e.g. 320 x 240)
                                     * 2. The layer is resized to the desired size (e.g. 1920 x 1080)
                                     * 3. The desired resolution is applied to the layer.
                                     *
                                     * The effect is that the thumbnails shows up briefly, is resized at low resolution and
                                     * after the download of the image is finished, the layer will be upgraded with the high resolution.
                                     */

                                    if (useResolutions) {
                                        await useSketch('resizeLayer', {
                                            width: desiredResolution || selection[0].width,
                                        });
                                        applyAsset();
                                    }
                                    break;
                                case 'selection':
                                    // Drop on selection
                                    // replace existing image layer
                                    if (useResolutions) {
                                        await restoreFrameAfterDrop();
                                        await applyAsset();
                                    }

                                    break;
                            }

                            setSketchSelectionChanged(false);
                        }}
                    ></GridView>
                ) : loading ? (
                    <EmptyState title={t('emptyStates.loading_items')}></EmptyState>
                ) : (
                    <EmptyState title={t('emptyStates.no_items')}></EmptyState>
                )}
            </custom-scroll-view>

            <custom-status-bar padding="small" padding-x="large" separator="top">
                <custom-h-stack align-items="center">
                    {selection && selection.length == 0 && (
                        <Tooltip
                            position="top"
                            content={t('libraries.help')}
                            withArrow
                            hoverDelay={0}
                            triggerElement={
                                <div>
                                    <IconQuestionMarkCircle></IconQuestionMarkCircle>
                                </div>
                            }
                        ></Tooltip>
                    )}

                    {images && selection.length == 0 ? (
                        <custom-h-stack style={{ width: '100%' }} justify-content="center">
                            {totalImages != Infinity && (
                                <Text size="x-small">
                                    {images.length} / {totalImages}
                                </Text>
                            )}
                        </custom-h-stack>
                    ) : (
                        ''
                    )}
                    {!useResolutions && <custom-spacer></custom-spacer>}
                    {selection && selection.length > 0 && (
                        <Text size="x-small" overflow="ellipsis" whitespace="nowrap" title={selection[0].title}>
                            {selection[0].title}
                        </Text>
                    )}

                    <custom-spacer></custom-spacer>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '24px' }}>
                            <LoadingCircle size="ExtraSmall" />
                        </div>
                    ) : (
                        ''
                    )}
                    {useResolutions && selection && selection.length > 0 && (
                        <custom-h-stack gap="xx-small">
                            <Flyout
                                hug={false}
                                fitContent={true}
                                isOpen={open}
                                onOpenChange={(isOpen) => setOpen(isOpen)}
                                legacyFooter={false}
                                trigger={
                                    <custom-h-stack>
                                        <Button
                                            style="Secondary"
                                            hugWidth={false}
                                            size="Small"
                                            onClick={() => setOpen((open) => !open)}
                                        >
                                            <custom-h-stack gap="xx-small">
                                                <Text whitespace="pre" size="x-small">
                                                    {selection && selection.length > 0 && desiredResolution
                                                        ? desiredResolution + 'w'
                                                        : selection[0].width + ' × ' + selection[0].height}
                                                </Text>
                                                <IconCaretDown></IconCaretDown>
                                            </custom-h-stack>
                                        </Button>
                                    </custom-h-stack>
                                }
                            >
                                <custom-v-stack>
                                    {resolutions.map((resolution) => {
                                        return (
                                            <div
                                                key={resolution}
                                                tabIndex={0}
                                                role="menuitem"
                                                aria-label={t('libraries.apply_image_resolution')}
                                                onClick={() => {
                                                    setDesiredResolution(resolution);
                                                    setOpen(false);
                                                }}
                                            >
                                                <MenuItem decorator={<IconImage />} title={resolution + 'w'}></MenuItem>
                                            </div>
                                        );
                                    })}
                                    <custom-line> </custom-line>
                                    <div
                                        tabIndex={0}
                                        role="menuitem"
                                        aria-label={t('libraries.apply_image_resolution')}
                                        onClick={() => {
                                            setDesiredResolution(null);
                                            setOpen(false);
                                        }}
                                    >
                                        <MenuItem
                                            decorator={<IconImage />}
                                            title={selection[0].width + ' × ' + selection[0].height}
                                        ></MenuItem>
                                    </div>
                                </custom-v-stack>
                            </Flyout>
                        </custom-h-stack>
                    )}
                </custom-h-stack>
            </custom-status-bar>
        </custom-v-stack>
    );
}
