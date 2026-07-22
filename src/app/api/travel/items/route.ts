import { youtubeThumbnailUrl } from "@/lib/travel";
import { getTravelSupabaseClient, uploadTravelPhoto } from "@/lib/travelServer";
import { NextResponse } from "next/server";

type ItemType = "trip" | "photo" | "favorite" | "favorite_location" | "video";
const TRAVEL_PHOTOS_BUCKET = "travel-photos";

function nullableText(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function booleanValue(value: FormDataEntryValue | null) {
  return value === "true" || value === "on";
}

function numberValue(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function longitudeValue(value: FormDataEntryValue | null, stateId: string | null) {
  const parsed = numberValue(value);
  if (parsed === null) return null;
  return stateId && parsed > 0 ? -parsed : parsed;
}

function travelPhotoStoragePath(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  const marker = `/storage/v1/object/public/${TRAVEL_PHOTOS_BUCKET}/`;
  const markerIndex = imageUrl.indexOf(marker);
  if (markerIndex === -1) return null;
  return decodeURIComponent(imageUrl.slice(markerIndex + marker.length).split("?")[0]);
}

async function backfillFavoriteCoordinatesFromPhoto(
  supabase: NonNullable<ReturnType<typeof getTravelSupabaseClient>>,
  photoId: string,
  favoriteId: string | null | undefined,
) {
  if (!favoriteId) return;

  const [{ data: photo }, { data: favorite }] = await Promise.all([
    supabase
      .from("travel_photos")
      .select("latitude, longitude, location_name")
      .eq("id", photoId)
      .maybeSingle(),
    supabase
      .from("travel_favorites")
      .select("latitude, longitude, location_name")
      .eq("id", favoriteId)
      .maybeSingle(),
  ]);

  if (
    photo?.latitude === null ||
    photo?.latitude === undefined ||
    photo.longitude === null ||
    photo.longitude === undefined ||
    favorite?.latitude !== null ||
    favorite?.longitude !== null
  ) {
    return;
  }

  const { error } = await supabase
    .from("travel_favorites")
    .update({
      latitude: photo.latitude,
      longitude: photo.longitude,
      location_name: favorite?.location_name || photo.location_name || null,
    })
    .eq("id", favoriteId);
  if (error) throw error;
}

async function backfillPhotoCoordinatesFromFavorite(
  supabase: NonNullable<ReturnType<typeof getTravelSupabaseClient>>,
  photo: {
    id: string;
    favorite_id: string | null;
    latitude: number | null;
    longitude: number | null;
    location_name: string | null;
  },
) {
  if (!photo.favorite_id || (photo.latitude !== null && photo.longitude !== null)) return;

  const { data: linkedPhotos, error: linkedPhotosError } = await supabase
    .from("travel_photos")
    .select("latitude, longitude, location_name, is_favorite_featured, sort_order, taken_on, created_at")
    .eq("favorite_id", photo.favorite_id)
    .neq("id", photo.id)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("is_favorite_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("taken_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (linkedPhotosError) throw linkedPhotosError;

  const linkedPhoto = linkedPhotos?.[0];
  const { data: favorite, error: favoriteError } = linkedPhoto
    ? { data: null, error: null }
    : await supabase
        .from("travel_favorites")
        .select("latitude, longitude, location_name")
        .eq("id", photo.favorite_id)
        .maybeSingle();
  if (favoriteError) throw favoriteError;

  const source = linkedPhoto ?? favorite;
  if (source?.latitude === null || source?.latitude === undefined || source.longitude === null || source.longitude === undefined) {
    return;
  }

  const { error } = await supabase
    .from("travel_photos")
    .update({
      latitude: source.latitude,
      longitude: source.longitude,
      location_name: photo.location_name || source.location_name || null,
    })
    .eq("id", photo.id);
  if (error) throw error;
}

async function defaultTripIdForScope(
  supabase: NonNullable<ReturnType<typeof getTravelSupabaseClient>>,
  countryId: string,
  stateId: string | null,
  explicitTripId: string | null,
) {
  if (explicitTripId) return explicitTripId;

  let query = supabase
    .from("travel_trips")
    .select("id")
    .eq("country_id", countryId)
    .limit(2);
  query = stateId ? query.eq("state_id", stateId) : query.is("state_id", null);

  const { data, error } = await query;
  if (error) throw error;
  return data?.length === 1 ? data[0].id : null;
}

export async function POST(request: Request) {
  try {
    const supabase = getTravelSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 503 });

    const formData = await request.formData();
    const type = formData.get("type");
    const id = nullableText(formData.get("id"));
    const countryId = nullableText(formData.get("country_id"));
    const stateId = nullableText(formData.get("state_id"));

    if (type !== "trip" && type !== "photo" && type !== "favorite" && type !== "favorite_location" && type !== "video") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!countryId) {
      return NextResponse.json({ error: "Missing country" }, { status: 400 });
    }

    const scopedTripId = await defaultTripIdForScope(
      supabase,
      countryId,
      stateId,
      nullableText(formData.get("trip_id")),
    );

    if (type === "trip") {
      const title = nullableText(formData.get("title"));
      if (!title) return NextResponse.json({ error: "Missing title" }, { status: 400 });

      const row = {
        ...(id ? { id } : {}),
        country_id: countryId,
        state_id: stateId,
        title,
        location_name: nullableText(formData.get("location_name")),
        started_on: nullableText(formData.get("started_on")),
        ended_on: nullableText(formData.get("ended_on")),
        notes: nullableText(formData.get("notes")),
        baylor_went: booleanValue(formData.get("baylor_went")),
        isabel_went: booleanValue(formData.get("isabel_went")),
      };

      const { data, error } = await supabase.from("travel_trips").upsert(row).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (type === "photo") {
      const file = formData.get("image");
      const existingUrl = nullableText(formData.get("image_url"));
      const imageHash = nullableText(formData.get("image_hash"));
      if (imageHash) {
        let duplicateQuery = supabase
          .from("travel_photos")
          .select("id")
          .eq("image_hash", imageHash)
          .limit(1);
        if (id) duplicateQuery = duplicateQuery.neq("id", id);
        const { data: duplicates, error: duplicateError } = await duplicateQuery;
        if (duplicateError) throw duplicateError;
        if (duplicates?.length) {
          return NextResponse.json({ error: "Duplicate photo" }, { status: 409 });
        }
      }
      const imageUrl = file instanceof File && file.size > 0 ? await uploadTravelPhoto(countryId, file) : existingUrl;
      const isFeatured = booleanValue(formData.get("is_featured"));

      if (!imageUrl) return NextResponse.json({ error: "Missing image" }, { status: 400 });

      if (isFeatured) {
        let query = supabase.from("travel_photos").update({ is_featured: false }).eq("country_id", countryId);
        query = stateId ? query.eq("state_id", stateId) : query.is("state_id", null);
        const { error } = await query;
        if (error) throw error;
      }

      const row = {
        ...(id ? { id } : {}),
        country_id: countryId,
        state_id: stateId,
        trip_id: scopedTripId,
        favorite_id: nullableText(formData.get("favorite_id")),
        favorite_location_id: nullableText(formData.get("favorite_location_id")),
        image_url: imageUrl,
        image_hash: imageHash,
        caption: nullableText(formData.get("caption")),
        location_name: nullableText(formData.get("location_name")),
        latitude: numberValue(formData.get("latitude")),
        longitude: longitudeValue(formData.get("longitude"), stateId),
        taken_on: nullableText(formData.get("taken_on")),
        sort_order: numberValue(formData.get("sort_order")) ?? 0,
        is_featured: isFeatured,
      };

      const { data, error } = await supabase.from("travel_photos").upsert(row).select().single();
      if (error) throw error;
      await backfillFavoriteCoordinatesFromPhoto(supabase, data.id, data.favorite_id);
      await backfillPhotoCoordinatesFromFavorite(supabase, data);
      return NextResponse.json({ item: data });
    }

    if (type === "video") {
      const title = nullableText(formData.get("title"));
      const url = nullableText(formData.get("url"));
      if (!title || !url) return NextResponse.json({ error: "Missing video" }, { status: 400 });
      const visibility = nullableText(formData.get("visibility")) ?? "unlisted";

      const row = {
        ...(id ? { id } : {}),
        country_id: countryId,
        state_id: stateId,
        trip_id: scopedTripId,
        title,
        url,
        provider: "youtube",
        thumbnail_url: nullableText(formData.get("thumbnail_url")) ?? youtubeThumbnailUrl(url),
        visibility: ["unlisted", "public", "private", "unknown"].includes(visibility) ? visibility : "unknown",
        notes: nullableText(formData.get("notes")),
        sort_order: numberValue(formData.get("sort_order")) ?? 0,
      };

      const { data, error } = await supabase.from("travel_videos").upsert(row).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (type === "favorite_location") {
      const favoriteId = nullableText(formData.get("favorite_id"));
      if (!favoriteId) return NextResponse.json({ error: "Missing favorite" }, { status: 400 });

      const row = {
        ...(id ? { id } : {}),
        favorite_id: favoriteId,
        country_id: countryId,
        state_id: stateId,
        name: nullableText(formData.get("name")),
        location_name: nullableText(formData.get("location_name")),
        address: nullableText(formData.get("address")),
        latitude: numberValue(formData.get("latitude")),
        longitude: longitudeValue(formData.get("longitude"), stateId),
        notes: nullableText(formData.get("notes")),
        sort_order: numberValue(formData.get("sort_order")) ?? 0,
      };

      const { data, error } = await supabase.from("travel_favorite_locations").upsert(row).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    const name = nullableText(formData.get("name"));
    const favoriteType = nullableText(formData.get("favorite_type"));
    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
    if (favoriteType !== "restaurant" && favoriteType !== "activity" && favoriteType !== "place") {
      return NextResponse.json({ error: "Invalid favorite type" }, { status: 400 });
    }

    const row = {
      ...(id ? { id } : {}),
      country_id: countryId,
      state_id: stateId,
      trip_id: scopedTripId,
      type: favoriteType,
      name,
      location_name: nullableText(formData.get("location_name")),
      address: nullableText(formData.get("address")),
      cuisine: favoriteType === "restaurant" ? nullableText(formData.get("cuisine")) : null,
      latitude: numberValue(formData.get("latitude")),
      longitude: longitudeValue(formData.get("longitude"), stateId),
      notes: nullableText(formData.get("notes")),
      sort_order: numberValue(formData.get("sort_order")) ?? 0,
    };

    const { data, error } = await supabase.from("travel_favorites").upsert(row).select().single();
    if (error) throw error;
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Could not save travel item", error);
    return NextResponse.json({ error: "Could not save travel item" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = getTravelSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 503 });

    const body = (await request.json()) as { type?: ItemType; id?: string; favorite_id?: string | null; favorite_location_id?: string | null; is_favorite_featured?: boolean; is_featured?: boolean };
    if (body.type !== "photo" || !body.id) {
      return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    }

    if (body.is_featured) {
      const { data: photo } = await supabase.from("travel_photos").select("country_id, state_id").eq("id", body.id).maybeSingle();
      if (!photo?.country_id) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      let query = supabase.from("travel_photos").update({ is_featured: false }).eq("country_id", photo.country_id);
      query = photo.state_id ? query.eq("state_id", photo.state_id) : query.is("state_id", null);
      const { error } = await query;
      if (error) throw error;
    }

    if (body.is_favorite_featured) {
      const { data: photo } = await supabase.from("travel_photos").select("favorite_id, favorite_location_id").eq("id", body.id).maybeSingle();
      const targetFavoriteId = body.favorite_id ?? photo?.favorite_id ?? null;
      const targetFavoriteLocationId =
        "favorite_location_id" in body ? body.favorite_location_id ?? null : photo?.favorite_location_id ?? null;
      if (!targetFavoriteId) {
        return NextResponse.json({ error: "Favorite featured photos must be linked to a favorite" }, { status: 400 });
      }
      if (targetFavoriteId) {
        let query = supabase
          .from("travel_photos")
          .update({ is_favorite_featured: false })
          .eq("favorite_id", targetFavoriteId);
        query = targetFavoriteLocationId ? query.eq("favorite_location_id", targetFavoriteLocationId) : query.is("favorite_location_id", null);
        const { error } = await query;
        if (error) throw error;
      }
    }

    const updateRow: { favorite_id?: string | null; favorite_location_id?: string | null; is_favorite_featured?: boolean; is_featured?: boolean } = {};
    if ("favorite_id" in body) updateRow.favorite_id = body.favorite_id ?? null;
    if ("favorite_location_id" in body) updateRow.favorite_location_id = body.favorite_location_id ?? null;
    if ("is_favorite_featured" in body) updateRow.is_favorite_featured = Boolean(body.is_favorite_featured);
    if ("is_featured" in body) updateRow.is_featured = Boolean(body.is_featured);
    if ("favorite_id" in body && body.favorite_id === null && !("is_favorite_featured" in body)) {
      updateRow.is_favorite_featured = false;
      updateRow.favorite_location_id = null;
    }

    const { data, error } = await supabase
      .from("travel_photos")
      .update(updateRow)
      .eq("id", body.id)
      .select("id, favorite_id, latitude, longitude, location_name")
      .single();
    if (error) throw error;
    await backfillFavoriteCoordinatesFromPhoto(supabase, data.id, data.favorite_id);
    await backfillPhotoCoordinatesFromFavorite(supabase, data);

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Could not update travel item", error);
    return NextResponse.json({ error: "Could not update travel item" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getTravelSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as ItemType | null;
    const id = searchParams.get("id");
    const table =
      type === "trip"
        ? "travel_trips"
        : type === "photo"
          ? "travel_photos"
          : type === "favorite_location"
            ? "travel_favorite_locations"
          : type === "favorite"
            ? "travel_favorites"
            : type === "video"
              ? "travel_videos"
              : null;

    if (!table || !id) return NextResponse.json({ error: "Invalid delete" }, { status: 400 });

    if (type === "photo") {
      const { data: photo } = await supabase.from("travel_photos").select("image_url").eq("id", id).maybeSingle();
      const storagePath = travelPhotoStoragePath(photo?.image_url);
      if (storagePath) {
        const { error } = await supabase.storage.from(TRAVEL_PHOTOS_BUCKET).remove([storagePath]);
        if (error) console.warn("Could not remove travel photo from storage", error);
      }
    }

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not delete travel item", error);
    return NextResponse.json({ error: "Could not delete travel item" }, { status: 500 });
  }
}
