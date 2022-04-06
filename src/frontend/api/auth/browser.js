import { oauth } from '../../api/oauth';

// randombytes only works when monkey patching some globals in index.html
import randomBytes from 'randombytes';

export async function browser(domain) {
    let error = '';

    let authData = {
        sessionID: null,
        url: null,
        challengeCode: null,
        verifier: null,
    };

    if (domain) {
        // Sanitize the domain and make sure it has https in it
        let sanitizedDomain = sanitizeURL(domain).trim();
        authData.domain = sanitizedDomain;
        let response = await oauth.session(authData);

        if (response && response.success) {
            // Proof Key for Code Exchange (PKCE)
            const verifier = await base64URLEncode(await randomBytes(32));
            let hashedVerifier = await sha256(verifier);
            const challenge = base64URLEncode(hashedVerifier);

            const sessionID = response.session_id;
            const challengeMethod = 'S256';
            const scope = 'basic%3Aread';
            const clientID = 'figma';
            const responseType = 'code';

            const url = `${sanitizedDomain}/api/oauth/authorize/session?response_type=${responseType}&client_id=${clientID}&scope=${scope}&code_challenge=${challenge}&code_challenge_method=${challengeMethod}&session_id=${sessionID}`;

            // Open a browser window
            // window.open(url);

            // Remember all the information for later requests
            authData.sessionID = response.session_id;
            authData.url = url;
            authData.challengeCode = challenge;
            authData.verifier = verifier;

            error = '';
            // context.rootState.router.push({
            //     name: 'pending',
            // });
        } else {
            error = 'error.domain';
        }
    }
}

function sanitizeURL(url) {
    // protocol
    let pattern = /^(ht)tps?:\/\//i;
    if (!pattern.test(url)) {
        url = 'https://' + url;
    }
    // strip path
    let parts = url.split('/');
    url = parts.slice(0, 3).join('/');
    return url;
}

function base64URLEncode(str) {
    return str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function sha256(buffer) {
    // return createHash('sha256').update(buffer).digest();
    return await hash(buffer);
}

// The npm package "create-hash" wasn’t working because of missing Node built-ins that
// aren’t available with Vite (and newer Webpack versions?).
async function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((bytes) => bytes.toString(16).padStart(2, '0')).join('');
        return hashHex;
    });
}
