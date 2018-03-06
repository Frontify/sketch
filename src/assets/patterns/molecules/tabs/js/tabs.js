import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Tabs = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('tabs', this);

        // handle tab click
        $ctx.on('click', '> .js-m-tabs__list .js-m-tabs__link', function (e) {
            e.preventDefault();
            var $target = $(e.currentTarget);

            // show content of target
            this.showContent($target);
        }.bind(this));

        // refresh tab
        $ctx.on('click', '.js-m-tabs__refresh', function (e) {
           e.preventDefault();
           this.refresh();
        }.bind(this));

        // open style guide
        $ctx.on('click', '.js-m-tabs__styleguide', function (e) {
            e.preventDefault();
            var $this = $(e.currentTarget);
            var url = $this.attr('href');
            if(url) {
                pluginCall('openUrl', url);
            }
        }.bind(this));

        callback();
    },

    showContent: function ($target) {
        var tabId = $target.attr('href').substring(5);
        var $tabs = this.$ctx;

        // content
        var $links = $tabs.find('> .js-m-tabs__list .js-m-tabs__link');
        var $panes = $tabs.find('> .js-m-tabs__content > .js-m-tabs__pane');

        // handle active states
        $links.removeClass('state-active');
        $target.addClass('state-active');

        // close current pane and open new pane
        var $pane = $panes.filter('#tab-' + tabId);
        $panes.removeClass('state-active');
        $pane.addClass('state-active');

        this.fire('tabSwitched', { id: tabId }, ['tabs']);
    },

    switchTab: function(id) {
        var $ctx = this.$ctx;

        if(id) {
            var $tab = $ctx.find('[href=#tab-' + id + ']');
            if($tab.length > 0) {
                this.showContent($tab);
            }
        }
    },

    setTarget: function(target) {
        var $ctx = this.$ctx;
        var $styleguide = $ctx.find('.js-m-tabs__styleguide');
        if(target.project && target.project.hub_id) {
            $styleguide.attr('href', '/hub/' + target.project.hub_id).removeClass('state-hidden');
        }
        else {
            $styleguide.addClass('state-hidden');
        }
    },

    refresh: function() {
        var $ctx = this.$ctx;

        // get active tab
        var $tab = $ctx.find('.js-m-tabs__link.state-active');
        if($tab.length > 0) {
            this.showContent($tab);
        }
    }
});
