Tc.Module.Tabs = Tc.Module.extend({
    on: function (callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('tabs', this);

        // handle tab click
        $ctx.on('click', '> .js-m-tabs__list .js-m-tabs__link', function (e) {
            e.preventDefault();
            let $target = $(e.currentTarget);

            // show content of target
            this.showContent($target);
        }.bind(this));

        // refresh tab
        $ctx.on('click', '.js-m-tabs__refresh', function (e) {
           e.preventDefault();
           this.refresh();
        }.bind(this));

        callback();
    },

    showContent: function ($target) {
        let tabId = $target.attr('href').substring(5);
        let $tabs = this.$ctx;

        // content
        let $links = $tabs.find('> .js-m-tabs__list .js-m-tabs__link');
        let $panes = $tabs.find('> .js-m-tabs__content > .js-m-tabs__pane');

        // handle active states
        $links.removeClass('state-active');
        $target.addClass('state-active');

        // close current pane and open new pane
        let $pane = $panes.filter('#tab-' + tabId);
        $panes.removeClass('state-active');
        $pane.addClass('state-active');

        this.fire('tabSwitched', { id: tabId }, ['tabs']);
    },

    switchTab: function(id) {
        let $ctx = this.$ctx;

        if(id) {
            let $tab = $ctx.find('> .js-m-tabs__list .js-m-tabs__link[href=#tab-' + id + ']');
            if($tab.length > 0) {
                this.showContent($tab);
            }
        }
    },

    getCurrentTab: function() {
        let $ctx = this.$ctx;
        let $current = $ctx.find('> .js-m-tabs__list .js-m-tabs__link.state-active');
        if($current.length > 0) {
            return $current.attr('href').substring(5);
        }

        return null;
     },

    refresh: function() {
        let $ctx = this.$ctx;

        // get active tab
        let $tab = $ctx.find('.js-m-tabs__link.state-active');
        if($tab.length > 0) {
            this.showContent($tab);
        }
    }
});
