"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { emptyMapView } from "@/lib/maps/districtViews";
import type {
  District,
  DistrictHotspot,
  DistrictMapView,
  EntityStatus,
} from "@/types";

type HotspotForm = DistrictHotspot;

type DistrictForm = {
  name: string;
  code: string;
  status: EntityStatus;
  mapView: DistrictMapView;
  hotspots: HotspotForm[];
};

const emptyHotspot = (): HotspotForm => ({
  name: "",
  pointType: "BLUE",
  latitude: 17.7,
  longitude: 82.8,
  address: "",
  description: "",
  categoryName: "Tourism",
});

const emptyForm = (): DistrictForm => ({
  name: "",
  code: "",
  status: "ACTIVE",
  mapView: emptyMapView(),
  hotspots: [],
});

function num(value: string, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function DistrictsManager() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<District | null>(null);
  const [form, setForm] = useState<DistrictForm>(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/districts");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load districts");
      setDistricts(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load districts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openEdit = (district: District) => {
    setEditing(district);
    setForm({
      name: district.name,
      code: district.code,
      status: district.status,
      mapView: district.mapView ?? emptyMapView(),
      hotspots: district.hotspots?.length
        ? district.hotspots.map((item) => ({ ...item }))
        : [],
    });
    setOpen(true);
  };

  const updateMapView = <K extends keyof DistrictMapView>(
    key: K,
    value: DistrictMapView[K],
  ) => {
    setForm((current) => ({
      ...current,
      mapView: { ...current.mapView, [key]: value },
    }));
  };

  const updateBound = (
    corner: 0 | 1,
    axis: 0 | 1,
    value: number,
  ) => {
    setForm((current) => {
      const bounds: DistrictMapView["bounds"] = [
        [...current.mapView.bounds[0]],
        [...current.mapView.bounds[1]],
      ];
      bounds[corner][axis] = value;
      return {
        ...current,
        mapView: { ...current.mapView, bounds },
      };
    });
  };

  const updateHotspot = (index: number, patch: Partial<HotspotForm>) => {
    setForm((current) => ({
      ...current,
      hotspots: current.hotspots.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  };

  const save = async () => {
    if (!editing) {
      toast.error("Districts are fixed — you can only edit map settings.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        status: form.status,
        mapView: form.mapView,
        hotspots: form.hotspots.map((item) => ({
          ...item,
          name: item.name.trim(),
          categoryName: item.categoryName.trim() || "Other",
          address: item.address?.trim() || undefined,
          description: item.description?.trim() || undefined,
        })),
      };

      if (form.hotspots.some((item) => !item.name.trim())) {
        toast.error("Each red/blue point needs a name");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/districts/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save district");
      toast.success("District map updated");
      setOpen(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save district");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Districts</h1>
          <p className="text-sm text-muted-foreground">
            Fixed district set — edit Leaflet bounds and red/blue points for each map.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Map</th>
              <th className="px-4 py-3">Pins</th>
              <th className="px-4 py-3">Locations</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                  Loading districts...
                </td>
              </tr>
            ) : districts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-muted-foreground">
                  No districts found.
                </td>
              </tr>
            ) : (
              districts.map((district) => (
                <tr key={district.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{district.name}</td>
                  <td className="px-4 py-3">{district.code}</td>
                  <td className="px-4 py-3">
                    {district.mapView ? (
                      <Badge variant="success">Leaflet</Badge>
                    ) : (
                      <Badge variant="secondary">Not set</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{district.hotspots?.length ?? 0}</td>
                  <td className="px-4 py-3">{district._count?.locations ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge variant={district.status === "ACTIVE" ? "success" : "secondary"}>
                      {district.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => openEdit(district)}>
                      Edit map
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit district map</DialogTitle>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>District Name</Label>
                <Input value={form.name} readOnly className="bg-stone-50" />
              </div>
              <div className="space-y-2">
                <Label>District Code</Label>
                <Input value={form.code} readOnly className="bg-stone-50" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as EntityStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active (shows in map dropdown)</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg border bg-stone-50 p-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Leaflet map bounds
                </h3>
                <p className="text-xs text-muted-foreground">
                  Same style as Alluri Sitharama Raju — OpenStreetMap locked to this
                  district.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Center lat</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.mapView.centerLat}
                    onChange={(event) =>
                      updateMapView("centerLat", num(event.target.value, form.mapView.centerLat))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Center lng</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.mapView.centerLng}
                    onChange={(event) =>
                      updateMapView("centerLng", num(event.target.value, form.mapView.centerLng))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Zoom</Label>
                  <Input
                    type="number"
                    value={form.mapView.zoom}
                    onChange={(event) =>
                      updateMapView("zoom", num(event.target.value, form.mapView.zoom))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">SW lat (south)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.mapView.bounds[0][0]}
                    onChange={(event) =>
                      updateBound(0, 0, num(event.target.value, form.mapView.bounds[0][0]))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SW lng (west)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.mapView.bounds[0][1]}
                    onChange={(event) =>
                      updateBound(0, 1, num(event.target.value, form.mapView.bounds[0][1]))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">NE lat (north)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.mapView.bounds[1][0]}
                    onChange={(event) =>
                      updateBound(1, 0, num(event.target.value, form.mapView.bounds[1][0]))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">NE lng (east)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={form.mapView.bounds[1][1]}
                    onChange={(event) =>
                      updateBound(1, 1, num(event.target.value, form.mapView.bounds[1][1]))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Min zoom</Label>
                  <Input
                    type="number"
                    value={form.mapView.minZoom}
                    onChange={(event) =>
                      updateMapView("minZoom", num(event.target.value, form.mapView.minZoom))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max zoom</Label>
                  <Input
                    type="number"
                    value={form.mapView.maxZoom}
                    onChange={(event) =>
                      updateMapView("maxZoom", num(event.target.value, form.mapView.maxZoom))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">
                    Red / blue points
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Red = mandal HQ · Blue = tourism. Saved as map pins like ASR.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      hotspots: [...current.hotspots, emptyHotspot()],
                    }))
                  }
                >
                  Add point
                </Button>
              </div>

              {form.hotspots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No points yet. Add red/blue coordinates for this district.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.hotspots.map((hotspot, index) => (
                    <div
                      key={`hotspot-${index}`}
                      className="grid gap-2 rounded-md border bg-white p-3 sm:grid-cols-2"
                    >
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Name</Label>
                        <Input
                          value={hotspot.name}
                          onChange={(event) =>
                            updateHotspot(index, { name: event.target.value })
                          }
                          placeholder="Place name"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={hotspot.pointType}
                          onValueChange={(value) =>
                            updateHotspot(index, {
                              pointType: value as "RED" | "BLUE",
                              categoryName:
                                value === "RED"
                                  ? "Mandal Headquarter"
                                  : hotspot.categoryName || "Tourism",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BLUE">Blue (Tourism)</SelectItem>
                            <SelectItem value="RED">Red (Mandal HQ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Category</Label>
                        <Input
                          value={hotspot.categoryName}
                          onChange={(event) =>
                            updateHotspot(index, { categoryName: event.target.value })
                          }
                          placeholder="Tourism"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Latitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={hotspot.latitude}
                          onChange={(event) =>
                            updateHotspot(index, {
                              latitude: num(event.target.value, hotspot.latitude),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Longitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          value={hotspot.longitude}
                          onChange={(event) =>
                            updateHotspot(index, {
                              longitude: num(event.target.value, hotspot.longitude),
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Address (optional)</Label>
                        <Input
                          value={hotspot.address ?? ""}
                          onChange={(event) =>
                            updateHotspot(index, { address: event.target.value })
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              hotspots: current.hotspots.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          Remove point
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : "Save district map"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
