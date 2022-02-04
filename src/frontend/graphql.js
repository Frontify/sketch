export async function queryGraphQLWithAuth({ query, auth }) {
    console.log('queryGraphQLWithAuth', query, auth);
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
    return result;
}
