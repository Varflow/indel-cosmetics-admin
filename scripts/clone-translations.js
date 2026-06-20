#!/usr/bin/env node
"use strict";

/**
 * Триггерит эндпоинт POST /api/clone-translation/clone-all
 * на запущенном инстансе Strapi.
 *
 * Использование:
 *   pnpm clone-translations                    # source=uk-UA, target=en
 *   pnpm clone-translations <source> <target>  # явные локали
 *   STRAPI_URL=http://prod:1337 pnpm clone-translations uk-UA en
 *
 * Перед запуском Strapi должен быть поднят (`pnpm develop` или `pnpm start`).
 */

const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

const [, , sourceArg, targetArg] = process.argv;
const source = sourceArg || "uk-UA";
const target = targetArg || "en";

const url = `${STRAPI_URL}/api/clone-translation/clone-all`;

(async () => {
  console.log(`→ POST ${url}`);
  console.log(`  source: ${source}`);
  console.log(`  target: ${target}`);
  console.log("");

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, target }),
    });
  } catch (err) {
    console.error(`✗ Не удалось достучаться до Strapi на ${STRAPI_URL}`);
    console.error(`  ${err.message}`);
    console.error(`  Убедись что Strapi запущен: pnpm develop`);
    process.exit(1);
  }

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!response.ok) {
    console.error(`✗ ${response.status} ${response.statusText}`);
    console.error(typeof body === "string" ? body : JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const { created = [], skipped = [], relationsLinked = [], errors = [] } =
    body || {};

  console.log(`✓ Создано переводов: ${created.length}`);
  for (const r of created) console.log(`    + ${r.uid} ${r.documentId}`);

  if (skipped.length) {
    console.log(`\n• Пропущено (уже переведено): ${skipped.length}`);
    for (const r of skipped) console.log(`    = ${r.uid} ${r.documentId}`);
  }

  if (relationsLinked.length) {
    console.log(`\n↔ Прицеплено связей: ${relationsLinked.length}`);
    for (const r of relationsLinked)
      console.log(`    ↔ ${r.uid} ${r.documentId} [${(r.fields || []).join(", ")}]`);
  }

  if (errors.length) {
    console.log(`\n✗ Ошибки: ${errors.length}`);
    for (const e of errors)
      console.log(`    ! phase ${e.phase} ${e.uid} ${e.documentId}: ${e.error}`);
    process.exit(1);
  }

  console.log("\nГотово.");
})();
