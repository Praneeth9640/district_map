"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { resolveDistrictView } from "@/lib/maps/districtViews";
import type { DistrictMapView } from "@/lib/maps/types";
import type { MapMarkerData, PointType } from "@/types";

export interface LeafletDistrictMapProps {
  districtCode: string;
  districtName: string;
  mapView?: DistrictMapView | null;
  markers: MapMarkerData[];
  selectedMarkerId?: string | null;
  focusLatLng?: { latitude: number; longitude: number } | null;
  onMapClick: (latitude: number, longitude: number) => void;
  onMarkerSelect: (marker: MapMarkerData) => void;
  onMarkerDrag: (latitude: number, longitude: number, marker: MapMarkerData) => void;
}

function normalizeHexColor(value?: string | null): string {
  if (!value) return "#f59e0b";
  const trimmed = value.trim();
  if (/^#([0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  if (/^#([0-9a-fA-F]{3})$/.test(trimmed)) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#f59e0b";
}

function createPointIcon(
  pointType: PointType | undefined,
  selected: boolean,
  temporary?: boolean,
  markerColor?: string | null,
) {
  const selectedClass = selected ? " is-selected" : "";
  const tempClass = temporary ? " is-temp" : "";

  if (pointType === "BLUE") {
    return L.divIcon({
      className: "district-map-marker",
      html: `<span class="dm-dot dm-dot-blue${selectedClass}${tempClass}" title="Tourism"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  if (pointType === "RED") {
    return L.divIcon({
      className: "district-map-marker",
      html: `<span class="dm-dot dm-dot-red${selectedClass}${tempClass}" title="Mandal Headquarter"><span class="dm-dot-core"></span></span>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  const color = normalizeHexColor(markerColor);
  return L.divIcon({
    className: "district-map-marker",
    html: `<span class="dm-dot dm-dot-custom${selectedClass}${tempClass}" style="--dm-color:${color};background:${color}" title="Custom"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function isMapAlive(map: L.Map | null | undefined): map is L.Map {
  if (!map) return false;
  try {
    const container = map.getContainer();
    return Boolean(container?.isConnected && (map as L.Map & { _loaded?: boolean })._loaded);
  } catch {
    return false;
  }
}

/**
 * Leaflet map locked to the selected district bounds (not the full world map).
 * Location details are edited in the side panel — not as a map popup.
 * @see https://leafletjs.com/
 */
export function LeafletDistrictMap({
  districtCode,
  districtName,
  mapView,
  markers,
  selectedMarkerId,
  focusLatLng,
  onMapClick,
  onMarkerSelect,
  onMarkerDrag,
}: LeafletDistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const disposedRef = useRef(false);
  const markerLayoutKeyRef = useRef("");
  const markerSelectionKeyRef = useRef("");
  const lastFocusKeyRef = useRef("");

  const view = resolveDistrictView(districtCode, mapView);
  const viewKey = view
    ? [
        districtCode,
        view.centerLat,
        view.centerLng,
        view.zoom,
        view.minZoom,
        view.maxZoom,
        view.bounds[0]?.join(","),
        view.bounds[1]?.join(","),
      ].join("|")
    : "";
  const focusKey =
    focusLatLng?.latitude != null && focusLatLng?.longitude != null
      ? `${focusLatLng.latitude},${focusLatLng.longitude}`
      : "";

  const callbacksRef = useRef({
    onMapClick,
    onMarkerSelect,
    onMarkerDrag,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMapClick,
      onMarkerSelect,
      onMarkerDrag,
    };
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !view) return;

    disposedRef.current = false;
    const bounds = L.latLngBounds(view.bounds[0], view.bounds[1]);

    const map = L.map(containerRef.current, {
      center: [view.centerLat, view.centerLng],
      zoom: view.zoom,
      zoomControl: false,
      attributionControl: false,
      keyboard: false,
      minZoom: view.minZoom,
      maxZoom: view.maxZoom,
      maxBounds: bounds.pad(0.02),
      maxBoundsViscosity: 1,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: view.maxZoom,
      bounds,
      noWrap: true,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    const fitWhenReady = () => {
      if (disposedRef.current || !isMapAlive(map)) return;
      try {
        map.invalidateSize({ animate: false });
        const size = map.getSize();
        if (!size.x || !size.y) {
          window.setTimeout(fitWhenReady, 50);
          return;
        }
        map.fitBounds(bounds, {
          padding: [12, 12],
          maxZoom: view.zoom,
          animate: false,
        });
      } catch {
        // Ignore transient Leaflet layout errors while the iframe settles.
      }
    };

    map.whenReady(fitWhenReady);
    window.setTimeout(fitWhenReady, 0);

    map.on("click", (event: L.LeafletMouseEvent) => {
      if (disposedRef.current) return;
      const target = event.originalEvent.target as HTMLElement | null;
      if (target?.closest(".leaflet-marker-icon")) return;
      if (!bounds.contains(event.latlng)) return;
      callbacksRef.current.onMapClick(
        Number(event.latlng.lat.toFixed(6)),
        Number(event.latlng.lng.toFixed(6)),
      );
    });

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    return () => {
      disposedRef.current = true;
      markerLayoutKeyRef.current = "";
      markerSelectionKeyRef.current = "";
      lastFocusKeyRef.current = "";
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markersLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (disposedRef.current || !isMapAlive(map) || !layer) return;

    const layoutKey = markers
      .map((marker) =>
        [
          marker.id ?? "tmp",
          marker.latitude,
          marker.longitude,
          marker.pointType,
          marker.markerColor ?? "",
          marker.temporary ? 1 : 0,
        ].join(":"),
      )
      .join("|");
    const selectionKey = String(selectedMarkerId ?? "");

    if (
      markerLayoutKeyRef.current === layoutKey &&
      markerSelectionKeyRef.current === selectionKey
    ) {
      return;
    }

    markerLayoutKeyRef.current = layoutKey;
    markerSelectionKeyRef.current = selectionKey;

    try {
      layer.clearLayers();

      markers.forEach((marker) => {
        if (marker.latitude == null || marker.longitude == null) return;

        const selected =
          selectedMarkerId === marker.id ||
          Boolean(marker.temporary && selectedMarkerId === "temporary");

        const leafletMarker = L.marker([marker.latitude, marker.longitude], {
          icon: createPointIcon(
            marker.pointType,
            selected,
            marker.temporary,
            marker.markerColor,
          ),
          draggable: true,
          title: marker.name ?? "Location",
          riseOnHover: true,
        });

        leafletMarker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          callbacksRef.current.onMarkerSelect(marker);
        });

        leafletMarker.on("drag", (event) => {
          if (disposedRef.current) return;
          const latlng = (event.target as L.Marker).getLatLng();
          callbacksRef.current.onMarkerDrag(
            Number(latlng.lat.toFixed(6)),
            Number(latlng.lng.toFixed(6)),
            marker,
          );
        });

        leafletMarker.addTo(layer);
      });
    } catch {
      // Ignore if map was torn down mid-update.
    }
  }, [markers, selectedMarkerId]);

  useEffect(() => {
    const map = mapRef.current;
    if (disposedRef.current || !isMapAlive(map) || !focusKey || !view) return;
    if (focusKey === lastFocusKeyRef.current) return;
    lastFocusKeyRef.current = focusKey;

    const [latText, lngText] = focusKey.split(",");
    const latitude = Number(latText);
    const longitude = Number(lngText);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const bounds = L.latLngBounds(view.bounds[0], view.bounds[1]);
    const target = L.latLng(latitude, longitude);
    if (!bounds.contains(target)) return;

    try {
      map.panTo(target, { animate: false });
    } catch {
      // Ignore transient Leaflet errors.
    }
  }, [focusKey, view]);

  if (!view) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-stone-100 px-6 text-center text-sm text-muted-foreground sm:min-h-[560px] lg:min-h-[640px]">
        Map bounds for {districtName} ({districtCode}) are not configured yet.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border bg-stone-100">
      <div
        ref={containerRef}
        className="h-full min-h-[420px] w-full sm:min-h-[560px] lg:h-full lg:min-h-[640px]"
        role="application"
        aria-label={`${districtName} interactive district map`}
      />
    </div>
  );
}
