import fetch from 'sketch-polyfill-fetch'
import child_process from '@skpm/child_process'
import createHash from 'create-hash'

function fetchSessionId(domain) {
    console.log(domain + '/api/oauth/generate/sessionid');

    return new Promise((resolve, reject) => {
        fetch(domain + '/api/oauth/generate/sessionid', {
            method: 'GET',
        })
            .then(response => {
                response
                    .json()
                    .then(json => {
                        resolve(json.session_id)
                    });
            })
            .catch(error => {
                reject(error)
            })
    })
}

function generateUrl(url, queryParams) {
    const queryParamsString = Object.keys(queryParams).map(function(key) {
        return [key, queryParams[key]].map(encodeURIComponent).join("=");
    }).join("&");

    return url + '?' + queryParamsString;
}

function base64URLEncode(str) {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

function sha256(buffer) {
    return createHash('sha256').update(buffer).digest()
}

function generateVerifier() {
    child_process.exec('openssl rand -base64 32', function (error, stdout, stderr) {
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

function generateChallengeCodeFromVerifier(verifier) {
    return base64URLEncode(sha256(verifier))
}

export {
    generateUrl,
    fetchSessionId,
    generateChallengeCodeFromVerifier,
    generateVerifier
}
