export async function queryGraphQLWithAuth({ query, auth }) {
    return new Promise(async (resolve, reject) => {
        try {
            try {
                let response = await fetch(`${auth.domain}/graphql`, {
                    method: 'post',
                    headers: {
                        Authorization: 'Bearer ' + auth.token,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: query.replace(/(\r\n|\n|\r)/gm, ''),
                    }),
                });

                let result = await response.json();
                resolve(result);
            } catch (error) {
                console.log('ERROR IN FETCH', error);
            }
        } catch (error) {
            console.log('ERROR NO INTERNET');
            reject(error);
        }
    });
}
