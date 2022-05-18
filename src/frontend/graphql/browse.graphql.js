export function browseWorkspaceProject(project) {
    return ` {
        workspaceProject(id: "${project}") {
          __typename
          id
          name
          browse {
            assets {
              items {
                id
                title
                ...on File {
                  extension
                  filename
                  downloadUrl
                }
              }
              
            }
            subFolders {
              items {
                id
                __typename
                name
              }
            }
          }
        }
      }`;
}
