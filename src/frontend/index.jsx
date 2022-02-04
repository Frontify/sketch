import React from 'react';
import ReactDOM from 'react-dom';
import { MainView } from './components/MainView';
import { SignInView } from './components/SignInView';
import { BrowserRouter } from 'react-router-dom';
import { UserContextProvider } from './UserContext';
import { Routes, Route, Link, useLocation } from 'react-router-dom';

ReactDOM.render(
    <UserContextProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainView />} />
                <Route path="/signin" element={<SignInView />} />
            </Routes>
        </BrowserRouter>
    </UserContextProvider>,
    document.getElementById('root')
);

/**
 * Messaging
 */

window.send = (data) => {
    // create and dispatch the event including the data
    var event = new CustomEvent('send-data', {
        detail: {
            data,
        },
    });
    window.dispatchEvent(event);
};
