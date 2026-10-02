"use client";

import { useEffect, useRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPointPopup } from "@/components/map/MapPointPopup";
import type { LocationFormValues } from "@/components/locations/LocationForm";
import { resolveDistrictView } from "@/lib/maps/districtViews";
import type { DistrictMapView } from "@/lib/maps/types";
import type { Category, MapMarkerData, PointType } from "@/types";

export interface LeafletDistrictMapProps {
  districtCode: string;
  districtName: string;
  mapView?: DistrictMapView | null;
  markers: MapMarkerData[];
  selectedMarkerId?: string | null;
  focusLatLng?: { latitude: number; longitude: number } | null;
  formValues?: LocationFormValues | null;
  categories: Category[];
  saving?: boolean;
  onMapClick: (latitude: number, longitude: number) => void;
  onMarkerSelect: (marker: MapMarkerData) => void;
  onMarkerDrag: (latitude: number, longitude: number, marker: MapMarkerData) => void;
  onFormChange?: (values: LocationFormValues) => void;
  onFormSave?: () => void;
  onFormCancel?: () => void;
}

function createPointIcon(
  pointType: PointType | undefined,
  selected: boolean,
  temporary?: boolean,
) {
  if (temporary) {
    return L.divIcon({
      className: "district-map-marker",
      html: `<span class="dm-dot dm-dot-temp${selected ? " is-selected" : ""}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  if (pointType === "BLUE") {
    return L.divIcon({
      className: "district-map-marker",
      html: `<span class="dm-dot dm-dot-blue${selected ? " is-selected" : ""}" title="Tourism"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  if (pointType === "RED") {
    return L.divIcon({
      className: "district-map-marker",
      html: `<span class="dm-dot dm-dot-red${selected ? " is-selected" : ""}" title="Mandal Headquarter"><span class="dm-dot-core"></span></span>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  return L.divIcon({
    className: "district-map-marker",
    html: `<span class="dm-dot dm-dot-custom${selected ? " is-selected" : ""}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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
 * @see https://leafletjs.com/
 */
export function LeafletDistrictMap({
  districtCode,
  districtName,
  mapView,
  markers,
  selectedMarkerId,
  focusLatLng,
  formValues,
  categories,
  saving,
  onMapClick,
  onMarkerSelect,
  onMarkerDrag,
  onFormChange,
  onFormSave,
  onFormCancel,
}: LeafletDistrictMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<L.Popup | null>(null);
  const disposedRef = useRef(false);
  const markerLayoutKeyRef = useRef("");
  const markerSelectionKeyRef = useRef("");

  const view = resolveDistrictView(districtCode, mapView);
  // Stable key so iframe prop identity changes do not remount / refit the map.
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
  const lastFocusKeyRef = useRef("");

  const callbacksRef = useRef({
    onMapClick,
    onMarkerSelect,
    onMarkerDrag,
    onFormChange,
    onFormSave,
    onFormCancel,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMapClick,
      onMarkerSelect,
      onMarkerDrag,
      onFormChange,
      onFormSave,
      onFormCancel,
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
      if (target?.closest(".leaflet-marker-icon, .district-map-popup, .leaflet-popup")) {
        return;
      }
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
      const root = popupRootRef.current;
      const popup = popupRef.current;
      try {
        if (popup && isMapAlive(map)) {
          map.closePopup(popup);
        }
      } catch {
        // ignore
      }
      popupRootRef.current = null;
      popupContainerRef.current = null;
      popupRef.current = null;
      markerLayoutKeyRef.current = "";
      markerSelectionKeyRef.current = "";
      try {
        map.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
      markersLayerRef.current = null;
      if (root) {
        setTimeout(() => {
          try {
            root.unmount();
          } catch {
            // ignore
          }
        }, 0);
      }
    };
    // Remount only when district bounds config actually changes
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
          icon: createPointIcon(marker.pointType, selected, marker.temporary),
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
      // Pan only — never change zoom when focusing a pin / form field sync.
      map.panTo(target, { animate: false });
    } catch {
      // Ignore transient Leaflet errors.
    }
  }, [focusKey, view]);

  useEffect(() => {
    const map = mapRef.current;
    if (disposedRef.current || !isMapAlive(map)) return;

    if (
      !formValues ||
      formValues.latitude == null ||
      formValues.longitude == null ||
      !onFormChange ||
      !onFormSave ||
      !onFormCancel
    ) {
      try {
        if (popupRef.current && map.hasLayer(popupRef.current)) {
          map.closePopup(popupRef.current);
        }
      } catch {
        // ignore
      }
      return;
    }

    if (!popupContainerRef.current) {
      popupContainerRef.current = document.createElement("div");
      popupContainerRef.current.className = "district-map-popup";
      popupRootRef.current = createRoot(popupContainerRef.current);
    }

    popupRootRef.current?.render(
      <MapPointPopup
        values={formValues}
        categories={categories}
        mapWidth={1}
        mapHeight={1}
        calibrated
        saving={saving}
        onChange={(values) => callbacksRef.current.onFormChange?.(values)}
        onSave={() => callbacksRef.current.onFormSave?.()}
        onCancel={() => callbacksRef.current.onFormCancel?.()}
        anchored={false}
      />,
    );

    if (!popupRef.current) {
      popupRef.current = L.popup({
        maxWidth: 340,
        minWidth: 300,
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        autoPan: false,
        className: "district-leaflet-popup",
        offset: [0, -12],
      });
    }

    const popup = popupRef.current;
    const nextLatLng = L.latLng(formValues.latitude, formValues.longitude);

    try {
      if (!map.hasLayer(popup)) {
        popup.setLatLng(nextLatLng);
        popup.setContent(popupContainerRef.current);
        popup.openOn(map);
        return;
      }

      const currentLatLng = popup.getLatLng();
      const coordsChanged =
        !currentLatLng ||
        Math.abs(currentLatLng.lat - nextLatLng.lat) > 1e-9 ||
        Math.abs(currentLatLng.lng - nextLatLng.lng) > 1e-9;

      if (coordsChanged) {
        popup.setLatLng(nextLatLng);
      }
    } catch {
      // Ignore if popup/map was disposed during the update.
    }
  }, [
    formValues,
    categories,
    saving,
    onFormChange,
    onFormSave,
    onFormCancel,
  ]);

  if (!view) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-stone-100 px-6 text-center text-sm text-muted-foreground sm:min-h-[560px] lg:min-h-[640px]">
        Map bounds for {districtName} ({districtCode}) are not configured yet.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-stone-100">
      <div
        ref={containerRef}
        className="h-full min-h-[420px] w-full sm:min-h-[560px] lg:h-full lg:min-h-[640px]"
        role="application"
        aria-label={`${districtName} interactive district map`}
      />
    </div>
  );
}
