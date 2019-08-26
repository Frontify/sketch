Tc.Module.Error = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        callback();
    },

    render: function(template) {
        if(window.tpl['error' + template]) {
            let $content = $(window.tpl['error' + template]());
            this.fire('openModal', { closeable: false, $content: $content });

            $content.on('click', '.js-m-error__action', function(e) {
                let $this = $(e.currentTarget);
                let url = $this.data('url');

                if(url) {
                    window.postMessage('openUrl', url);
                }

            }.bind(this));

            $content.on('click', '.js-m-error__logout', function(e) {
                window.postMessage('logout');
            }.bind(this));
        }
    }
});
