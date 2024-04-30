'use strict';

/**
 * komanda service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::komanda.komanda');
