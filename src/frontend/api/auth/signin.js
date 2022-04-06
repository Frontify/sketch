import api from '../../api/';
import oauth from '../../api/oauth';

export async function signIn({ accessToken, domain, forceRefresh }) {
    let loading = false;
    let authData = {
        accessToken: null,
        domain: null,
        lastSignIn: null,
    };
    let state = {
        user: {},
        brands: {},
    };
    if (accessToken && domain) {
        loading = true;

        authData.accessToken = accessToken;
        authData.domain = domain;

        // get all the data!
        let response = await api.loadUser(authData);

        if (response) {
            let data = response.data;

            // check if the request failed
            if (!forceRefresh && response && response.data && response.data.whoami) {
                // Assign API data to local state
                context.rootState.data.user = data.whoami;
                context.rootState.data.brands = data.brands;

                // remember when this happened
                authData.lastSignIn = new Date().getTime();

                if (!context.rootState.data.user) {
                    // user has been deleted

                    context.dispatch('signOut');
                }
            } else {
                // Failed
                // Maybe the token expired?
                // Maybe the network request failed?
                // Try refresh token

                await refreshToken(context);
            }
            loading = false;
        } else {
            handleConnectionIssue(context);
        }
    }
}

function handleConnectionIssue(context) {
    loading = false;
}

async function refreshToken(context) {
    let refresh = await oauth.refresh(authData);

    if (refresh && !refresh.error) {
        if (refresh && refresh.token_type == 'Bearer') {
            // Assign response data
            authData.expiresIn = refresh.expires_in;
            authData.accessToken = refresh.access_token;
            authData.refreshToken = refresh.refresh_token;
            await context.dispatch('signIn', {
                domain: authData.domain,
                accessToken: authData.accessToken,
            });
            parent.postMessage(
                {
                    pluginMessage: {
                        type: 'sign-in',
                        data: {
                            authData: authData,
                        },
                    },
                },
                '*'
            );
        }
    }
}
