Tc.Module.Conflict = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        $ctx.on('click', '.js-m-conflict__pull', function (e) {
            let id = $ctx.data('source-id');
            this.fire('pullChanges', {id: id}, ['events']);
            this.fire('closeModal', ['events']);
        }.bind(this));

        $ctx.on('click', '.js-m-conflict__push', function (e) {
            let id = $ctx.data('source-id');
            this.fire('pushChanges', {id: id}, ['events']);
            this.fire('closeModal', ['events']);
        }.bind(this));

        callback();
    }
});
