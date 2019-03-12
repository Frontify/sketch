Tc.Module.Howto = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        $ctx.on('click', '.js-m-howto__move', function(e) {
            e.preventDefault();
            this.fire('closeModal', ['events']);

            window.postMessage('moveCurrentFile');
        }.bind(this));

        callback();
    }
});
