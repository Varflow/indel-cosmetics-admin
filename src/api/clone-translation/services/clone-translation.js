"use strict";

const SINGLE_TYPES = [
  { uid: "api::menyu.menyu", populate: "*" },
  { uid: "api::teksty.teksty", populate: "*" },
  { uid: "api::o-kompanii.o-kompanii", populate: "*" },
];

const SIMPLE_COLLECTIONS = [
  { uid: "api::novosti.novosti", populate: ["image"] },
  { uid: "api::slajder-glavnaya.slajder-glavnaya", populate: ["image"] },
  { uid: "api::video-glavnaya.video-glavnaya", populate: "*" },
  { uid: "api::komanda.komanda", populate: ["avatar"] },
];

const RELATION_COLLECTIONS = [
  {
    uid: "api::category.category",
    populate: ["image"],
    relations: ["pod_kategoriyas", "tovaries"],
  },
  {
    uid: "api::pod-kategoriya.pod-kategoriya",
    populate: ["image"],
    relations: ["category", "tovaries"],
  },
  {
    uid: "api::tovary.tovary",
    populate: ["image"],
    relations: ["kategoriyas", "pod_kategoriyas"],
  },
];

const RELATION_TARGETS = {
  "api::category.category": {
    pod_kategoriyas: "api::pod-kategoriya.pod-kategoriya",
    tovaries: "api::tovary.tovary",
  },
  "api::pod-kategoriya.pod-kategoriya": {
    category: "api::category.category",
    tovaries: "api::tovary.tovary",
  },
  "api::tovary.tovary": {
    kategoriyas: "api::category.category",
    pod_kategoriyas: "api::pod-kategoriya.pod-kategoriya",
  },
};

const stripMetadata = (data) => {
  const {
    id,
    documentId,
    locale,
    localizations,
    createdAt,
    updatedAt,
    publishedAt,
    ...rest
  } = data;
  return rest;
};

const stripFields = (data, fields) => {
  if (!fields || fields.length === 0) return data;
  const out = { ...data };
  for (const f of fields) delete out[f];
  return out;
};

const asArray = (val) => (Array.isArray(val) ? val : val ? [val] : []);

module.exports = ({ strapi }) => ({
  async cloneAll({ sourceLocale, targetLocale }) {
    if (!sourceLocale || !targetLocale) {
      throw new Error("sourceLocale и targetLocale обязательны");
    }
    if (sourceLocale === targetLocale) {
      throw new Error("sourceLocale и targetLocale должны отличаться");
    }

    const summary = {
      sourceLocale,
      targetLocale,
      created: [],
      skipped: [],
      relationsLinked: [],
      errors: [],
    };

    const allTypes = [
      ...SINGLE_TYPES,
      ...SIMPLE_COLLECTIONS,
      ...RELATION_COLLECTIONS,
    ];

    // Phase 1: создать перевод каждой записи (без relations)
    for (const ct of allTypes) {
      const docs = await strapi.documents(ct.uid).findMany({
        locale: sourceLocale,
        populate: ct.populate,
        status: "published",
      });
      const list = asArray(docs);

      for (const original of list) {
        try {
          const existing = await strapi.documents(ct.uid).findOne({
            documentId: original.documentId,
            locale: targetLocale,
          });
          if (existing) {
            summary.skipped.push({
              uid: ct.uid,
              documentId: original.documentId,
              reason: "перевод уже существует",
            });
            continue;
          }

          const data = stripFields(stripMetadata(original), ct.relations);

          await strapi.documents(ct.uid).update({
            documentId: original.documentId,
            locale: targetLocale,
            data,
          });

          await strapi.documents(ct.uid).publish({
            documentId: original.documentId,
            locale: targetLocale,
          });

          summary.created.push({
            uid: ct.uid,
            documentId: original.documentId,
          });
        } catch (err) {
          strapi.log.error(
            `[clone-translation] phase1 ${ct.uid} ${original.documentId}: ${err.message}`
          );
          summary.errors.push({
            phase: 1,
            uid: ct.uid,
            documentId: original.documentId,
            error: err.message,
          });
        }
      }
    }

    // Phase 2: прицепить relations к созданным переводам
    for (const ct of RELATION_COLLECTIONS) {
      const fieldMap = RELATION_TARGETS[ct.uid];
      const populateRelations = Object.keys(fieldMap);

      const docs = await strapi.documents(ct.uid).findMany({
        locale: sourceLocale,
        populate: populateRelations,
        status: "published",
      });
      const list = asArray(docs);

      for (const original of list) {
        try {
          const translated = await strapi.documents(ct.uid).findOne({
            documentId: original.documentId,
            locale: targetLocale,
            status: "published",
          });
          if (!translated) continue;

          const updateData = {};
          for (const [field, targetUid] of Object.entries(fieldMap)) {
            const rel = original[field];
            if (rel == null) continue;

            if (Array.isArray(rel)) {
              const linked = [];
              for (const r of rel) {
                const t = await strapi.documents(targetUid).findOne({
                  documentId: r.documentId,
                  locale: targetLocale,
                  status: "published",
                });
                if (t) linked.push(t.documentId);
              }
              updateData[field] = linked;
            } else {
              const t = await strapi.documents(targetUid).findOne({
                documentId: rel.documentId,
                locale: targetLocale,
                status: "published",
              });
              updateData[field] = t ? t.documentId : null;
            }
          }

          if (Object.keys(updateData).length === 0) continue;

          await strapi.documents(ct.uid).update({
            documentId: original.documentId,
            locale: targetLocale,
            status: "published",
            data: updateData,
          });

          summary.relationsLinked.push({
            uid: ct.uid,
            documentId: original.documentId,
            fields: Object.keys(updateData),
          });
        } catch (err) {
          strapi.log.error(
            `[clone-translation] phase2 ${ct.uid} ${original.documentId}: ${err.message}`
          );
          summary.errors.push({
            phase: 2,
            uid: ct.uid,
            documentId: original.documentId,
            error: err.message,
          });
        }
      }
    }

    return summary;
  },
});
