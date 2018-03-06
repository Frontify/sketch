import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Colors = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        $ctx.html(window.tpl.loader());

        $ctx.on('click', '.js-m-colors__color', function (e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);

            var color = {
                r: $this.data('color-r'),
                g: $this.data('color-g'),
                b: $this.data('color-b'),
                a: $this.data('color-a')
            };

            pluginCall('applyColor', color);
        }.bind(this));


        $ctx.on('click', '.js-m-color__learn', function(e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.data('url');
            if(url) {
                pluginCall('openUrl', url, true);
            }
        }.bind(this));

        $ctx.on('click', '.js-m-color__styleguide', function(e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.data('url');
            if(url) {
                pluginCall('openUrl', url);
            }
        }.bind(this));

        callback();
    },

    render: function (data) {
        var $ctx = this.$ctx;
        $ctx.html(window.tpl.colorslist(data));
    },

    onTabSwitched(data) {
        if(data.id === 'colors') {
            this.$ctx.html(window.tpl.loader());
            pluginCall('showColors');
        }
    }
});