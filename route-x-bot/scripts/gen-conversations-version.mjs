/**
 * Генерирует src/generated/conversationsVersion.ts — хэш исходников диалогов.
 *
 * Этот хэш уходит в `version` хранилища @grammyjs/conversations. Плагин
 * отбрасывает состояния, записанные под другой версией, поэтому любое изменение
 * в src/conversations/ автоматически сбрасывает незавершённые диалоги вместо
 * того, чтобы реплеить их в изменившийся код и падать.
 *
 * Запускается из vercel-build, dev, start и Dockerfile. Работает и в node, и в bun.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "src", "conversations");
const outFile = join(root, "src", "generated", "conversationsVersion.ts");

const hash = createHash("sha256");
const files = readdirSync(sourceDir)
  .filter((f) => f.endsWith(".ts"))
  .sort();

for (const file of files) {
  // Имя файла тоже в хэше: переименование меняет версию так же, как правка тела
  hash.update(file);
  // Переносы строк нормализуются: git на Windows отдаёт CRLF, а сборка на
  // Vercel — LF. Без этого одна и та же ревизия давала бы разные версии
  // и впустую сбрасывала живые диалоги.
  const source = readFileSync(join(sourceDir, file), "utf8").split("\r\n").join("\n");
  hash.update(source);
}

const version = hash.digest("hex").slice(0, 12);

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(
  outFile,
  `// Сгенерировано scripts/gen-conversations-version.mjs — не редактировать вручную.\n` +
    `// Хэш ${files.length} файл(ов) из src/conversations/.\n` +
    `export const CONVERSATIONS_VERSION = "${version}";\n`,
);

console.log(`conversations version: ${version} (${files.join(", ")})`);
