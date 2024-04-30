'use strict';

/**
 * menyu service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::menyu.menyu');
