import {getSessionId, generateVerifier, generateChallengeCodeFromVerifier, generateUrl} from "../../../../../helpers/login";

Tc.Module.Login = Tc.Module.extend({
    on: function(callback) {
        let $ctx = this.$ctx;
        this.settings = null;

        this.render();

        $ctx.on('click', '.js-o-login__link', function(e) {
            e.preventDefault();
            let $this = $(e.currentTarget);
            let url = $this.attr('href');

            window.postMessage('openUrl', url, true);
        }.bind(this));

        callback();
    },

    render: function() {
        let $ctx = this.$ctx;
        $ctx.html(window.tpl.login());

        this.settings = new Tc.Module.Settings($ctx.find('.js-o-login__form'), this.sandbox);
        this.settings.validation(function () {
            let domain = this.sanitizeUrl(this.settings.serialize().domain);
            let blacklist = ['https://app.frontify.com'];

            let permitted = true;
            blacklist.forEach(function(item) {
                if(item.startsWith(domain)) {
                    permitted = false;
                }
            }.bind(this));

            if(!permitted) {
                this.settings.showErrors({ domain: 'Please use your dedicated Frontify domain'})
            }
            else {
                this.login(domain);
            }
        }.bind(this), function () {
            // noop
        }.bind(this));
    },

    login: function(domain) {
        window.postMessage('memorizeDomain', domain);
        getSessionId(domain)
            .then(sessionId => {

                console.log('Generated session id: ', sessionId)
                const verifier = generateVerifier()
                const challengeCode = generateChallengeCodeFromVerifier(verifier)

                console.log('Verifier: ', verifier)
                const url = generateUrl('/api/oauth/authorize', {
                    response_type : 'code',
                    client_id: 'sketch',
                    scope: 'api:v1',
                    code_challenge_method: 'S256',
                    code_challenge: challengeCode,
                    redirect_uri: 'https://frontify.com/sketchplugin',
                    session_id: sessionId
                });

                console.log('URL', url);
                console.log('Domain', domain);
                //const urlParams = '/api/oauth/authorize?response_type=token&client_id=sketch&redirect_uri=https://frontify.com/sketchplugin'
                //window.location.href = domain + urlParams
            });
    },

    sanitizeUrl: function(url) {
        // protocol
        let pattern = /^(ht)tps?:\/\//i;
        if (!pattern.test(url)) {
            url = "https://" + url;
        }

        // strip path
        let parts = url.split('/');
        url = parts.slice(0, 3).join('/');

        return url;
    }

});
