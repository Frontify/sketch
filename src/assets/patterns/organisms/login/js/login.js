import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Login = Tc.Module.extend({
    on: function(callback) {
        var $ctx = this.$ctx;
        this.settings = null;

        this.render();

        $ctx.on('click', '.js-o-login__link', function(e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.attr('href');

            pluginCall('openUrl', url, true);
        }.bind(this));

        callback();
    },

    render: function() {
        var $ctx = this.$ctx;
        $ctx.html(window.tpl.login());

        this.settings = new Tc.Module.Settings($ctx.find('.js-o-login__form'), this.sandbox);
        this.settings.validation(function () {
            var domain = this.sanitizeUrl(this.settings.serialize().domain);
            var blacklist = ['https://app.frontify.com'];

            var permitted = true;
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
        var urlParams = '/api/oauth/authorize?response_type=token&client_id=sketch&redirect_uri=https://frontify.com/sketchplugin';
        pluginCall('memorizeDomain', domain);
        window.location.href = domain + urlParams;
    },

    sanitizeUrl: function(url) {
        // protocol
        var pattern = /^(ht)tps?:\/\//i;
        if (!pattern.test(url)) {
            url = "https://" + url;
        }

        // strip path
        var parts = url.split('/');
        url = parts.slice(0, 3).join('/');

        return url;
    }

});
