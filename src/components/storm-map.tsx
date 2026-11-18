// CMP-03 bản React Native (BA-BD-002 §8): SVG tự vẽ bằng d3-geo + react-native-svg, nền Natural Earth đóng gói sẵn (DS-06).
// Cùng phép chiếu/hình học/ký hiệu với web (src/modules/map/core.ts). Chưa có pan/zoom (§8.2 "NÊN").
import { geoPath, type GeoProjection } from "d3-geo";
import type React from "react";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import {
  ARCHIPELAGOS,
  GRID_STEP,
  circlePath,
  graticulePath,
  kmToPx,
  makeProjection,
  polylinePath,
  symbolPath,
  type FlatMapView,
} from "@/modules/map";
import { nowPoint, type Storm, type VesselWithRisk } from "@/modules/risk";
import { formatTimeDateGmt7 } from "@/shared/format/gmt7";
import { t } from "@/shared/i18n";
import { useTheme } from "~/theme/use-theme";
import { BASEMAP } from "~/lib/basemap";

interface Props {
  storm: Storm | null;
  vessels: readonly VesselWithRisk[];
  view: FlatMapView;
  selectedVesselId: string | null;
  onVesselPick: (id: string) => void;
  onStormPick?: () => void;
}

type Pt = [number, number];

function project(p: GeoProjection, lat: number, lon: number): Pt | null {
  const xy = p([lon, lat]);
  return xy ? [xy[0], xy[1]] : null;
}

const HIT = 44;

type SvgTextProps = React.ComponentProps<typeof SvgText>;

/** Nhãn có quầng cùng màu nền (§8.3) — react-native-svg không có paint-order nên vẽ hai lớp. */
const SVG_FONT = Platform.OS === "web" ? "Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif" : undefined;

function HaloText({ halo, haloWidth, children, ...props }: SvgTextProps & { halo: string; haloWidth: number; children: string }) {
  const rest = { fontFamily: SVG_FONT, ...props };
  return (
    <>
      <SvgText {...rest} stroke={halo} strokeWidth={haloWidth} strokeLinejoin="round">
        {children}
      </SvgText>
      <SvgText {...rest}>{children}</SvgText>
    </>
  );
} // vùng chạm mobile §8.3 #9

