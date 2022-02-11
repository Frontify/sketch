import React from 'react';

import { ArtboardsView } from './ArtboardsView';
import { MainView } from './MainView';
import { PalettesView } from './PalettesView';
import { TypographyView } from './TypographyView';
import { LaunchView } from './LaunchView';
import { OpenDocumentsView } from './OpenDocumentsView';
import { RecentDocumentsView } from './RecentDocumentsView';
import { RequireAuth } from './RequireAuth';

import { SignInView } from './SignInView';
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
                <Route path="/sources" element={<SourcesView />}>
                    <Route path="open" element={<OpenDocumentsView />} />
                    <Route path="recent" element={<RecentDocumentsView />} />
                </Route>

                <Route path="/source/*" element={<SourceView />}>
                    <Route path="artboards" element={<ArtboardsView />}></Route>
                    <Route path="brand/*" element={<MainView />}>
                        <Route
                            path="colors"
                            element={
                                <PalettesView
                                    palettes={context.palettes.entries}
                                    guidelines={context.guidelines.entries}
                                />
                            }
                        ></Route>
                        <Route path="text-styles" element={<TypographyView />}></Route>
                        <Route path="symbols"></Route>
                        <Route path="icons"></Route>
                        <Route path="images"></Route>
                        <Route path="logos"></Route>
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
                <Route path="/signin" element={<SignInView />} />
                <Route path="/launch" element={<LaunchView />} />
            </Routes>
        </BrowserRouter>
    );
}
