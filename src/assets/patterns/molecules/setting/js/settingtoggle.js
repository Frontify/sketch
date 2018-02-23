Tc.Setting.Toggle = Tc.Setting.Base.extend({
    elem: function() {
        var $ctx = this.$ctx;
        this.readonly = $ctx.find('.js-m-setting-toggle').is('[readonly]');

        $ctx.on('click', function() {
            if($.isFunction(this.changed)) {
                this.changed(this.serialize());
            }
        }.bind(this));
    },

    setting: function () {
        var $ctx = this.$ctx;

        this.readonly = $ctx.find('.js-m-setting-toggle').is('[readonly]');

        $ctx.on('click', function(e) {
            if(!this.readonly) {
                if(!$(e.target).is('input')) {
                    e.stopPropagation();
                }
                else {
                    this.save().then(function(data) {
                        if(data.success) {
                            if($.isFunction(this.saved)) {
                                this.saved(data);
                            }
                        }
                    }.bind(this));
                }
            }
        }.bind(this));
    },

    enter: function() {
        var $ctx = this.$ctx;
        this.mod.leave($ctx);
    },

    leave: function() {
        this._super();
    },

    serialize: function() {
        var $ctx = this.$ctx;

        var info = {};

        var $toggle = $ctx.find('.js-m-setting-toggle');
        var checked = $toggle.is(':checked');
        var mapping_false = $ctx.data('mapping-false');
        var mapping_true = $ctx.data('mapping-true');
        if (mapping_true !== undefined && mapping_false !== undefined) {
            checked = checked ? mapping_true : mapping_false;
        }

        if($ctx.data('key')) {
            info[$ctx.data('key')] = checked;
        }

        info[this.id] = checked;

        // extend with data values
        info = $.extend(true, {}, info, $toggle.data());

        var data = null;

        // group data, if configured
        if ($ctx.data('group')) {
            data = {};
            data[$ctx.data('group')] = info;
        }
        else {
            data = info;
        }

        return data;
    },

    setValue: function(checked) {
        var $ctx = this.$ctx;
        var $toggle = $ctx.find('.js-m-setting-toggle');

        if(checked) {
            $toggle.attr('checked', 'checked');
        }
        else {
            $toggle.removeAttr('checked');
        }
    }
});
