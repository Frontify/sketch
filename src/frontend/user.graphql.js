export const userQuery = `{
    currentUser {
        name
        id
        email
        avatar
    }
    brands {
        name
        id
        color
        avatar
        workspaceProjects {
            ... on WorkspaceProjectItems {
              __typename
              items {
                id
                name
                }
            }
        }
        projects(types: [MEDIA_LIBRARY, ICON_LIBRARY, LOGO_LIBRARY, DOCUMENT_LIBRARY]) {
            ... on MediaLibrary {
                id
                name
                __typename
            }
            ... on IconLibrary {
                id
                name
                __typename
            }
            ... on LogoLibrary {
                id
                name
                __typename
            }
            ... on DocumentLibrary {
                id
                name
                __typename
            }
        }
      }
}`;
