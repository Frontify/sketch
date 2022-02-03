export default function(context, args) {
  context.dispatch("signOut", null, {
    root: true
  });
  context.rootState.loading = false;
}
