export default async function accessToken(auth) {
  let args = {
    code: auth.code,
    code_verifier: auth.verifier,
    grant_type: "authorization_code",
    client_id: "figma",
    redirect_uri: "/connection/figma"
  };

  let formData = new FormData();
  for (let key in args) {
    formData.append(key, args[key]);
  }

  let url = `${auth.domain}/api/oauth/accesstoken`;

  try {
    let response = await fetch(url, {
      method: "post",
      body: formData
    });

    if (response) {
      let result = await response.json();

      return result;
    }
  } catch (error) {}
}
