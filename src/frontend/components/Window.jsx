import React from 'react';

// Import Styles
import '@frontify/arcade/style';

// Artboards
import { ArtboardsView } from './Artboards/ArtboardsView';

// Brand
import { BrandView } from './Brand/BrandView';
import { MediaLibrariesView } from './Brand/MediaLibrariesView';
import { PalettesView } from './Brand/PalettesView';
import { TypographyView } from './Brand/TypographyView';

// Sign In
import { RequireAuth } from './SignIn/RequireAuth';
import { SignInView } from './SignIn/SignInView';
import { SignInPendingView } from './SignIn/SignInPendingView';

// Sources
import { SourceView } from './Sources/SourceView';
import { SourcesView } from './Sources/SourcesView';
import { OpenDocumentsView } from './Sources/OpenDocumentsView';
import { RecentDocumentsView } from './Sources/RecentDocumentsView';
import { RemoteDocumentsView } from './Sources/RemoteDocumentsView';

// Context
import { useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';

// Router
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Window() {
    let context = useContext(UserContext);
    let { t } = useTranslation();

    // Initial refresh will load the user, brand, etc.
    useEffect(() => {
        context.actions.refresh();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/sources"
                    element={
                        <RequireAuth>
                            <SourcesView />
                        </RequireAuth>
                    }
                >
                    <Route path="open" element={<OpenDocumentsView />} />
                    <Route path="recent" element={<RecentDocumentsView />} />
                    <Route path="remote" element={<RemoteDocumentsView />} />
                </Route>

                <Route
                    path="/source/*"
                    element={
                        <RequireAuth>
                            <SourceView />
                        </RequireAuth>
                    }
                >
                    <Route path="artboards" element={<ArtboardsView />}></Route>
                    <Route path="brand/*" element={<BrandView />}>
                        <Route
                            path="colors"
                            element={
                                <PalettesView
                                    palettes={context && context.colorPalettes}
                                    guidelines={context && context.guidelines}
                                />
                            }
                        ></Route>
                        <Route
                            path="typography"
                            element={
                                <TypographyView
                                    palettes={context && context.textStylePalettes}
                                    guidelines={context && context.guidelines}
                                />
                            }
                        ></Route>

                        <Route path="symbols"></Route>
                        <Route path="icons" element={<MediaLibrariesView type="IconLibrary" selected="" />}></Route>
                        <Route path="media" element={<MediaLibrariesView type="MediaLibrary" selected="" />}></Route>
                        <Route path="logos" element={<MediaLibrariesView type="LogoLibrary" selected="" />}></Route>

                        <Route
                            path="*"
                            element={
                                <main style={{ padding: '1rem' }}>
                                    <p>{t('emptyStates.no_items')}</p>
                                </main>
                            }
                        />
                    </Route>
                </Route>
                <Route path="/" element={<SignInView />} />
                <Route path="/signin" element={<SignInView />} />
                <Route path="/signin-pending" element={<SignInPendingView />} />
            </Routes>
        </BrowserRouter>
    );
}
