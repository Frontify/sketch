import React from 'react';

import { ArtboardsView } from './ArtboardsView';

import { IconLibrariesView } from './IconLibrariesView';
import { LogoLibrariesView } from './LogoLibrariesView';
import { MediaLibrariesView } from './MediaLibrariesView';

import { MainView } from './MainView';
import { PalettesView } from './PalettesView';
import { TypographyView } from './TypographyView';

import { OpenDocumentsView } from './OpenDocumentsView';
import { RecentDocumentsView } from './RecentDocumentsView';
import { RequireAuth } from './RequireAuth';

import { SignInView } from './SignInView';
import { SignInPendingView } from './SignInPendingView';
import { SourceView } from './SourceView';
import { SourcesView } from './SourcesView';

// Context
import { useContext } from 'react';
import { UserContext, UserContextProvider } from '../UserContext';

// Router
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function App() {
    let context = useContext(UserContext);
    let { t } = useTranslation();
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
                    <Route path="brand/*" element={<MainView />}>
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
        </BrowserRouter>
    );
}
