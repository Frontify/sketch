export default async function session(auth) {
    try {
        // let response = await fetch(`${auth.domain}/api/oauth/generate/sessionid`, {
        //   method: "get"
        // });
        let response = await fetch(`${auth.domain}/api/oauth/generate/sessionid`, {
            method: 'get',
        });
        let result = await response.json();
        return result;
    } catch (error) {}
}
