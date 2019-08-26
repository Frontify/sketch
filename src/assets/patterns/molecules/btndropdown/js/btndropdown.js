(function ($) {

    Tc.Module.BtnDropdown = Tc.Module.extend({
        on: function (callback) {
            let $ctx = this.$ctx;

            this.sandbox.subscribe('events', this);
            this.observer = null;

            // events
            $('html').on('mousedown.btndropdown', function (e) {
                // outside click ($ctx is <body>)
                let $this = $(e.target);
                let $menu = $this.closest('.js-m-btn-dropdown__menu');
                let $toggle = $this.closest('.js-m-btn-dropdown__toggle');
                let isModal = $('body').hasClass('state-m-modal-visible');
                if ($menu.length === 0 && $toggle.length === 0 && !isModal) {
                    this.onCloseDropdown($ctx.find('.js-m-btn-dropdown__menu.state-open'));
                }
            }.bind(this));

            $ctx.on('click.btndropdown', '.js-m-btn-dropdown__close', function (e) {
                let $this = $(e.target);
                let $menu = $this.closest('.js-m-btn-dropdown__menu');
                this.onCloseDropdown($menu);
            }.bind(this));

            $ctx.on('click.btndropdown', '.js-m-btn-dropdown__toggle', function (e) {
                e.stopPropagation();

                let $currentToggle = $(e.currentTarget);

                // close all open dropdown except current (and open parents for nested menus)
                let $closeToggles = $ctx.find('.js-m-btn-dropdown__toggle.state-open').filter(function (index, toggle) {
                    let $toggle = $(toggle);

                    if ($toggle.is($currentToggle)) {
                        return false;
                    }

                    let hasOpenParents = false;
                    $currentToggle.closest('.m-btn-dropdown').parents('.m-btn-dropdown').each(function (index, el) {
                        let $openToggles = $(el).find('.js-m-btn-dropdown__toggle.state-open');
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
                    let $toggle = $(toggle);
                    let $menu = $toggle.next('.js-m-btn-dropdown__menu');
                    this.close($toggle, $menu);
                }.bind(this));

                // toggle current menu
                let $currentMenu = $currentToggle.next('.js-m-btn-dropdown__menu');
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
            let event = $toggle.data('event');
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
                let config = {subtree: false, childList: true};

                // pass in the target node, as well as the observer options
                this.observer.observe($menu.get(0), config);
            }
        },

        position: function ($toggle, $menu) {
            // check horizontal dimension
            let offset = $menu.offset();

            let width = parseInt($menu.outerWidth());
            let offsetLeft = offset.left;
            let maxWidth = parseInt($(window).width());

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
            let height = parseInt($menu.outerHeight());
            let offsetTop = offset.top - parseInt($(window).scrollTop());
            let maxHeight = parseInt($(window).height());

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

            let event = $toggle.data('event');
            if (event) {
                this.fire(event + 'Closed', {$toggle: $toggle, $menu: $menu}, ['events']);
            }

            $toggle.removeClass('state-open');
            $menu.hide().removeClass('state-open');
        },

        onCloseDropdown: function ($elem) {
            if ($elem && $elem.length > 0) {
                let $toggle, $menu;
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
                let $toggle, $menu;
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

