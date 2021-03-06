Tc.Module.Target = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);

        $ctx.on('click', '.js-m-target__change-project', function(e) {
            e.preventDefault();
            let $this = $(e.currentTarget);
            this.fire('openModal', { modifier: 'default', closeable: false, $content: $(window.tpl.loaderspinner())}, ['events']);
            this.fire('closeDropdown', $this.closest('.js-m-btn-dropdown__menu'), ['events']);
            window.postMessage('changeProject');
        }.bind(this));

        $ctx.on('click', '.js-m-target__help', function(e) {
            e.preventDefault();
            let $this = $(e.currentTarget);
            this.fire('closeDropdown', $this.closest('.js-m-btn-dropdown__menu'), ['events']);
            window.postMessage('openUrl', $this.attr('href'), true);
        }.bind(this));

        $ctx.on('click', '.js-m-target__logout', function(e) {
            e.preventDefault();
            window.postMessage('logout');
        }.bind(this));

        callback();
    },

    render: function (data) {
        let $ctx = this.$ctx;

        if(!data) {
            $ctx.html(window.tpl.targetblank(data));
        }
        else {
            $ctx.html(window.tpl.target(data));
        }
    }
});
