import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Toolbar = Tc.Module.extend({
    on: function(callback) {
        var $ctx = this.$ctx;

        $ctx.on('click', '.js-m-toolbar__login', function() {
            pluginCall('showLogin')
        }.bind(this));

        $ctx.on('click', '.js-m-toolbar__profile', function() {
            pluginCall('showProfile')
        }.bind(this));

        $ctx.on('click', '.js-m-toolbar__artboards', function() {
            pluginCall('showArtboards')
        }.bind(this));

        $ctx.on('click', '.js-m-toolbar__sources', function() {
            pluginCall('showSources')
        }.bind(this));

        callback();
    },

    renderUser: function(user) {
        var $ctx = this.$ctx;

        var $user = $ctx.find('.js-m-toolbar__user');
        $user.html(window.tpl.toolbaruser(user));
    }
});