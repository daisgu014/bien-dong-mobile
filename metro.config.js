// Metro cho app mobile Biển Đông — source tự đứng, không đọc gì ngoài thư mục mobile/.
//   ~/x            → src/x
//   @/modules/<m>  → src/core/modules/<m>/core.ts   (lõi chép từ web bởi scripts/sync-core.mjs)
//   @/shared/x     → src/core/shared/x
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const coreRoot = path.join(projectRoot, "src/core");

const config = getDefaultConfig(projectRoot);
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstream ?? context.resolveRequest;
  let target = moduleName;
  if (moduleName.startsWith("~/")) target = path.join(projectRoot, "src", moduleName.slice(2));
  else if (/^@\/modules\/[^/]+$/.test(moduleName)) target = path.join(coreRoot, "modules", moduleName.slice("@/modules/".length), "core.ts");
  else if (moduleName.startsWith("@/shared/")) target = path.join(coreRoot, "shared", moduleName.slice("@/shared/".length));
  else if (moduleName.startsWith("@/")) throw new Error(`[metro] ${moduleName}: app mobile chỉ được dùng @/modules/<tên> (core.ts) và @/shared/*`);
  return resolve(context, target, platform);
};

module.exports = config;
