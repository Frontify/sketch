import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Typography = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('tabs', this);

        callback();
    },

    render: function () {
        var $ctx = this.$ctx;
        $ctx.html(window.tpl.typographysoon());
    },

    onTabSwitched(data) {
        if(data.id === 'typography') {
            this.render()
        }
    }
});