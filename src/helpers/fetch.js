import fetch from 'sketch-polyfill-fetch'
import readJSON from './readJSON'
import extend from '../helpers/extend'

export default function(uri, options) {
    // get token
    var token = readJSON('token');
    var defaults = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token.access_token,
        }
    };

    options = extend({}, defaults, options);

    return fetch(token.domain + uri, options).then(function(response) {
        var contentType = response.headers.get("content-type");
        if(contentType && contentType.includes("application/json")) {
          return response.json();
        }

        var contentDisposition = response.headers.get("content-disposition");
        if(contentDisposition && contentDisposition.indexOf('attachment') !== false) {
            return response.blob();
        }

        throw new TypeError("Oops, we haven't got JSON!");
    }.bind(this)).catch(function(err) {
        if(err.localizedDescription) {
            console.error(err.localizedDescription);
        }
        else {
            console.error(err);
        }
    }.bind(this));
}