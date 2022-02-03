import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import { BrowserRouter } from 'react-router-dom';
import { UserContextProvider } from './UserContext';

import { browser } from './api/auth/browser';

async function init() {
    let auth = {
        accessToken: 'Gvzh9ju6DatSnANhFvDKnTubcHE5TXLVz2ux1oor',
        domain: 'https://company-136571.frontify.com',
    };

    browser(auth.domain);

    // let query = `{
    //         current_user: currentUser {
    //           name
    //           id
    //           email
    //           avatar
    //         }
    //         }`;

    // let { data } = await queryGraphQLWithAuth({ query, auth });
    // console.log(data);
    // console.log(UserContextProvider);
}
init();

async function queryGraphQLWithAuth({ query, auth }) {
    let response = await fetch(`${auth.domain}/graphql`, {
        method: 'post',
        headers: {
            Authorization: 'Bearer ' + auth.accessToken,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: query.replace(/(\r\n|\n|\r)/gm, ''),
        }),
    });

    let result = await response.json();
    return result;
}

ReactDOM.render(
    <UserContextProvider>
        <BrowserRouter>
            <App />
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
