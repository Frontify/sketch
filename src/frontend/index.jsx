import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';

// Context
import { useContext } from 'react';
import { UserContext, UserContextProvider } from './UserContext';

// i18n
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import common_de from './translations/de.json';
import common_en from './translations/en.json';

i18next.init({
    interpolation: { escapeValue: false }, // React already does escaping
    lng: 'de', // language to use
    resources: {
        en: common_en,
        de: common_de,
    },
});

ReactDOM.render(
    <I18nextProvider i18n={i18next}>
        <UserContextProvider>
            <App />
        </UserContextProvider>
    </I18nextProvider>,
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
