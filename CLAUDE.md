# Biển Đông — app điện thoại (Expo / React Native)

App mobile của Biển Đông. Nghiệp vụ, nguồn dữ liệu và nhận diện nằm ở repo web [daisgu014/stormcheck](https://github.com/daisgu014/stormcheck):
`docs/ba/BA-BD-002_agent-spec.md`, `docs/data-sources.md`, `docs/brand/BRAND.md`. Mã UC/BR/GAP/AT dùng chung với web.

## Lệnh

```bash
pnpm start                         # Expo dev server
pnpm typecheck && pnpm test        # tsc + vitest
EXPO_OFFLINE=1 CI=1 pnpm check:bundle   # bundle Android (Metro)
pnpm sync:core / pnpm check:core   # chép lại / kiểm tra lõi từ web (WEB_SRC hoặc ../stormcheck/src)
```

Trước khi báo xong: `pnpm typecheck && pnpm test && pnpm check:bundle`.

## Quy ước

- Expo SDK 58, Expo Router (`src/app`), TanStack Query 5, Zustand 5 + AsyncStorage, react-native-svg + d3-geo, lucide-react-native. Không thêm dependency khi chưa nêu lý do trong PR.
- `src/core/` là lõi **chép từ web** (README §Lõi). Không sửa tay trừ `src/core/modules/*/core.ts`; sửa logic ở web rồi `pnpm sync:core`.
- App gọi thẳng DS-02 JMA và DS-05 Open-Meteo qua use-case `sources` trong lõi (chủ sản phẩm chọn 18/11/2026); không đi qua API của web.
- Chuỗi hiển thị lấy từ `@/shared/i18n` (bản chép). Màu/cỡ chữ từ `src/theme/tokens.ts`.
- Commit theo Conventional Commits kèm mã UC/BR/GAP.

## Quy tắc không được vi phạm (giống web)

1. Ghi nguồn (`<SourceAttribution>`) ở mọi nơi hiển thị dữ liệu bão/thời tiết; tuyên bố giới hạn trách nhiệm.
2. Chỉ dùng nguồn `approved*` trong registry.
3. Không bịa, không nội suy (BR-01); thiếu → "Nguồn không cung cấp". Bán kính JMA ghi "≥ 30/50 kt", không phải "cấp 6/10" (Q-B1).
4. JMA, Open-Meteo luôn là "Tham khảo quốc tế".
5. Không dùng logo/ảnh của cơ quan khí tượng.
6. Giờ hiển thị GMT+7, lưu UTC.
7. Lỗi nguồn bão → NGOẠI TUYẾN, giữ dữ liệu cũ; không bao giờ báo "không có bão" khi chưa biết.
