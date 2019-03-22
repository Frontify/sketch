import fetch from '../helpers/fetch'

var MochaJSDelegate = require('mocha-js-delegate');
var threadDictionary = NSThread.mainThread().threadDictionary();

class Notification {
    constructor() {
        this.pusher = null;
        this.channel = null;

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

    disconnect() {
        if(this.pusher) {
            if(this.channel) {
                this.unsubscribe();
            }

            if(threadDictionary['frontifynotificationobservers']) {
                threadDictionary['frontifynotificationobservers'].forEach(function(observer) {
                    NSNotificationCenter.defaultCenter().removeObserver(observer);
                }.bind(this));

                threadDictionary.removeObjectForKey('frontifynotificationobservers');
            }

            threadDictionary.removeObjectForKey('frontifynotificationpusher');
            this.pusher = null;

        }
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

    unsubscribe() {
        if (this.pusher) {
            if (this.channel) {
                this.channel.unsubscribe();
                threadDictionary.removeObjectForKey('frontifynotificationchannel');
                this.channel = null;

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

            // Keep script around, otherwise everything will be dumped once its run
            COScript.currentCOScript().setShouldKeepAround(true);

            var delegateInstance = delegate.getClassInstance();
            var sel = NSSelectorFromString('didReceiveChannelEventNotification:');

            if(!threadDictionary['frontifynotificationobservers']) {
                threadDictionary['frontifynotificationobservers'] = [];
            }

            threadDictionary['frontifynotificationobservers'].push(NSNotificationCenter
                .defaultCenter()
                .addObserver_selector_name_object(delegateInstance, sel, 'PTPusherEventReceivedNotification', this.pusher));
        }
    }
}

export default new Notification();

