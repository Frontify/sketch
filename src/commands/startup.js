import notification from '../model/notification';
import user from '../model/user';

/**
 * Triggered on plugin startup (when the plugin is installed and on subsequent
 * Sketch restarts).
 */
export default function (context) {
    loadFramework('pusher', 'PTPusher', context);

    const accessToken = user.getAccessToken();

    if (accessToken) {
        notification.listen(accessToken);
    }
}

function loadFramework(name, checkClassName, context) {
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
