'use strict';

/**
 * novosti service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::novosti.novosti');
