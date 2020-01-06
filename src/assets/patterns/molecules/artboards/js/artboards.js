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

        $ctx.on('click', '.js-m-artboards__upload-button', function(e) {
            let $this = $(e.currentTarget);
            let $item = $this.closest('.js-m-artboards__item');
            let artboard = this.getArtboard($item.data('idExternal'));

            e.stopPropagation();
            window.postMessage('uploadArtboard', artboard);
            this.updateItemState($item, 'uploading');
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload-all', function(e) {
            let artboards = [];
            let $uploadAllTrigger = $ctx.find('.js-m-artboards__upload-all');

            e.stopPropagation();
            $uploadAllTrigger.attr('disabled', 'disabled');

            $.each($ctx.find('.js-m-artboards__item'), function(index, item) {
                let $item = $(item);
                let artboard = this.getArtboard($item.data('idExternal'))
                artboards.push(artboard);
                this.updateItemState($item, 'uploading');
            }.bind(this));

            // give button time to gray out
            setTimeout(function() {
                window.postMessage('uploadArtboards', artboards);
            }, 20);
        }.bind(this));

        $ctx.on('click', '.js-m-artboards__upload-selected', function(e) {
            let artboards = [];
            let $uploadSelectedTrigger = $ctx.find('.js-m-artboards__upload-selected');

            e.stopPropagation();
            $uploadSelectedTrigger.attr('disabled', 'disabled');

            $.each($ctx.find('.js-m-artboards__item.state-selected'), function(index, item) {
                let $item = $(item);
                let artboard = this.getArtboard($item.data('idExternal'));
                artboards.push(artboard);
                this.updateItemState($item, 'uploading');
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

    updateItemState: function ($item, state) {
        var $allStates = $item.find('.js-m-artboards__upload-state');
        var $upload = $item.find('.js-m-artboards__upload');
        var $matchingState = null;

        $upload
            .removeClass('state-inactive')
            .removeClass('state-uploading')
            .removeClass('state-success')
            .removeClass('state-failed')
            .removeClass('state-no-changes');

        if (state === 'uploading') {
            $matchingState = $item.find('.js-m-artboards__upload-state--uploading');
            $upload.addClass('state-uploading');
        }

        else if (state === 'failed') {
            $matchingState = $item.find('.js-m-artboards__upload-state--failed');
            $upload.addClass('state-failed');
        }

        else if (state === 'success') {
            $matchingState = $item.find('.js-m-artboards__upload-state--success');
            $upload.addClass('state-success');
        }

        else if (state === 'no-changes') {
            $matchingState = $item.find('.js-m-artboards__upload-state--no-changes');
            $upload.addClass('state-no-changes');
        }

        else {
            $upload.addClass('state-inactive');
        }

        $allStates.removeClass('state-visible');
        $allStates.addClass('state-hidden');
        $matchingState.addClass('state-visible');
    },

    updateArtboardSelection: function (selectedArtboards) {
        let $ctx = this.$ctx;
        let $allArtboardItems = $ctx.find('.js-m-artboards__item');
        let $uploadSelectedTrigger = $ctx.find('.js-m-artboards__upload-selected');

        $allArtboardItems.removeClass('state-selected');

        selectedArtboards.forEach(function(layerId) {
            let $matchingArtboard = $selectedArtboardItems = $ctx.find('.js-m-artboards__item[data-id-external="' + layerId + '"]');
            $matchingArtboard.addClass('state-selected');
        }.bind(this));

        if (selectedArtboards.length > 0) {
            $uploadSelectedTrigger.removeAttr('disabled');
        }
        else {
            $uploadSelectedTrigger.prop('disabled', true);
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

        if (data.nochanges) {
            this.updateItemState($item, 'no-changes');
        }
        else {
            this.updateItemState($item, 'success');
        }
    },

    artboardUploadFailed: function(data) {
        let $ctx = this.$ctx;
        let $item = $ctx.find('.js-m-artboards__item[data-id-external="' + data.id_external + '"]');


        this.updateItemState($item, 'failed');
    },

    onPreviewReady: function (layerId, path) {
        this.updatePreviewImage(layerId, path);
    },

    updatePreviewImage: function (layerId,  path) {
        var $image = this.$ctx.find('.js-m-artboards__item[data-id-external="' + layerId + '"] .js-m-artboards__preview-image');
        $image.attr('src', 'file://' + path + layerId + '.png');
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
