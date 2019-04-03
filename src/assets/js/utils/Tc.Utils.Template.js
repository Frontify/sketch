(function ($) {
    "use strict";

    Tc.Utils.Template = Class.extend({
        init: function () {

        },

        truncate: function(str, suffixLength, maxLength, minLength) {
            suffixLength = suffixLength !== undefined ? suffixLength : 8;
            maxLength = maxLength !== undefined ? maxLength : 40;
            minLength = minLength !== undefined ? minLength : 0;

            if (str && str.length > minLength && str.length > maxLength) {
                let end = str.substring(str.length - suffixLength);
                let begin = str.substring(0, str.length - suffixLength);
                begin = begin.substring(0, maxLength);

                return begin + '&hellip;' + end;
            }
            else {
                return str;
            }
        },

        isEmpty: function(value) {
            return !(value && $.trim(value.replace(/<\/?[^>]+(>|$)/g, "")) !== '');
        },

        escape: function (str) {
            if (str == null) return '';

            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
    });
})(Tc.$);
