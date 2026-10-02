"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MapMarkerData } from "@/types";

const LeafletDistrictMap = dynamic(
  () =>
    import("@/components/map/LeafletDistrictMap").then(
      (mod) => mod.LeafletDistrictMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading district map...
      </div>
    ),
  },
);

type EmbedMapProps = {
  districtCode: string;
  districtName: string;
  mapView?: import("@/lib/maps/types").DistrictMapView | null;
  markers: MapMarkerData[];
  selectedMarkerId?: string | null;
  focusLatLng?: { latitude: number; longitude: number } | null;
};

type ParentMessage =
  | { type: "district-map:props"; payload: EmbedMapProps }
  | { type: "district-map:ping" };

function postToParent(message: Record<string, unknown>) {
  if (typeof window === "undefined" || window.parent === window) return;
  window.parent.postMessage(message, window.location.origin);
}

export default function EmbedMapPage() {
  const [props, setProps] = useState<EmbedMapProps | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<ParentMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "district-map:props") {
        setProps(event.data.payload);
      }
    };

    window.addEventListener("message", onMessage);
    postToParent({ type: "district-map:ready" });
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!props) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading district map...
      </div>
    );
  }

  return (
    <div className="h-full w-full [&_.rounded-lg]:rounded-none [&_.border]:border-0">
      <LeafletDistrictMap
        districtCode={props.districtCode}
        districtName={props.districtName}
        mapView={props.mapView}
        markers={props.markers}
        selectedMarkerId={props.selectedMarkerId}
        focusLatLng={props.focusLatLng}
        onMapClick={(latitude, longitude) =>
          postToParent({ type: "district-map:click", latitude, longitude })
        }
        onMarkerSelect={(marker) =>
          postToParent({ type: "district-map:marker-select", marker })
        }
        onMarkerDrag={(latitude, longitude, marker) =>
          postToParent({
            type: "district-map:marker-drag",
            latitude,
            longitude,
            marker,
          })
        }
      />
    </div>
  );
}
