Tc.Module.Sources = Tc.Module.extend({
    on: function(callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        this.sources = [];
        this.jets = null;

        $ctx.html(window.tpl.loaderspinner());

        $ctx.on('click', '.js-m-sources__change-target', function(e) {
            e.stopPropagation();

            // open modal with loader
            this.fire('openModal', {
                modifier: 'default',
                closeable: false,
                $content: $(window.tpl.loaderspinner())
            }, ['events']);
            window.postMessage('changeFolder');
        }.bind(this));

        $ctx.on('click', '.js-m-sources__add', function(e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'uploading';
            this.updateItem($item, source);

            window.postMessage('addSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__push', function(e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'pushing';
            this.updateItem($item, source);

            window.postMessage('pushSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__pull', function(e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'pulling';
            this.updateItem($item, source);

            window.postMessage('pullSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__conflict', function(e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');
            window.postMessage('resolveConflict', $item.data('id'));
        }.bind(this));

        $ctx.on('click', '.js-m-sources__open', function(e) {
            var $target = $(e.target);

            // skip toggle
            if ($target.closest('.js-m-sources__toggle').length === 0) {
                var $item = $(e.currentTarget);
                var source = this.getSource($item.data('id'));
                source.state = 'opening';
                this.updateItem($item, source);

                window.postMessage('openSource', source);
            }
        }.bind(this));

        $ctx.on('click', '.js-m-sources__download', function(e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'downloading';
            this.updateItem($item, source);

            window.postMessage('downloadSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__add-current', function(e) {
            e.stopPropagation();

            // give button time to gray out
            setTimeout(function() {
                window.postMessage('addCurrentFile');
            }, 20);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__finder', function(e) {
            e.stopPropagation();

            window.postMessage('openFinder');
        }.bind(this));

        callback();
    },

    updateItem: function($item, source) {
        $item.replaceWith(window.tpl.sourcesitem(source));
    },

    getSource: function(id) {
        return this.sources.find(function(source) {
            return source.id == id;
        }.bind(this));
    },

    sourceUploadProgress: function(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id_external + '"]');
        $item.find('.js-a-progress__progress').css({'stroke-dasharray': data.progress + ' 100'});
    },

    sourceUploaded: function(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';
        source.state = 'same';
        source.id = data.id;

        this.updateItem($item, source);
    },

    sourceUploadFailed: function(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';

        var currentState = source.state;

        switch (currentState) {
            case 'pushing':
                source.state = 'failedpush';
                break;
            case 'uploading':
                source.state = 'failedadd';
                break;
        }

        this.updateItem($item, source);
    },

    sourceDownloadProgress: function(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');
        $item.find('.js-a-progress__progress').css({'stroke-dasharray': data.progress + ' 100'});
    },

    sourceDownloaded: function(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';
        source.state = 'same';
        source.id = data.id;

        this.updateItem($item, source);
    },

    sourceDownloadFailed: function(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';

        var currentState = source.state;

        switch (currentState) {
            case 'pulling':
                source.state = 'failedpull';
                break;
            case 'downloading':
                source.state = 'faileddownload';
                break;
        }

        this.updateItem($item, source);
    },

    render: function(data) {
        var $ctx = this.$ctx;
        this.sources = data.sources;
        $ctx.html(window.tpl.sourceslist(data));

        // initialize search
        try {
            if(this.jets) {
                this.jets.destroy();
            }

            this.jets = new Jets({
                searchTag: '.js-m-sources__search',
                contentTag: '.js-m-sources__list',
                didSearch: function(search_phrase) {
                    var $nr = this.$ctx.find('.js-m-sources__no-results');
                    var hasResults = this.$ctx.find('.js-m-sources__item:visible').length;
                    if (!hasResults) {
                        $nr.addClass('state-visible');
                    }
                    else {
                        $nr.removeClass('state-visible');

                    }
                }.bind(this)
            });
        } catch (e) {
            // prevent sketch from crashing
        }
    },

    showHowTo: function() {
        this.fire('openModal', {modifier: 'default', closeable: false, $content: $(window.tpl.howto())}, ['events']);
    },

    showConflict: function(id) {
        var source = this.getSource(id);
        this.fire('openModal', {
            modifier: 'default',
            closeable: false,
            $content: $(window.tpl.conflict(source))
        }, ['events']);
    },

    onTabSwitched(data) {
        if (data.id === 'sources') {
            this.$ctx.html(window.tpl.loaderspinner());
            window.postMessage('showSources');
        }
    },

    onPushChanges(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id=' + data.id + ']');

        // update item
        var source = this.getSource(data.id);
        source.state = 'pushing';
        this.updateItem($item, source);

        window.postMessage('pushSource', source);
    },

    onPullChanges(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id=' + data.id + ']');

        // update item
        var source = this.getSource(data.id);
        source.state = 'pulling';
        this.updateItem($item, source);

        window.postMessage('pullSource', source);
    }
});
