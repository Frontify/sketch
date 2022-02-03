export default `

  currentUser {
     id
     name
     email
     avatar
   }
 
brands {
 name
 id
 color
 avatar
 projects(types: [MEDIA_LIBRARY, ICON_LIBRARY, LOGO_LIBRARY]) {
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
 }


}`;
