export function browseWorkspaceProject(project) {
    return ` {
        workspaceProject(id: "${project}") {
          __typename
          id
          name
          browse {
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
