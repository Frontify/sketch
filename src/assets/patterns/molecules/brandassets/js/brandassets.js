Tc.Module.BrandAssets = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('tabs', this);

        // set hub link


        callback();
    },

    onTabSwitched(data) {
        if (data.id === 'brandassets') {
            var $ctx = this.$ctx;
            var $active = $ctx.find('.js-m-tabs__link.state-active');
            if ($active.length > 0) {
                var tabs = this.sandbox.getModuleById($('#tabs-brandassets').data('terrificId'));
                tabs.switchTab($active.attr('href').substring('5'));
            }
        }
    }
});