import React from 'react';
import ReactDOM from 'react-dom';
import { Window } from './components/Window';

// Context
import { UserContextProvider } from './context/UserContext';

// i18n
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import common_de from './translations/de.json';
import common_en from './translations/en.json';

/**
 * i18n:
 * ----------------------------------------------------------------------------
 * Todo:
 *
 * 1. Make sure that everything is translated.
 * 2. Automatically detect the user language and use it as a default.
 * 3. Implement a language switcher (?)
 *
 */

i18next.init({
    interpolation: { escapeValue: false }, // React already does escaping
    lng: 'en', // language to use
    resources: {
        en: common_en,
        de: common_de,
    },
});

ReactDOM.render(
    <I18nextProvider i18n={i18next}>
        <UserContextProvider>
            <Window />
        </UserContextProvider>
    </I18nextProvider>,
    document.getElementById('root')
);

/**
 * Communication with the Sketch backend:
 * ----------------------------------------------------------------------------
 *
 * Usually, this low level method is not called directly.
 *
 * Instead, there’s a React hook "useSketch()" that can be used instead.
 *
 * The advantage of the hook is that is also provides a callback/reply
 * mechanism. With it, you can not only send messages to Sketch, but
 * rather request information.
 *
 */

window.send = (data) => {
    // create and dispatch the event including the data
    var event = new CustomEvent('message-from-sketch', {
        detail: {
            data,
        },
    });
    window.dispatchEvent(event);
};
