export default async function poll(auth) {
  let response = await fetch(
    `${auth.domain}/api/oauth/poll/accesstoken?session_id=${auth.sessionID}`,
    {
      method: "get"
    }
  );
  let result = await response.json();
  return result;
}
