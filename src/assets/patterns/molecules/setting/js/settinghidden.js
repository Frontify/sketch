(function ($) {
    Tc.Setting.Hidden = Tc.Setting.Base.extend({
        elem: function(setting) {
            var $ctx = this.$ctx;
        },

        serialize: function() {
            var $ctx = this.$ctx;

            var info = {};
            info[this.id] = $ctx.attr('value');

            var data = null;

            if ($ctx.data('group')) {
                data = {};
                data[$ctx.data('group')] = info;
            }
            else {
                data = info;
            }

            return data;
        },

        setValue: function(value) {
            var $ctx = this.$ctx;
            $ctx.attr('value', value);
        }
    });
}(Tc.$));
