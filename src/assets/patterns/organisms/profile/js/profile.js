import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Profile = Tc.Module.extend({
    on: function(callback) {
        var $ctx = this.$ctx;

        $ctx.on('click', '.js-o-profile__logout', function() {
            pluginCall('logout')
        }.bind(this));

        callback();
    }
});
