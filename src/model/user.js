import writeJSON from '../helpers/writeJSON';
import readJSON from '../helpers/readJSON';
import fetch from '../helpers/fetch';
import notification from './notification';
import target from './target';
const Settings = require('sketch/settings');

let threadDictionary = NSThread.mainThread().threadDictionary();

class User {
    constructor() {}

    getAuthentication() {
        if (this.isAuthenticated()) {
            return {
                domain: Settings.settingForKey('domain'),
                token: Settings.settingForKey('token'),
            };
        }
    }
    isAuthenticated() {
        let domain = Settings.settingForKey('domain');
        let token = Settings.settingForKey('token');

        console.log(domain, token);

        return domain && token;
    }

    getUser() {
        if (threadDictionary['frontifyuser']) {
            return Promise.resolve(threadDictionary['frontifyuser']);
        }
        return fetch('/v1/user/info/').then(
            function (data) {
                if (data.success) {
                    threadDictionary['frontifyuser'] = data;
                }

                return data;
            }.bind(this)
        );
    }

    logout() {
        console.log('LOGOUT IN SKETCH');
        // Previously, the API endpoint "logout" was called but we’ve removed it.
        return new Promise((resolve, reject) => {
            Settings.setSettingForKey('domain', null);
            Settings.setSettingForKey('token', null);

            threadDictionary.removeObjectForKey('frontifyuser');

            // disconnect from pusher
            notification.disconnect();

            resolve();
        });
    }

    login(data) {
        Settings.setSettingForKey('domain', data.domain);
        Settings.setSettingForKey('token', data.access_token);
        return Promise.resolve().then(
            function () {
                console.log(data);

                return notification.listen();
            }.bind(this)
        );
    }
}

export default new User();
