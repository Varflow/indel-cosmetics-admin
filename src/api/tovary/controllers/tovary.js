"use strict";

/**
 * tovary controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::tovary.tovary", ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;

    const { populate, locale = strapi.config.get("api.defaultLocale") } =
      ctx.query;

    console.log("ctx.params:", ctx.params);

    const queryId = isNaN(Number(id)) ? { documentId: id } : { id };
    console.log("queryId:", queryId);
    const entity = await strapi.db.query("api::tovary.tovary").findOne({
      where: {
        $and: [
          queryId,
          {
            locale,
          },
        ],
      },
      populate,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
