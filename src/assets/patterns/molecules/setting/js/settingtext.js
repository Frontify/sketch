Tc.Setting.Text = Tc.Setting.Base.extend({
    elem: function() {
        let $ctx = this.$ctx;

        this.$text = $ctx.find('.js-m-setting__input');
        this.initialValue = this.$text.val();
        this.readonly = this.$text.is('[readonly]');

        if(this.$text.is('textarea')) {
            autosize(this.$text);
        }

        if (this.$text.is('[data-mask]')) {
            // special selector needed to make mask plugin work
            this.$text.addClass('js-m-setting__input-' + this.id);
            $ctx.find('.js-m-setting__input-' + this.id).mask('' + this.$text.data('mask'));
        }

        this.$text.on('change', function (e) {
            if (!this.readonly && $.isFunction(this.changed)) {
                this.changed($(e.currentTarget).val());
            }
        }.bind(this));

        this.$text.on('focus', function (e) {
           if (!this.readonly && $.isFunction(this.changed)) {
               this.focus();
           }
        }.bind(this));

        this.$text.on('keyup', $.debounce(200, function (e) {
            if (!this.readonly && $.isFunction(this.changed)) {
                this.changed($(e.currentTarget).val());
            }
        }.bind(this)));

        $ctx.on('focusin', '.js-m-setting__bar', function (e) {
            if (!this.readonly) {
                $(e.currentTarget).addClass('state-active');
            }
        }.bind(this)).on('focusout', '.js-m-setting__bar', function (e) {
            if (!this.readonly) {
                $(e.currentTarget).removeClass('state-active');
            }
        }.bind(this));
    },

    setting: function () {
        this.elem();

        let $ctx = this.$ctx;
        this.hasChanged = false;

        this.$text.on('keyup change', function() {
            if(this.initialValue !== this.$text.val()) {
                this.hasChanged = true;
            }
            else {
                this.hasChanged = false;
            }
        }.bind(this));

        // tab handling
        $ctx.on('keydown', function(e) {
            if (this.active && e.which === 9) {
                e.preventDefault();
                $ctx.trigger('submit');

                if(e.shiftKey) {
                    this.mod.prev($ctx);
                }
                else {
                    this.mod.next($ctx);
                }
            }
        }.bind(this));

        $ctx.on('reset', function(e) {
            e.preventDefault();
            this.$text.val(this.initialValue);

            this.hasChanged = false;

            if($.isFunction(this.cancel)) {
                this.cancel(this.serialize());
            }
        }.bind(this));

        // setup validation
        this.validation(function() {
            if(this.hasChanged) {
                this.save().then(function(data) {
                    if($.isFunction(this.saved)) {
                        this.saved(data);
                    }

                    if(data.success) {
                        this.initialValue = this.$text.val();
                        this.mod.leave($ctx);
                        this.showSuccess();
                    }
                    else if(data.errors) {
                        this.showErrors(data.errors);
                    }
                }.bind(this));
            }
            else {
                if($.isFunction(this.notChanged)) {
                    this.notChanged(this.serialize());
                }

                this.mod.leave($ctx);
            }
        }.bind(this), function() {
            this.mod.leave($ctx);
        }.bind(this));
    },

    enter: function() {
        this._super();

        if(!this.readonly) {
            this.showActions();
            this.$text.trigger('select');
        }
        else {
            this.mod.leave(this.$ctx);
        }
    },

    leave: function() {
        this._super();

        if(!this.readonly) {
            this.$text.trigger('blur');
            this.hideActions();
        }
    },

    focus: function() {
        if(!this.readonly) {
            if(!this.isSetting) {
                this.$text.trigger('select');
            }
            else {
                this.enter();
            }
        }

        return this;
    },

    unfocus: function($setting) {
        this._super();

        if(!this.readonly) {
            let $ctx = this.$ctx;

            if (this.validator.form()) {
                if (this.hasChanged) {
                    this.save().then(function (data) {
                        if ($.isFunction(this.saved)) {
                            this.saved(data);
                        }

                        if (data.success) {
                            this.initialValue = this.$text.val();
                            this.mod.leave($ctx);
                            this.showSuccess();
                            this.mod.enter($setting);
                        }
                        else if (data.errors) {
                            this.showErrors(data.errors);
                        }
                    }.bind(this));
                }
                else {
                    this.mod.leave($ctx);
                    this.mod.enter($setting);
                }
            }
            else {
                this.validator.focusInvalid();
                $ctx.velocity('callout.pulse', {duration: 300});
            }
        }
    },

    setValue: function(value) {
        if(this.$text.attr('type') === 'unit') {
            value =  this.tpl.unit(value, true);
        }

        this.$text.val(value);
        return this;
    },

    getValue: function() {
        let value = this.$text.val();

        if(this.$text.attr('type') === 'unit') {
            value =  this.tpl.unit(value, true);
        }

        return value;
    },

    clear: function() {
        this.$text.val('');
    },

    setReadonly: function(readonly) {
        if(readonly) {
            this.readonly = true;
            this.$text.attr('readonly', 'readonly');
        }
        else {
            this.readonly = false;
            this.$text.removeAttr('readonly');
        }
    },

    serialize: function() {
        let $ctx = this.$ctx;

        let info = {};
        info[this.id] = this.getValue();

        let data = null;
        let group = $ctx.data('group');

        if (group) {
            // allow for nested grouping
            data = this.createGroup({}, group, info);
        }
        else {
            data = info;
        }

        return data;
    }
});
