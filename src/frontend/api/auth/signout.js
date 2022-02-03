export default function (context, args) {
  parent.postMessage({
      pluginMessage: {
        type: "sign-out",
        data: {}
      }
    },
    "*"
  );

  context.rootState.authData.accessToken = "";
  context.rootState.authData.domain = "";

  context.rootState.router.push({
    name: "signin"
  });

  context.dispatch("tips/reset", null, {
    root: true
  });
}