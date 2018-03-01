import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Sources = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);

        this.sources = [];

        $ctx.html(window.tpl.loader());

        $ctx.on('click', '.js-m-sources__export-target', function (e) {
            var url = $(e.currentTarget).data('url');

            // open export target in frontify
            pluginCall('openUrl', url);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__change-target', function (e) {
            // open modal with loader
            this.fire('openModal', {modifier: 'default', $content: $(window.tpl.loader())}, ['events']);
            pluginCall('changeFolder');
        }.bind(this));

        $ctx.on('click', '.js-m-sources__add', function (e) {
            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'syncing';
            this.updateItem($item, source);

            pluginCall('addSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__push', function (e) {
            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'syncing';
            this.updateItem($item, source);

            pluginCall('pushSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__pull', function (e) {
            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'syncing';
            this.updateItem($item, source);

            pluginCall('pullSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__conflict', function (e) {
            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');
            pluginCall('resolveConflict', $item.data('id'));
        }.bind(this));

        $ctx.on('click', '.js-m-sources__open', function (e) {
            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            var source = this.getSource($item.data('id'));
            source.state = 'opening';
            this.updateItem($item, source);

            pluginCall('openSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__download', function (e) {
            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-sources__item');

            // update item
            var source = this.getSource($item.data('id'));
            source.state = 'syncing';
            this.updateItem($item, source);

            pluginCall('downloadSource', source);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__add-current', function () {
            // give button time to gray out
            setTimeout(function () {
                pluginCall('addCurrentFile');
            }, 20);
        }.bind(this));

        $ctx.on('click', '.js-m-sources__finder', function () {
            pluginCall('openFinder');
        }.bind(this));

        callback();
    },

    updateItem: function ($item, source) {
        $item.replaceWith(window.tpl.sourcesitem(source));
    },

    getSource: function (id) {
        return this.sources.find(function (source) {
            return source.id == id;
        }.bind(this));
    },

    sourceUploaded: function (data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';
        source.state = 'same';
        source.id = data.id;

        this.updateItem($item, source);
    },

    sourceUploadFailed: function (data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';
        source.state = 'failed';

        this.updateItem($item, source);
    },

    sourceDownloaded: function (data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';
        source.state = 'same';
        source.id = data.id;

        this.updateItem($item, source);
    },

    sourceDownloadFailed: function (data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id="' + data.id + '"]');

        var source = this.getSource(data.id);
        source.modified_localized_ago = 'just now';
        source.state = 'failed';

        this.updateItem($item, source);
    },

    render: function (data) {
        var $ctx = this.$ctx;
        this.sources = data.sources;
        $ctx.html(window.tpl.sourceslist(data));
    },

    showHowTo: function () {
        this.fire('openModal', {modifier: 'default', $content: $(window.tpl.howto())}, ['events']);
    },

    showConflict: function (id) {
        var source = this.getSource(id);
        this.fire('openModal', {modifier: 'default', $content: $(window.tpl.conflict(source))}, ['events']);
    },

    onTabSwitched(data) {
        if (data.id === 'sources') {
            this.$ctx.html(window.tpl.loader());
            pluginCall('showSources');
        }
    },

    onPushChanges(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id=' + data.id + ']');

        // update item
        var source = this.getSource(data.id);
        source.state = 'syncing';
        this.updateItem($item, source);

        pluginCall('pushSource', source);
    },

    onPullChanges(data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-sources__item[data-id=' + data.id + ']');

        // update item
        var source = this.getSource(data.id);
        source.state = 'syncing';
        this.updateItem($item, source);

        pluginCall('pullSource', source);
    }
});