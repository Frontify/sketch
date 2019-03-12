Tc.Module.Status = Tc.Module.extend({
    on: function (callback) {
        var $ctx = this.$ctx;
        this.setStatus(navigator.onLine);

        // Status events
        window.addEventListener('offline', function () {
            this.setStatus(navigator.onLine);
        }.bind(this));

        window.addEventListener('online', function () {
            this.setStatus(navigator.onLine);
            window.postMessage('online');
        }.bind(this));

        callback();
    },

    setStatus: function (status) {
        var $ctx = this.$ctx;

        if (status) {
            $ctx.removeClass('state-offline');
        }
        else {
            $ctx.addClass('state-offline');
        }
    }
});
