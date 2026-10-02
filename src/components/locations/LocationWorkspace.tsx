"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DistrictMap } from "@/components/map/DistrictMap";
import { MapPointPopup } from "@/components/map/MapPointPopup";
import { DistrictSelector } from "@/components/districts/DistrictSelector";
import {
  locationToFormValues,
  type LocationFormValues,
} from "@/components/locations/LocationForm";
import { LocationTable } from "@/components/locations/LocationTable";
import { LocationFilters } from "@/components/locations/LocationFilters";
import { LocationDetails } from "@/components/locations/LocationDetails";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { distanceMeters, findNearestHotspot } from "@/lib/maps/hotspots";
import type { Category, District, EntityStatus, Location, MapMarkerData } from "@/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

function findNearestSavedLocation(
  locations: Location[],
  latitude: number,
  longitude: number,
  radiusMeters = 1200,
): Location | null {
  let nearest: Location | null = null;
  let best = Number.POSITIVE_INFINITY;

  for (const location of locations) {
    if (location.latitude == null || location.longitude == null) continue;
    const distance = distanceMeters(
      latitude,
      longitude,
      location.latitude,
      location.longitude,
    );
    if (distance <= radiusMeters && distance < best) {
      best = distance;
      nearest = location;
    }
  }

  return nearest;
}

