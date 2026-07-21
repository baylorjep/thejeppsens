"use client";

import { optimizeImageFile } from "@/lib/vinylImage";
import CreateFavoriteFromPhoto from "@/components/CreateFavoriteFromPhoto";
import { extractPhotoMetadata } from "@/lib/photoMetadata";
import type { PhotoMetadata } from "@/lib/photoMetadata";
import { youtubeThumbnailUrl } from "@/lib/travel";
import type { Country, TravelFavorite, TravelFavoriteType, TravelPhoto, TravelState, TravelTrip, TravelVideo } from "@/lib/travel";
import type { TravelMapCenter } from "@/lib/travelMapCenters";
import type { TravelQuickAddDetail } from "@/components/TravelQuickAddButton";
import { Edit3, ImagePlus, LocateFixed, Plus, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type EditorMode = "trip" | "photo" | "favorite" | "video";

interface TravelCountryEditorProps {
  country: Country;
  state?: TravelState;
  mapCenter: TravelMapCenter;
  trips: TravelTrip[];
  photos: TravelPhoto[];
  favorites: TravelFavorite[];
  videos: TravelVideo[];
}

const emptyTrip = {
  id: "",
  title: "",
  location_name: "",
  started_on: "",
  ended_on: "",
  notes: "",
  baylor_went: true,
  isabel_went: true,
};

const emptyPhoto = {
  id: "",
  country_id: "",
  state_id: "",
  trip_id: "",
  favorite_id: "",
  image_url: "",
  caption: "",
  location_name: "",
  latitude: "",
  longitude: "",
  taken_on: "",
  sort_order: "0",
  is_featured: false,
};

const emptyFavorite = {
  id: "",
  trip_id: "",
  type: "restaurant" as TravelFavoriteType,
  name: "",
  location_name: "",
  address: "",
  cuisine: "",
  latitude: "",
  longitude: "",
  notes: "",
  sort_order: "0",
};

const emptyVideo = {
  id: "",
  trip_id: "",
  title: "",
  url: "",
  thumbnail_url: "",
  visibility: "unlisted" as TravelVideo["visibility"],
  notes: "",
  sort_order: "0",
};

function imageToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function inputClassName() {
  return "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
}

function favoriteLabel(type: TravelFavoriteType) {
  if (type === "restaurant") return "Food";
  if (type === "activity") return "Activity";
  return "Place";
}

function distanceInMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(b.latitude - a.latitude);
  const lonDelta = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function formatMiles(meters: number) {
  return Math.round(meters / 1609.344).toLocaleString();
}

export default function TravelCountryEditor({ country, state, mapCenter, trips, photos, favorites, videos }: TravelCountryEditorProps) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<EditorMode>("trip");
  const [tripForm, setTripForm] = useState(emptyTrip);
  const [photoForm, setPhotoForm] = useState(emptyPhoto);
  const [favoriteForm, setFavoriteForm] = useState(emptyFavorite);
  const [videoForm, setVideoForm] = useState(emptyVideo);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [importProgress, setImportProgress] = useState("");
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attachPhotoId, setAttachPhotoId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [isCreatingFavoriteFromPhoto, setIsCreatingFavoriteFromPhoto] = useState(false);
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([country]);
  const [destinationStates, setDestinationStates] = useState<TravelState[]>(state ? [state] : []);

  const restaurants = useMemo(() => favorites.filter((favorite) => favorite.type === "restaurant"), [favorites]);
  const activities = useMemo(() => favorites.filter((favorite) => favorite.type === "activity"), [favorites]);
  const places = useMemo(() => favorites.filter((favorite) => favorite.type === "place"), [favorites]);
  const favoritesById = useMemo(() => new Map(favorites.map((favorite) => [favorite.id, favorite])), [favorites]);
  const selectedPhotoCountry = destinationCountries.find((destination) => destination.id === photoForm.country_id) ?? country;
  const selectedPhotoDestinationChanged = Boolean(photoForm.country_id && (photoForm.country_id !== country.id || (photoForm.state_id || "") !== (state?.id ?? "")));
  const selectedPhotoCountryIsUnitedStates =
    selectedPhotoCountry.display_name === "United States" || selectedPhotoCountry.geo_name === "United States";
  const attachedPhotos = useMemo(
    () => photos.filter((photo) => photo.favorite_id === favoriteForm.id),
    [photos, favoriteForm.id],
  );
  const unattachedPhotos = useMemo(
    () => photos.filter((photo) => photo.favorite_id !== favoriteForm.id),
    [photos, favoriteForm.id],
  );
  const activeEditorPhoto = useMemo<TravelPhoto | null>(() => {
    if (!photoForm.id) return null;
    return {
      id: photoForm.id,
      country_id: photoForm.country_id || country.id,
      state_id: photoForm.state_id || null,
      trip_id: photoForm.trip_id || null,
      favorite_id: photoForm.favorite_id || null,
      image_url: photoForm.image_url,
      caption: photoForm.caption || null,
      location_name: photoForm.location_name || null,
      latitude: photoForm.latitude ? Number(photoForm.latitude) : null,
      longitude: photoForm.longitude ? Number(photoForm.longitude) : null,
      taken_on: photoForm.taken_on || null,
      sort_order: Number(photoForm.sort_order) || 0,
      is_featured: photoForm.is_featured,
    };
  }, [country.id, photoForm, state?.id]);
  const sortedPhotoFavorites = useMemo(() => {
    if (!activeEditorPhoto || activeEditorPhoto.latitude === null || activeEditorPhoto.longitude === null) return favorites;
    const photoPoint = { latitude: activeEditorPhoto.latitude, longitude: activeEditorPhoto.longitude };

    return favorites
      .map((favorite) => {
        const candidatePoints = [
          favorite.latitude !== null && favorite.longitude !== null
            ? { latitude: favorite.latitude, longitude: favorite.longitude }
            : null,
          ...photos
            .filter((photo) => photo.id !== activeEditorPhoto.id && photo.favorite_id === favorite.id && photo.latitude !== null && photo.longitude !== null)
            .map((photo) => ({ latitude: photo.latitude as number, longitude: photo.longitude as number })),
        ].filter((point): point is { latitude: number; longitude: number } => Boolean(point));
        const nearestDistance = candidatePoints.length
          ? Math.min(...candidatePoints.map((point) => distanceInMeters(photoPoint, point)))
          : Number.POSITIVE_INFINITY;
        return { favorite, nearestDistance };
      })
      .sort((a, b) => a.nearestDistance - b.nearestDistance || a.favorite.name.localeCompare(b.favorite.name))
      .map(({ favorite }) => favorite);
  }, [activeEditorPhoto, favorites, photos]);

  const confirmCoordinateDistance = (latitudeValue: string, longitudeValue: string) => {
    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return true;

    const distance = distanceInMeters(
      { latitude, longitude },
      { latitude: mapCenter.latitude, longitude: mapCenter.longitude },
    );
    const thresholdMiles = state ? 350 : 2500;
    if (distance <= thresholdMiles * 1609.344) return true;

    return window.confirm(
      `These coordinates are about ${formatMiles(distance)} miles from ${mapCenter.label}. Are you sure this location belongs here?`,
    );
  };

  useEffect(() => {
    const handleQuickAdd = (event: Event) => {
      const { mode: nextMode, favoriteType } = (event as CustomEvent<TravelQuickAddDetail>).detail;
      resetForms();
      setMode(nextMode);
      if (nextMode === "favorite" && favoriteType) {
        setFavoriteForm({ ...emptyFavorite, type: favoriteType });
      }
      setIsOpen(true);
      window.setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    };

    window.addEventListener("travel:quick-add", handleQuickAdd);
    return () => window.removeEventListener("travel:quick-add", handleQuickAdd);
  }, []);

  useEffect(() => {
    const handleEditItem = (event: Event) => {
      const detail = (event as CustomEvent<{ type: EditorMode; item: TravelTrip | TravelPhoto | TravelFavorite | TravelVideo }>).detail;
      if (detail.type === "trip") editTrip(detail.item as TravelTrip);
      if (detail.type === "photo") editPhoto(detail.item as TravelPhoto);
      if (detail.type === "favorite") editFavorite(detail.item as TravelFavorite);
      if (detail.type === "video") editVideo(detail.item as TravelVideo);
      window.setTimeout(() => sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
    };

    window.addEventListener("travel:edit-item", handleEditItem);
    return () => window.removeEventListener("travel:edit-item", handleEditItem);
  }, []);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const [countriesResponse, statesResponse] = await Promise.all([
          fetch("/api/travel/countries"),
          fetch("/api/travel/states"),
        ]);
        const countriesPayload = countriesResponse.ok ? await countriesResponse.json() : null;
        const statesPayload = statesResponse.ok ? await statesResponse.json() : null;
        if (Array.isArray(countriesPayload?.countries)) setDestinationCountries(countriesPayload.countries);
        if (Array.isArray(statesPayload?.states)) setDestinationStates(statesPayload.states);
      } catch {
        setDestinationCountries([country]);
        setDestinationStates(state ? [state] : []);
      }
    };

    void loadDestinations();
  }, [country, state]);

  const resetForms = () => {
    setTripForm(emptyTrip);
    setPhotoForm({ ...emptyPhoto, country_id: country.id, state_id: state?.id ?? "" });
    setFavoriteForm(emptyFavorite);
    setVideoForm(emptyVideo);
    setPhotoFile(undefined);
    setPhotoPreview("");
    setImportProgress("");
    setIsCreatingFavoriteFromPhoto(false);
  };

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;

    try {
      const optimizedFile = await optimizeImageFile(file, 1600, 0.76);
      setPhotoFile(optimizedFile);
      setPhotoPreview(await imageToDataUrl(optimizedFile));
      setMessage("Photo optimized.");
    } catch {
      setMessage("Could not load that photo.");
    }
  };

  const reverseGeocodePhoto = async (latitude?: number, longitude?: number) => {
    if (latitude === undefined || longitude === undefined) return "";

    try {
      const controller = new AbortController();
      window.setTimeout(() => controller.abort(), 4000);
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
      });
      const response = await fetch(`/api/travel/geocode?${params.toString()}`, { signal: controller.signal });
      if (!response.ok) return "";
      const data = (await response.json()) as { label?: string | null };
      return data.label?.split(",").slice(0, 2).join(", ").trim() ?? "";
    } catch {
      return "";
    }
  };

  const importPhotoFiles = async (fileList?: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (!files.length) return;

    setIsSaving(true);
    setMessage(`Importing 0 / ${files.length} photos...`);
    setImportProgress(`Selected ${files.length} ${files.length === 1 ? "photo" : "photos"}. Starting import...`);

    let imported = 0;
    let skipped = 0;
    const locationCache = new Map<string, string>();

    for (const [index, file] of files.entries()) {
      try {
        const currentStatus = `Importing ${index + 1} / ${files.length}`;
        setMessage(`${currentStatus}: reading photo data...`);
        setImportProgress(`${currentStatus}: reading photo data...`);

        const metadata: PhotoMetadata = await extractPhotoMetadata(file).catch(() => ({}));
        const cacheKey =
          metadata.latitude !== undefined && metadata.longitude !== undefined
            ? `${metadata.latitude.toFixed(3)},${metadata.longitude.toFixed(3)}`
            : "";
        let locationName = "";

        if (cacheKey) {
          locationName = locationCache.get(cacheKey) ?? "";
          if (!locationName) {
            setImportProgress(`${currentStatus}: looking up location...`);
            locationName = await reverseGeocodePhoto(metadata.latitude, metadata.longitude);
            if (locationName) locationCache.set(cacheKey, locationName);
          }
        }

        setImportProgress(`${currentStatus}: optimizing image...`);
        const optimizedFile = await optimizeImageFile(file, 1600, 0.76);

        setImportProgress(`${currentStatus}: uploading...`);
        const formData = new FormData();
        formData.set("type", "photo");
        formData.set("country_id", country.id);
        if (state) formData.set("state_id", state.id);
        formData.set("trip_id", photoForm.trip_id);
        formData.set("image_url", "");
        formData.set("caption", "");
        formData.set("location_name", locationName || state?.state_name || country.display_name);
        formData.set("latitude", metadata.latitude !== undefined ? String(metadata.latitude) : "");
        formData.set("longitude", metadata.longitude !== undefined ? String(metadata.longitude) : "");
        formData.set("taken_on", metadata.takenOn ?? "");
        formData.set("sort_order", String(photos.length + index));
        formData.set("is_featured", "false");
        formData.set("image", optimizedFile);

        const response = await fetch("/api/travel/items", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Import failed");
        imported += 1;
        setImportProgress(`Imported ${imported} / ${files.length}${skipped ? `, skipped ${skipped}` : ""}.`);
      } catch {
        skipped += 1;
        setImportProgress(`Imported ${imported} / ${files.length}, skipped ${skipped}.`);
      }
    }

    try {
      resetForms();
      const summary = `Imported ${imported} ${imported === 1 ? "photo" : "photos"}${skipped ? `, skipped ${skipped}` : ""}.`;
      setMessage(summary);
      setImportProgress(summary);
      setIsOpen(false);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const submitFormData = async (formData: FormData) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/travel/items", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Save failed");

      resetForms();
      setMessage("Saved.");
      router.refresh();
    } catch {
      setMessage("Could not save.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("type", "trip");
    formData.set("country_id", country.id);
    if (state) formData.set("state_id", state.id);
    if (tripForm.id) formData.set("id", tripForm.id);
    formData.set("title", tripForm.title);
    formData.set("location_name", tripForm.location_name);
    formData.set("started_on", tripForm.started_on);
    formData.set("ended_on", tripForm.ended_on);
    formData.set("notes", tripForm.notes);
    formData.set("baylor_went", String(tripForm.baylor_went));
    formData.set("isabel_went", String(tripForm.isabel_went));
    await submitFormData(formData);
  };

  const savePhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmCoordinateDistance(photoForm.latitude, photoForm.longitude)) return;
    const formData = new FormData();
    formData.set("type", "photo");
    const destinationCountryId = photoForm.country_id || country.id;
    const destinationStateId = photoForm.state_id;
    formData.set("country_id", destinationCountryId);
    if (destinationStateId) formData.set("state_id", destinationStateId);
    if (photoForm.id) formData.set("id", photoForm.id);
    formData.set("trip_id", selectedPhotoDestinationChanged ? "" : photoForm.trip_id);
    formData.set("favorite_id", selectedPhotoDestinationChanged ? "" : photoForm.favorite_id);
    formData.set("image_url", photoForm.image_url);
    formData.set("caption", photoForm.caption);
    formData.set("location_name", photoForm.location_name);
    formData.set("latitude", photoForm.latitude);
    formData.set("longitude", photoForm.longitude);
    formData.set("taken_on", photoForm.taken_on);
    formData.set("sort_order", photoForm.sort_order);
    formData.set("is_featured", String(photoForm.is_featured));
    if (photoFile) formData.set("image", photoFile);
    await submitFormData(formData);
  };

  const saveFavorite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confirmCoordinateDistance(favoriteForm.latitude, favoriteForm.longitude)) return;
    const formData = new FormData();
    formData.set("type", "favorite");
    formData.set("country_id", country.id);
    if (state) formData.set("state_id", state.id);
    if (favoriteForm.id) formData.set("id", favoriteForm.id);
    formData.set("trip_id", favoriteForm.trip_id);
    formData.set("favorite_type", favoriteForm.type);
    formData.set("name", favoriteForm.name);
    formData.set("location_name", favoriteForm.location_name);
    formData.set("address", favoriteForm.address);
    formData.set("cuisine", favoriteForm.cuisine);
    formData.set("latitude", favoriteForm.latitude);
    formData.set("longitude", favoriteForm.longitude);
    formData.set("notes", favoriteForm.notes);
    formData.set("sort_order", favoriteForm.sort_order);
    await submitFormData(formData);
  };

  const saveVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("type", "video");
    formData.set("country_id", country.id);
    if (state) formData.set("state_id", state.id);
    if (videoForm.id) formData.set("id", videoForm.id);
    formData.set("trip_id", videoForm.trip_id);
    formData.set("title", videoForm.title);
    formData.set("url", videoForm.url);
    formData.set("thumbnail_url", videoForm.thumbnail_url);
    formData.set("visibility", videoForm.visibility);
    formData.set("notes", videoForm.notes);
    formData.set("sort_order", videoForm.sort_order);
    await submitFormData(formData);
  };

  const findCoordinates = async () => {
    const parts = [
      favoriteForm.name,
      favoriteForm.location_name,
      state?.state_name,
      country.display_name,
    ]
      .filter((part): part is string => Boolean(part))
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) {
      setMessage("Add a name or location first.");
      return;
    }

    setIsGeocoding(true);
    setMessage("");

    try {
      const response = await fetch(`/api/travel/geocode?q=${encodeURIComponent(parts.join(", "))}`);
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as {
        results?: { latitude: number; longitude: number; label: string }[];
      };
      const result = data.results?.[0];
      if (!result) {
        setMessage("No map match found.");
        return;
      }
      setFavoriteForm((current) => ({
        ...current,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
        location_name: current.location_name || result.label.split(",").slice(0, 2).join(", "),
      }));
      setMessage("Coordinates filled from map search.");
    } catch {
      setMessage("Could not search the map.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const findPhotoCoordinates = async () => {
    const parts = [
      photoForm.location_name,
      state?.state_name,
      country.display_name,
    ]
      .filter((part): part is string => Boolean(part))
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) {
      setMessage("Add a photo location first.");
      return;
    }

    setIsGeocoding(true);
    setMessage("");

    try {
      const response = await fetch(`/api/travel/geocode?q=${encodeURIComponent(parts.join(", "))}`);
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as {
        results?: { latitude: number; longitude: number; label: string }[];
      };
      const result = data.results?.[0];
      if (!result) {
        setMessage("No map match found.");
        return;
      }
      setPhotoForm((current) => ({
        ...current,
        latitude: String(result.latitude),
        longitude: String(result.longitude),
        location_name: current.location_name || result.label.split(",").slice(0, 2).join(", "),
      }));
      setMessage("Photo location added to map.");
    } catch {
      setMessage("Could not search the map.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const linkPhotoToFavorite = async (photoId: string, favoriteId: string | null) => {
    setIsLinking(true);
    try {
      const response = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", id: photoId, favorite_id: favoriteId }),
      });
      if (!response.ok) throw new Error("Link failed");
      setAttachPhotoId("");
      setMessage(favoriteId ? "Photo linked to favorite." : "Photo detached from favorite.");
      router.refresh();
    } catch {
      setMessage("Could not update that photo link.");
    } finally {
      setIsLinking(false);
    }
  };

  const setFavoriteFeaturedPhoto = async (photoId: string) => {
    setIsLinking(true);
    try {
      const response = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", id: photoId, is_favorite_featured: true }),
      });
      if (!response.ok) throw new Error("Featured photo update failed");
      setMessage("Favorite pin photo updated.");
      router.refresh();
    } catch {
      setMessage("Could not update the favorite pin photo.");
    } finally {
      setIsLinking(false);
    }
  };

  const deleteItem = async (type: EditorMode, id: string) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      const response = await fetch(`/api/travel/items?type=${type}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setMessage("Deleted.");
      router.refresh();
    } catch {
      setMessage("Could not delete.");
    }
  };

  const editTrip = (trip: TravelTrip) => {
    setMode("trip");
    setIsOpen(true);
    setTripForm({
      id: trip.id,
      title: trip.title,
      location_name: trip.location_name ?? "",
      started_on: trip.started_on ?? "",
      ended_on: trip.ended_on ?? "",
      notes: trip.notes ?? "",
      baylor_went: trip.baylor_went,
      isabel_went: trip.isabel_went,
    });
  };

  const editPhoto = (photo: TravelPhoto) => {
    setMode("photo");
    setIsOpen(true);
    setPhotoForm({
      id: photo.id,
      country_id: photo.country_id,
      state_id: photo.state_id ?? "",
      trip_id: photo.trip_id ?? "",
      favorite_id: photo.favorite_id ?? "",
      image_url: photo.image_url,
      caption: photo.caption ?? "",
      location_name: photo.location_name ?? "",
      latitude: photo.latitude?.toString() ?? "",
      longitude: photo.longitude?.toString() ?? "",
      taken_on: photo.taken_on ?? "",
      sort_order: String(photo.sort_order),
      is_featured: Boolean(photo.is_featured),
    });
    setPhotoPreview(photo.image_url);
    setPhotoFile(undefined);
    setIsCreatingFavoriteFromPhoto(false);
  };

  const editFavorite = (favorite: TravelFavorite) => {
    setMode("favorite");
    setIsOpen(true);
    setFavoriteForm({
      id: favorite.id,
      trip_id: favorite.trip_id ?? "",
      type: favorite.type,
      name: favorite.name,
      location_name: favorite.location_name ?? "",
      address: favorite.address ?? "",
      cuisine: favorite.cuisine ?? "",
      latitude: favorite.latitude?.toString() ?? "",
      longitude: favorite.longitude?.toString() ?? "",
      notes: favorite.notes ?? "",
      sort_order: String(favorite.sort_order),
    });
  };

  const editVideo = (video: TravelVideo) => {
    setMode("video");
    setIsOpen(true);
    setVideoForm({
      id: video.id,
      trip_id: video.trip_id ?? "",
      title: video.title,
      url: video.url,
      thumbnail_url: video.thumbnail_url ?? youtubeThumbnailUrl(video.url) ?? "",
      visibility: video.visibility ?? "unlisted",
      notes: video.notes ?? "",
      sort_order: String(video.sort_order),
    });
  };

  return (
    <section ref={sectionRef} className="border-t border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h2 className="text-lg font-bold text-slate-950">Edit Travel Log</h2>
              <p className="text-sm text-slate-500">Add trips, photos, food, activities, and locations.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForms();
              setIsOpen((current) => !current);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isOpen ? "Close" : "Add item"}
          </button>
        </div>

        {message && <p className="mb-4 text-sm text-slate-500">{message}</p>}

        {isOpen && (
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[86vh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-slate-50 p-4 shadow-2xl md:static md:mb-8 md:max-h-none md:rounded-xl md:shadow-none">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                ["trip", "Trip"],
                ["photo", "Photo"],
                ["favorite", "Favorite"],
                ["video", "Video"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as EditorMode)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    mode === value ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "trip" && (
              <form onSubmit={saveTrip} className="grid gap-3 md:grid-cols-2">
                <input className={inputClassName()} value={tripForm.title} onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })} placeholder="Trip title" required />
                <input className={inputClassName()} value={tripForm.location_name} onChange={(e) => setTripForm({ ...tripForm, location_name: e.target.value })} placeholder="City or area" />
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-500">Start date</span>
                  <input className={inputClassName()} type="date" value={tripForm.started_on} onChange={(e) => setTripForm({ ...tripForm, started_on: e.target.value })} />
                </label>
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-500">End date</span>
                  <input className={inputClassName()} type="date" value={tripForm.ended_on} onChange={(e) => setTripForm({ ...tripForm, ended_on: e.target.value })} />
                </label>
                <textarea className={`${inputClassName()} md:col-span-2`} value={tripForm.notes} onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })} placeholder="Notes" rows={3} />
                <div className="flex gap-4 text-sm text-slate-600">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={tripForm.baylor_went} onChange={(e) => setTripForm({ ...tripForm, baylor_went: e.target.checked })} />Baylor</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={tripForm.isabel_went} onChange={(e) => setTripForm({ ...tripForm, isabel_went: e.target.checked })} />Isabel</label>
                </div>
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save trip"}</button>
              </form>
            )}

            {mode === "photo" && (
              <form onSubmit={savePhoto} className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-500">Move to country</span>
                  <select
                    className={inputClassName()}
                    value={photoForm.country_id || country.id}
                    onChange={(e) => setPhotoForm({
                      ...photoForm,
                      country_id: e.target.value,
                      state_id: "",
                      trip_id: "",
                      favorite_id: "",
                      is_featured: false,
                    })}
                  >
                    {destinationCountries.map((destination) => (
                      <option key={destination.id} value={destination.id}>{destination.display_name}</option>
                    ))}
                  </select>
                </label>
                {selectedPhotoCountryIsUnitedStates && (
                  <label className="space-y-1">
                    <span className="block text-xs font-semibold text-slate-500">Move to state</span>
                    <select
                      className={inputClassName()}
                      value={photoForm.state_id}
                      onChange={(e) => setPhotoForm({
                        ...photoForm,
                        state_id: e.target.value,
                        trip_id: "",
                        favorite_id: "",
                        is_featured: false,
                      })}
                    >
                      <option value="">United States country page</option>
                      {destinationStates.map((destinationState) => (
                        <option key={destinationState.id} value={destinationState.id}>{destinationState.state_name}</option>
                      ))}
                    </select>
                  </label>
                )}
                {selectedPhotoDestinationChanged && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 md:col-span-2">
                    Saving will move this photo and clear its current trip/favorite link.
                  </p>
                )}
                <select className={inputClassName()} value={photoForm.trip_id} onChange={(e) => setPhotoForm({ ...photoForm, trip_id: e.target.value })} disabled={selectedPhotoDestinationChanged}>
                  <option value="">No trip</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
                <select className={inputClassName()} value={photoForm.favorite_id} onChange={(e) => setPhotoForm({ ...photoForm, favorite_id: e.target.value })} disabled={selectedPhotoDestinationChanged}>
                  <option value="">Not linked to a favorite</option>
                  {sortedPhotoFavorites.map((favorite) => <option key={favorite.id} value={favorite.id}>{favoriteLabel(favorite.type)}: {favorite.name}</option>)}
                </select>
                {activeEditorPhoto && !photoForm.favorite_id && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 md:col-span-2">
                    {isCreatingFavoriteFromPhoto ? (
                      <CreateFavoriteFromPhoto
                        photo={activeEditorPhoto}
                        favorites={favorites}
                        photos={photos}
                        onDone={() => {
                          setIsCreatingFavoriteFromPhoto(false);
                          setMessage("Experience updated for this photo.");
                          router.refresh();
                        }}
                        onCancel={() => setIsCreatingFavoriteFromPhoto(false)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCreatingFavoriteFromPhoto(true)}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                      >
                        <Plus className="h-4 w-4" />
                        Create or link an experience from this photo
                      </button>
                    )}
                  </div>
                )}
                <label className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-500">Photo date</span>
                  <input className={inputClassName()} type="date" value={photoForm.taken_on} onChange={(e) => setPhotoForm({ ...photoForm, taken_on: e.target.value })} />
                </label>
                <input className={inputClassName()} value={photoForm.caption} onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })} placeholder="Caption" />
                <input className={inputClassName()} value={photoForm.location_name} onChange={(e) => setPhotoForm({ ...photoForm, location_name: e.target.value })} placeholder="Location" />
                <div className="grid gap-3 md:col-span-2 md:grid-cols-[1fr_1fr_auto]">
                  <input className={inputClassName()} value={photoForm.latitude} onChange={(e) => setPhotoForm({ ...photoForm, latitude: e.target.value })} placeholder="Latitude" />
                  <input className={inputClassName()} value={photoForm.longitude} onChange={(e) => setPhotoForm({ ...photoForm, longitude: e.target.value })} placeholder="Longitude" />
                  <button
                    type="button"
                    onClick={findPhotoCoordinates}
                    disabled={isGeocoding}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <LocateFixed className="h-4 w-4" />
                    {isGeocoding ? "Finding..." : "Find"}
                  </button>
                </div>
                {photoForm.location_name && (!photoForm.latitude || !photoForm.longitude) && (
                  <p className="text-xs text-amber-700 md:col-span-2">Find this location to show the photo on the map.</p>
                )}
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                  <input type="checkbox" checked={photoForm.is_featured} onChange={(e) => setPhotoForm({ ...photoForm, is_featured: e.target.checked })} />
                  Featured photo for this page
                </label>
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 md:col-span-2">
                  <ImagePlus className="mb-2 h-5 w-5" />
                  Upload optimized photo
                  <input type="file" accept="image/*" onChange={(event) => handlePhotoChange(event.target.files?.[0])} className="sr-only" />
                </label>
                <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500 md:col-span-2">
                  <ImagePlus className="mb-2 h-5 w-5" />
                  Bulk import from iPhone photos
                  <span className="mt-1 text-xs text-slate-400">Uses photo date and GPS when available, then uploads optimized copies.</span>
                  <input
                    type="file"
                    accept="image/*,.heic,.heif"
                    multiple
                    disabled={isSaving}
                    onChange={(event) => {
                      void importPhotoFiles(event.target.files);
                      event.target.value = "";
                    }}
                    className="sr-only"
                  />
                </label>
                {importProgress && (
                  <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 md:col-span-2">
                    {importProgress}
                  </p>
                )}
                {photoPreview && (
                  <div className="md:col-span-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="" className="h-48 w-full rounded-lg object-cover" />
                  </div>
                )}
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save photo"}</button>
              </form>
            )}

            {mode === "favorite" && (
              <form onSubmit={saveFavorite} className="grid gap-3 md:grid-cols-2">
                <select className={inputClassName()} value={favoriteForm.type} onChange={(e) => setFavoriteForm({ ...favoriteForm, type: e.target.value as TravelFavoriteType })}>
                  <option value="restaurant">Food</option>
                  <option value="activity">Activity</option>
                  <option value="place">Location</option>
                </select>
                <select className={inputClassName()} value={favoriteForm.trip_id} onChange={(e) => setFavoriteForm({ ...favoriteForm, trip_id: e.target.value })}>
                  <option value="">No trip</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
                <input className={inputClassName()} value={favoriteForm.name} onChange={(e) => setFavoriteForm({ ...favoriteForm, name: e.target.value })} placeholder="Name" required />
                {favoriteForm.type === "restaurant" && (
                  <input className={inputClassName()} value={favoriteForm.cuisine} onChange={(e) => setFavoriteForm({ ...favoriteForm, cuisine: e.target.value })} placeholder="Cuisine (Mexican, burgers, pizza)" />
                )}
                <input className={inputClassName()} value={favoriteForm.location_name} onChange={(e) => setFavoriteForm({ ...favoriteForm, location_name: e.target.value })} placeholder="City or area" />
                <input className={`${inputClassName()} md:col-span-2`} value={favoriteForm.address} onChange={(e) => setFavoriteForm({ ...favoriteForm, address: e.target.value })} placeholder="Street address or Maps-friendly address" />
                <div className="grid gap-3 md:col-span-2 md:grid-cols-[1fr_1fr_auto]">
                  <input className={inputClassName()} value={favoriteForm.latitude} onChange={(e) => setFavoriteForm({ ...favoriteForm, latitude: e.target.value })} placeholder="Latitude" />
                  <input className={inputClassName()} value={favoriteForm.longitude} onChange={(e) => setFavoriteForm({ ...favoriteForm, longitude: e.target.value })} placeholder="Longitude" />
                  <button
                    type="button"
                    onClick={findCoordinates}
                    disabled={isGeocoding}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <LocateFixed className="h-4 w-4" />
                    {isGeocoding ? "Finding..." : "Find"}
                  </button>
                </div>
                <textarea className={`${inputClassName()} md:col-span-2`} value={favoriteForm.notes} onChange={(e) => setFavoriteForm({ ...favoriteForm, notes: e.target.value })} placeholder="Notes" rows={3} />
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save favorite"}</button>
              </form>
            )}

            {mode === "favorite" && favoriteForm.id && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Attached photos</p>
                {attachedPhotos.length > 0 ? (
                  <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {attachedPhotos.map((photo) => (
                      <div key={photo.id} className="group relative overflow-hidden rounded-md border border-slate-100 bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.image_url} alt={photo.caption ?? ""} className="aspect-square w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => void setFavoriteFeaturedPhoto(photo.id)}
                          disabled={isLinking}
                          aria-label="Use as pin photo"
                          title="Use as pin photo"
                          className={`absolute left-1 top-1 rounded-full p-1 text-white shadow-sm transition-colors disabled:cursor-wait ${
                            photo.is_favorite_featured ? "bg-amber-500" : "bg-slate-950/70 hover:bg-amber-500"
                          }`}
                        >
                          <Star className={`h-3 w-3 ${photo.is_favorite_featured ? "fill-current" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void linkPhotoToFavorite(photo.id, null)}
                          disabled={isLinking}
                          aria-label="Detach photo"
                          title="Detach photo"
                          className="absolute right-1 top-1 rounded-full bg-slate-950/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-wait"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-3 text-sm text-slate-400">No photos attached yet.</p>
                )}
                {unattachedPhotos.length > 0 && (
                  <div className="flex gap-2">
                    <select className={inputClassName()} value={attachPhotoId} onChange={(e) => setAttachPhotoId(e.target.value)}>
                      <option value="">Choose a photo to attach...</option>
                      {unattachedPhotos.map((photo) => (
                        <option key={photo.id} value={photo.id}>
                          {photo.caption ?? photo.location_name ?? photo.taken_on ?? "Photo"}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => attachPhotoId && void linkPhotoToFavorite(attachPhotoId, favoriteForm.id)}
                      disabled={!attachPhotoId || isLinking}
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      Attach
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === "video" && (
              <form onSubmit={saveVideo} className="grid gap-3 md:grid-cols-2">
                <select className={inputClassName()} value={videoForm.trip_id} onChange={(e) => setVideoForm({ ...videoForm, trip_id: e.target.value })}>
                  <option value="">No trip</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
                <input className={inputClassName()} value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} placeholder="Video title" required />
                <input
                  className={`${inputClassName()} md:col-span-2`}
                  value={videoForm.url}
                  onChange={(e) => {
                    const url = e.target.value;
                    setVideoForm({ ...videoForm, url, thumbnail_url: youtubeThumbnailUrl(url) ?? videoForm.thumbnail_url });
                  }}
                  placeholder="YouTube URL"
                  required
                />
                <select className={inputClassName()} value={videoForm.visibility} onChange={(e) => setVideoForm({ ...videoForm, visibility: e.target.value as TravelVideo["visibility"] })}>
                  <option value="unlisted">Unlisted</option>
                  <option value="public">Public</option>
                  <option value="private">Private / limited access</option>
                  <option value="unknown">Unknown</option>
                </select>
                <input className={inputClassName()} value={videoForm.thumbnail_url} onChange={(e) => setVideoForm({ ...videoForm, thumbnail_url: e.target.value })} placeholder="Thumbnail URL" />
                {videoForm.thumbnail_url && (
                  <div className="md:col-span-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={videoForm.thumbnail_url} alt="" className="h-36 w-full rounded-lg object-cover" />
                  </div>
                )}
                {videoForm.visibility === "private" && (
                  <p className="text-xs text-amber-700 md:col-span-2">Private YouTube videos may not embed for other viewers.</p>
                )}
                <textarea className={`${inputClassName()} md:col-span-2`} value={videoForm.notes} onChange={(e) => setVideoForm({ ...videoForm, notes: e.target.value })} placeholder="Notes" rows={3} />
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save video"}</button>
              </form>
            )}
          </div>
        )}

        {isOpen && (
          <div className="grid gap-4 lg:grid-cols-4">
            <ItemList title="Trips" items={trips.map((trip) => ({ id: trip.id, title: trip.title, detail: trip.location_name ?? state?.state_name ?? country.display_name, onEdit: () => editTrip(trip), onDelete: () => deleteItem("trip", trip.id) }))} />
            <ItemList
              title="Photos"
              limit={8}
              items={photos.map((photo) => ({
                id: photo.id,
                title: photo.caption ?? photo.location_name ?? "Photo",
                detail: [photo.taken_on ?? state?.state_name ?? country.display_name, photo.favorite_id ? `linked: ${favoritesById.get(photo.favorite_id)?.name ?? "favorite"}` : null]
                  .filter(Boolean)
                  .join(" · "),
                thumbnail: photo.image_url,
                onEdit: () => editPhoto(photo),
                onDelete: () => deleteItem("photo", photo.id),
              }))}
            />
            <ItemList title="Videos" items={videos.map((video) => ({ id: video.id, title: video.title, detail: video.notes ?? "YouTube", onEdit: () => editVideo(video), onDelete: () => deleteItem("video", video.id) }))} />
            <ItemList
              title="Favorites"
              limit={8}
              items={[...restaurants, ...activities, ...places].map((favorite) => ({
                id: favorite.id,
                title: favorite.name,
                detail: [
                  favorite.type === "restaurant" ? "Food" : favorite.type,
                  favorite.type === "restaurant" ? favorite.cuisine : null,
                  favorite.location_name,
                ].filter(Boolean).join(" · "),
                onEdit: () => editFavorite(favorite),
                onDelete: () => deleteItem("favorite", favorite.id),
              }))}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function ItemList({
  title,
  items,
  limit,
}: {
  title: string;
  items: { id: string; title: string; detail: string; thumbnail?: string; onEdit: () => void; onDelete: () => void }[];
  limit?: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleItems = limit && !showAll ? items.slice(0, limit) : items;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-950">{title}</h3>
      {items.length ? (
        <div className="space-y-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3">
              <div className="flex min-w-0 items-start gap-3">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="truncate text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={item.onEdit}
                  aria-label={`Edit ${item.title}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-950"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={item.onDelete}
                  aria-label={`Delete ${item.title}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {limit && items.length > limit && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950"
            >
              {showAll ? "Show less" : `Show all ${items.length}`}
            </button>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Nothing yet.</p>
      )}
    </div>
  );
}
