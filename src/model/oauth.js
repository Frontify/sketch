import fetch from 'sketch-polyfill-fetch';

class OAuth {
    constructor() {
        this.sessionId = '';
        this.domain = '';
        this.secret = '';
        this.challengeCode = '';
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

    async beginOauthFlow(domain) {
        this.domain = domain;

        const url = `${domain}/api/oauth/create/session`;
        const options = { method: OAuth.REQUEST_METHOD_POST() };

        const response = await fetch(url, options);
        const json = await response.json();
        this.sessionId = json.data.key;
        await this.getSecretAndChallengeCode();
        this.openBrowser();

        // TODO: complete by polling or user click
        setTimeout(() => this.completeAuthorization().then(), 10000);
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
            challenge_code_method: 'S256',
            code_challenge: this.challengeCode,
            redirect_uri: OAuth.REDIRECT_URI(),
            session_id: this.sessionId
        };

        const url_params = [];

        for (const name in parameters) {
            const value = encodeURI(parameters[name]);
            url_params.push(`${name}=${value}`);
        }

        const url = `${this.domain}/api/oauth/authorize?${url_params.join('&')}`;

        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
    }

    async completeAuthorization() {
        let url = `${this.domain}/api/oauth/poll`;
        let options = {
            method: 'POST',
            headers: OAuth.POST_HEADERS(),
            body: JSON.stringify({session_id: this.sessionId })
        };

        let response = await fetch(url, options);
        let json = await response.json();
        const code = json.data.payload.code;

        // TODO: split into separated functions
        url =`${this.domain}/api/oauth/accesstoken`;
        options = {
            method: OAuth.REQUEST_METHOD_POST(),
            headers: OAuth.POST_HEADERS(),
            body: JSON.stringify({
                grant_type: OAuth.GRANT_TYPE(),
                code,
                client_id: OAuth.CLIENT_ID(),
                redirect_uri: OAuth.REDIRECT_URI(),
                code_verifier: this.secret
            })
        };

        response = await fetch(url, options);
        json = await response.json();

        console.log(json);
    }
}

export default new OAuth();
