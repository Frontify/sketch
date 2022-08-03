import React, { useContext, useEffect } from 'react';

// Artboards
import { ArtboardsView } from './Artboards/ArtboardsView';

// Brand
import { BrandView } from './Brand/BrandView';
import { IconLibrariesView } from './Libraries/IconLibrariesView';
import { MediaLibrariesView } from './Libraries/MediaLibrariesView';
import { LogoLibrariesView } from './Libraries/LogoLibrariesView';
import { ColorPalettesView } from './Brand/ColorPalettesView';
import { TypographyView } from './Brand/TypographyView';

// Sign In
import { OfflineView } from './SignIn/OfflineView';
import { RequireAuth } from './SignIn/RequireAuth';
import { SignInView } from './SignIn/SignInView';
import { SignInPendingView } from './SignIn/SignInPendingView';

// Sources
import { SourceView } from './Sources/SourceView';
import { SourcesView } from './Sources/SourcesView';
import { OpenDocumentsView } from './Sources/OpenDocumentsView';
import { RecentDocumentsView } from './Sources/RecentDocumentsView';

// Context
import { UserContext } from '../context/UserContext';

// Router
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PluginRoutes() {
    let context = useContext(UserContext);
    let { t } = useTranslation();
    let navigate = useNavigate();

    // Initial refresh will load the user, brand, etc.
    useEffect(() => {
        context.actions.refresh();
    }, []);

    useEffect(() => {
        if (!navigator.onLine) {
            navigate('/offline');
        }
    }, []);

    // Poor man’s offline state handling: redirect to an emtpy state.
    window.addEventListener('offline', () => {
        navigate('/offline');
    });
    window.addEventListener('online', () => {
        navigate('/source/artboards');
    });

    // Redirect after the webview has loaded
    // Somehow we can’t load urls with # in them through the native WebView loadURL()
    // That’s why we need this roundtrip so that React router can make the redirect
    window.addEventListener('message-from-sketch', (event) => {
        if (event.detail?.data) {
            let { type } = event.detail.data;
            if (type == 'did-finish-load') {
                navigate('/source/artboards');
            }
        }
    });
    return (
        <Routes>
            <Route path="/offline" element={<OfflineView></OfflineView>}></Route>
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
                            <ColorPalettesView
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
                    <Route path="icons" element={<IconLibrariesView />}></Route>
                    <Route path="media" element={<MediaLibrariesView />}></Route>
                    <Route path="logos" element={<LogoLibrariesView />}></Route>

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
    );
}
