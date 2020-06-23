import fetch from 'sketch-polyfill-fetch';

class OAuth {
    constructor() {
        this.sessionId = '';
        this.domain = '';
        this.secret = '';
        this.challengeCode = '';
        this.accessToken = null;
    }

    static CLIENT_ID() {
        return 'sketch';
    }

    static REDIRECT_URI() {
        return 'https://frontify.com/sketchplugin';
    }

    static GRANT_TYPE() {
        return 'authorization_code';
    }

    static POST_HEADERS() {
        return { 'Content-Type': 'application/json' };
    }

    static REQUEST_METHOD_POST() {
        return 'POST';
    }

    static REQUEST_METHOD_GET() {
        return 'GET';
    }

    async authorize(domain) {
        this.domain = domain;

        const url = `${domain}/api/oauth/create/session`;
        const options = { method: OAuth.REQUEST_METHOD_POST() };
        let hasError = false;
        let error = null;

        const response = await fetch(url, options);
        const json = await response.json();
        this.sessionId = json.data.key;
        await this.getSecretAndChallengeCode();
        this.openBrowser();

        try {
            const authorizationCode = await this.pollAuthorizationCode();
            this.accessToken = await this.getAccessTokenByAuthorizationCode(authorizationCode);
        } catch (errorMessage) {
            hasError = true;
            error = errorMessage;
        }

        return {
            accessToken: this.accessToken,
            hasError,
            error,
        };
    }

    async getSecretAndChallengeCode() {
        const url = `${this.domain}/api/oauth/random`;
        const options = { method: OAuth.REQUEST_METHOD_GET() };
        const response = await fetch(url, options);
        const json = await response.json();

        this.secret = json.data.secret;
        this.challengeCode = json.data.sha256;
    }

    openBrowser() {
        const parameters = {
            response_type: 'code',
            client_id: OAuth.CLIENT_ID(),
            scope: 'api:v1',
            code_challenge_method: 'S256',
            code_challenge: this.challengeCode,
            redirect_uri: OAuth.REDIRECT_URI(),
            session_id: this.sessionId,
        };

        const url_params = [];

        for (const name in parameters) {
            const value = encodeURI(parameters[name]);
            url_params.push(`${name}=${value}`);
        }

        const url = `${this.domain}/api/oauth/authorize?${url_params.join('&')}`;

        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
    }

    async getAuthorizationCode() {
        const url = `${this.domain}/api/oauth/poll`;
        const options = {
            method: 'POST',
            headers: OAuth.POST_HEADERS(),
            body: JSON.stringify({ session_id: this.sessionId }),
        };

        const response = await fetch(url, options);
        const json = await response.json();

        if (json.data && json.data.payload.code) {
            return json.data.payload.code;
        }

        return false;
    }

    async pollAuthorizationCode() {
        const maxAttempts = 30;
        const pollingInterval = 2 * 1000;
        let attempts = 0;

        const executePoll = async (resolve, reject) => {
            const result = await this.getAuthorizationCode();
            attempts++;

            if (result) {
                return resolve(result);
            } else if (maxAttempts && attempts === maxAttempts) {
                return reject(new Error('Exceeded max attempts'));
            } else {
                setTimeout(executePoll, pollingInterval, resolve, reject);
            }
        };

        return new Promise(executePoll);
    }

    async getAccessTokenByAuthorizationCode(authorizationCode) {
        const url = `${this.domain}/api/oauth/accesstoken`;
        const options = {
            method: OAuth.REQUEST_METHOD_POST(),
            headers: OAuth.POST_HEADERS(),
            body: JSON.stringify({
                grant_type: OAuth.GRANT_TYPE(),
                code: authorizationCode,
                client_id: OAuth.CLIENT_ID(),
                redirect_uri: OAuth.REDIRECT_URI(),
                code_verifier: this.secret,
            }),
        };

        const response = await fetch(url, options);
        const json = await response.json();

        if (json.error || json.success === false) {
            throw new Error(json.error);
        }

        return json.access_token;
    }
}

export default new OAuth();
