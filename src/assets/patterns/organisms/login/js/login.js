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
            this.login();
        }.bind(this), function () {
            // noop
        }.bind(this));
    },

    login: function() {
        var urlParams = '/api/oauth/authorize?response_type=token&client_id=sketch&redirect_uri=https://frontify.com/sketchplugin';

        var addHttps = function (url) {
            const pattern = /^(ht)tps?:\/\//i;
            if (!pattern.test(url)) {
             url = "https://" + url;
            }

            return url;
        };

        var domain = addHttps(this.settings.serialize().domain);

        pluginCall('memorizeDomain', domain);

        window.location.href = domain + urlParams;
    }

});
