# Biển Đông — app điện thoại (Expo / React Native)

App mobile của Biển Đông (web: [daisgu014/stormcheck](https://github.com/daisgu014/stormcheck)). **Repo riêng, tự đứng**: không import gì từ web lúc build. Lõi logic (risk-engine, adapter nguồn, kiểm tra ghe…) được **chép** từ web vào `src/core/`, giao diện viết lại bằng React Native.

## Chạy

```bash
pnpm install          # .npmrc: node-linker=hoisted (Expo cần cây node_modules phẳng)
pnpm start            # Expo dev server — quét QR bằng Expo Go hoặc dev build
pnpm typecheck && pnpm test
pnpm check:bundle     # bundle Android bằng Metro
pnpm check:core       # lõi đã chép có lệch web không (cần clone web cạnh repo này)
```

Build cài đặt: `npx eas-cli@latest build -p android --profile preview` (cần tài khoản Expo; chưa cấu hình `eas.json`).

## Dữ liệu

Điện thoại **gọi thẳng** nguồn đã đăng ký (chủ sản phẩm chọn 18/11/2026), không qua máy chủ web:

| Nguồn | Dùng cho | Nhịp làm mới |
|---|---|---|
| DS-02 JMA | bão + áp thấp nhiệt đới (luôn là "nguồn dự phòng", nhãn ngưỡng 30/50 kt — Q-B1) | 30 phút (`pollIntervalMinutes`) |
| DS-05 Open-Meteo | 16 ngày theo tỉnh/thành, sóng gió 7 ngày theo vùng biển | 60 phút |
| DS-06 Natural Earth | nền bản đồ, đóng gói trong `assets/basemap/` | — |

Mọi request đi qua lõi `sources` (chép từ web) (policy `approved*`, User-Agent có liên hệ, timeout, adapter zod).
Lỗi nguồn bão → báo NGOẠI TUYẾN và giữ dữ liệu lần trước; **không** hiện "Biển Đông hiện không có bão".
Ghe do người dùng thêm lưu trên máy (AsyncStorage, khoá `bien-dong.local-vessels.v1`); mức nguy hiểm tính trên máy bằng cùng risk-engine với web (A-01, bản chép).

## Lõi chép từ web (`src/core/`)

- `src/core/modules/<m>/core.ts` (risk, vessel, forecast, map, sources, storm): **mobile sở hữu**, chọn những gì app cần từ module của web.
- Mọi file còn lại trong `src/core/` do `scripts/sync-core.mjs` chép từ `src/` của web theo cây import của các `core.ts` (và `@/shared/*` mà UI mobile dùng: `format`, `i18n`), cùng fixture BA-BD-002 §11.1 cho test. **Không sửa tay**; `src/core/SOURCE.md` ghi commit web đã chép.
- Script từ chối file kéo React/Next/server-only/DB/CSS.

```bash
pnpm sync:core                         # chép lại sau khi web sửa logic
pnpm check:core                        # thoát 1 nếu bản chép lệch web
WEB_SRC=/path/to/stormcheck/src pnpm sync:core   # khi web không nằm ở ../stormcheck
```

Sửa logic thì sửa ở web (có test), rồi `sync:core` + `pnpm typecheck && pnpm test && pnpm check:bundle` ở đây.

Alias (`metro.config.js`, `tsconfig.json`, `vitest.config.mts`): `~/x` → `src/x` · `@/modules/<m>` → `src/core/modules/<m>/core.ts` · `@/shared/x` → `src/core/shared/x`. Chuỗi hiển thị lấy từ `src/core/shared/i18n/vi.ts`.

## Màn hình (bản 0.1)

Bản đồ (S-02) · Chi tiết bão (S-05) · Ghe (S-06) · Chi tiết ghe (S-04) · Thêm ghe / cập nhật vị trí (S-03) · Dự báo: Sắp tới + Trên biển (S-07) · Cài đặt (S-08) · Nguồn dữ liệu.

Chưa có so với web: pan/zoom bản đồ, chạm bản đồ để chọn vị trí ghe, thanh thời gian dự báo, dự báo theo giờ, xu hướng ngày 17–30,
thời tiết đã qua, triều cường, địa cầu, test render ghi nguồn cho component React Native (cần jest-expo + Testing Library).
