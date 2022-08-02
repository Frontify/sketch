import fetch from '../helpers/fetch';
import target from './target';
import source from './source';
import user from './user';
import { loadFramework } from '../commands/startup';
import writeJSON from '../helpers/writeJSON';
import writeLog from '../helpers/writeLog';

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

    connect() {
        console.log('⚡️ Pusher :: connect');
        writeLog('⚡️ Pusher :: connect');
        if (this.pusher) {
            writeLog('⚡️ Pusher :: return already available instance');
            return Promise.resolve(this.pusher);
        }

        writeLog('⚡️ Pusher :: Fetch environement');

        return fetch('/v1/account/environment').then(
            function (data) {
                writeLog('⚡️ Pusher :: Received Data, ' + JSON.stringify(data));
                console.log('⚡️ Received Data', data);
                if (data['pusher']['enabled']) {
                    if (data['pusher']['region'] != 'us') {
                        writeLog('⚡️ Pusher :: enabled and region is not US');

                        this.pusher = PTPusher.pusherWithKey_delegate_encrypted_cluster(
                            data['pusher']['key'],
                            nil,
                            true,
                            data['pusher']['region']
                        );
                    } else {
                        writeLog('⚡️ Pusher :: Region is US');
                        this.pusher = PTPusher.pusherWithKey_delegate_encrypted(data['pusher']['key'], nil, true);
                    }

                    this.pusher.authorizationURL = NSURL.URLWithString(data['domain'] + '/api/pusher/auth');
                    writeLog('⚡️ Pusher :: Authorization URL ' + this.pusher.authorizationURL());

                    writeLog('⚡️ Pusher :: Connect');

                    this.pusher.connect();

                    threadDictionary['frontifynotificationpusher'] = this.pusher;
                    writeLog('⚡️ Pusher :: Return');
                    return this.pusher;
                }

                throw new Error('Pusher not enabled');
            }.bind(this)
        );
    }

    disconnect() {
        console.log('⚡️ Pusher :: Disconnect');
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
        console.log('⚡️ Pusher :: Show Notification');
        let notification = NSUserNotification.alloc().init();
        notification.title = data.title;
        notification.contentImage = NSImage.alloc().initByReferencingURL(NSURL.URLWithString(data.image));
        notification.informativeText = data.description;
        notification.soundName = NSUserNotificationDefaultSoundName;

        NSUserNotificationCenter.defaultUserNotificationCenter().deliverNotification(notification);
    }

    subscribe(project) {
        writeLog('⚡️ Pusher :: subscribe to project: ' + project);
        if (this.pusher) {
            this.channel = this.pusher.subscribeToPresenceChannelNamed_delegate('project-' + project, nil);
            threadDictionary['frontifynotificationchannel'] = this.channel;
        }
    }

    unsubscribe() {
        writeLog('⚡️ Pusher :: unsubscribe');
        if (this.pusher) {
            if (this.channel) {
                this.channel.unsubscribe();
                threadDictionary.removeObjectForKey('frontifynotificationchannel');
                this.channel = null;
            }
        }
    }

    on(event, callback) {
        console.log('⚡️ Pusher :: on', event);
        if (this.pusher) {
            let delegate = new MochaJSDelegate({
                'didReceiveChannelEventNotification:': function (notification) {
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
            console.log('⚡️ event listener set up');
        }
    }

    listen() {
        console.log('⚡️ Pusher :: listen');
        return this.connect()
            .then(
                function () {
                    // subscribe to current chosen project
                    return source.getCurrentAsset().then(
                        function (source) {
                            writeLog('⚡️ Pusher :: Received current asset: ' + source.id || source.refs.remote_id);

                            if (source.refs.remote_project_id) {
                                this.subscribe(source.refs.remote_project_id);

                                writeLog('⚡️ Pusher :: Subscribe to: ' + source.refs.remote_project_id);

                                // bind events
                                this.on(
                                    'screen-activity',
                                    function (event) {
                                        writeLog('⚡️ Pusher :: Event: ' + JSON.stringify(event.data()));
                                        console.log(event.data());

                                        // Filter relevant activities from the event’s data
                                        let possibleActivities = ['OPEN', 'LOCAL_CHANGE', 'CLOSE'];
                                        let eventData = event.data();
                                        if (possibleActivities.indexOf('' + eventData.type) > -1) {
                                            /**
                                             * In general, notifications are fired on a per-project basis.
                                             * When we receive an event, we need to figure out if it is related to
                                             * the current asset and wether it’s from a different user.
                                             *
                                             * 1. Compare asset id of current asset and the asset from the event
                                             * 2. Compare the user id’s to figure out if the activity was from a different user
                                             */
                                            source
                                                .getCurrentAsset()
                                                .then(
                                                    function (asset) {
                                                        console.log('on :: ', asset);
                                                        console.log('on :: ', eventData);
                                                        if (asset && '' + asset.id == '' + eventData.screen) {
                                                            console.log('on :: ', 'same');
                                                            user.getUser().then(
                                                                function (userData) {
                                                                    console.log('on :: user');
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
                                                                }.bind(this)
                                                            );
                                                        }
                                                    }.bind(this)
                                                )
                                                .catch((error) => {
                                                    console.error(error);
                                                });
                                        }
                                    }.bind(this)
                                );

                                return true;
                            }
                        }.bind(this)
                    );
                }.bind(this)
            )
            .catch(
                function (e) {
                    console.error(e);
                }.bind(this)
            );
    }
}

export default new Notification();
