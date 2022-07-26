import readJSON from './readJSON';
import extend from '../helpers/extend';
import fetch from 'sketch-polyfill-fetch';
import user from '../model/user';
let sketch3 = require('sketch');

export default function (uri, options) {
    // get token
    let { token, domain } = user.getAuthentication();

    let defaults = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + token,
        },
    };

    options = extend({}, defaults, options);

    if (!options.cdn) {
        uri = domain + uri;
    }

    return fetch(uri, options)
        .then(
            function (response) {
                let contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                }

                if (contentType && (contentType.includes('text/html') || contentType.includes('image/svg+xml'))) {
                    return response.text();
                }

                throw new TypeError('Invalid response');
            }.bind(this)
        )
        .catch(
            function (e) {
                // whitelist uris
                if (uri.indexOf('/v1/user/logout') > -1) {
                    return '';
                }

                if (e.localizedDescription) {
                    console.error(e.localizedDescription);
                } else {
                    console.error(e);
                }

                throw e;
            }.bind(this)
        );
}
