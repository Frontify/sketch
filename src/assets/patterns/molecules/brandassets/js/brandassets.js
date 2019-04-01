Tc.Module.BrandAssets = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('tabs', this);

        // Cta from blankslate
        $ctx.on('click', '.js-m-brandassets_blank-cta', function(e) {
            var $this = $(e.currentTarget);
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
        if (data.id === 'brandassets') {
            var $ctx = this.$ctx;
            var $active = $ctx.find('.js-m-tabs__link.state-active');
            if ($active.length > 0) {
                var tabs = this.sandbox.getModuleById($('#tabs-brandassets').data('terrificId'));
                this.hideBlankSlate();
                tabs.switchTab($active.attr('href').substring('5'));
            }
        }
    }
});
