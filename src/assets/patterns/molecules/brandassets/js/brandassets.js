Tc.Module.BrandAssets = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('tabs', this);

        // Cta from blankslate
        $ctx.on('click', '.js-m-brandassets_blank-cta', function(e) {
            let $this = $(e.currentTarget);
            window.postMessage('openUrl', $this.data('url'));
        }.bind(this));

        callback();
    },

    showBlankSlate(data) {
        this.$ctx.find('.js-m-brandassets__blank-container').html(window.tpl.brandassetsblank(data)).addClass('state-visible');
    },

    hideBlankSlate(data) {
        this.$ctx.find('.js-m-brandassets__blank-container').html('').removeClass('state-visible');
    },

    onTabSwitched(data) {
        this.hideBlankSlate();

        if (data.id === 'brandassets') {
            let $ctx = this.$ctx;
            let $active = $ctx.find('.js-m-tabs__link.state-active');
            if ($active.length > 0) {
                let tabs = this.sandbox.getModuleById($('#tabs-brandassets').data('terrificId'));
                tabs.switchTab($active.attr('href').substring('5'));
            }
        }
    }
});
