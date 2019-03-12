Tc.Module.Toolbar = Tc.Module.extend({
    on: function(callback) {
        var $ctx = this.$ctx;

        $ctx.on('click', '.js-m-toolbar__login', function() {
            window.postMessage('showLogin')
        }.bind(this));

        $ctx.on('click', '.js-m-toolbar__profile', function() {
            window.postMessage('showProfile')
        }.bind(this));

        $ctx.on('click', '.js-m-toolbar__artboards', function() {
            window.postMessage('showArtboards')
        }.bind(this));

        $ctx.on('click', '.js-m-toolbar__sources', function() {
            window.postMessage('showSources')
        }.bind(this));

        callback();
    },

    renderUser: function(user) {
        var $ctx = this.$ctx;

        var $user = $ctx.find('.js-m-toolbar__user');
        $user.html(window.tpl.toolbaruser(user));
    }
});
