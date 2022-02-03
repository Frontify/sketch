export default async function refresh(auth) {
  let args = {
    scope: "basic:read",
    refresh_token: auth.refreshToken,
    grant_type: "refresh_token",
    client_id: "figma"
  };

  let formData = new FormData();
  for (let key in args) {
    formData.append(key, args[key]);
  }

  let url = `${auth.domain}/api/oauth/refresh`;

  try {
    let response = await fetch(url, {
      method: "post",
      body: formData
    });
    let result = await response.json();
    return result;
  } catch (error) {}
}
