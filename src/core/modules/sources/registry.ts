// Registry nguồn dữ liệu — NGUỒN SỰ THẬT. Mỗi entry khớp 1-1 với docs/data-sources.md §2.
// Sửa ở một nơi thì sửa cả nơi kia. `termsCheckedAt` cũ hơn 180 ngày → kiểm tra lại điều khoản.
import { z } from "zod";
import { SourceDefinitionSchema, type SourceDefinition, type SourceId } from "./domain/registry-schema";

const APP_UA = "BienDong/0.1 (+https://github.com/daisgu014/stormcheck; contact: {email})";

const raw: SourceDefinition[] = [
  {
    id: "DS-01",
    name: "Trung tâm Dự báo Khí tượng Thuỷ văn Quốc gia (NCHMF)",
    shortName: "NCHMF",
    owner: "Bộ Nông nghiệp và Môi trường — Cục Khí tượng Thuỷ văn",
    role: "Chính thức, ưu tiên hiển thị. Tạm thời quản trị viên nhập tay thông số từ bản tin kèm link (AC-04).",
    homepage: "https://nchmf.gov.vn/",
    termsUrl: "https://nchmf.gov.vn/",
    licenseName: "Chưa xác minh điều khoản tái sử dụng tự động",
    licenseUrl: null,
    attributionText: {
      vi: "Nguồn: Trung tâm Dự báo KTTV Quốc gia",
      en: "Source: Viet Nam National Center for Hydro-Meteorological Forecasting (NCHMF)",
    },
    requiresModificationNotice: false,
    commercialUse: "unknown",
    officialStatus: "official_vn",
    status: "pending_agreement",
    enabled: false, // KHÔNG scrape. Chờ thoả thuận (Q-L4).
    termsCheckedAt: "2026-09-21",
    pollIntervalMinutes: 180,
    maxRequestsPerDay: null,
    userAgent: APP_UA,
    windAveragingMinutes: null,
    notes: "Chưa tìm thấy API công khai. Không scrape website. Bản tin nhập tay có kiểm duyệt.",
  },
  {
    id: "DS-02",
    name: "RSMC Tokyo — Cơ quan Khí tượng Nhật Bản (JMA)",
    shortName: "JMA",
    owner: "Japan Meteorological Agency",
    role: "Nguồn quốc tế chính (bão + áp thấp nhiệt đới có bản tin); dự phòng khi DS-01 lỗi. Bán kính gió theo ngưỡng 30/50 kt, KHÔNG phải cấp 6/10.",
    homepage: "https://www.jma.go.jp/bosai/map.html#contents=typhoon",
    termsUrl: "https://www.jma.go.jp/jma/en/copyright.html",
    licenseName: "Public Data License 1.0 (tương thích CC BY 4.0)",
    licenseUrl: "https://www.jma.go.jp/jma/en/copyright.html",
    attributionText: {
      vi: "Nguồn: Cơ quan Khí tượng Nhật Bản (JMA)",
      en: "Source: Japan Meteorological Agency (JMA)",
      original: "出典：気象庁",
    },
    requiresModificationNotice: true,
    commercialUse: "allowed",
    officialStatus: "international_reference",
    status: "approved", // endpoint bosai đã xác minh 21/09/2026 (references/source-notes.md)
    enabled: true,
    termsCheckedAt: "2026-09-21",
    pollIntervalMinutes: 30,
    maxRequestsPerDay: 1000,
    userAgent: APP_UA,
    windAveragingMinutes: 10,
    notes: "bosai/typhoon/data/targetTc.json + {tcId}/specifications.json + forecast.json. Cache-Control max-age=60, có ETag. Gió TB 10 phút.",
  },
  {
    id: "DS-03",
    name: "Joint Typhoon Warning Center (JTWC)",
    shortName: "JTWC",
    owner: "U.S. Navy / U.S. Air Force",
    role: "Lớp 'so sánh đường đi' — tắt mặc định. Không phải bản tin chính thức tại Việt Nam.",
    homepage: "https://www.metoc.navy.mil/jtwc/jtwc.html",
    termsUrl: "https://www.metoc.navy.mil/jtwc/jtwc.html",
    licenseName: "Tác phẩm của Chính phủ Hoa Kỳ — phạm vi công cộng tại Hoa Kỳ",
    licenseUrl: null,
    attributionText: {
      vi: "Tham khảo: Joint Typhoon Warning Center (JTWC), U.S. Navy/Air Force — không phải bản tin chính thức tại Việt Nam",
      en: "Reference: Joint Typhoon Warning Center (JTWC), U.S. Navy/Air Force — not an official bulletin in Viet Nam",
    },
    requiresModificationNotice: false,
    commercialUse: "allowed",
    officialStatus: "international_reference",
    status: "approved",
    enabled: false, // chỉ dùng cho lớp tham khảo; chưa có adapter
    termsCheckedAt: "2026-09-21",
    pollIntervalMinutes: 360,
    maxRequestsPerDay: 100,
    userAgent: APP_UA,
    windAveragingMinutes: 1,
    notes: "Chỉ dùng dữ liệu số (bản tin text). Không dùng ảnh GIF cảnh báo.",
  },
  {
    id: "DS-04",
    name: "Global Disaster Alert and Coordination System (GDACS)",
    shortName: "GDACS",
    owner: "Liên Hợp Quốc – Uỷ ban châu Âu (JRC)",
    role: "Phát hiện sự kiện bão mới trong bbox Biển Đông, kích hoạt bản ghi chờ nguồn chính. Không dùng để phân mức.",
    homepage: "https://www.gdacs.org/",
    termsUrl: "https://www.gdacs.org/About/termofuse.aspx",
    licenseName: "Miễn phí, yêu cầu ghi nguồn; không bảo đảm; không thay thế cảnh báo chính thức",
    licenseUrl: "https://www.gdacs.org/About/termofuse.aspx",
    attributionText: {
      vi: "Nguồn: Global Disaster Alert and Coordination System, GDACS",
      en: "Source: Global Disaster Alert and Coordination System, GDACS",
    },
    requiresModificationNotice: false,
    commercialUse: "allowed",
    officialStatus: "international_reference",
    status: "approved",
    enabled: true,
    termsCheckedAt: "2026-09-21",
    pollIntervalMinutes: 60,
    maxRequestsPerDay: 100,
    userAgent: APP_UA,
    windAveragingMinutes: null,
  },
  {
    id: "DS-05",
    name: "Open-Meteo (Forecast, Marine, Historical Weather, Seasonal Forecast API)",
    shortName: "Open-Meteo",
    owner: "Open-Meteo.com",
    role: "Dự báo theo giờ tại một điểm (UC-04); dự báo theo ngày 16 ngày, xu hướng ngày 17–30 (ECMWF EC46, trung bình tổ hợp — độ tin cậy thấp) và thời tiết đã qua, chi tiết theo giờ của một ngày theo tỉnh/thành (tab DỰ BÁO). Đã chuyển đổi sang cấp Beaufort.",
    homepage: "https://open-meteo.com/",
    termsUrl: "https://open-meteo.com/en/terms",
    licenseName: "CC BY 4.0 (dữ liệu) — miễn phí chỉ cho phi thương mại, < 10.000 request/ngày",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attributionText: {
      vi: "Weather data by Open-Meteo.com",
      en: "Weather data by Open-Meteo.com",
    },
    requiresModificationNotice: true,
    commercialUse: "requires_plan",
    officialStatus: "international_reference",
    status: "approved_noncommercial",
    enabled: true,
    termsCheckedAt: "2026-11-07",
    pollIntervalMinutes: 60,
    maxRequestsPerDay: 5000,
    userAgent: APP_UA,
    windAveragingMinutes: null,
    notes: "Q-L2: nếu sản phẩm thương mại thì phải mua gói hoặc thay nguồn. Endpoint: api.open-meteo.com/v1/forecast, marine-api…/v1/marine, archive-api…/v1/archive, seasonal-api…/v1/seasonal (điều khoản kiểm 07/11/2026: < 10.000/ngày, 5.000/giờ, 600/phút, chung một hạn mức). KHÔNG dùng sea_level_height_msl cho triều cường: Open-Meteo ghi rõ 'không phù hợp cho hàng hải ven bờ', lưới 8 km không phủ sông Sài Gòn.",
  },
  {
    id: "DS-06",
    name: "Natural Earth (world-atlas + admin-1 + minor islands)",
    shortName: "Natural Earth",
    owner: "Natural Earth (public domain) · world-atlas (ISC)",
    role: "Đường bờ biển, đảo nhỏ, ranh giới 34 tỉnh (đã gộp theo sắp xếp 2025; Hoàng Sa, Trường Sa theo đơn vị hành chính VN) — nền bản đồ, đóng gói tĩnh.",
    homepage: "https://www.naturalearthdata.com/",
    termsUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
    licenseName: "Public domain (Natural Earth) · ISC (world-atlas)",
    licenseUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
    attributionText: { vi: "Nền bản đồ: Natural Earth", en: "Basemap: Natural Earth" },
    requiresModificationNotice: false,
    commercialUse: "allowed",
    officialStatus: "derived",
    status: "approved",
    enabled: true,
    termsCheckedAt: "2026-09-21",
    pollIntervalMinutes: null,
    maxRequestsPerDay: null,
    userAgent: APP_UA,
    windAveragingMinutes: null,
  },
  {
    id: "DS-07",
    name: "Đài Khí tượng Thuỷ văn khu vực Nam Bộ — bản tin dự báo thuỷ triều, triều cường",
    shortName: "Đài KTTV Nam Bộ",
    owner: "Bộ Nông nghiệp và Môi trường — Cục Khí tượng Thuỷ văn",
    role: "Chính thức: mực nước đỉnh triều tại TP.HCM (Phú An, Nhà Bè…) và cấp báo động. App CHỈ dẫn link tới bản tin gốc; lịch kỳ triều cường trong app do Biển Đông tự tính theo pha Mặt Trăng, không phải dự báo mực nước.",
    homepage: "https://www.kttv-nb.org.vn/",
    termsUrl: "https://www.kttv-nb.org.vn/",
    licenseName: "Chưa xác minh điều khoản tái sử dụng tự động",
    licenseUrl: null,
    attributionText: {
      vi: "Nguồn: Đài Khí tượng Thuỷ văn khu vực Nam Bộ",
      en: "Source: Southern Regional Hydro-Meteorological Center (Viet Nam)",
    },
    requiresModificationNotice: false,
    commercialUse: "unknown",
    officialStatus: "official_vn",
    status: "pending_agreement",
    enabled: false, // Bản tin dạng PDF trên website, chưa có API/điều khoản → KHÔNG scrape (Q-L5).
    termsCheckedAt: "2026-11-07",
    pollIntervalMinutes: 720,
    maxRequestsPerDay: null,
    userAgent: APP_UA,
    windAveragingMinutes: null,
    notes: "Bản tin hải văn dạng PDF (kttv-nb.org.vn/attachments/…, kttv.gov.vn/upload/haivan/…). Không tìm thấy API công khai hay điều khoản cho phép tái sử dụng tự động. Chỉ đặt link.",
  },
];

const RegistrySchema = z.array(SourceDefinitionSchema).superRefine((list, ctx) => {
  const ids = new Set<string>();
  for (const s of list) {
    if (ids.has(s.id)) ctx.addIssue({ code: "custom", message: `Trùng id ${s.id}` });
    ids.add(s.id);
  }
});

/** Registry đã validate (ném lỗi ngay khi import nếu sai — phát hiện ở build/test). */
export const SOURCES: readonly SourceDefinition[] = RegistrySchema.parse(raw);

const byId = new Map(SOURCES.map((s) => [s.id, s] as const));

export function getSource(id: SourceId): SourceDefinition {
  const s = byId.get(id);
  if (!s) throw new Error(`Nguồn ${id} chưa đăng ký trong registry`);
  return s;
}

export function listSources(): readonly SourceDefinition[] {
  return SOURCES;
}
