export function assetsQuery({ ids }) {
    return `{
        assets(ids: [${ids}]) {
          __typename
          id
          title
          createdAt
          creator {
            name
            email
          }
          modifiedAt
          modifier {
              name
              email
          }
          ...on Image {
            downloadUrl
            previewUrl
          }
        }
      }`;
}
