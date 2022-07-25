// Todo: Use workspace query

/***
             * 
             * 
             * {
  node(id: "eyJpZGVudGlmaWVyIjoxOTEyNzcsInR5cGUiOiJwcm9qZWN0In0=") {
    ... on Workspace {
      id
      __typename
      browse {
        subFolders {
          items {
            name
          }
        }
      }
      assets(
        query: { inFolder: {id: "eyJpZGVudGlmaWVyIjoxMDQ1NDYsInR5cGUiOiJmb2xkZXIifQ=="}}
      ) {
        items {
          __typename
          title
          ... on File {
            extension
            modifiedAt
          }
        }
      }
    }
  }
}


// OR:

 let newQuery = `{
                workspaceProject(id: ${project.id}) {
      ... on Workspace {
        id
        __typename
        browse {
          subFolders {
            items {
              name
            }
          }
        }
        assets(
          query: { inFolder: {id: "${folder.id}"}}
        ) {
          items {
            __typename
            title
            ... on File {
              extension
              modifiedAt
            }
          }
        }
      }
    }
  }`;
            console.log('run new query', newQuery);
            let newQueryResult = await queryGraphQLWithAuth({ query: newQuery, auth: context.auth });

             */

// GraphQL:
// setFolders(result.data.node.subFolders.items);
