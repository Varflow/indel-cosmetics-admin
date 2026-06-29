"use strict";

/**
 * tovary controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::tovary.tovary", ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;
    const { populate, locale } = ctx.query;

    const isNumeric = !isNaN(Number(id));

    const base = await strapi.db.query("api::tovary.tovary").findOne({
      where: isNumeric ? { id } : { documentId: id },
      select: ["documentId"],
    });

    if (!base) {
      return ctx.notFound("Tovary not found");
    }

    const entity = await strapi.documents("api::tovary.tovary").findOne({
      documentId: base.documentId,
      locale: locale || undefined,
      populate,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
