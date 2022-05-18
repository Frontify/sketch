export function listQuery(id, libraryType, page, limit) {
    return `{
  project(id: "${id}") {
    ... on ${libraryType} {
      name,
      assets(page: ${page}, limit: ${limit}, query: {type: [IMAGE, VIDEO]}) {
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
            downloadUrl,
            extension
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