export function StormMap({ storm, vessels, view, selectedVesselId, onVesselPick, onStormPick }: Props) {
  const { c, name: theme } = useTheme();
  const m = c.map;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - size.w) > 1 || Math.abs(height - size.h) > 1) setSize({ w: width, h: height });
  };

  const base = useMemo(() => {
    if (size.w < 10 || size.h < 10) return null;
    const projection = makeProjection(view, size.w, size.h, 0);
    const path = geoPath(projection);
    return {
      projection,
      land: path(BASEMAP.land) ?? "",
      vn: path(BASEMAP.countries.vietnam) ?? "",
      archipelagos: path(BASEMAP.admin.archipelagos) ?? "",
      borders: path(BASEMAP.countries.borders) ?? "",
      provinces: path(BASEMAP.admin.borders) ?? "",
      grid: graticulePath(projection, GRID_STEP[view]),
      scalePx: kmToPx(projection, 12, 108, 200),
    };
  }, [size.w, size.h, view]);

  const stormGeom = useMemo(() => {
    if (!base || !storm) return null;
    const p = base.projection;
    const center = nowPoint(storm);
    if (!center) return null;
    const cxy = project(p, center.lat, center.lon);
    if (!cxy) return null;
    const past = storm.track.filter((x) => x.kind === "past");
    const pastSrc = past.length > 0 ? past : (storm.pastPositions ?? []);
    const pastPts = pastSrc.map((x) => project(p, x.lat, x.lon)).filter((x): x is Pt => x !== null);
    const fcPts = storm.track.filter((x) => x.kind === "forecast").map((x) => project(p, x.lat, x.lon)).filter((x): x is Pt => x !== null);
    return {
      center: cxy,
      // Bán kính là km TỪ NGUỒN (GAP-02). Nguồn không có → không vẽ (BR-01, AT-03).
      gale: storm.radiusGaleKm !== null ? circlePath(p, center, storm.radiusGaleKm) : null,
      storm: storm.radiusStormKm !== null ? circlePath(p, center, storm.radiusStormKm) : null,
      pastD: polylinePath([...pastPts, cxy]),
      fcD: polylinePath([cxy, ...fcPts]),
      pastPts,
      fcPts,
    };
  }, [base, storm]);

  const vesselPts = useMemo(() => {
    if (!base) return [];
    return vessels
      .filter((v) => v.status !== "paused" && v.lastPosition)
      .map((v) => ({ v, xy: project(base.projection, v.lastPosition!.lat, v.lastPosition!.lon) }))
      .filter((x): x is { v: VesselWithRisk; xy: Pt } => x.xy !== null)
      .sort((a, b) => (a.v.id === selectedVesselId ? 1 : b.v.id === selectedVesselId ? -1 : 0));
  }, [base, vessels, selectedVesselId]);

  const credit = storm ? t("source.mapCredit", { name: storm.stamp.sourceName, time: formatTimeDateGmt7(storm.stamp.issuedAt) }) : t("source.mapCreditNoStorm");

  return (
    <View style={[styles.root, { backgroundColor: m.sea }]} onLayout={onLayout} accessibilityLabel={t("map.title")}>
      {base && (
        <Svg width={size.w} height={size.h}>
          <Path d={base.grid} stroke={m.grid} strokeWidth={1} fill="none" />
          <Path d={base.land} fill={m.land} stroke={m.coast} strokeWidth={0.8} />
          <Path d={base.vn} fill={m.landVn} stroke={m.coast} strokeWidth={0.8} />
          <Path d={base.archipelagos} fill={m.landVn} stroke={m.coast} strokeWidth={0.8} />
          <Path d={base.provinces} stroke={m.coast} strokeWidth={0.6} strokeDasharray="3 2" opacity={0.6} fill="none" />
          <Path d={base.borders} stroke={m.border} strokeWidth={1} fill="none" />
          {ARCHIPELAGOS.map((a) => {
            const xy = project(base.projection, a.lat, a.lon);
            return xy ? (
              <HaloText key={a.id} x={xy[0]} y={xy[1] + 16} fontSize={11} fontStyle="italic" fontWeight="600" fill={m.muted} halo={m.halo} haloWidth={3} textAnchor="middle">
                {a.name}
              </HaloText>
            ) : null;
          })}

          {stormGeom && (
            <G>
              {stormGeom.gale && <Path d={stormGeom.gale} fill={m.accent} fillOpacity={0.12} stroke={m.accent} strokeOpacity={0.7} strokeWidth={1.5} />}
              {stormGeom.storm && <Path d={stormGeom.storm} fill={m.accent} fillOpacity={0.3} stroke={m.accent} strokeWidth={2} />}
              <Path d={stormGeom.pastD} stroke={m.ink} strokeWidth={2} fill="none" />
              <Path d={stormGeom.fcD} stroke={m.ink} strokeWidth={2} strokeDasharray="5 4" fill="none" />
              {stormGeom.pastPts.map(([x, y], i) => (
                <Rect key={`p${i}`} x={x - 2.5} y={y - 2.5} width={5} height={5} fill={m.ink} />
              ))}
              {stormGeom.fcPts.map(([x, y], i) => (
                <Rect key={`f${i}`} x={x - 3} y={y - 3} width={6} height={6} fill={m.halo} stroke={m.ink} strokeWidth={1.2} />
              ))}
              <Circle cx={stormGeom.center[0]} cy={stormGeom.center[1]} r={11} stroke={m.accent} strokeWidth={2} fill="none" />
              <Circle cx={stormGeom.center[0]} cy={stormGeom.center[1]} r={4.5} fill={m.accent} />
              <Line x1={stormGeom.center[0] - 16} y1={stormGeom.center[1]} x2={stormGeom.center[0] + 16} y2={stormGeom.center[1]} stroke={m.accent} strokeWidth={1.5} />
              <Line x1={stormGeom.center[0]} y1={stormGeom.center[1] - 16} x2={stormGeom.center[0]} y2={stormGeom.center[1] + 16} stroke={m.accent} strokeWidth={1.5} />
            </G>
          )}

          {vesselPts.map(({ v, xy: [x, y] }) => {
            const lv = v.risk.level;
            const color = lv === "safe" ? m.ink : c.risk[lv].symbol;
            const selected = v.id === selectedVesselId;
            const showLabel = selected || lv === "danger" || lv === "warn";
            return (
              <G key={v.id} x={x} y={y}>
                {selected && <Rect x={-11} y={-11} width={22} height={22} rx={5} stroke={c.primary} strokeWidth={2} fill="none" />}
                <Path
                  d={symbolPath(lv, 5)}
                  fill={lv === "safe" ? "none" : color}
                  stroke={color}
                  strokeWidth={1.8}
                  strokeDasharray={v.risk.flags.includes("unverified") ? "2 1.5" : undefined}
                />
                {showLabel && (
                  <HaloText x={10} y={-8} fontSize={12} fontWeight="700" fill={m.ink} halo={m.halo} haloWidth={3.5}>
                    {v.regNo}
                  </HaloText>
                )}
              </G>
            );
          })}

          <G x={12} y={size.h - 14}>
            <Line x1={0} y1={0} x2={base.scalePx} y2={0} stroke={m.ink} strokeWidth={2} />
            <Line x1={0} y1={-4} x2={0} y2={0} stroke={m.ink} strokeWidth={2} />
            <Line x1={base.scalePx} y1={-4} x2={base.scalePx} y2={0} stroke={m.ink} strokeWidth={2} />
            <HaloText x={0} y={-7} fontSize={11} fill={m.ink} halo={m.halo} haloWidth={3}>
              {t("map.scale")}
            </HaloText>
          </G>
        </Svg>
      )}

      {/* Vùng chạm ≥ 44 px cho ghe và tâm bão (§8.3 #9, §9.5). */}
      {vesselPts.map(({ v, xy: [x, y] }) => (
        <Pressable
          key={`hit-${v.id}`}
          accessibilityRole="button"
          accessibilityLabel={t("map.vessel", { regNo: v.regNo, level: t(`risk.${v.risk.level}`) })}
          onPress={() => onVesselPick(v.id)}
          style={[styles.hit, { left: x - HIT / 2, top: y - HIT / 2 }]}
        />
      ))}
      {stormGeom && onStormPick && storm && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("map.stormCenter", { name: storm.nameVn })}
          onPress={onStormPick}
          style={[styles.hit, { left: stormGeom.center[0] - HIT / 2, top: stormGeom.center[1] - HIT / 2 }]}
        />
      )}

      {/* Ghi nguồn trên bản đồ §8.3 #12 (BR-01, BR-23; GAP-09). */}
      <View style={[styles.credit, { backgroundColor: theme === "ink" ? "rgba(24,36,58,0.82)" : "rgba(255,255,255,0.86)" }]} pointerEvents="none">
        <Text style={{ color: c.muted, fontSize: 11 }} numberOfLines={1}>
          {credit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: "hidden" },
  hit: { position: "absolute", width: HIT, height: HIT },
  credit: { position: "absolute", right: 8, bottom: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, maxWidth: "70%" },
});
