(function ($) {
    Tc.Module.Modal = Tc.Module.extend({
        on: function (callback) {
            var $ctx = this.$ctx;

            this.$overlay = $('.js-m-modal__overlay');
            this.mId = $ctx.data('modal-id');
            this.isOpen = false;
            this.closeable = true;
            this.sandbox.subscribe('events', this);

            // open modal
            $('body').on('click.m-modal', '.js-m-modal__open', function (e) {
                var $target = $(e.currentTarget);
                var modalId = $target.data('modal-id') || 'modal';
                if(this.mId === modalId) {
                    this.open({ modifier: $target.data('modal-modifier')});
                }
            }.bind(this));

            $ctx.on('click', '.js-m-modal__close', function () {
                this.close(true);
            }.bind(this));

            $(document).keyup(function (e) {
                if (e.which === 27) {
                    this.close();
                }
            }.bind(this));

            callback();
        },

        close: function (force) {
            // guard to prevent race conditions
            if (!this.isOpen || (!this.closeable && !force)) {
                return;
            }
            this.isOpen = false;
            Tc.Module.Modal.count--;

            var $ctx = this.$ctx;
            $ctx.removeClass('state-visible');

            if(Tc.Module.Modal.count === 0) {
                $('body').removeClass('state-m-modal-visible', false);
                this.$overlay.removeClass('state-visible');
            }
            else {
                this.$overlay.css({ zIndex: 2000 + Tc.Module.Modal.count});
            }

            this.sandbox.removeModules($ctx.find('.js-m-modal__content'));
            $ctx.off('click.modal');
        },

        open: function (data) {
            var $ctx = this.$ctx;
            var modifier = data.modifier || null;
            var $container = $ctx.find('.js-m-modal__content');

            // guard to prevent race conditions
            if (this.isOpen) {
                return;
            }
            this.isOpen = true;
            Tc.Module.Modal.count++;

            var $close = $ctx.find('> .js-m-modal__close');

            if(!this.closeable) {
                // hide close button
               $close.addClass('state-hidden');
            }
            else {
                // show close button
                $close.removeClass('state-hidden');
            }

            // remove modifier classes
            $container.attr('class', $container.attr('class').replace(/\bm-modal__content--.*?\b/g, ''));
            if(modifier) {
                $container.addClass('m-modal__content--' + modifier);
            }

            // close modal
            $ctx.on('click.modal' + this.id, function(e) {
                if($(e.target).closest('.js-m-modal__content').length === 0) {
                    this.close();
                }
            }.bind(this));

            $('body').addClass('state-m-modal-visible', false);
            this.$overlay.css({ zIndex: 2000 + 2 * Tc.Module.Modal.count}).addClass('state-visible');
            $ctx.css({ zIndex: 2000 + 2 * Tc.Module.Modal.count + 1}).addClass('state-visible');

            setTimeout(function() {
                this.fire('modalOpened', { id: this.mId }, ['events']);
            }.bind(this), 200);
        },

        onOpenModal: function(data) {
            var id = data.id || 'modal';
            var $ctx = this.$ctx;
            this.closeable = true;

            if(id === this.mId) {
                this.closeable = data.closeable !== false;

                if(data.$content) {
                    var $container = $ctx.find('.js-m-modal__content');
                    $container.html(data.$content);
                    if(data.terrific !== false) {
                        this.sandbox.addModules($container);
                    }
                }

                this.open({ modifier: data.modifier });
            }
        },

        onCloseModal: function(data) {
            var id = data.id || 'modal';

            if(id === this.mId) {
                this.close(true);
            }
        }
    });

    Tc.Module.Modal.count = 0;
})(Tc.$);
