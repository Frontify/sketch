(function ($) {
    Tc.Module.Settings = Tc.Module.extend({
        init: function ($ctx, sandbox, id) {
            this._super($ctx, sandbox,  'c-settings-' + Tc.Module.Settings.count++);
            this.on();
        },

        on: function () {
            var $ctx = this.$ctx;

            this.settings = [];
            this.elems = [];
            this.active = false;
            this.$active = null;
            this.validator = null;

            this.sandbox.subscribe('events', this);
            this.sandbox.subscribe('tabs', this);

            // destroy old instance
            var settings = $ctx.data('settings');
            if (settings) {
                settings.destroy();
            }

            // apply setting logic
            this.setup();

            // setting activation
            $ctx.off('.settings');
            $ctx.on('click.settings', '.js-o-settings__setting', function (e) {
                var $item = $(e.currentTarget);
                this.enter($item);
            }.bind(this));

            // accordion
            $ctx.on('click.settings', '.js-o-settings__accordion-open', function (e) {
                var $item = $(e.currentTarget);
                var $container = $item.next('.js-o-settings__accordion-content');

                if ($container.hasClass('state-open')) {
                    $container.removeClass('state-open');
                }
                else {
                    $container.addClass('state-open');
                }
            }.bind(this));
        },

        setup: function () {
            var $ctx = this.$ctx;
            var isSetting = false;

            var $settings = $ctx.find('.js-o-settings__setting');
            $settings.each(function (index, setting) {
                isSetting = true;
                var $setting = $(setting);
                var id = $setting.data('id');

                if ($setting.data('setting')) {
                    this.settings.push({
                        id: id,
                        item: $setting.data('setting')
                    });
                    return;
                }

                // apply specific logic to the form elem
                var type = Tc.Utils.String.capitalize(Tc.Utils.String.toCamel($setting.data('type')));
                var item = new Tc.Setting[type](this, $setting, true);
                item.setting();

                $setting.data('setting', item);

                this.settings.push({
                    id: id,
                    item: item
                });
            }.bind(this));

            if(!isSetting) {
                var $elems = $ctx.find('.js-o-settings__elem');
                $elems.each(function (index, elem) {
                    var $elem = $(elem);
                    var id = $elem.data('id');

                    if ($elem.data('elem')) {
                        this.elems.push({
                            id: id,
                            item: $elem.data('elem')
                        });
                        return;
                    }

                    // apply specific logic to the form elem
                    var type = Tc.Utils.String.capitalize(Tc.Utils.String.toCamel($elem.data('type')));
                    var item = new Tc.Setting[type](this, $elem, false);
                    item.elem(false);

                    $elem.data('elem', item);

                    this.elems.push({
                        id: id,
                        item: item
                    });
                }.bind(this));
            }

            $ctx.data('settings', this);
        },

        validation: function (submitHandler, resetHandler) {
            var $ctx = this.$ctx;
            $ctx.on('reset', function () {
                $ctx.validate().resetForm();
                if ($.isFunction(resetHandler)) {
                    resetHandler();
                }
                else {
                    Tc.Setting.Base.prototype.hideDetails.apply(this).then(function () {
                        Tc.Setting.Base.prototype.hideActions.apply(this, [this.$actions]);
                    }.bind(this));
                }
            }.bind(this));

            var self = this;
            this.validator = $ctx.validate({
                onfocusout: false,
                submitHandler: function () {
                    Tc.Setting.Base.prototype.showLoader.apply(self);

                    if ($.isFunction(submitHandler)) {
                        submitHandler();
                    }
                },
                errorPlacement: Tc.Setting.Base.prototype.errorPlacement.bind(this),
                showErrors: function () {
                    if (this.numberOfInvalids() > 0) {
                        Tc.Setting.Base.prototype.showError.apply(self);
                    }
                    this.defaultShowErrors();
                }
            });
        },

        showErrors: function (errors) {
            if (!this.validator) {
                console.log('Validation not enabled for this settings instance');
            }
            else {
                this.validator.showErrors(errors);
                this.validator.focusInvalid();
            }

            Tc.Setting.Base.prototype.hideLoader.apply(this);
        },

        enter: function ($setting) {
            if (!this.active) {
                this.active = true;
                this.$active = $setting;
                $setting.removeClass('state-focus').addClass('state-active');
                this.getSetting($setting.data('id')).enter();
            }
            else {
                if (!$setting.is(this.$active)) {
                    this.$active.addClass('state-focus');
                    this.getSetting(this.$active.data('id')).unfocus($setting);
                }
            }
        },

        leave: function ($setting) {
            if (this.active) {
                this.active = false;
                this.$active = null;
                $setting.removeClass('state-focus state-active');
                this.getSetting($setting.data('id')).leave();
            }
        },

        next: function ($setting) {
            var id = $setting.data('id');
            var index = this.settings.findIndex(function (item) {
                return item.id === id;
            });

            if (this.settings[index + 1]) {
                this.enter(this.settings[index + 1].item.$ctx);
            }
        },

        prev: function ($setting) {
            var id = $setting.data('id');
            var index = this.settings.findIndex(function (item) {
                return item.id === id;
            });

            if (this.settings[index - 1]) {
                this.enter(this.settings[index - 1].item.$ctx);
            }
        },

        serialize: function () {
            var data = {};

            this.elems.forEach(function (item) {
                data = $.extend(true, {}, data, item.item.serialize());
            });

            this.settings.forEach(function (item) {
                data = $.extend(true, {}, data, item.item.serialize());
            });

            return data;
        },

        destroy: function () {
            this.elems.forEach(function (item) {
                if ($.isFunction(item.item.destroy)) {
                    item.item.destroy();
                }
            });

            this.settings.forEach(function (item) {
                if ($.isFunction(item.item.destroy)) {
                    item.item.destroy();
                }
            });
        },

        resize: function (offsetBottom) {
            var $ctx = this.$ctx;

            if (offsetBottom) {
                var height = parseInt($ctx.height());
                var offsetTop = $ctx.offset().top;

                if (height + offsetTop < offsetBottom) {
                    $ctx.height(offsetBottom - offsetTop);
                }
            }
            else {
                $ctx.css('height', 'auto');
            }
        },

        get: function (id) {
            var item = this.getSetting(id);
            if ($.isEmptyObject(item)) {
                item = this.getElem(id);
            }

            return item;
        },

        getSettings: function (id) {
           return this.settings.map(function(setting) {
                return setting.item;
           }.bind(this));
        },

        getActive: function () {
            if(this.$active) {
                var id = this.$active.data('id');
                var item = this.getSetting(id);
                if ($.isEmptyObject(item)) {
                    item = this.getElem(id);
                }

                return item;
            }

            return null;
        },

        getSetting: function (id) {
            var setting = this.settings.find(function (item) {
                return item.id === id;
            });

            if (!setting) {
                return {};
            }

            return setting.item;
        },

        getElem: function (id) {
            var elem = this.elems.find(function (item) {
                return item.id === id;
            });

            if (!elem) {
                return {};
            }

            return elem.item;
        },

        getFirstElem: function () {
            if (!this.elems[0]) {
                return {};
            }

            return this.elems[0].item;
        },

        onTabSwitched: function(data){
            var active = this.getActive();
            if(active) {
                if($.isFunction(active.onTabSwitched)) {
                    active.onTabSwitched(data);
                }
            }
        },

        getFirstSetting: function () {
            if (!this.settings[0]) {
                return {};
            }

            return this.settings[0].item;
        }
    });

    Tc.Module.Settings.count = 0;

}(Tc.$));
