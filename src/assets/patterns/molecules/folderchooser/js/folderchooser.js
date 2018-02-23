import pluginCall from 'sketch-module-web-view/client'

Tc.Module.FolderChooser = Tc.Module.extend({
    on: function (callback) {
        this.sandbox.subscribe('events', this);
        callback();
    },

    render: function (folders, current) {
        var $content = $(window.tpl.folderchooser({
            folders: folders.folders,
            folder: folders.folder,
            current: current
        }));

        this.fire('openModal', {modifier: 'default', $content: $content}, ['events']);

        $content.on('submit', function (e) {
            e.preventDefault();
            var id = $content.find('.js-m-folderchooser__target').data('id');
            this.fire('closeModal', ['events']);
            pluginCall('folderSelected', id);
        }.bind(this));

        $content.on('reset', function (e) {
            e.preventDefault();
            this.fire('closeModal', ['events']);
        }.bind(this));

        $content.on('click', '.js-m-folderchooser__back', function (e) {
            var parent = $(e.currentTarget).data('parent');
            pluginCall('changeFolder', parent);
        }.bind(this));

        $content.on('click', '.js-m-folderchooser__item', function (e) {
            var id = $(e.currentTarget).data('id');
            pluginCall('changeFolder', id);
        }.bind(this));
    }
});