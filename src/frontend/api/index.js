/**
 * Returns an Object with a few methods on it to receive API data for
 * colors, text styles and libraries.
 */

import listQuery from './list';
import searchQuery from './search';
import userQuery from './user';

async function queryGraphQLWithAuth(query, { accessToken, domain }) {
    let response = await fetch(`${domain}/graphql/`, {
        method: 'post',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: '{"query": "query CurrentUser{currentUser{id name email avatar}}"}',
    }).catch((error) => {
        console.log(error);
    });
    let result = await response.json();
    return result;
}

export async function loadUser(auth) {
    return queryGraphQLWithAuth(userQuery, auth);
}

export async function loadMediaLibrary({ auth, id, libraryType, page = 1, limit = 50 }) {
    return queryGraphQLWithAuth(auth.domain, auth.accessToken, listQuery(id, libraryType, page, limit));
}

export async function searchMediaLibrary({ auth, id, libraryType, page = 1, limit = 50, term }) {
    return queryGraphQLWithAuth(auth.domain, auth.accessToken, searchQuery(id, libraryType, page, limit, term));
}

export default {
    searchMediaLibrary,
    loadMediaLibrary,
    loadUser,
};
