// src/modules/map/core.ts — public API THUẦN (phép chiếu, hình học, ký hiệu) dùng chung cho web và app mobile (mobile/).
export type { FlatMapView, MapLayer, MapTheme, MapView } from "./domain/views";
export { ALL_LAYERS, DEFAULT_LAYERS_DESKTOP, DEFAULT_LAYERS_MOBILE, VIEW_BBOX, makeProjection, kmToPx } from "./domain/views";
export { circlePath, graticulePath, graticuleLabels, polylinePath } from "./domain/geometry";
export { symbolPath, SYMBOL_R, SYMBOL_STROKE } from "./domain/symbology";
export { placeLabels, stormExclusion, estimateTextWidth } from "./domain/labels";
export type { LabelRequest, PlacedLabel } from "./domain/labels";
export { ARCHIPELAGOS, ISLANDS, SEA_LABELS, GRID_STEP } from "./domain/places";
