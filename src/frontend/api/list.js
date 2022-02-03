export default function (id, libraryType, page, limit) {
    return `{
  project(id: ${id}) {
    ... on ${libraryType} {
      name,
      list(page: ${page}, limit: ${limit}) {
          total,
          page, 
          limit,
        assets {
          ... on Image {
            __typename,
            id,
            filename,
            title,
            width,
            height,
            generic_url,
            download_url
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
