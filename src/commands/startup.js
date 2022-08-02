import notification from '../model/notification';
import user from '../model/user';
import writeLog from '../helpers/writeLog';

/**
 * Triggered on plugin startup (when the plugin is installed and on subsequent
 * Sketch restarts).
 */
export default function (context) {
    writeLog('⚡️ Pusher :: Framework loaded');
    loadFramework('pusher', 'PTPusher', context);

    if (user.isAuthenticated()) {
        notification.listen();
    }
}

export function loadFramework(name, checkClassName, context) {
    if (NSClassFromString(checkClassName) == null) {
        let mocha = Mocha.sharedRuntime();

        return mocha.loadFrameworkWithName_inDirectory(
            name,
            context.scriptPath.stringByDeletingLastPathComponent() + '/frameworks'
        );
    } else {
        return true;
    }
}
