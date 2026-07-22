"use client";

import { extractPhotoMetadata } from "@/lib/photoMetadata";
import type { PhotoMetadata } from "@/lib/photoMetadata";
import { optimizeImageFile } from "@/lib/vinylImage";
import type { TravelFavorite, TravelFavoriteLocation } from "@/lib/travel";
import { ImagePlus } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

interface TravelFavoritePhotoAddFormProps {
  favorite: TravelFavorite;
  photoCount: number;
  onDone: () => void;
  onCancel: () => void;
}

function inputClassName() {
  return "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
}

function imageToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

async function fileSha256(file: File) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function locationDefaults(favorite: TravelFavorite, location: TravelFavoriteLocation | null) {
  return {
    locationName: location?.location_name ?? location?.name ?? favorite.location_name ?? favorite.name,
    latitude: location?.latitude?.toString() ?? favorite.latitude?.toString() ?? "",
    longitude: location?.longitude?.toString() ?? favorite.longitude?.toString() ?? "",
  };
}

export default function TravelFavoritePhotoAddForm({ favorite, photoCount, onDone, onCancel }: TravelFavoritePhotoAddFormProps) {
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreview, setPhotoPreview] = useState("");
  const [imageHash, setImageHash] = useState("");
  const [favoriteLocationId, setFavoriteLocationId] = useState("");
  const selectedLocation = useMemo(
    () => favorite.locations?.find((location) => location.id === favoriteLocationId) ?? null,
    [favorite.locations, favoriteLocationId],
  );
  const defaults = locationDefaults(favorite, selectedLocation);
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState(defaults.locationName);
  const [latitude, setLatitude] = useState(defaults.latitude);
  const [longitude, setLongitude] = useState(defaults.longitude);
  const [takenOn, setTakenOn] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const setPhotoLocation = (locationId: string) => {
    const nextLocation = favorite.locations?.find((location) => location.id === locationId) ?? null;
    const nextDefaults = locationDefaults(favorite, nextLocation);
    setFavoriteLocationId(locationId);
    setLocationName(nextDefaults.locationName);
    setLatitude(nextDefaults.latitude);
    setLongitude(nextDefaults.longitude);
  };

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;
    setError("");

    try {
      const optimizedFile = await optimizeImageFile(file, 1600, 0.76);
      const metadata: PhotoMetadata = await extractPhotoMetadata(file).catch(() => ({}));
      const nextImageHash = await fileSha256(optimizedFile);
      setPhotoFile(optimizedFile);
      setPhotoPreview(await imageToDataUrl(optimizedFile));
      setImageHash(nextImageHash);
      if (metadata.takenOn) setTakenOn(metadata.takenOn);
      if (metadata.latitude !== undefined) setLatitude(String(metadata.latitude));
      if (metadata.longitude !== undefined) setLongitude(String(metadata.longitude));
    } catch {
      setError("Could not load that photo.");
    }
  };

  const savePhoto = async (event: FormEvent) => {
    event.preventDefault();
    if (!photoFile) return;
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("type", "photo");
      formData.set("country_id", favorite.country_id);
      if (favorite.state_id) formData.set("state_id", favorite.state_id);
      formData.set("trip_id", favorite.trip_id ?? "");
      formData.set("favorite_id", favorite.id);
      formData.set("favorite_location_id", favoriteLocationId);
      formData.set("image_url", "");
      formData.set("image_hash", imageHash);
      formData.set("caption", caption);
      formData.set("location_name", locationName);
      formData.set("latitude", latitude);
      formData.set("longitude", longitude);
      formData.set("taken_on", takenOn);
      formData.set("sort_order", String(photoCount));
      formData.set("is_featured", "false");
      formData.set("image", photoFile);

      const response = await fetch("/api/travel/items", { method: "POST", body: formData });
      if (response.status === 409) {
        setError("That photo is already in the travel log.");
        return;
      }
      if (!response.ok) throw new Error("Save failed");
      onDone();
    } catch {
      setError("Could not save that photo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={savePhoto} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
        <ImagePlus className="mb-2 h-5 w-5" />
        Upload photo
        <input type="file" accept="image/*" onChange={(event) => void handlePhotoChange(event.target.files?.[0])} className="sr-only" />
      </label>
      {photoPreview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoPreview} alt="" className="max-h-48 w-full rounded-lg object-cover" />
      )}
      {(favorite.locations ?? []).length > 0 && (
        <select className={inputClassName()} value={favoriteLocationId} onChange={(event) => setPhotoLocation(event.target.value)}>
          <option value="">Parent favorite only</option>
          {favorite.locations?.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name || location.location_name || location.address || "Saved location"}
            </option>
          ))}
        </select>
      )}
      <input className={inputClassName()} value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Caption" />
      <input className={inputClassName()} value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Location" />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className={inputClassName()} value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Latitude" />
        <input className={inputClassName()} value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Longitude" />
      </div>
      <input className={inputClassName()} type="date" value={takenOn} onChange={(event) => setTakenOn(event.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving || !photoFile} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          {isSaving ? "Saving..." : "Save photo"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950">
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
