import notification from '../model/notification';
import source from '../model/source';
import user from '../model/user';
import target from '../model/target';
import executeSafely from '../helpers/executeSafely';

/**
 * Triggered on plugin startup (when the plugin is installed and on subsequent
 * Sketch restarts).
 */
export default function (context) {
    executeSafely(context, function () {
        loadFramework('pusher', 'PTPusher', context);

        var possibleActivities = ['OPEN', 'LOCAL_CHANGE', 'CLOSE'];

        notification.connect().then(function (client) {
            if (client) {
                // subscribe to current chosen project
                target.getSimpleTarget().then(function (target) {
                    if (target.project) {
                        notification.subscribe(target.project);

                        // bind events
                        notification.on('screen-activity', function (event) {
                            var eventData = event.data();

                            if (possibleActivities.indexOf('' + eventData.type) > -1) {
                                source.getCurrentAsset().then(function (asset) {
                                    if (asset && '' + asset.id == '' + eventData.screen) {
                                        user.getUser().then(function (userData) {
                                            if ('' + eventData.actor.id != '' + userData.id) {
                                                notification.showNotification({
                                                    title: 'You are not alone',
                                                    image: eventData.actor.image,
                                                    description: eventData.actor.name + ' is currently working on ' + asset.filename + '. This might lead to conflicts.'
                                                });
                                            }
                                        }.bind(this));
                                    }
                                }.bind(this));
                            }
                        }.bind(this));
                    }
                }.bind(this));
            }
        }.bind(this));
    });
}

function loadFramework(name, checkClassName, context) {
    if (NSClassFromString(checkClassName) == null) {
        var mocha = Mocha.sharedRuntime();
        return mocha.loadFrameworkWithName_inDirectory(name, context.scriptPath.stringByDeletingLastPathComponent() + '/frameworks');
    } else {
        return true;
    }
}
