#!/usr/bin/env node
// Chép lõi logic của web (../src) vào mobile/src/core — app mobile là source riêng, KHÔNG import gì từ web lúc build.
// Điểm vào là các file mobile/src/core/modules/<m>/core.ts (do mobile sở hữu, viết tay). Script đi theo import của chúng,
// chép đúng các file cần từ ../src sang cùng đường dẫn tương đối, và ghi lại commit nguồn vào src/core/SOURCE.md.
//
//   node scripts/sync-core.mjs           # chép lại từ ../stormcheck/src (hoặc WEB_SRC=/đường/dẫn/web/src)
//   node scripts/sync-core.mjs --check   # chỉ so sánh, thoát 1 nếu bản chép lệch web
//
// Quy ước alias trong code chép sang (giữ nguyên, không sửa file):
//   @/modules/<m>  → mobile/src/core/modules/<m>/core.ts
//   @/shared/x     → mobile/src/core/shared/x
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const mobileRoot = path.resolve(import.meta.dirname, "..");
// Repo web: WEB_SRC, hoặc clone stormcheck đặt cạnh repo này (../stormcheck/src).
const webSrc = path.resolve(process.env.WEB_SRC ?? path.resolve(mobileRoot, "../stormcheck/src"));
const coreRoot = path.join(mobileRoot, "src/core");
const check = process.argv.includes("--check");

if (!fs.existsSync(webSrc)) {
  console.error(`Không thấy ${webSrc}. Đặt WEB_SRC=<đường dẫn tới src/ của web> hoặc clone daisgu014/stormcheck cạnh repo này.`);
  process.exit(2);
}

const EXT = [".ts", ".tsx", "/index.ts"];
function resolveFile(base) {
  for (const e of ["", ...EXT]) {
    const p = base + e;
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }
  return null;
}

const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

/** file trong web (../src/...) → file đích trong mobile/src/core/... */
const toCore = (webFile) => path.join(coreRoot, path.relative(webSrc, webFile));

const queue = [];
const seen = new Set();
const entries = fs.readdirSync(path.join(coreRoot, "modules")).map((m) => path.join(coreRoot, "modules", m, "core.ts"));

function enqueueSpecifiers(text, fromDirWeb) {
  for (const m of text.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    if (!spec) continue;
    let target = null;
    if (spec.startsWith("./") || spec.startsWith("../")) target = resolveFile(path.resolve(fromDirWeb, spec));
    else if (spec.startsWith("@/shared/")) target = resolveFile(path.join(webSrc, "shared", spec.slice(9)));
    else if (spec.startsWith("@/modules/")) continue; // → core.ts của mobile (điểm vào, đã có)
    else if (spec.startsWith("@/")) throw new Error(`Import không hỗ trợ trong lõi mobile: ${spec}`);
    else continue; // gói npm
    if (!target) throw new Error(`Không phân giải được ${spec} từ ${fromDirWeb}`);
    if (!seen.has(target)) {
      seen.add(target);
      queue.push(target);
    }
  }
}

// core.ts của mobile import "./domain/..." → tương ứng ../src/modules/<m>/domain/...
for (const entry of entries) enqueueSpecifiers(fs.readFileSync(entry, "utf8"), path.join(webSrc, path.relative(coreRoot, path.dirname(entry))));

// Code riêng của mobile (app/, src/ trừ core/) import @/shared/* (i18n, format) → chép luôn các file đó.
const mobileCode = (d) =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return p === coreRoot ? [] : mobileCode(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
for (const f of mobileCode(path.join(mobileRoot, "src"))) {
  const shared = [...fs.readFileSync(f, "utf8").matchAll(IMPORT_RE)].map((m) => m[1] ?? m[2]).filter((s) => s?.startsWith("@/shared/"));
  enqueueSpecifiers(shared.map((s) => `import x from "${s}";`).join("\n"), webSrc);
}

// Fixture chuẩn BA-BD-002 §11.1 cho test của mobile (AT-01, AT-08).
for (const extra of ["modules/risk/__fixtures__/ba-bd-002.ts"]) {
  const f = path.join(webSrc, extra);
  if (!seen.has(f)) {
    seen.add(f);
    queue.push(f);
  }
}

const FORBIDDEN = /from\s+["'](react|react-dom|next(\/[^"']*)?|server-only|drizzle-orm|postgres)["']|\.css["']/;
const files = [];
while (queue.length) {
  const f = queue.shift();
  const text = fs.readFileSync(f, "utf8");
  if (FORBIDDEN.test(text)) throw new Error(`${path.relative(webSrc, f)} kéo theo React/Next/server-only/DB/CSS — không chép sang mobile được`);
  files.push(f);
  enqueueSpecifiers(text, path.dirname(f));
}

let drift = 0;
for (const f of files.sort()) {
  const dest = toCore(f);
  const src = fs.readFileSync(f, "utf8");
  const cur = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : null;
  if (cur === src) continue;
  drift++;
  if (check) console.log(`lệch: ${path.relative(mobileRoot, dest)}`);
  else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, src);
  }
}

// File thừa (đã bị bỏ khỏi cây phụ thuộc).
const wanted = new Set([...files.map(toCore), ...entries, path.join(coreRoot, "SOURCE.md")]);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(coreRoot)) {
  if (wanted.has(f)) continue;
  drift++;
  if (check) console.log(`thừa: ${path.relative(mobileRoot, f)}`);
  else fs.rmSync(f);
}

if (check) {
  console.log(drift ? `${drift} file lệch web — chạy node scripts/sync-core.mjs` : "Lõi mobile khớp web.");
  process.exit(drift ? 1 : 0);
}

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD", { cwd: webSrc }).toString().trim();
} catch {}
fs.writeFileSync(
  path.join(coreRoot, "SOURCE.md"),
  `# Lõi chép từ web\n\nThư mục này (trừ \`modules/*/core.ts\`) được **chép** từ \`src/\` của web stormcheck bởi \`scripts/sync-core.mjs\`, không sửa tay.\nSửa logic thì sửa ở web rồi chạy lại script; \`--check\` cho biết bản chép có lệch web không.\n\n- Commit web: \`${commit}\`\n- Số file: ${files.length}\n`,
);
console.log(`Đã chép ${files.length} file (${drift} thay đổi) từ web @ ${commit}.`);
