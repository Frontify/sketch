(function ($) {

    Tc.Module.BtnDropdown = Tc.Module.extend({
        on: function (callback) {
            var $ctx = this.$ctx;

            this.sandbox.subscribe('events', this);
            this.observer = null;

            // events
            $('html').on('mousedown.btndropdown', function (e) {
                // outside click ($ctx is <body>)
                var $this = $(e.target);
                var $menu = $this.closest('.js-m-btn-dropdown__menu');
                var $toggle = $this.closest('.js-m-btn-dropdown__toggle');
                var isModal = $('body').hasClass('state-m-modal-visible');
                if ($menu.length === 0 && $toggle.length === 0 && !isModal) {
                    this.onCloseDropdown($ctx.find('.js-m-btn-dropdown__menu.state-open'));
                }
            }.bind(this));

            $ctx.on('click.btndropdown', '.js-m-btn-dropdown__close', function (e) {
                var $this = $(e.target);
                var $menu = $this.closest('.js-m-btn-dropdown__menu');
                this.onCloseDropdown($menu);
            }.bind(this));

            $ctx.on('click.btndropdown', '.js-m-btn-dropdown__toggle', function (e) {
                e.stopPropagation();

                var $currentToggle = $(e.currentTarget);

                // close all open dropdown except current (and open parents for nested menus)
                var $closeToggles = $ctx.find('.js-m-btn-dropdown__toggle.state-open').filter(function (index, toggle) {
                    var $toggle = $(toggle);

                    if ($toggle.is($currentToggle)) {
                        return false;
                    }

                    var hasOpenParents = false;
                    $currentToggle.closest('.m-btn-dropdown').parents('.m-btn-dropdown').each(function (index, el) {
                        var $openToggles = $(el).find('.js-m-btn-dropdown__toggle.state-open');
                        if ($openToggles.length > 0) {
                            hasOpenParents = true;
                        }
                    });

                    if (hasOpenParents) {
                        return false;
                    }

                    return true;
                }.bind(this));

                $closeToggles.each(function (index, toggle) {
                    var $toggle = $(toggle);
                    var $menu = $toggle.next('.js-m-btn-dropdown__menu');
                    this.close($toggle, $menu);
                }.bind(this));

                // toggle current menu
                var $currentMenu = $currentToggle.next('.js-m-btn-dropdown__menu');
                this.toggle($currentToggle, $currentMenu);
            }.bind(this));

            callback();
        },

        toggle: function ($toggle, $menu) {
            if (!$toggle.hasClass('state-open')) {
                this.open($toggle, $menu);
            }
            else {
                this.close($toggle, $menu);
            }
        },

        open: function ($toggle, $menu) {
            $toggle.addClass('state-open');
            var event = $toggle.data('event');
            if (event) {
                this.fire(event + 'Opened', {$toggle: $toggle, $menu: $menu}, ['events']);
            }

            $menu.show().addClass('state-open');

            this.position($toggle, $menu);

            if (this.observer) {
                this.observer.disconnect();
            }

            if (MutationObserver) {
                this.observer = new MutationObserver(function (mutations) {
                    this.position($toggle, $menu);
                }.bind(this));

                // configuration of the observer:
                var config = {subtree: false, childList: true};

                // pass in the target node, as well as the observer options
                this.observer.observe($menu.get(0), config);
            }
        },

        position: function ($toggle, $menu) {
            // check horizontal dimension
            var offset = $menu.offset();

            var width = parseInt($menu.outerWidth());
            var offsetLeft = offset.left;
            var maxWidth = parseInt($(window).width());

            if ($menu.hasClass('m-btn-dropdown__menu--center')) {
                $menu.css({left: (-width/2 + parseInt($toggle.outerWidth())/2 + ($menu.data('offset') || 0)) + 'px', right: 'auto'});
                offsetLeft = $menu.offset().left;
            }

            if (offsetLeft + width > maxWidth) {
                $menu.css({left: 'auto', right: 0});
            }

            if (offsetLeft < 60) {
                $menu.css({left: 0, right: 'auto'});
            }

            // check vertical dimension
            var height = parseInt($menu.outerHeight());
            var offsetTop = offset.top - parseInt($(window).scrollTop());
            var maxHeight = parseInt($(window).height());

            if (offsetTop + height > maxHeight && offsetTop - height > 60 && !$menu.hasClass('m-btn-dropdown__menu--below')) {
                $menu.css({top: 'auto', bottom: '120%'});
            }
            else if (!$menu.hasClass('m-btn-dropdown__menu--above')) {
                $menu.css({top: '120%', bottom: 'auto'});
            }

            if($menu.hasClass('m-btn-dropdown__menu--middle')) {
                $menu.css({ bottom: 'auto', top: 'auto', transform: 'translateY(-50%)'});
            }
        },

        close: function ($toggle, $menu) {
            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            var event = $toggle.data('event');
            if (event) {
                this.fire(event + 'Closed', {$toggle: $toggle, $menu: $menu}, ['events']);
            }

            $toggle.removeClass('state-open');
            $menu.hide().removeClass('state-open');
        },

        onCloseDropdown: function ($elem) {
            if ($elem && $elem.length > 0) {
                var $toggle, $menu;
                if ($elem.hasClass('js-m-btn-dropdown__toggle')) {
                    $toggle = $elem;
                    $menu = $toggle.next('.js-m-btn-dropdown__menu');
                    this.close($toggle, $menu);
                }
                else if ($elem.hasClass('js-m-btn-dropdown__menu')) {
                    $menu = $elem;
                    $toggle = $menu.prev('.js-m-btn-dropdown__toggle');
                    this.close($toggle, $menu);
                }
            }
        },

        onOpenDropdown: function ($elem) {
            if ($elem && $elem.length > 0) {
                var $toggle, $menu;
                if ($elem.hasClass('js-m-btn-dropdown__toggle')) {
                    $toggle = $elem;
                    $menu = $toggle.next('.js-m-btn-dropdown__menu');
                    this.open($toggle, $menu);
                }
                else if ($elem.hasClass('js-m-btn-dropdown__menu')) {
                    $menu = $elem;
                    $toggle = $menu.prev('.js-m-btn-dropdown__toggle');
                    this.open($toggle, $menu);
                }
            }
        }
    });
}(Tc.$));

