(function ($) {
    Tc.Setting.Hidden = Tc.Setting.Base.extend({
        elem: function(setting) {
            let $ctx = this.$ctx;
        },

        serialize: function() {
            let $ctx = this.$ctx;

            let info = {};
            info[this.id] = $ctx.attr('value');

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

        setValue: function(value) {
            let $ctx = this.$ctx;
            $ctx.attr('value', value);
        }
    });
}(Tc.$));
