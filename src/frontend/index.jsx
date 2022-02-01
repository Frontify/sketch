import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';

(() => {
    ReactDOM.render(<App />, document.getElementById('root'));
})();

/**
 * Messaging
 */

window.sendData = (data) => {
    // create and dispatch the event including the data
    var event = new CustomEvent('send-data', {
        detail: {
            data,
        },
    });
    window.dispatchEvent(event);
};