export function LocationWorkspace() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [districtId, setDistrictId] = useState<string>("");
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<LocationFormValues | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusLatLng, setFocusLatLng] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [searchPin, setSearchPin] = useState<MapMarkerData | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<EntityStatus | "ALL">("ALL");
  const [deleteTarget, setDeleteTarget] = useState<Location | MapMarkerData | null>(null);
  const [details, setDetails] = useState<Location | null>(null);

  const selectedDistrict = useMemo(
    () => districts.find((district) => district.id === districtId) ?? null,
    [districts, districtId],
  );

  const loadDistricts = useCallback(async () => {
    setLoadingDistricts(true);
    try {
      const data = await fetchJson<District[]>("/api/districts?status=ACTIVE");
      setDistricts(data);
      if (data.length > 0) {
        setDistrictId((current) => current || data[0].id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load districts");
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchJson<Category[]>("/api/categories?status=ACTIVE");
      setCategories(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load categories");
    }
  }, []);

  const loadLocations = useCallback(async () => {
    if (!districtId) {
      setLocations([]);
      return;
    }

    setLoadingLocations(true);
    try {
      // Load full district set so map pins stay visible while searching places.
      const params = new URLSearchParams({ districtId });
      if (categoryFilter !== "ALL") params.set("categoryId", categoryFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const data = await fetchJson<Location[]>(`/api/locations?${params.toString()}`);
      setLocations(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  }, [districtId, categoryFilter, statusFilter]);

  const filteredLocations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((location) => {
      return (
        location.name.toLowerCase().includes(q) ||
        (location.address ?? "").toLowerCase().includes(q) ||
        (location.description ?? "").toLowerCase().includes(q) ||
        (location.category?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [locations, search]);

  useEffect(() => {
    void loadDistricts();
    void loadCategories();
  }, [loadDistricts, loadCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadLocations();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadLocations]);

  // Place search: hotspots + OpenStreetMap names inside the district (e.g. Krishnadevipeta)
  useEffect(() => {
    const q = search.trim();
    if (!q || !selectedDistrict) {
      setSearchPin(null);
      return;
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const localMatch = locations.find(
            (location) =>
              location.name.toLowerCase().includes(q.toLowerCase()) ||
              (location.address ?? "").toLowerCase().includes(q.toLowerCase()),
          );
          if (
            localMatch?.latitude != null &&
            localMatch.longitude != null
          ) {
            setFocusLatLng({
              latitude: localMatch.latitude,
              longitude: localMatch.longitude,
            });
            setSelectedId(localMatch.id);
            setSearchPin(null);
            return;
          }

          const results = await fetchJson<
            Array<{
              name: string;
              latitude: number;
              longitude: number;
              source: string;
              pointType?: "RED" | "BLUE";
            }>
          >(
            `/api/places/search?${new URLSearchParams({
              q,
              districtCode: selectedDistrict.code,
            }).toString()}`,
          );

          const hit = results[0];
          if (!hit) {
            setSearchPin(null);
            if (q.length >= 4) {
              toast.message(`No place found for "${q}" in this district.`);
            }
            return;
          }

          setFocusLatLng({ latitude: hit.latitude, longitude: hit.longitude });
          setSearchPin({
            id: "search-result",
            pixelX: 0,
            pixelY: 0,
            name: hit.name,
            latitude: hit.latitude,
            longitude: hit.longitude,
            pointType: hit.pointType ?? "CUSTOM",
            temporary: true,
          });
          setSelectedId("temporary");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Search failed");
        }
      })();
    }, 400);

    return () => clearTimeout(timer);
  }, [search, selectedDistrict, locations]);

  const openFormAt = useCallback((values: LocationFormValues) => {
    setFormValues({
      ...values,
      sessionKey:
        values.sessionKey ??
        `pin-${values.id ?? "new"}-${values.latitude}-${values.longitude}-${Date.now()}`,
    });
    setSelectedId(values.id ?? "temporary");
    if (values.latitude != null && values.longitude != null) {
      setFocusLatLng({ latitude: values.latitude, longitude: values.longitude });
    }
    setDetails(null);
  }, []);

  const handleDistrictChange = (nextId: string) => {
    setDistrictId(nextId);
    setFormValues(null);
    setSelectedId(null);
    setFocusLatLng(null);
    setSearchPin(null);
    setDetails(null);
  };

  const handleMapClick = (latitude: number, longitude: number) => {
    if (!selectedDistrict) return;

    const nearestSaved = findNearestSavedLocation(locations, latitude, longitude);
    if (nearestSaved) {
      openFormAt(locationToFormValues(nearestSaved));
      return;
    }

    const hotspot = findNearestHotspot(
      selectedDistrict.code,
      latitude,
      longitude,
      undefined,
      selectedDistrict.hotspots,
    );
    const categoryFromHotspot = hotspot
      ? categories.find((category) => category.name === hotspot.categoryName)
      : undefined;

    openFormAt({
      districtId: selectedDistrict.id,
      categoryId: categoryFromHotspot?.id ?? categories[0]?.id ?? "",
      name: hotspot?.name ?? "",
      pixelX: 0,
      pixelY: 0,
      latitude: hotspot?.latitude ?? latitude,
      longitude: hotspot?.longitude ?? longitude,
      address: hotspot?.address ?? "",
      description: hotspot?.description ?? "",
      pointType: hotspot?.pointType ?? "CUSTOM",
      markerColor:
        hotspot?.pointType === "RED" || hotspot?.pointType === "BLUE"
          ? ""
          : "#f59e0b",
      status: "ACTIVE",
    });
  };

  const handleMarkerDrag = (
    latitude: number,
    longitude: number,
    marker: MapMarkerData,
  ) => {
    if (!formValues) return;
    if (marker.temporary || marker.id === formValues.id) {
      setFormValues({
        ...formValues,
        latitude,
        longitude,
        // Keep the same session so the popup does not remount while dragging
        sessionKey: formValues.sessionKey,
      });
    }
  };

  const markers: MapMarkerData[] = useMemo(() => {
    const saved: MapMarkerData[] = locations.map((location) => ({
      id: location.id,
      pixelX: location.pixelX,
      pixelY: location.pixelY,
      name: location.name,
      categoryName: location.category?.name,
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address,
      description: location.description,
      pointType: location.pointType,
      markerColor: location.markerColor,
      status: location.status,
    }));

    if (formValues && !formValues.id) {
      saved.push({
        pixelX: 0,
        pixelY: 0,
        name: formValues.name || "New location",
        categoryName: categories.find((c) => c.id === formValues.categoryId)?.name,
        latitude: formValues.latitude,
        longitude: formValues.longitude,
        address: formValues.address,
        description: formValues.description,
        pointType: formValues.pointType,
        markerColor: formValues.markerColor,
        status: formValues.status,
        temporary: true,
      });
    } else if (searchPin && !formValues) {
      saved.push(searchPin);
    }

    if (formValues?.id) {
      return saved.map((marker) =>
        marker.id === formValues.id
          ? {
              ...marker,
              latitude: formValues.latitude,
              longitude: formValues.longitude,
              name: formValues.name || marker.name,
              pointType: formValues.pointType,
              markerColor: formValues.markerColor,
            }
          : marker,
      );
    }

    return saved;
  }, [locations, formValues, categories, searchPin]);

  const saveLocation = async (valuesOverride?: LocationFormValues) => {
    const current = valuesOverride ?? formValues;
    if (!current || !selectedDistrict) return;
    if (!current.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    if (!current.categoryId) {
      toast.error("Category is required");
      return;
    }
    if (current.latitude == null || current.longitude == null) {
      toast.error("Latitude and longitude are required");
      return;
    }

    const resolvedColor =
      current.pointType === "CUSTOM"
        ? current.markerColor?.trim() || "#f59e0b"
        : null;

    setSaving(true);
    try {
      const payload = {
        districtId: selectedDistrict.id,
        categoryId: current.categoryId,
        name: current.name.trim(),
        pixelX: 0,
        pixelY: 0,
        latitude: current.latitude,
        longitude: current.longitude,
        address: current.address.trim() || null,
        description: current.description.trim() || null,
        pointType: current.pointType,
        markerColor: resolvedColor,
        status: current.status,
      };

      const saved = current.id
        ? await fetchJson<Location>(`/api/locations/${current.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetchJson<Location>("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      toast.success(current.id ? "Location updated" : "Location saved");
      setFormValues(null);
      setSelectedId(saved.id);
      setSearchPin(null);
      if (saved.latitude != null && saved.longitude != null) {
        setFocusLatLng({ latitude: saved.latitude, longitude: saved.longitude });
      }
      await loadLocations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await fetchJson(`/api/locations/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Location deleted");
      if (formValues?.id === deleteTarget.id) setFormValues(null);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      if (details?.id === deleteTarget.id) setDetails(null);
      setDeleteTarget(null);
      await loadLocations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete location");
    }
  };

  const editLocation = (location: Location) => {
    openFormAt(locationToFormValues(location));
  };

  const viewLocation = (location: Location) => {
    setDetails(location);
    setSelectedId(location.id);
    if (location.latitude != null && location.longitude != null) {
      setFocusLatLng({ latitude: location.latitude, longitude: location.longitude });
    }
    setFormValues(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">District Map</h1>
          <p className="text-sm text-muted-foreground">
            Select a district to open its map. Click red (mandal) or blue (tourism) points
            for latitude / longitude.
          </p>
        </div>
        <DistrictSelector
          districts={districts}
          value={districtId}
          onChange={handleDistrictChange}
          loading={loadingDistricts}
          className="w-full max-w-sm"
        />
      </div>

      <LocationFilters
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        categoryId={categoryFilter}
        status={statusFilter}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
      />

      {!selectedDistrict ? (
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
          {loadingDistricts ? "Loading districts..." : "No districts available."}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <DistrictMap
              key={selectedDistrict.id}
              districtCode={selectedDistrict.code}
              districtName={selectedDistrict.name}
              mapView={selectedDistrict.mapView}
              markers={markers}
              selectedMarkerId={selectedId}
              focusLatLng={focusLatLng}
              categories={categories}
              onMapClick={handleMapClick}
              onMarkerSelect={(marker) => {
                if (marker.id) {
                  const location = locations.find((item) => item.id === marker.id);
                  if (location) {
                    openFormAt(locationToFormValues(location));
                    return;
                  }
                }
                if (formValues) {
                  setSelectedId(marker.id ?? "temporary");
                }
              }}
              onMarkerDrag={handleMarkerDrag}
            />

            <aside className="lg:sticky lg:top-4">
              {formValues ? (
                <MapPointPopup
                  values={formValues}
                  categories={categories}
                  mapWidth={1}
                  mapHeight={1}
                  calibrated
                  saving={saving}
                  anchored={false}
                  onChange={setFormValues}
                  onSave={(values) => void saveLocation(values)}
                  onCancel={() => {
                    setFormValues(null);
                    setSelectedId(null);
                  }}
                />
              ) : (
                <div className="rounded-lg border border-dashed bg-white p-4 text-sm text-muted-foreground">
                  Click the map or a red/blue point to edit location details here.
                </div>
              )}
            </aside>
          </div>
          <LocationDetails location={details} />
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-stone-900">Saved Locations</h2>
        <LocationTable
          locations={filteredLocations}
          loading={loadingLocations}
          selectedId={selectedId}
          onView={viewLocation}
          onEdit={editLocation}
          onDelete={(location) => setDeleteTarget(location)}
          onAdd={() =>
            toast.message("Click the map or a red/blue point to open location fields.")
          }
        />
      </div>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location?
              {deleteTarget && "name" in deleteTarget && deleteTarget.name
                ? ` "${deleteTarget.name}" will be permanently removed.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
