import writeJSON from '../helpers/writeJSON'
import readJSON from '../helpers/readJSON'
import fetch from '../helpers/fetch'

class User {
    constructor() {
        this.context = null;
    }

    setContext(context) {
        this.context = context;
    }

    isAuthenticated() {
        var token = readJSON(this.context, 'token');

        return token && token.access_token;
    }

    getUser() {
        return fetch(this.context, '/v1/user/info/');
    }

    logout() {
        return Promise.resolve().then(function () {
            return fetch(this.context, '/v1/user/logout/').then(function( ) {
                writeJSON(this.context, 'token', {});
                return true;
            }.bind(this));
        }.bind(this));
    }

    login(data) {
        writeJSON(this.context, 'token', data);
    }
}

export default new User();

