import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Colors = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        this.palettes = {};

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


        $ctx.on('click', '.js-m-color__learn', function (e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.data('url');
            if (url) {
                pluginCall('openUrl', url, true);
            }
        }.bind(this));

        $ctx.on('click', '.js-m-color__styleguide', function (e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.data('url');
            if (url) {
                pluginCall('openUrl', url);
            }
        }.bind(this));

        // Add / replace colors
        $ctx.on('click', '.js-m-colors__document-add', function (e) {
            var id = $(e.currentTarget).closest('.js-m-colors__palette').data('id');
            var colors = this.getColors(id);
            this.showSuccess(id);
            pluginCall('addDocumentColors', colors);
        }.bind(this));

        $ctx.on('click', '.js-m-colors__document-replace', function (e) {
            var id = $(e.currentTarget).closest('.js-m-colors__palette').data('id');
            var colors = this.getColors(id);
            this.showSuccess(id);
            pluginCall('replaceDocumentColors', colors);
        }.bind(this));

        $ctx.on('click', '.js-m-colors__global-add', function (e) {
            var id = $(e.currentTarget).closest('.js-m-colors__palette').data('id');
            var colors = this.getColors(id);
            this.showSuccess(id);
            pluginCall('addGlobalColors', colors);
        }.bind(this));

        $ctx.on('click', '.js-m-colors__global-replace', function (e) {
            var id = $(e.currentTarget).closest('.js-m-colors__palette').data('id');
            var colors = this.getColors(id);
            this.showSuccess(id);
            pluginCall('replaceGlobalColors', colors);
        }.bind(this));

        // expand / collapse button visibility
        $ctx.on('mouseenter', '.js-m-colors__desc-wrap', function (e) {
            var $this = $(e.currentTarget);

            // hide all
            $ctx.find('.js-m-colors__expand, .js-m-colors__collapse').removeClass('state-visible');

            var $expand = $this.find('.js-m-colors__expand');
            var $collapse = $this.find('.js-m-colors__collapse');

            if ($this.hasClass('state-collapsed')) {
                if (parseInt($this.height()) > 13) {
                    $collapse.hide();
                    $expand.show();
                    setTimeout(function () {
                        $expand.addClass('state-visible');
                    }, 18);
                }
            }
            else {
                $expand.hide();
                $collapse.show();

                setTimeout(function () {
                    $collapse.addClass('state-visible');
                }, 18);
            }
        }.bind(this));

        $ctx.on('mouseleave', '.js-m-colors__desc-wrap', function (e) {
            var $this = $(e.currentTarget);
            var $expand = $this.find('.js-m-colors__expand, .js-m-colors__collapse');
            $expand.removeClass('state-visible');
        }.bind(this));

        $ctx.on('click', '.js-m-colors__expand', function (e) {
            var $this = $(e.currentTarget);
            $this.removeClass('state-visible');
            $this.closest('.js-m-colors__desc-wrap').removeClass('state-collapsed');
        }.bind(this));

        $ctx.on('click', '.js-m-colors__collapse', function (e) {
            var $this = $(e.currentTarget);
            $this.removeClass('state-visible');
            $this.closest('.js-m-colors__desc-wrap').addClass('state-collapsed');
        }.bind(this));

        callback();
    },

    showSuccess: function (id) {
        var $ctx = this.$ctx;
        var $palette = $ctx.find('.js-m-colors__palette[data-id=' + id + ']');
        var $btn = $palette.find('.js-m-colors__toggle');
        var $icon = $btn.find('.js-m-colors__add');
        this.fire('closeDropdown', $btn, ['events']);
        $btn.velocity({color: '#A3CE62'}, {
            duration: 200, complete: function () {
                $icon.removeClass('fi-plus').addClass('fi-checkmark-circle');
                $btn.velocity('reverse', {
                    duration: 200, delay: 400, complete: function () {
                        $icon.removeClass('fi-checkmark-circle').addClass('fi-plus');
                    }
                });

            }
        });
    },

    getColors: function (id) {
        return this.palettes[id].colors;
    },

    render: function (data) {
        var $ctx = this.$ctx;
        this.palettes = data.palettes;
        $ctx.html(window.tpl.colorslist(data));
    },

    onTabSwitched(data) {
        if (data.id === 'colors') {
            this.$ctx.html(window.tpl.loaderspinner());
            pluginCall('showColors');
        }
    }
});