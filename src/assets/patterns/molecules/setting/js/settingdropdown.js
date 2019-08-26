Tc.Setting.Dropdown = Tc.Setting.Base.extend({
    elem: function (setting) {
        let $ctx = this.$ctx;

        this.$select =  $ctx.find('select');
        this.readonly = this.$select.is('[readonly]');
        this.expand = $ctx.data('expand') || false;
        this.current = null;

        this.$select.on('click', function(e) {
            e.stopPropagation();
        });

        this.$select.dropdown({
            changed: function(data) {
                if($.isFunction(this.changed)) {
                    this.changed(this.serialize());
                }

                if(setting) {
                    $ctx.trigger('submit');
                }
            }.bind(this),
            open: function() {
                if(this.expand) {
                    // calc
                    let $list = $ctx.find('.js-ca-dropdown__list');
                    let offset = $list.offset();
                    let bottom = offset['top'] + parseInt($list.outerHeight()) + 30;
                    this.mod.resize(bottom);
                }
            }.bind(this),
            close: function() {
                if(this.expand) {
                    // calc
                    this.mod.resize();
                }
            }.bind(this)
        });

        $ctx.on('focusin', '.js-m-setting__bar', function(e) {
            $(e.currentTarget).addClass('state-active');
        }.bind(this)).on('focusout', '.js-m-setting__bar', function(e) {
            $(e.currentTarget).removeClass('state-active');
        }.bind(this));

        $ctx.on('click', function() {
            if($.isFunction(this.focus)) {
                this.focus()
            }
        }.bind(this));
    },

    setting: function() {
        let $ctx = this.$ctx;

        this.elem(true);

        // tab handling
        $ctx.find('.ca-dropdown').attr('tabindex', '-1');
        $ctx.on('keydown', function(e) {
            if (this.active && e.which === 9) {
                e.preventDefault();
                if(e.shiftKey) {
                    this.mod.prev($ctx);
                }
                else {
                    this.mod.next($ctx);
                }
            }
        }.bind(this));

        $ctx.on('submit', function(e, ignore) {
            e.preventDefault();

            // save
            if(this.current !== this.$select.val()) {
                this.save().then(function (data) {
                    if (data.success) {
                        if ($.isFunction(this.saved)) {
                            this.saved(data);
                        }


                        setTimeout(function() {
                            this.mod.leave($ctx);
                            this.showSuccess();
                        }.bind(this), 0);
                    }
                }.bind(this));
            }
            else {
                this.mod.leave($ctx);
            }
        }.bind(this)).on('reset', function() {
            this.mod.leave($ctx);
        }.bind(this));
    },

    enter: function() {
        this._super();
        let $ctx = this.$ctx;

        this.current = this.$select.val();

        if(!this.readonly) {
            this.showActions();
            $ctx.find('.ca-dropdown > .selected').trigger('mouseup');
        }
        else {
            this.mod.leave($ctx);
        }
    },

    leave: function() {
        this._super();

        let $ctx = this.$ctx;

        this.hideActions();
        $ctx.find('.js-m-setting__bar').removeClass('state-active');
    },

    focus: function() {
        let $ctx = this.$ctx;

        if(!this.readonly) {
            if (!this.isSetting) {
                $ctx.find('.ca-dropdown > .selected').trigger('mouseup');
            }
            else {
                this.enter();
            }
        }
    },

    unfocus: function($setting) {
        this._super();
        let $ctx = this.$ctx;

        if(!this.readonly) {
            this.mod.leave($ctx);
            this.mod.enter($setting);
        }
    },

    serialize: function() {
        let $ctx = this.$ctx;

        let info = {};
        info[this.id] = $ctx.find('select').val();

        let data = null;

        if ($ctx.data('group')) {
            data = {};
            data[$ctx.data('group')] = info;
        }
        else {
            data = info;
        }

        return data;
    },

    destroy: function() {

    },

    setIndex: function(index) {
        this.$ctx.find('.js-ca-dropdown__list').find('li[data-index="' + index + '"]').trigger('mouseup');
    }
});
