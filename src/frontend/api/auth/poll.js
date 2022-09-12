import oauth from '../../api/oauth';

export default async function (context) {
    let pollResponse = await oauth.poll(context.rootState.authData);

    if (pollResponse.success) {
        context.rootState.authData.code = pollResponse.code;

        // got the code, now let’s get the access token
        let tokenResponse = await oauth.accessToken(context.rootState.authData);

        if (tokenResponse.token_type == 'Bearer') {
            context.rootState.authData.expiresIn = tokenResponse.expires_in;
            context.rootState.authData.accessToken = tokenResponse.access_token;
            context.rootState.authData.refreshToken = tokenResponse.refresh_token;

            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'sign-in',
                        data: {
                            authData: context.rootState.authData,
                        },
                    },
                },
                '*'
            );

            context.dispatch('signIn', null, {
                root: true,
            });

            context.rootState.router.push({
                name: 'palettes',
            });
            context.rootState.error = '';
        } else {
            context.rootState.error = 'error.get_access_token';
        }
    } else {
        context.rootState.error = 'error.poll_access_token';
    }
}
