import writeJSON from '../helpers/writeJSON'
import readJSON from '../helpers/readJSON'
import fetch from '../helpers/fetch'
import notification from './notification';

var threadDictionary = NSThread.mainThread().threadDictionary();

class User {
    constructor() {
    }

    isAuthenticated() {
        var token = readJSON('token');

        return token && token.access_token;
    }

    getUser() {
        if (threadDictionary['frontifyuser']) {
            return Promise.resolve(threadDictionary['frontifyuser']);
        }
        return fetch('/v1/user/info/').then(function(data) {
            if(data.success) {
                threadDictionary['frontifyuser'] = data;
            }

            return data;
        }.bind(this));
    }

    logout() {
        return Promise.resolve().then(function () {
            return fetch('/v1/user/logout/').then(function( ) {
                writeJSON('token', {});
                writeJSON('target', {});
                threadDictionary.removeObjectForKey('frontifyuser');

                // disconnect from pusher
                notification.disconnect();

                return true;
            }.bind(this));
        }.bind(this));
    }

    login(data) {
        writeJSON('token', data);
    }
}

export default new User();

