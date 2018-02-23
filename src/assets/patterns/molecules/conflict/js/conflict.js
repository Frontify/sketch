import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Conflict = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        $ctx.on('click', '.js-m-conflict__pull', function (e) {
            var id = $ctx.data('source-id');
            this.fire('pullChanges', {id: id}, ['events']);
            this.fire('closeModal', ['events']);
        }.bind(this));

        $ctx.on('click', '.js-m-conflict__push', function (e) {
            var id = $ctx.data('source-id');
            this.fire('pushChanges', {id: id}, ['events']);
            this.fire('closeModal', ['events']);
        }.bind(this));

        callback();
    }
});