Tc.Module.Artboards = Tc.Module.extend({
    on: function(callback) {
        let $ctx = this.$ctx;

        this.sandbox.subscribe('events', this);
        this.sandbox.subscribe('tabs', this);
        this.artboards = [];
        this.jets = null;

        $ctx.html(window.tpl.loaderspinner());

        $ctx.on('click', '.js-m-artboards__change-target', function(e) {
            e.stopPropagation();

            // open modal with loader
            this.fire('openModal', {
                modifier: 'default',
                closeable: false,
                $content: $(window.tpl.loaderspinner())
            }, ['events']);
            window.postMessage('changeFolder');
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload', function(e) {
            e.stopPropagation();

            let $this = $(e.currentTarget);
            let $item = $this.closest('.js-m-artboards__item');

            // update item
            let artboard = this.getArtboard($item.data('idExternal'));
            artboard.state = 'uploading';
            this.updateItem($item, artboard);

            window.postMessage('uploadArtboard', artboard);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload-all', function(e) {
            e.stopPropagation();

            let artboards = [];

            $ctx.find('.js-m-artboards__upload-all').attr('disabled', 'disabled');

            $.each($ctx.find('.js-m-artboards__item'), function(index, item) {
                let $item = $(item);
                let artboard = this.getArtboard($item.data('idExternal'));
                artboard.state = 'uploading';
                artboards.push(artboard);

                // update item
                this.updateItem($item, artboard);

            }.bind(this));

            // give button time to gray out
            setTimeout(function() {
                window.postMessage('uploadArtboards', artboards);
            }, 20);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload-selected', function(e) {
            e.stopPropagation();

            let artboards = [];

            $ctx.find('.js-m-artboards__upload-selected').attr('disabled', 'disabled');

            $.each($ctx.find('.js-m-artboards__item.state-selected'), function(index, item) {
                let $item = $(item);
                let artboard = this.getArtboard($item.data('idExternal'));
                artboard.state = 'uploading';
                artboards.push(artboard);

                // update item
                this.updateItem($item, artboard);
            }.bind(this));

            // give button time to gray out
            setTimeout(function() {
                window.postMessage('uploadArtboards', artboards);
            }, 20);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__item', function(e) {
            e.stopPropagation();

            let $this = $(e.currentTarget);
            let url = $this.data('url');

            if (url) {
                window.postMessage('openUrl', url);
            }
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__annotation', function(e) {
            e.stopPropagation();
            e.preventDefault();

            let $this = $(e.currentTarget);
            let url = $this.attr('href');

            if (url) {
                window.postMessage('openUrl', url);
            }
        }.bind(this));

        callback();
    },

    updateItem: function($item, artboard) {
        let $replaceItem = $(window.tpl.artboardsitem(artboard));
        $item.replaceWith($replaceItem);

        if (artboard.state === 'success') {
            // flash icon green
            let $badge = $replaceItem.find('.js-m-artboards__badge');
            $badge.velocity({backgroundColor: '#A3CE62'}, {
                duration: 200, complete: function() {
                    $badge.velocity('reverse', {
                        duration: 200, delay: 1000
                    });
                }
            });
        }
    },

    getArtboard: function(id_external) {
        return this.artboards.find(function(artboard) {
            return artboard.id_external == id_external;
        }.bind(this));
    },


    artboardUploadProgress: function(data) {
        let $ctx = this.$ctx;
        let $item = $ctx.find('.js-m-artboards__item[data-id-external="' + data.id_external + '"]');
        $item.find('.js-a-progress__progress').css({'stroke-dasharray': data.progress + ' 100'});
    },

    artboardsUploaded: function() {
        let $ctx = this.$ctx;
        $ctx.find('.js-m-artboards__upload-all').removeAttr('disabled');
    },

    artboardUploaded: function(data) {
        let $ctx = this.$ctx;
        let $item = $ctx.find('.js-m-artboards__item[data-id-external="' + data.id_external + '"]');

        let artboard = this.getArtboard(data.id_external);

        artboard.nochanges = data.nochanges;

        if (!data.nochanges) {
            artboard.modified_localized_ago = 'just now';
            artboard.modifier_name = 'you'
        }
        artboard.state = 'success';
        artboard.id = data.id;
        artboard.sha = data.sha;

        this.updateItem($item, artboard);

    },

    artboardUploadFailed: function(data) {
        let $ctx = this.$ctx;
        let $item = $ctx.find('.js-m-artboards__item[data-id-external="' + data.id_external + '"]');

        let artboard = this.getArtboard(data.id_external);
        artboard.modified_localized_ago = 'just now';
        artboard.state = 'failed';

        this.updateItem($item, artboard);
    },

    onPreviewReady: function (layerId) {
        this.updatePreviewImage(layerId);
    },

    updatePreviewImage: function (layerId) {
        var $image = this.$ctx.find('.js-m-artboards__item[data-id-external="' + layerId + '"] .js-m-artboards__preview-image');
        $image.attr('src', 'file:///var/folders/rk/xkvpp6b10pq1yvpc11wgjfnr0000gn/T/sketch-frontify/' + layerId + '.png');
    },

    render: function(data) {
        let $ctx = this.$ctx;
        this.artboards = data.artboards;
        $ctx.html(window.tpl.artboardslist(data));
        $ctx.on('lazyloaded', function (e) {
            var layerId = e.target.getAttribute('data-id-external');
            window.postMessage('generatePreview', layerId);
        }.bind(this))
        // initialize search
        try {
            if(this.jets) {
                this.jets.destroy();
            }

            this.jets = new Jets({
                searchTag: '.js-m-artboards__search',
                contentTag: '.js-m-artboards__list',
                didSearch: function(search_phrase) {
                    let $nr = this.$ctx.find('.js-m-artboards__no-results');
                    let hasResults = this.$ctx.find('.js-m-artboards__item:visible').length;
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

    onTabSwitched(data) {
        if (data.id === 'artboards') {
            this.$ctx.html(window.tpl.loaderspinner());
            window.postMessage('showArtboards');
        }
    }
});
