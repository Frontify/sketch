import pluginCall from 'sketch-module-web-view/client'

Tc.Module.Artboards = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);
        this.artboards = [];

        $ctx.html(window.tpl.loader());

        $ctx.on('click', '.js-m-artboards__export-target', function (e) {
            e.stopPropagation();

            var url = $(e.currentTarget).data('url');

            // open export target in frontify
            pluginCall('openUrl', url);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__change-target', function(e) {
            e.stopPropagation();

            // open modal with loader
            this.fire('openModal', { modifier: 'default', closeable: false, $content: $(window.tpl.loader())}, ['events']);
            pluginCall('changeFolder');
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload', function (e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var $item = $this.closest('.js-m-artboards__item');

            // update item
            var artboard = this.getArtboard($item.data('idExternal'));
            artboard.state = 'uploading';
            this.updateItem($item, artboard);

            pluginCall('uploadArtboard', artboard);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload-all', function (e) {
            e.stopPropagation();

            var artboards = [];

            $ctx.find('.js-m-artboards__upload-all').attr('disabled', 'disabled');

            $.each($ctx.find('.js-m-artboards__item'), function (index, item) {
                var $item = $(item);
                var artboard = this.getArtboard($item.data('idExternal'));
                artboard.state = 'uploading';
                artboards.push(artboard);

                // update item
                this.updateItem($item, artboard);

            }.bind(this));

            // give button time to gray out
            setTimeout(function() {
                pluginCall('uploadArtboards', artboards);
            }, 20);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__item', function(e) {
            e.stopPropagation();

            var $this = $(e.currentTarget);
            var url = $this.data('url');

            if(url) {
                pluginCall('openUrl', url);
            }
        }.bind(this));

        callback();
    },

    updateItem: function ($item, artboard) {
        $item.replaceWith(window.tpl.artboardsitem(artboard));
    },

    getArtboard: function (id_external) {
        return this.artboards.find(function (artboard) {
            return artboard.id_external == id_external;
        }.bind(this));
    },

    artboardsUploaded: function () {
        var $ctx = this.$ctx;
        $ctx.find('.js-m-artboards__upload-all').removeAttr('disabled');
    },

    artboardUploaded: function (data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-artboards__item[data-id-external="' + data.id_external + '"]');

        var artboard = this.getArtboard(data.id_external);

        artboard.nochanges = data.nochanges;

        if (!data.nochanges) {
            artboard.modified_localized_ago = 'just now';
            artboard.modifier_name = 'you'
        }
        artboard.state = 'success';
        artboard.id = data.id;

        this.updateItem($item, artboard);
    },

    artboardUploadFailed: function (data) {
        var $ctx = this.$ctx;
        var $item = $ctx.find('.js-m-artboards__item[data-id-external="' + data.id_external + '"]');

        var artboard = this.getArtboard(data.id_external);
        artboard.modified_localized_ago = 'just now';
        artboard.state = 'failed';

        this.updateItem($item, artboard);
    },

    render: function (data) {
        var $ctx = this.$ctx;
        this.artboards = data.artboards;
        $ctx.html(window.tpl.artboardslist(data));
    },

    onTabSwitched(data) {
        if(data.id === 'artboards') {
            this.$ctx.html(window.tpl.loader());
            pluginCall('showArtboards');
        }
    }
});