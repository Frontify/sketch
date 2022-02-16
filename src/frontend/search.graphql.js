export function searchQuery(id, libraryType, page, limit, term) {
    return `{
  project(id: "${id}") {
    ... on ${libraryType} {
      name,
      assets(query: { search: "${term}", type: [IMAGE, VIDEO]}, page: ${page}, limit: ${limit}) {
          total,
          page, 
          limit,
          items {
          ... on Image {
            __typename,
            id,
            filename,
            title,
            width,
            height,
            previewUrl,
            downloadUrl
          },
           ... on Video{
            __typename,
            id,
            filename,
            title
          }
        }
      }
    }
  }
}`;
}
