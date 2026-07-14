import { getTravelSupabaseClient, uploadTravelPhoto } from "@/lib/travelServer";
import { NextResponse } from "next/server";

type ItemType = "trip" | "photo" | "favorite" | "video";

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

export async function POST(request: Request) {
  try {
    const supabase = getTravelSupabaseClient();
    if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 503 });

    const formData = await request.formData();
    const type = formData.get("type");
    const id = nullableText(formData.get("id"));
    const countryId = nullableText(formData.get("country_id"));
    const stateId = nullableText(formData.get("state_id"));

    if (type !== "trip" && type !== "photo" && type !== "favorite" && type !== "video") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (!countryId) {
      return NextResponse.json({ error: "Missing country" }, { status: 400 });
    }

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
        trip_id: nullableText(formData.get("trip_id")),
        image_url: imageUrl,
        caption: nullableText(formData.get("caption")),
        location_name: nullableText(formData.get("location_name")),
        taken_on: nullableText(formData.get("taken_on")),
        sort_order: numberValue(formData.get("sort_order")) ?? 0,
        is_featured: isFeatured,
      };

      const { data, error } = await supabase.from("travel_photos").upsert(row).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (type === "video") {
      const title = nullableText(formData.get("title"));
      const url = nullableText(formData.get("url"));
      if (!title || !url) return NextResponse.json({ error: "Missing video" }, { status: 400 });

      const row = {
        ...(id ? { id } : {}),
        country_id: countryId,
        state_id: stateId,
        trip_id: nullableText(formData.get("trip_id")),
        title,
        url,
        provider: "youtube",
        notes: nullableText(formData.get("notes")),
        sort_order: numberValue(formData.get("sort_order")) ?? 0,
      };

      const { data, error } = await supabase.from("travel_videos").upsert(row).select().single();
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
      trip_id: nullableText(formData.get("trip_id")),
      type: favoriteType,
      name,
      location_name: nullableText(formData.get("location_name")),
      latitude: numberValue(formData.get("latitude")),
      longitude: numberValue(formData.get("longitude")),
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
          : type === "favorite"
            ? "travel_favorites"
            : type === "video"
              ? "travel_videos"
              : null;

    if (!table || !id) return NextResponse.json({ error: "Invalid delete" }, { status: 400 });

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Could not delete travel item", error);
    return NextResponse.json({ error: "Could not delete travel item" }, { status: 500 });
  }
}
