import React from 'react';

import { MainView } from './MainView';
import { PalettesView } from './PalettesView';
import { TypographyView } from './TypographyView';
import { SignInView } from './SignInView';

// Context
import { useContext } from 'react';
import { UserContext, UserContextProvider } from '../UserContext';

// Router
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

export function App() {
    let context = useContext(UserContext);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/brand" element={<MainView />}>
                    <Route
                        path="colors"
                        element={
                            <PalettesView palettes={context.palettes.entries} guidelines={context.guidelines.entries} />
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
                                <p>There's nothing here!</p>
                            </main>
                        }
                    />
                </Route>
                <Route path="/signin" element={<SignInView />} />
            </Routes>
        </BrowserRouter>
    );
}
