import fetch from 'sketch-polyfill-fetch';

class OAuth {
    constructor() {
        this.sessionId = '';
        this.oAuthSecret = '';
        this.domain = '';
    }

    async beginOauthFlow(domain) {
        const url = `${domain}/api/oauth/create/session`;
        const options = {
            method: 'POST'
        };

        const response = await fetch(url, options);
        const json = await response.json();
        this.sessionId = json.data.key;

        console.log(this.sessionId);
    }

    async generateSecret() {

    }
}

export default new OAuth();
