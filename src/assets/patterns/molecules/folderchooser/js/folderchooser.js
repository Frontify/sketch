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

        this.fire('openModal', {modifier: 'default', closeable: false, $content: $content}, ['events']);

        $content.on('submit', function (e) {
            e.preventDefault();
            var id = $content.find('.js-m-folderchooser__target').data('id');
            this.fire('closeModal', ['events']);
            window.postMessage('folderSelected', id);
        }.bind(this));

        $content.on('reset', function (e) {
            e.preventDefault();
            this.fire('closeModal', ['events']);
        }.bind(this));

        $content.on('click', '.js-m-folderchooser__back', function (e) {
            var parent = $(e.currentTarget).data('parent');
            window.postMessage('changeFolder', parent);
        }.bind(this));

        $content.on('click', '.js-m-folderchooser__item', function (e) {
            var id = $(e.currentTarget).data('id');
            window.postMessage('changeFolder', id);
        }.bind(this));

        // Add folders
        $content.on('blur', '.js-m-folderchooser__folder-create', function (e) {
            var $this = $(e.currentTarget);
            var folder = $.trim($this.val());

            if (folder !== '') {
                // add new folder
                var set = $content.find('.js-m-folderchooser__target').data('id');
                window.postMessage('addFolder', folder, set);
            }
            else {
                $this.val('');
            }
        }.bind(this));

        $content.on('keydown', '.js-m-folderchooser__folder-create', function (e) {
            var $this = $(e.currentTarget);

            if (e.which === 13 && !e.ctrlKey && !e.metaKey) {
                $this.trigger('blur');
                return false;
            }
            else if (e.which === 27 && !e.ctrlKey && !e.metaKey) {
                $this.val('');
                $this.trigger('blur');
                return false;
            }
        }.bind(this));
    }
});
