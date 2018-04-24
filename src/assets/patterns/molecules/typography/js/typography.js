import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Typography = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        this.groups = null;
        this.colors = null;

        // Add / replace font styles
        $ctx.on('click', '.js-m-typography__styles-add', function (e) {
            var id = $(e.currentTarget).closest('.js-m-typography__group').data('id');
            var fontStyles = this.getFontStyles(id);
            this.showSuccess(id);
            pluginCall('addFontStyles', fontStyles);
        }.bind(this));

        // Apply font style
        $ctx.on('click', '.js-m-typography__style', function(e) {
            var $this = $(e.currentTarget);
            var fontStyle = $.extend(true, {}, this.getFontStyle($this.data('group'), $this.data('id')));

            // reduce colors to current selected color
            var currentColor = $this.data('color');
            if(fontStyle.colors && fontStyle.colors.foreground && currentColor) {
                for (var id in fontStyle.colors.foreground) {
                   if (fontStyle.colors.foreground.hasOwnProperty(id)) {
                       if(currentColor != id) {
                           delete fontStyle.colors.foreground[id];
                       }
                   }
               }
            }
            pluginCall('applyFontStyle', fontStyle);
        }.bind(this));

        // change preview color
        $ctx.on('click', '.js-m-typography__color', function (e) {
            e.stopPropagation();
            var $this = $(e.currentTarget);
            var color = this.getColor($this.data('id'));
            var $style = $this.closest('.js-m-typography__style');
            var $example = $style.find('.js-m-typography__example');
            var $colors = $style.find('.js-m-typography__color');

            if(color.light) {
                $style.addClass('state-light');
            }
            else {
                $style.removeClass('state-light');
            }

            $style.data('color', $this.data('id'));
            $colors.removeClass('state-active');
            $this.addClass('state-active');
            $example.css({ color: color.css_value });
        }.bind(this));

        // expand / collapse button visibility
        $ctx.on('mouseenter', '.js-m-typography__desc-wrap', function (e) {
            var $this = $(e.currentTarget);

            // hide all
            $ctx.find('.js-m-typography__expand, .js-m-typography__collapse').removeClass('state-visible');

            var $expand = $this.find('.js-m-typography__expand');
            var $collapse = $this.find('.js-m-typography__collapse');

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

        $ctx.on('mouseleave', '.js-m-typography__desc-wrap', function (e) {
            var $this = $(e.currentTarget);
            var $expand = $this.find('.js-m-typography__expand, .js-m-typography__collapse');
            $expand.removeClass('state-visible');
        }.bind(this));

        $ctx.on('click', '.js-m-typography__expand', function (e) {
            var $this = $(e.currentTarget);
            $this.removeClass('state-visible');
            $this.closest('.js-m-typography__desc-wrap').removeClass('state-collapsed');
        }.bind(this));

        $ctx.on('click', '.js-m-typography__collapse', function (e) {
            var $this = $(e.currentTarget);
            $this.removeClass('state-visible');
            $this.closest('.js-m-typography__desc-wrap').addClass('state-collapsed');
        }.bind(this));


        $ctx.on('click', '.js-m-typography__learn', function (e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.data('url');
            if (url) {
                pluginCall('openUrl', url, true);
            }
        }.bind(this));

        $ctx.on('click', '.js-m-typography__styleguide', function (e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.data('url');
            if (url) {
                pluginCall('openUrl', url);
            }
        }.bind(this));


        callback();
    },

    render: function (data) {
        var $ctx = this.$ctx;
        this.groups = data.groups;
        this.colors = data.colors;
        $ctx.html(window.tpl.typographylist(data));
    },

    showSuccess: function (id) {
        var $ctx = this.$ctx;
        var $group = $ctx.find('.js-m-typography__group[data-id=' + id + ']');
        var $btn = $group.find('.js-m-typography__toggle');
        var $icon = $btn.find('.js-m-typography__add');
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

    getFontStyles: function (id) {
        return this.groups[id].styles;
    },

    getFontStyle: function(group, id) {
        return this.getFontStyles(group).find(function(style) {
            return style.id == id;
        });
    },

    getColor: function(id) {
        return this.colors[id];
    },

    onTabSwitched(data) {
        if (data.id === 'typography') {
            this.$ctx.html(window.tpl.loaderspinner());
            pluginCall('showTypography');
        }
    }
});