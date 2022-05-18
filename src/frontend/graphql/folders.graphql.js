export function foldersQuery(folder) {
    return `{
        node(id: "${folder}") {
      ... on SubFolder {
        __typename
        id
        name
        subFolders {
          items {
            __typename
            id
            name
          }
        }
      }
    }
  }
  `;
}
