import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Target = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        $ctx.on('click', '.js-m-target__change-project', function(e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            this.fire('openModal', { modifier: 'default', closeable: false, $content: $(window.tpl.loader())}, ['events']);
            this.fire('closeDropdown', $this.closest('.js-m-btn-dropdown__menu'), ['events']);
            pluginCall('changeProject');
        }.bind(this));

        $ctx.on('click', '.js-m-target__help', function(e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            this.fire('closeDropdown', $this.closest('.js-m-btn-dropdown__menu'), ['events']);
            pluginCall('openUrl', $this.attr('href'), true);
        }.bind(this));

        $ctx.on('click', '.js-m-target__logout', function(e) {
            e.preventDefault();
            pluginCall('logout');
        }.bind(this));

        callback();
    },

    render: function (data) {
        var $ctx = this.$ctx;

        if(!data) {
            $ctx.html(window.tpl.targetblank(data));
        }
        else {
            $ctx.html(window.tpl.target(data));
        }
    }
});