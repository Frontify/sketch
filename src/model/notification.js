import fetch from '../helpers/fetch'

var MochaJSDelegate = require('mocha-js-delegate');
var threadDictionary = NSThread.mainThread().threadDictionary();

class Notification {
    constructor() {
        this.pusher = null;
        this.channel = null;
        this.bindings = {};

        if (threadDictionary['frontifynotificationbindings']) {
            this.bindings = threadDictionary['frontifynotificationbindings'];
        }

        if (threadDictionary['frontifynotificationpusher']) {
            this.pusher = threadDictionary['frontifynotificationpusher'];
        }

        if (threadDictionary['frontifynotificationchannel']) {
            this.channel = threadDictionary['frontifynotificationchannel'];
        }
    }

    connect() {
        return fetch('/v1/account/environment').then(function (data) {
            if (data['pusher']['enabled']) {
                if (data['pusher']['region'] != 'us') {
                    this.pusher = PTPusher.pusherWithKey_delegate_encrypted_cluster(data['pusher']['key'], nil, true, data['pusher']['region']);
                }
                else {
                    this.pusher = PTPusher.pusherWithKey_delegate_encrypted(data['pusher']['key'], nil, true);
                }

                this.pusher.authorizationURL = NSURL.URLWithString(data['domain'] + '/api/pusher/auth');
                this.pusher.connect();

                threadDictionary['frontifynotificationpusher'] = this.pusher;

                return this.pusher;
            }

            return null;
        }.bind(this));
    }

    showNotification(data) {
        var notification = NSUserNotification.alloc().init();
        notification.title = data.title;
        notification.contentImage = NSImage.alloc().initByReferencingURL(NSURL.URLWithString(data.image));
        notification.informativeText = data.description;
        notification.soundName = NSUserNotificationDefaultSoundName;

        NSUserNotificationCenter.defaultUserNotificationCenter().deliverNotification(notification);
    }

    subscribe(project) {
        if (this.pusher) {
            this.channel = this.pusher.subscribeToPresenceChannelNamed_delegate('project-' + project, nil);
            threadDictionary['frontifynotificationchannel'] = this.channel;
        }
    }

    unsubscribe(project) {
        if (this.pusher) {
            if (this.channel) {
                this.channel.unsubscribe();
            }
        }
    }

    on(event, callback) {
        if (this.pusher) {
            var delegate = new MochaJSDelegate({
                'didReceiveChannelEventNotification:': function (notification) {
                    var event = notification.userInfo().objectForKey('PTPusherEventUserInfoKey');
                    callback(event);
                }
            });
            var delegateInstance = delegate.getClassInstance();
            var sel = NSSelectorFromString('didReceiveChannelEventNotification:');

            NSNotificationCenter
                .defaultCenter()
                .addObserver_selector_name_object(delegateInstance, sel, 'PTPusherEventReceivedNotification', this.pusher);
        }
    }
}

export default new Notification();

