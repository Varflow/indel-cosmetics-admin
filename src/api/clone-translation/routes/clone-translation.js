"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/clone-translation/clone-all",
      handler: "clone-translation.cloneAll",
      config: {
        auth: false,
      },
    },
  ],
};
