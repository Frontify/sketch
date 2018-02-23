/**
 * dropdown.dot.js
 *
 * A super-flexible and clean JQuery Dropdown Plugin based on dot.js Templates.
 *
 * @author Roger Dudler <roger.dudler@gmail.com>
 *
 * Modified!!
 */
(function ($) {
    $.fn.dropdown = function(options) {

        // Default settings
        var settings = $.extend({
            'selected': '.selected',
            'items': 'ul',
            'item': 'li',
            'openClass': 'open',
            'changed': function(data) {}
        }, options);

        return this.each(function() {

            var $this = $(this);

            // hide select element
            $this.hide();

            // prepare dropdown template
            var dtemplate = window.tpl[$this.data('template')];
            var dtemplateSelected = window.tpl[$this.data('template') + '-selected'];
            var data = { "selected": null, "items": [], "classes": $this.data('classes') };
            var selectedIndex = 0;
            var readonly = $this.is('[readonly]');

            // parse data for dropdown items
            $.each($this.find('option'), function(key, option) {
                var $option = $(option);
                var item = {
                    'value': $option.attr('value'),
                    'label': $option.text(),
                    'selected': $option.is(':selected')
                };

                // read data attributes
                var dataAttributes = $option.data();
                $.each(dataAttributes, function(name, value) {
                    item[name] = value;
                });

                if ($option.is(':selected')) {
                    data.selected = item;
                    selectedIndex = key;
                }
                data.items.push(item);
            });

            // render dropdown
            var $dropdown = $(dtemplate(data));
            var $items = $dropdown.find(settings.items);
            var $selected = $dropdown.find('> ' + settings.selected);

            // handle dropdown toggling
            $selected.on('mouseup', function() {
                $dropdown.focus();
                if ($items.is(':visible')) {
                    _closeDropdown();
                } else {
                    _openDropdown();
                }
                return false;
            });
            
            // handle dropdown reset
            $this.closest('form').on('reset.dropdown', function() {
                var $current = $this.find('[selected]');
                var item = $items.find(settings.item).first();

                if($current.length > 0) {
                    var currentIndex = $this.find('option').index($current);
                    item = $items.find(settings.item).get(currentIndex);
                }

                if (item) {
                    _chooseItem(item);
                }
            });

            // add custom classes
            if (data.classes) {
                $dropdown.addClass(data.classes);
            }

            $dropdown.on('focus', function() {
                $this.addClass('focus');
            });

            $dropdown.on('blur', function() {
                $this.removeClass('focus');
                _closeDropdown();
            });

            $dropdown.on('keydown', function(e) {
                var next = null;
                switch (e.keyCode) {
                    case 40: // down
                        if (!$dropdown.hasClass(settings.openClass)) {
                            _openDropdown();
                            next = $items.find('.selected');
                        } else {
                            next = $items.find('.hover').next(settings.item).first();
                            if (!next.length) {
                                next = $items.find(settings.item).first();
                            }
                        }
                        _selectItem(next, true);
                        e.preventDefault();
                        break;

                    case 38: // up
                        if (!$dropdown.hasClass(settings.openClass)) {
                            _openDropdown();
                            next = $items.find('.selected');
                        } else {
                            next = $items.find('.hover').prev(settings.item).first();
                            if (!next.length) {
                                next = $items.find(settings.item).last();
                            }
                        }
                        _selectItem(next, true);
                        e.preventDefault();
                        break;

                    case 13:
                        if (!$dropdown.hasClass(settings.openClass)) {
                            _openDropdown();
                        } else {
                            var item = $items.find('.hover').first();
                            if (item) {
                                _chooseItem(item);
                            }
                        }
                        e.preventDefault();
                        break;
                }
            });

            // hide selected item from list
            $items.find('[data-index=' + selectedIndex + ']').addClass('selected');

            // handle clicks on items
            $items.on('mouseup', settings.item, function() {
                _chooseItem(this);
                return false;
            });

            $items.on('mouseover', settings.item, function() {
                _selectItem(this, false);
            });

            function _selectItem(option, reveal) {
                var $option = $(option);
                $items.find(settings.item).removeClass('hover');
                $option.addClass('hover');
                if (reveal) {
                    $option.parent().scrollTop($option.position().top-$option.height());
                }
            }

            function _chooseItem(option) {
                var index = $(option).data('index');
                var item = data.items[index];
                $dropdown.find('> ' + settings.selected).html(dtemplateSelected(item));
                $items.find('[data-index=' + selectedIndex + ']').removeClass('selected');
                selectedIndex = index;
                $(option).addClass('selected');
                $this.val(item.value);
                item.srcElement = $dropdown;
                settings.changed(item);
                _closeDropdown();
            }

            function _openDropdown() {
                if(readonly) {
                    return;
                }

                $items.show();
                $dropdown.addClass(settings.openClass);
                
                if($.isFunction(settings.open)) {
                    settings.open();
                }
            }

            function _closeDropdown() {
                $items.hide();
                $dropdown.removeClass(settings.openClass);

                if($.isFunction(settings.close)) {
                    settings.close();
                }
            }

            // insert dropdown into dom tree
            return $this.before($dropdown);
        });
    };
})(jQuery);
