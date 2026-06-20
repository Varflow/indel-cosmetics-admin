'use strict';

// Content-type tables that have i18n enabled (partner is intentionally NOT localized).
const LOCALIZED_TABLES = [
  'tovaries',
  'novostis',
  'categories',
  'pod_kategoriyas',
  'komandas',
  'menyus',
  'teksties',
  'slajder_glavnayas',
  'video_glavnayas',
  'o_kompaniis',
];

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/*{ strapi }*/) {},

  /**
   * Runs after the schema is synced (so the `locale` column exists) on every boot.
   * Idempotent backfill: when i18n is first enabled on existing data, Strapi may leave
   * pre-existing rows with locale = NULL, which hides them from the content manager
   * (it always queries a concrete locale). This assigns the default locale to any
   * orphaned rows. After the first run it is a no-op (WHERE locale IS NULL matches nothing).
   */
  async bootstrap({ strapi }) {
    const DEFAULT_LOCALE = 'uk-UA';
    const knex = strapi.db.connection;

    for (const table of LOCALIZED_TABLES) {
      // Skip types that aren't localized yet (no `locale` column).
      if (!(await knex.schema.hasColumn(table, 'locale'))) continue;

      const updated = await knex(table)
        .whereNull('locale')
        .update({ locale: DEFAULT_LOCALE });

      if (updated > 0) {
        strapi.log.info(`[i18n-backfill] ${table}: ${DEFAULT_LOCALE} -> ${updated} rows`);
      }
    }
  },
};
