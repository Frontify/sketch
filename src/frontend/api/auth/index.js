import browser from "./browser";
import cancel from "./cancel";
import signIn from "./signIn";
import signOut from "./signOut";
import poll from "./poll";

export default {
  namespaced: true,
  actions: {
    browser,
    cancel,
    signIn,
    signOut,
    poll
  }
};