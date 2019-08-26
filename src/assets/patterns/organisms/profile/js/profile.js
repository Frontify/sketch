Tc.Module.Profile = Tc.Module.extend({
    on: function(callback) {
        let $ctx = this.$ctx;

        $ctx.on('click', '.js-o-profile__logout', function() {
            window.postMessage('logout')
        }.bind(this));

        callback();
    }
});
