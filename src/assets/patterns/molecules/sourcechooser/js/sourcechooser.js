Tc.Module.SourceChooser = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        this.settings = null;
        this.type = $ctx.data('type');

        callback();
    },

    render: function(data) {
        let $ctx = this.$ctx;
        $ctx.html(window.tpl.sourcechooserlist(data));

        if(this.settings) {
            this.settings.destroy();
        }

        this.settings = new Tc.Module.Settings($ctx, this.sandbox);

        this.settings.getElem('source').changed = function(data) {
            window.postMessage('switchAssetSourceForType', this.type, data.source);
        }.bind(this);
    }
});
