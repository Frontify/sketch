Tc.Module.Error = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        callback();
    },

    render: function(template) {
        if(window.tpl['error' + template]) {
            var $content = $(window.tpl['error' + template]());
            this.fire('openModal', { closeable: false, $content: $content });

            $content.on('click', '.js-m-error__action', function(e) {
                var $this = $(e.currentTarget);
                var url = $this.data('url');

                if(url) {
                    window.postMessage('openUrl', url);
                }
            }.bind(this));
        }
    }
});
