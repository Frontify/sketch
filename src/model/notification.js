import fetch from '../helpers/fetch';
import target from './target';
import source from './source';
import user from './user';

let MochaJSDelegate = require('mocha-js-delegate');
let threadDictionary = NSThread.mainThread().threadDictionary();

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

    connect(accessToken) {
        if (this.pusher) {
            return Promise.resolve(this.pusher);
        }

        return fetch('/v1/account/environment').then((data) => {
            if (data['pusher']['enabled']) {
                if (data['pusher']['region'] != 'us') {
                    this.pusher = PTPusher.pusherWithKey_delegate_encrypted_cluster(
                        data['pusher']['key'],
                        nil,
                        true,
                        data['pusher']['region']
                    );
                } else {
                    this.pusher = PTPusher.pusherWithKey_delegate_encrypted(data['pusher']['key'], nil, true);
                }

                this.pusher.authorizationURL = NSURL.URLWithString(
                    data['domain'] + `/v1/pusher/auth?access_token=${accessToken}`
                );
                this.pusher.connect();

                threadDictionary['frontifynotificationpusher'] = this.pusher;
                return this.pusher;
            }

            throw new Error('Pusher not enabled');
        });
    }

    disconnect() {
        if (this.pusher) {
            if (this.channel) {
                this.unsubscribe();
            }

            this.pusher.disconnect();

            threadDictionary.removeObjectForKey('frontifynotificationpusher');
            this.pusher = null;
        }
    }

    showNotification(data) {
        let notification = NSUserNotification.alloc().init();
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
            let delegate = new MochaJSDelegate({
                'didReceiveChannelEventNotification:': (notification) => {
                    let event = notification.userInfo().objectForKey('PTPusherEventUserInfoKey');
                    callback(event);
                },
            });

            let fiber = require('sketch/async').createFiber();

            let delegateInstance = delegate.getClassInstance();
            let sel = NSSelectorFromString('didReceiveChannelEventNotification:');

            NSNotificationCenter.defaultCenter().addObserver_selector_name_object(
                delegateInstance,
                sel,
                'PTPusherEventReceivedNotification',
                this.pusher
            );
        }
    }

    listen(accessToken) {
        return this.connect(accessToken)
            .then(() => {
                // subscribe to current chosen project
                return target.getTarget().then((target) => {
                    if (target.project) {
                        this.subscribe(target.project.id);

                        // bind events
                        this.on('screen-activity', (event) => {
                            let possibleActivities = ['OPEN', 'LOCAL_CHANGE', 'CLOSE'];
                            let eventData = event.data();
                            if (possibleActivities.indexOf('' + eventData.type) > -1) {
                                source.getCurrentAsset().then((asset) => {
                                    if (asset && '' + asset.id == '' + eventData.screen) {
                                        user.getUser().then((userData) => {
                                            if ('' + eventData.actor.id != '' + userData.id) {
                                                this.showNotification({
                                                    title: 'You are not alone',
                                                    image: eventData.actor.image,
                                                    description:
                                                        eventData.actor.name +
                                                        ' is currently working on ' +
                                                        asset.filename +
                                                        '. This might lead to conflicts.',
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });

                        return true;
                    }
                });
            })
            .catch((e) => {
                console.error(e);
            });
    }
}

export default new Notification();
