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

  const view = resolveDistrictView(districtCode, mapView);

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

    const bounds = L.latLngBounds(view.bounds[0], view.bounds[1]);

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: view.minZoom,
      maxZoom: view.maxZoom,
      maxBounds: bounds.pad(0.02),
      maxBoundsViscosity: 1,
    });

    L.control.zoom({ position: "topright" }).addTo(map);
    map.fitBounds(bounds, { padding: [12, 12], maxZoom: view.zoom });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: view.maxZoom,
      bounds,
    }).addTo(map);

    // Soft district frame so the view reads as “this district only”
    L.rectangle(bounds, {
      color: "#57534e",
      weight: 1.5,
      dashArray: "6 4",
      fill: false,
      interactive: false,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
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
      const root = popupRootRef.current;
      const popup = popupRef.current;
      if (popup) {
        map.closePopup(popup);
      }
      popupRootRef.current = null;
      popupContainerRef.current = null;
      popupRef.current = null;
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      // Defer unmount — React forbids sync unmount while a render is in progress.
      if (root) {
        setTimeout(() => {
          root.unmount();
        }, 0);
      }
    };
    // Remounted by parent key when district changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

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
        const latlng = (event.target as L.Marker).getLatLng();
        callbacksRef.current.onMarkerDrag(
          Number(latlng.lat.toFixed(6)),
          Number(latlng.lng.toFixed(6)),
          marker,
        );
      });

      leafletMarker.addTo(layer);
    });
  }, [markers, selectedMarkerId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusLatLng || !view) return;
    if (focusLatLng.latitude == null || focusLatLng.longitude == null) return;
    const bounds = L.latLngBounds(view.bounds[0], view.bounds[1]);
    const target = L.latLng(focusLatLng.latitude, focusLatLng.longitude);
    if (!bounds.contains(target)) return;
    map.setView(target, Math.max(map.getZoom(), 13), { animate: true });
  }, [focusLatLng, view]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (
      !formValues ||
      formValues.latitude == null ||
      formValues.longitude == null ||
      !onFormChange ||
      !onFormSave ||
      !onFormCancel
    ) {
      if (popupRef.current) map.closePopup(popupRef.current);
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
        maxWidth: 320,
        minWidth: 280,
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        className: "district-leaflet-popup",
        offset: [0, -12],
      });
    }

    popupRef.current
      .setLatLng([formValues.latitude, formValues.longitude])
      .setContent(popupContainerRef.current);

    if (!map.hasLayer(popupRef.current)) {
      popupRef.current.openOn(map);
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
