Tc.Module.MediaChooser = Tc.Module.extend({
    on: function(callback) {
        let $ctx = this.$ctx;
        this.$form = $ctx.find('.js-m-mediachooser__form');
        this.$assets = $ctx.find('.js-m-mediachooser__asset-list');
        this.document = $ctx.data('document');
        this.rowHeight = 170;
        this.type = $ctx.data('type');
        this.random = false;

        // subscribe to channels
        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        // setup search
        this.settings = new Tc.Module.Settings(this.$form, this.sandbox);

        $ctx.on('submit', '.js-m-mediachooser__form', function(e) {
            // prevent form submit
            e.preventDefault();
        }.bind(this));

        let query = this.settings.getElem('q');
        query.changed = function() {
            this.search();
        }.bind(this);

        $ctx.on('click', '.js-m-mediachooser__asset-item', function(e) {
            let $this = $(e.currentTarget);
            this.selectItem($this);
        }.bind(this));

        callback();
    },

    applyFlexImages: function(maxHeight) {
        if(this.type !== 'icons' && this.type !== 'logos') {
            this.$assets.flexImages({ container: '.js-m-mediachooser__asset-item', rowHeight: maxHeight, truncate: false });
        }
    },

    selectItem: function($item) {
        let url = $item.data('url');
        let ext = $item.data('ext');
        let title = $item.data('title');
        window.postMessage('applyLibraryAsset', { url: url, ext: ext, title: title });
    },

    search: function() {
        let filters = this.settings.serialize();

        // add filters
        this.random = false;
        if (filters.q === '') {
            this.random = true;
        }

        let query = $.param(filters);

        this.$assets.html(window.tpl.loaderspinner());

        window.postMessage('searchLibraryAssets', this.type, query);
    },

    render: function(data) {
        let assets = data.assets;

        if (assets.length > 0) {
            if (this.random) {
                this.shuffle(assets);
            }

            this.$assets.html(window.tpl.mediachooserresults({ items: assets, type: this.type }));
            this.applyFlexImages(this.rowHeight);
        }
        else {
            this.$assets.html(window.tpl.mediachooserresults({ items: assets, type: this.type }));
        }
    },

    showSearch: function() {
        this.$ctx.find('.js-m-mediachooser__form').removeClass('state-hidden');

        let q =  this.settings.getElem('q');
        q.setValue('');
        q.focus();
    },

    /**
     * Shuffles array in place.
     * @param {Array} a items The array containing the items.
     */
    shuffle: function(a) {
        let j, x, i;
        for (i = a.length; i; i--) {
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
    },

    onTabSwitched(data) {
        if (data.id === this.type) {
            this.$assets.html('');
            window.postMessage('showLibrary', this.type);
        }
    }
});
