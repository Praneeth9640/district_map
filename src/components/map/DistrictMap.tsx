"use client";

import { useEffect, useRef } from "react";
import type { LeafletDistrictMapProps } from "@/components/map/LeafletDistrictMap";
import type { LocationFormValues } from "@/components/locations/LocationForm";
import type { MapMarkerData } from "@/types";

type EmbedOutbound =
  | { type: "district-map:ready" }
  | { type: "district-map:click"; latitude: number; longitude: number }
  | { type: "district-map:marker-select"; marker: MapMarkerData }
  | {
      type: "district-map:marker-drag";
      latitude: number;
      longitude: number;
      marker: MapMarkerData;
    }
  | { type: "district-map:form-change"; values: LocationFormValues }
  | { type: "district-map:form-save" }
  | { type: "district-map:form-cancel" };

/**
 * Renders the Leaflet district map inside a same-origin iframe so page
 * dropdowns are never covered by map stacking contexts.
 */
export function DistrictMap(props: LeafletDistrictMapProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const propsRef = useRef(props);
  const readyRef = useRef(false);

  propsRef.current = props;

  const pushProps = () => {
    const frame = iframeRef.current?.contentWindow;
    if (!frame || !readyRef.current) return;
    const {
      onMapClick: _c,
      onMarkerSelect: _s,
      onMarkerDrag: _d,
      onFormChange: _fc,
      onFormSave: _fs,
      onFormCancel: _fx,
      ...serializable
    } = propsRef.current;
    frame.postMessage(
      { type: "district-map:props", payload: serializable },
      window.location.origin,
    );
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent<EmbedOutbound>) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;

      const current = propsRef.current;
      switch (event.data.type) {
        case "district-map:ready":
          readyRef.current = true;
          pushProps();
          break;
        case "district-map:click":
          current.onMapClick(event.data.latitude, event.data.longitude);
          break;
        case "district-map:marker-select":
          current.onMarkerSelect(event.data.marker);
          break;
        case "district-map:marker-drag":
          current.onMarkerDrag(
            event.data.latitude,
            event.data.longitude,
            event.data.marker,
          );
          break;
        case "district-map:form-change":
          current.onFormChange?.(event.data.values);
          break;
        case "district-map:form-save":
          current.onFormSave?.();
          break;
        case "district-map:form-cancel":
          current.onFormCancel?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pushProps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.districtCode,
    props.districtName,
    props.mapView,
    props.markers,
    props.selectedMarkerId,
    props.focusLatLng,
    props.formValues,
    props.categories,
    props.saving,
  ]);

  return (
    <iframe
      ref={iframeRef}
      title={`${props.districtName} district map`}
      src="/embed/map"
      className="h-[420px] w-full rounded-lg border-0 bg-stone-100 sm:h-[560px] lg:h-[640px]"
      onLoad={() => {
        // ready message may arrive before or after load; nudge a resync
        if (readyRef.current) pushProps();
      }}
    />
  );
}

export type DistrictMapProps = LeafletDistrictMapProps;
