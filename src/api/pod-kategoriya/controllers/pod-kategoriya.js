'use strict';

/**
 * pod-kategoriya controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::pod-kategoriya.pod-kategoriya', ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;
    const { populate, locale } = ctx.query;

    const isNumeric = !isNaN(Number(id));

    // 1. Резолвим documentId по числовому id ИЛИ documentId, БЕЗ фильтра по locale.
    //    Числовой id уникально указывает на одну строку (любой локали), и нам
    //    нужно только её documentId — он общий для всех локалей документа.
    const base = await strapi.db.query('api::pod-kategoriya.pod-kategoriya').findOne({
      where: isNumeric ? { id } : { documentId: id },
      select: ['documentId'],
    });

    if (!base) {
      return ctx.notFound('Pod-kategoriya not found');
    }

    // 2. Грузим нужную локаль через Document Service — он корректно
    //    работает с documentId + locale (и отдаёт published-версию).
    const entity = await strapi.documents('api::pod-kategoriya.pod-kategoriya').findOne({
      documentId: base.documentId,
      locale: locale || undefined,
      populate,
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
