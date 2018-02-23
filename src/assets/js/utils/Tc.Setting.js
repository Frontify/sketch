Tc.Setting = Tc.Setting || {};

/*
 * Setting base class
 */
(function ($) {
    Tc.Setting.Base = Class.extend({
        init: function (mod, $ctx, setting) {
            this.mod = mod;
            this.$ctx = $ctx;
            this.$details = $($ctx.find('.js-m-setting__details').eq(0));
            this.$message = $();
            this.id = $ctx.data('id');
            this.animating = false;
            this.validator = null;
            this.isSetting = setting;
            this.$block = $();
            this.instant = $ctx.data('instant');
            this.method = $ctx.data('method') || 'post'; // useful for overriding with patch

            // render default actions if no others are available
            if($ctx.find('.js-m-setting__actions').length === 0) {
                this.$details.append($(window.tpl.settingactionsdetails({})));
            }

            if(setting) {
                this.active = false;

                if(!this.instant) {
                    if (this.$details.length === 0) {
                        this.$meta = $(window.tpl.settingmeta());
                        this.$meta.append($(window.tpl.settingactionsinline({})));
                        $ctx.append(this.$meta);
                    }

                    this.$block = $(window.tpl.settingblock({}));
                    $ctx.append(this.$block);
                }
            }
        },

        /* called on initial click on setting */
        enter: function() {
            this.$block.hide();
            this.active = true;
            this.$message.remove();
        },

        /* called when editing of setting is finished */
        leave: function() {
            this.$block.show();
            this.active = false;
        },

        /* called when another setting is clicked and current setting is not deactivated yet */
        unfocus: function() {
            // to be overridden
        },

        focus: function() {
            // to be overridden
        },


        clear: function() {
            // to be overriden
        },

        save: function() {
            var $ctx = this.$ctx;
            var info = this.serialize();

            if(api) {
                // return this.data[this.method](api, info);
            }
            else {
                return Promise.resolve($.extend(true, {}, { success: true }, info ));
            }
        },

        showDetails: function() {
            return new Promise(function(resolve) {
                if(this.$details && !this.$details.hasClass('state-open')) {
                    var $ctx = this.$ctx;
                    var $label = $ctx.find('.js-m-setting__label').clone().removeClass('state-hidden');

                    this.$details.prepend($label);
                    var offset = this.$details.offset();
                    var bottom = offset['top'] + parseInt(this.$details.outerHeight());
                    this.mod.resize(bottom);

                    this.$details.addClass('state-open');
                    this.$details.velocity('fadeIn', {
                        visibility: 'visible',
                        display: 'block',
                        complete: function() {
                            resolve();
                        }.bind(this)}
                    );
                }
                else {
                    resolve();
                }
            }.bind(this));
        },

        hideDetails: function() {
            return new Promise(function(resolve) {
                if (this.$details && this.$details.hasClass('state-open')) {
                    var $ctx = this.$ctx;

                    this.$details.velocity('fadeOut', {
                        duration: 1,
                        display: 'block',
                        visibility: 'hidden',
                        complete: function () {
                            this.$details.removeClass('state-open');
                            this.$details.find('.js-m-setting__label').remove();
                            this.mod.resize();
                            resolve();
                        }.bind(this)
                    });
                }
                else {
                    resolve();
                }
            }.bind(this));
        },

        showActions: function($actions) {
            return new Promise(function(resolve) {
                var $ctx = this.$ctx;
                if(!$actions) {

                    $actions = $ctx.find('.js-m-setting__actions');

                    // exclude actions from nested elems and settings
                    $actions = $actions.filter(function(index, el) {
                        var $el = $(el);
                        var $parents = $el.parentsUntil($ctx, '.js-co-settings__elem, .js-co-settings__setting');
                        return $parents.length === 0;
                    }.bind(this));

                    $actions = $($actions.eq(0));
                }

                $actions.velocity('stop');

                if(this.$details && this.$details.length === 0) {
                    $actions.velocity('transition.slideRightIn', {
                        visibility: 'visible',
                        duration: 300,
                        complete: function() {
                            resolve();
                        }
                    });
                }
                else {
                    if(!$actions.hasClass('state-open')) {
                        $actions.addClass('state-open');
                        $actions.velocity('transition.slideUpIn', {
                            visibility: 'visible',
                            duration: 300,
                            complete: function() {
                                resolve();
                            }
                        });
                    }
                    else {
                        resolve();
                    }
                }
            }.bind(this));
        },

        hideActions: function($actions) {
            return new Promise(function(resolve) {
                var $ctx = this.$ctx;
                $actions = $actions || $ctx.find('.js-m-setting__actions');
                $actions.velocity('stop');

                if (this.$details && this.$details.length === 0) {
                    $actions.velocity('reverse', {
                        visibility: 'hidden',
                        duration: 300,
                        complete: function () {
                            $actions.removeAttr('style');
                            resolve();
                        }
                    });
                }
                else {
                    if($actions.hasClass('state-open')) {
                        $actions.removeClass('state-open');
                        $actions.velocity('reverse', {
                            visibility: 'hidden',
                            duration: 300,
                            complete: function () {
                                resolve();
                            }
                        });
                    }
                    else {
                        resolve();
                    }
                }
            }.bind(this));
        },

        showSuccess: function($actions) {
            var sequence = [];

            return new Promise(function(resolve) {
                var $ctx = this.$ctx;
                $actions = $actions || $ctx.find('.js-m-setting__actions');

                if (this.$details && this.$details.length === 0) {
                    this.$message.remove();
                    this.$message = $(window.tpl.settingmessages({success: true}));

                    $actions.velocity('transition.slideRightOut', {duration: 100});

                    $ctx.append(this.$meta);
                    this.$meta.append(this.$message);

                    sequence = [
                        {e: this.$message, p: 'transition.slideRightIn', o: {duration: 300}},
                        {e: this.$message, p: 'reverse', o: {duration: 300, delay: 700, complete: function() {
                            resolve();
                        }}}
                    ];

                    $.Velocity.RunSequence(sequence);
                }
                else {
                    var $reset = $actions.find('button[type="reset"]');
                    var $submit = $actions.find('button[type="submit"]');
                    var $submitLabel = $submit.find('.js-m-setting__btn-label');
                    var $submitIcon = $submit.find('.js-m-setting__btn-icon--success');
                    var $loaderIcon = $submit.find('.js-m-setting__btn-icon--loading');
                    var width = $submit.data('width');

                    // stop velocity calls
                    $reset.velocity('stop');
                    $submit.velocity('stop');
                    $submitLabel.velocity('stop');
                    $submitIcon.velocity('stop');
                    $loaderIcon.velocity('stop');

                    /* reverser sequence */
                    var reverseSequence = [];

                    if($reset.length > 0) {
                        reverseSequence.push({e: $reset, p: 'transition.slideUpIn', o: {duration: 1, display: 'block'}});
                    }

                    reverseSequence = reverseSequence.concat([
                        {e: $submitIcon, p: 'fadeOut', o: {duration: 1, display: 'none'}},
                        {e: $submitLabel, p: { opacity: 1 }, o: { duration: 1, visibility: 'visible' }},
                        {e: $submit, p: { width: width }, o: {duration: 1, sequenceQueue: false}}
                    ]);


                    /* normal sequence */
                    sequence.push({e: $loaderIcon, p: 'fadeOut', o: {duration: 1, display: 'none'}});

                    if($reset.length > 0) {
                        sequence.push({e: $reset, p: 'transition.slideDownOut', o: {duration: 100}});
                    }

                    sequence = sequence.concat([
                        {e: $submitLabel, p: { opacity: 0 }, o: {duration: 100, visibility: 'hidden'}},
                        {e: $submit, p: { width: 47}, o: {duration: 150, sequenceQueue: false }},
                        {e: $submitIcon, p: 'fadeIn', o: {duration: 100, complete: function() {
                            setTimeout(function() {
                                $.Velocity.RunSequence(reverseSequence);
                                resolve();
                            }, 300);
                        }.bind(this)}}
                    ]);

                    $.Velocity.RunSequence(sequence);
                }

            }.bind(this));
        },

        showError: function($actions) {
            var $ctx = this.$ctx;
            $actions = $actions || $ctx.find('.js-m-setting__actions');

            if(!this.animating) {
                this.animating = true;

                if (this.$details && this.$details.length === 0) {
                    $actions.velocity('transition.slideRightOut', {duration: 100});

                    this.$message.remove();
                    this.$message = $(window.tpl.settingmessages({success: false}));

                    $ctx.append(this.$meta);
                    this.$meta.append(this.$message);

                    var sequence = [
                        {e: this.$message, p: 'transition.slideRightIn', o: {duration: 100}},
                        {e: this.$message, p: 'reverse', o: {duration: 300, delay: 700}},
                        {e: $actions, p: 'reverse', o: { duration: 100, display: 'block', complete: function() {
                            this.animating = false;
                        }.bind(this)}}
                    ];

                    $.Velocity.RunSequence(sequence);
                }
                else {
                    var $reset = $actions.find('button[type="reset"]');
                    var $submit = $actions.find('button[type="submit"]');
                    var $submitLabel = $submit.find('.js-m-setting__btn-label');
                    var $submitIcon = $submit.find('.js-m-setting__btn-icon--error');
                    var $loaderIcon = $submit.find('.js-m-setting__btn-icon--loading');
                    $submit.css({ width: $submit.outerWidth()});

                    // stop velocity calls
                    $reset.velocity('stop');
                    $submit.velocity('stop');
                    $submitLabel.velocity('stop');
                    $submitIcon.velocity('stop');
                    $loaderIcon.velocity('stop');

                    var reverseSequence = [
                        {e: $submitIcon, p: 'reverse', o: {duration: 100, display:'none', complete: function() {
                            $submit.removeClass('m-btn--danger');
                        }.bind(this)}},
                        {e: $submit, p: 'reverse', o: {duration: 150, sequenceQueue: false }},
                        {e: $submitLabel, p: 'reverse', o: {duration: 100 }},
                        {e: $reset, p: 'reverse', o: {duration: 1, display: 'block', complete: function() {
                            this.animating = false;
                        }.bind(this)}}
                    ];

                    var sequence = [
                        {e: $reset, p: 'transition.slideDownOut', o: {duration: 100}},
                        {e: $submitLabel, p: { opacity: 0 }, o: {duration: 100, visibility: 'hidden' }},
                        {e: $submit, p: { width: [47, $submit.outerWidth()] }, o: {duration: 150, sequenceQueue: false, complete: function() {
                            $submit.addClass('m-btn--danger');
                        }.bind(this)}},
                        {e: $submitIcon, p: 'fadeIn', o: {duration: 100, complete: function() {
                            setTimeout(function() {
                                $.Velocity.RunSequence(reverseSequence);
                            }, 300);
                        }.bind(this)}}
                    ];

                    $.Velocity.RunSequence(sequence);
                }
            }
        },

        showErrors: function(errors) {
            if(!this.validator) {
                console.log('Validation not enabled for this setting');
            }
            else {
                this.hideLoader().then(function() {
                    this.validator.showErrors(errors);
                    this.validator.focusInvalid();
                }.bind(this));
            }
        },

        validation: function(submitHandler, resetHandler, $ctx) {
            $ctx = $ctx || this.$ctx;
            var self = this;

            $ctx.on('reset', function(e) {
                $ctx.validate().resetForm();
                if($.isFunction(resetHandler)) {
                    resetHandler();
                }
            }.bind(this));

            this.validator = $ctx.validate({
                onfocusout: false,
                submitHandler: function() {
                    if(self.$details.length > 0) {
                        self.showLoader();
                    }

                    if($.isFunction(submitHandler)) {
                        submitHandler();
                    }
                },
                errorPlacement: this.errorPlacement.bind(this),
                showErrors: function() {
                    if(this.numberOfInvalids() > 0) {
                        self.showError();
                    }
                    this.defaultShowErrors();
                }
            });
        },

        showLoader: function($actions) {
            var $ctx = this.$ctx;
            $actions = $actions || $ctx.find('.js-m-setting__actions');
            var $reset = $actions.find('button[type="reset"]');
            var $submit = $actions.find('button[type="submit"]');
            var $submitLabel = $submit.find('.js-m-setting__btn-label');
            var $loaderIcon = $submit.find('.js-m-setting__btn-icon--loading');

            // stop velocity calls
            $reset.velocity('stop');
            $submit.velocity('stop');
            $submitLabel.velocity('stop');
            $loaderIcon.velocity('stop');

            $submit.data('width', $submit.outerWidth());

            var sequence = [];

            if($reset.length > 0) {
                sequence.push({e: $reset, p: 'transition.slideDownOut', o: {duration: 100}});
            }

            sequence = sequence.concat([
                {e: $submitLabel, p: {opacity: 0}, o: {duration: 100, visibility: 'hidden'}},
                {e: $submit, p: {width: 47}, o: {duration: 150, sequenceQueue: false}},
                {e: $loaderIcon, p: 'fadeIn', o: {duration: 100, display: 'inline-block'}}
            ]);

            $.Velocity.RunSequence(sequence);
        },

        hideLoader: function($actions) {
            return new Promise(function(resolve) {
                var $ctx = this.$ctx;

                if (this.$details && this.$details.length === 0) {
                    resolve(); // resolve immediately for settings without details
                }

                $actions = $actions || $ctx.find('.js-m-setting__actions');
                var $reset = $actions.find('button[type="reset"]');
                var $submit = $actions.find('button[type="submit"]');
                var $submitLabel = $submit.find('.js-m-setting__btn-label');
                var $loaderIcon = $submit.find('.js-m-setting__btn-icon--loading');
                // stop velocity calls
                $reset.velocity('stop');
                $submit.velocity('stop');
                $submitLabel.velocity('stop');
                $loaderIcon.velocity('stop');
                var sequence = [
                    {e: $loaderIcon, p: 'fadeOut', o: {duration: 100, display: 'none'}},
                    {e: $submit, p: 'reverse', o: {duration: 150 }},
                    {e: $submitLabel, p: {opacity: 1}, o: {duration: 150, visibility: 'visible', sequenceQueue: false }}
                ];

                if($reset.length > 0) {
                    sequence.push({e: $reset, p: 'reverse', o: {duration: 100, display: 'block', complete: function() {
                        resolve();
                    }}});
                }
                else {
                    resolve();
                }

                $.Velocity.RunSequence(sequence);
            }.bind(this));
        },

        hide: function () {
            this.$ctx.hide();
        },

        show: function () {
            this.$ctx.show();
        },

        errorPlacement: function($error, $element) {
            $error.addClass('m-setting__error');
            $element.parent().append($error);
            $error.velocity('transition.slideDownIn', { duration: 100 });
        },

        createGroup: function(data, groups, info) {
            var parts = groups.split('.');
            var group = parts.shift();
            data[group] = {};

            if(parts.length > 0) {
                data[group] = this.createGroup(data[group], parts.join('.'), info);
            }
            else {
                data[group] = info;
            }

            return data;
        }
    });
}(Tc.$));
