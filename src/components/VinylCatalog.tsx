"use client";

import { VinylRecord } from "@/data/vinyls";
import {
  getCollectionSnapshot,
  getStatusTone,
  sortVinylRecords,
  uniqueSorted,
  VinylSortKey,
} from "@/lib/vinylAnalytics";
import { fetchVinylRecords, saveVinylRecord, VinylApiStatus } from "@/lib/vinylApi";
import { getAppleMusicAlbumUrl, getAppleMusicSearchUrl } from "@/lib/appleMusic";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { getDecade, statusLabel } from "@/lib/vinylRecordUtils";
import {
  X,
  ArrowUpDown,
  Disc3,
  Grid3X3,
  Heart,
  List,
  Search,
  Shuffle,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Confetti from "react-confetti";

type VinylCatalogProps = {
  records: VinylRecord[];
};

type ViewMode = "grid" | "list";
type FilterKey = "genres" | "moods" | "status" | "decades";
type QuickFilter = "all" | "favorites" | "wishlist" | "upgrade";

function CoverArt({
  record,
  src,
  backSrc,
  side = "front",
  priority = false,
  loading = "lazy",
  fetchPriority = "low",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  flipOnHover = false,
}: {
  record: VinylRecord;
  src?: string;
  backSrc?: string;
  side?: "front" | "back";
  priority?: boolean;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  sizes?: string;
  flipOnHover?: boolean;
}) {
  const imageSrc = src ?? record.coverImage;
  const [isFlipped, setIsFlipped] = useState(false);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    setCanHover(typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  if (imageSrc) {
    const hasBackCover = Boolean(backSrc ?? record.backCoverImage);
    const imageClassName = "object-cover transition-transform duration-500 ease-out";

    return (
      <div
        className="group relative h-full w-full"
        style={{ perspective: "1200px" }}
        onMouseEnter={flipOnHover && hasBackCover && canHover ? () => setIsFlipped(true) : undefined}
        onMouseLeave={flipOnHover && hasBackCover && canHover ? () => setIsFlipped(false) : undefined}
        onFocus={flipOnHover && hasBackCover && canHover ? () => setIsFlipped(true) : undefined}
        onBlur={flipOnHover && hasBackCover && canHover ? () => setIsFlipped(false) : undefined}
      >
        {flipOnHover && hasBackCover && canHover ? (
          <div
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-black/55 text-white opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100"
            aria-hidden="true"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </div>
        ) : null}
        <div
          className="relative h-full w-full transition-transform duration-500 ease-out"
          style={{ transformStyle: "preserve-3d", transform: flipOnHover && hasBackCover && isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <Image
              src={imageSrc}
              alt={`${record.title} by ${record.artist} ${side} cover`}
              fill
              priority={priority}
              loading={loading}
              fetchPriority={priority ? "high" : fetchPriority}
              sizes={sizes}
              quality={62}
              className={imageClassName}
              unoptimized={imageSrc.startsWith("data:")}
            />
          </div>
          {hasBackCover ? (
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <Image
                src={backSrc ?? record.backCoverImage!}
                alt={`${record.title} by ${record.artist} back cover`}
                fill
                priority={false}
                loading="lazy"
                fetchPriority="low"
                sizes={sizes}
                quality={62}
                className={imageClassName}
                unoptimized={String(backSrc ?? record.backCoverImage).startsWith("data:")}
              />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,_#f9fafb,_#e5e7eb)]">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm">
        <Disc3 className="h-14 w-14 text-gray-300" />
      </div>
    </div>
  );
}

function RecordMeta({ record }: { record: VinylRecord }) {
  const chips = [
    record.releaseYear?.toString(),
    getDecade(record),
    record.vinylColor,
    statusLabel(record.status),
  ].filter(Boolean);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (!isVisible) setIsVisible(true);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <span className={`transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>{displayValue}</span>;
}

function createSeededRandom(seed: number) {
  let state = Math.floor(seed * 2147483647) || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export default function VinylCatalog({ records }: VinylCatalogProps) {
  const [allRecords, setAllRecords] = useState<VinylRecord[]>(records);
  const [, setApiSource] = useState<VinylApiStatus>("local");
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [activeMood, setActiveMood] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [activeDecade, setActiveDecade] = useState("All");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sortKey, setSortKey] = useState<VinylSortKey>("date-added");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pickedRecordId, setPickedRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(null);
  const [selectedRecordAppleMusicUrl, setSelectedRecordAppleMusicUrl] = useState("");
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusCelebrationMessage, setStatusCelebrationMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompactCarousel, setIsCompactCarousel] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [carouselSeed] = useState(() => Math.random());
  const hasAppliedFavoriteDefault = useRef(false);
  const desktopCarouselDelay = `${-(carouselSeed * 84).toFixed(2)}s`;
  const mobileCarouselRef = useRef<HTMLDivElement | null>(null);
  const mobileCarouselItemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);
  const hasInitializedTouchCarousel = useRef(false);
  const recordsPerPage = 9;

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setApiSource(response.source);
        setAllRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setAllRecords([...records, ...queuedRecords]));
  }, [records]);

  useEffect(() => {
    const hasFavorites = allRecords.some((record) => record.favorite);
    if (hasFavorites && !hasAppliedFavoriteDefault.current && sortKey === "date-added") {
      hasAppliedFavoriteDefault.current = true;
      setSortKey("favorites");
    }
  }, [allRecords, sortKey]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const update = () => setIsCompactCarousel(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsTouchDevice(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const filterOptions = useMemo(
    () => ({
      genres: uniqueSorted(allRecords.flatMap((record) => record.genres)),
      moods: uniqueSorted(allRecords.flatMap((record) => record.moods)),
      status: ["Owned", "Wishlist", "Upgrade wanted"],
      decades: uniqueSorted(allRecords.map(getDecade)),
    }),
    [allRecords],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = allRecords.filter((record) => {
      const searchable = [
        record.title,
        record.artist,
        record.releaseYear?.toString(),
        record.originalReleaseYear?.toString(),
        record.recordingYears,
        record.pressingYear?.toString(),
        record.label,
        record.catalogNumber,
        record.format,
        record.discCount?.toString(),
        record.pressing,
        record.pressingNotes,
        record.vinylColor,
        record.condition,
        record.source,
        record.storageLocation,
        record.giftFrom,
        record.whereWeGotIt,
        record.bestFor,
        record.notes,
        record.favoriteStories,
        ...record.genres,
        ...record.moods,
        ...(record.favoriteTracks ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesGenre = activeGenre === "All" || record.genres.includes(activeGenre);
      const matchesMood = activeMood === "All" || record.moods.includes(activeMood);
      const matchesStatus = activeStatus === "All" || statusLabel(record.status) === activeStatus;
      const matchesDecade = activeDecade === "All" || getDecade(record) === activeDecade;
      const matchesQuickFilter =
        quickFilter === "all" ||
        (quickFilter === "favorites" && record.favorite) ||
        (quickFilter === "wishlist" && record.status === "wishlist") ||
        (quickFilter === "upgrade" && record.status === "upgrade");
      return matchesQuery && matchesGenre && matchesMood && matchesStatus && matchesDecade && matchesQuickFilter;
    });

    return sortVinylRecords(matches, sortKey);
  }, [activeDecade, activeGenre, activeMood, activeStatus, allRecords, query, quickFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / recordsPerPage));
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    return filteredRecords.slice(startIndex, startIndex + recordsPerPage);
  }, [currentPage, filteredRecords]);

  const carouselRecords = (isCompactCarousel ? allRecords.slice(0, 24) : allRecords).filter(
    (record) => record.status !== "wishlist",
  );
  const desktopCarouselRows = useMemo(() => {
    const seededRandom = createSeededRandom(carouselSeed);
    const shuffled = [...carouselRecords].sort(() => seededRandom() - 0.5);

    return {
      top: shuffled.filter((_, index) => index % 2 === 0),
      bottom: shuffled.filter((_, index) => index % 2 === 1),
    };
  }, [carouselRecords, carouselSeed]);
  const rollingRecords = isCompactCarousel
    ? [...carouselRecords, ...carouselRecords]
    : [...carouselRecords, ...carouselRecords, ...carouselRecords];
  const touchCarouselRecords = [...carouselRecords, ...carouselRecords];
  const rollingRecordsReverse = isCompactCarousel
    ? []
    : [...desktopCarouselRows.bottom, ...desktopCarouselRows.bottom, ...desktopCarouselRows.bottom];
  const rollingRecordsTop = isCompactCarousel
    ? []
    : [...desktopCarouselRows.top, ...desktopCarouselRows.top, ...desktopCarouselRows.top];
  const pickedRecord = allRecords.find((record) => record.id === pickedRecordId);
  const shouldUseModal = !isTouchDevice;

  const snapshot = useMemo(() => getCollectionSnapshot(allRecords), [allRecords]);

  const pickRandomRecord = () => {
    const pool = filteredRecords.length ? filteredRecords : allRecords;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setPickedRecordId(next.id);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveGenre("All");
    setActiveMood("All");
    setActiveStatus("All");
    setActiveDecade("All");
    setQuickFilter("all");
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeDecade, activeGenre, activeMood, activeStatus, quickFilter, query, sortKey, viewMode]);

  useEffect(() => {
    if (!isTouchDevice || hasInitializedTouchCarousel.current || !mobileCarouselRef.current || !carouselRecords.length) {
      return;
    }

    const startIndex = Math.floor(Math.random() * carouselRecords.length);
    mobileCarouselItemRefs.current[startIndex]?.scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });
    hasInitializedTouchCarousel.current = true;
  }, [carouselRecords.length, isTouchDevice]);

  useEffect(() => {
    if (!isTouchDevice || !mobileCarouselRef.current) return;

    const container = mobileCarouselRef.current;
    let frame = 0;
    let pauseUntil = 0;

    const pause = () => {
      pauseUntil = performance.now() + 1200;
    };

    const tick = (now: number) => {
      const loopWidth = container.scrollWidth / 2;
      if (loopWidth > 0 && now >= pauseUntil) {
        container.scrollLeft += 1.1;
        if (container.scrollLeft >= loopWidth) {
          container.scrollLeft -= loopWidth;
        }
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    container.addEventListener("touchstart", pause, { passive: true });
    container.addEventListener("pointerdown", pause);
    container.addEventListener("wheel", pause, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("touchstart", pause);
      container.removeEventListener("pointerdown", pause);
      container.removeEventListener("wheel", pause);
    };
  }, [carouselRecords.length, isTouchDevice]);

  useEffect(() => {
    if (!selectedRecord) {
      setSelectedRecordAppleMusicUrl("");
      return;
    }

    let active = true;
    setSelectedRecordAppleMusicUrl(getAppleMusicSearchUrl(selectedRecord));
    getAppleMusicAlbumUrl(selectedRecord).then((url) => {
      if (active) setSelectedRecordAppleMusicUrl(url);
    });

    return () => {
      active = false;
    };
  }, [selectedRecord]);

  const toggleFavorite = async (record: VinylRecord) => {
    const nextRecord = { ...record, favorite: !record.favorite };
    setFavoriteRecordId(record.id);

    try {
      const response = await saveVinylRecord(nextRecord);
      const savedRecord = response.record;
      setApiSource(response.source);
      setAllRecords((current) =>
        current.map((item) => (item.id === savedRecord.id ? savedRecord : item)),
      );
      setSelectedRecord((current) => (current?.id === savedRecord.id ? savedRecord : current));
    } catch {
      setAllRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
      setSelectedRecord((current) => (current?.id === nextRecord.id ? nextRecord : current));
    } finally {
      setFavoriteRecordId(null);
    }
  };

  const markAsOwned = async (record: VinylRecord) => {
    if (record.status === "owned") return;

    const nextRecord = { ...record, status: "owned" as const };

    try {
      const response = await saveVinylRecord(nextRecord);
      const savedRecord = response.record;
      setApiSource(response.source);
      setAllRecords((current) =>
        current.map((item) => (item.id === savedRecord.id ? savedRecord : item)),
      );
      setSelectedRecord((current) => (current?.id === savedRecord.id ? savedRecord : current));
    } catch {
      setAllRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
      setSelectedRecord((current) => (current?.id === nextRecord.id ? nextRecord : current));
    }

    setStatusCelebrationMessage(`Nice. ${record.title} is now on the owned shelf.`);
    setShowConfetti(true);
    window.setTimeout(() => {
      setShowConfetti(false);
      setStatusCelebrationMessage("");
    }, 3000);
  };

  const filterGroups: Array<{
    label: string;
    value: string;
    setValue: (value: string) => void;
    options: string[];
    keyName: FilterKey;
  }> = [
    {
      label: "Genre",
      value: activeGenre,
      setValue: setActiveGenre,
      options: filterOptions.genres,
      keyName: "genres",
    },
    {
      label: "Mood",
      value: activeMood,
      setValue: setActiveMood,
      options: filterOptions.moods,
      keyName: "moods",
    },
    {
      label: "Status",
      value: activeStatus,
      setValue: setActiveStatus,
      options: filterOptions.status,
      keyName: "status",
    },
    {
      label: "Decade",
      value: activeDecade,
      setValue: setActiveDecade,
      options: filterOptions.decades,
      keyName: "decades",
    },
  ];
  const quickFilterOptions = [
    ["all", "All"],
    ["favorites", "Favorites"],
    allRecords.some((record) => record.status === "wishlist") ? ["wishlist", "Wishlist"] : null,
    allRecords.some((record) => record.status === "upgrade") ? ["upgrade", "Upgrades"] : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <div>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Records</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">
            <AnimatedNumber value={allRecords.length} />
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Artists</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">
            <AnimatedNumber value={snapshot.artists} />
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Genres</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">
            <AnimatedNumber value={snapshot.genres} />
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <p className="text-sm text-gray-500">Favorites</p>
          <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">
            <AnimatedNumber value={snapshot.favorites} />
          </p>
        </div>
      </div>

      {rollingRecords.length > 0 ? (
        <section className="mb-10 overflow-hidden py-2">
          {isTouchDevice ? (
            <div
              ref={mobileCarouselRef}
              className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {touchCarouselRecords.map((record, index) => {
                const recordHref = `/vinyl/${record.id}`;
                const coverClasses =
                  "relative h-28 w-28 shrink-0 snap-center overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:h-48 sm:w-48 lg:h-56 lg:w-56";

                return (
                  <Link
                    key={`${record.id}-touch-${index}`}
                    href={recordHref}
                    ref={(node) => {
                      mobileCarouselItemRefs.current[index] = node;
                    }}
                    className={coverClasses}
                    aria-label={`Open ${record.title} by ${record.artist}`}
                  >
                    <CoverArt
                      record={record}
                      backSrc={record.backCoverImage}
                      priority={index < 2}
                      sizes="(max-width: 639px) 112px, (max-width: 1023px) 192px, 224px"
                      flipOnHover
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="vinyl-marquee flex w-max gap-4" style={{ animationDelay: desktopCarouselDelay }}>
            {rollingRecordsTop.map((record, index) => {
              const recordHref = `/vinyl/${record.id}`;
              const coverClasses = "relative h-28 w-28 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:h-48 sm:w-48 lg:h-56 lg:w-56";

              return shouldUseModal ? (
                <button
                  key={`${record.id}-${index}`}
                  type="button"
                  onClick={() => setSelectedRecord(record)}
                  className={coverClasses}
                  aria-label={`View ${record.title} by ${record.artist}`}
                >
                  <CoverArt
                    record={record}
                    backSrc={record.backCoverImage}
                    priority={index < (isCompactCarousel ? 1 : 2)}
                    sizes="(max-width: 639px) 112px, (max-width: 1023px) 192px, 224px"
                    flipOnHover
                  />
                </button>
              ) : (
                <Link
                  key={`${record.id}-${index}`}
                  href={recordHref}
                  className={coverClasses}
                  aria-label={`Open ${record.title} by ${record.artist}`}
                >
                  <CoverArt
                    record={record}
                    backSrc={record.backCoverImage}
                    priority={index < (isCompactCarousel ? 1 : 2)}
                    sizes="(max-width: 639px) 112px, (max-width: 1023px) 192px, 224px"
                    flipOnHover
                  />
                </Link>
              );
            })}
            </div>
          )}
          {shouldUseModal && rollingRecordsReverse.length > 0 ? (
            <div className="vinyl-marquee-reverse mt-4 flex w-max gap-4" style={{ animationDelay: desktopCarouselDelay }}>
              {rollingRecordsReverse.map((record, index) => (
                <button
                  key={`${record.id}-reverse-${index}`}
                  type="button"
                  onClick={() => setSelectedRecord(record)}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:h-40 sm:w-40 lg:h-48 lg:w-48"
                  aria-label={`View ${record.title} by ${record.artist}`}
                >
                  <CoverArt
                    record={record}
                    backSrc={record.backCoverImage}
                    sizes="(max-width: 639px) 96px, (max-width: 1023px) 160px, 192px"
                    flipOnHover
                  />
                </button>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mb-10 rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-5 flex flex-col items-start gap-3 text-left">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">
            Collection Snapshot
          </p>
          <h2 className="text-2xl font-semibold text-gray-950">Top patterns</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Top decade", snapshot.topEra.value, `${snapshot.topEra.count} records`],
            ["Top genre", snapshot.topGenre.value, `${snapshot.topGenre.count} records`],
            ["Top artist", snapshot.topArtist.value, `${snapshot.topArtist.count} records`],
            ["Top mood", snapshot.topMood.value, `${snapshot.topMood.count} records`],
          ].map(([label, value, sublabel]) => (
            <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-lg font-semibold text-gray-950">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{sublabel}</p>
            </div>
          ))}
        </div>

        <Link
          href="/vinyl/insights"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
        >
          <Sparkles className="h-4 w-4" />
          View more analytics
        </Link>
      </section>

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, artist, song, genre, notes, stories, storage..."
              className="w-full rounded-md border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gray-950"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-wrap gap-2">
              {quickFilterOptions.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuickFilter(value as QuickFilter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    quickFilter === value
                      ? "bg-gray-950 text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={pickRandomRecord}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:w-auto"
            >
              <Shuffle className="h-4 w-4" />
              Pick one
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 sm:w-auto"
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              {viewMode === "grid" ? "List" : "Grid"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {filterGroups.map((group) => (
            <label key={group.keyName} className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                {group.label}
              </span>
              <select
                value={group.value}
                onChange={(event) => group.setValue(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-950"
              >
                {["All", ...group.options].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
              Sort
            </span>
            <div className="relative">
              <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={sortKey}
                onChange={(event) => {
                  hasAppliedFavoriteDefault.current = true;
                  setSortKey(event.target.value as VinylSortKey);
                }}
                className="w-full rounded-md border border-gray-300 bg-white py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-950"
              >
                <option value="date-added">Recently added</option>
                <option value="favorites">Favorites first</option>
                <option value="artist">Artist A-Z</option>
                <option value="title">Title A-Z</option>
                <option value="year-desc">Newest release</option>
                <option value="year-asc">Oldest release</option>
              </select>
            </div>
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {allRecords.length} records
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-left text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      </section>

      {pickedRecord ? (
        <div className="mb-8 rounded-lg border border-gray-950 bg-gray-950 p-5 text-white">
          <p className="text-sm text-gray-400">Tonight&apos;s pick</p>
          <p className="mt-1 text-2xl font-semibold">
            {pickedRecord.title} <span className="text-gray-400">by {pickedRecord.artist}</span>
          </p>
        </div>
      ) : null}

      {filteredRecords.length > 0 ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {Math.min((currentPage - 1) * recordsPerPage + 1, filteredRecords.length)}-
              {Math.min(currentPage * recordsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="min-w-20 text-center text-sm font-medium text-gray-900">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div
            className={
              viewMode === "grid"
                ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                : "space-y-4"
            }
          >
            {paginatedRecords.map((record, index) => (
            <article
              key={record.id}
              className={
                viewMode === "grid"
                  ? `overflow-hidden rounded-lg border ${getStatusTone(record.status).card}`
                  : `grid overflow-hidden rounded-lg border ${getStatusTone(record.status).card} sm:grid-cols-[180px_minmax(0,1fr)]`
              }
            >
              <Link
                href={`/vinyl/${record.id}`}
                className={
                  viewMode === "grid"
                    ? "relative block aspect-square w-full"
                    : "relative block aspect-square w-full sm:aspect-auto"
                }
              >
                <CoverArt
                  record={record}
                  backSrc={record.backCoverImage}
                  priority={index < (isCompactCarousel ? 2 : 4)}
                  loading={index < (isCompactCarousel ? 2 : 4) ? "eager" : "lazy"}
                  fetchPriority={index < (isCompactCarousel ? 2 : 4) ? "high" : "low"}
                  sizes={
                    viewMode === "grid"
                      ? "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      : "(max-width: 639px) 100vw, 180px"
                  }
                  flipOnHover
                />
              </Link>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(record.status).badge}`}>
                        {statusLabel(record.status)}
                      </span>
                      {record.favorite ? (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                          Favorite
                        </span>
                      ) : null}
                    </div>
                    <Link href={`/vinyl/${record.id}`} className="block text-xl font-semibold text-gray-950 hover:underline">
                      {record.title}
                    </Link>
                    <p className="mt-1 text-sm text-gray-600">{record.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(record)}
                    disabled={favoriteRecordId === record.id}
                    className={`rounded-full border p-2 transition-colors ${
                      record.favorite
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-950"
                    }`}
                    title={record.favorite ? "Remove favorite" : "Add favorite"}
                    aria-label={record.favorite ? `Remove ${record.title} from favorites` : `Add ${record.title} to favorites`}
                  >
                    <Star className={`h-4 w-4 ${record.favorite ? "fill-current" : ""}`} />
                  </button>
                </div>

                <RecordMeta record={record} />

                <div className="mt-4 flex flex-wrap gap-2">
                  {[...record.genres, ...record.moods].slice(0, 6).map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>

                {record.favoriteTracks?.length ? (
                  <p className="mt-4 text-sm text-gray-600">
                    Tracks: {record.favoriteTracks.join(", ")}
                  </p>
                ) : null}

                {record.status !== "owned" ? (
                  <p className="mt-4 rounded-md bg-white/80 px-3 py-2 text-sm text-gray-700">
                    {record.status === "wishlist"
                      ? "On the wishlist"
                      : "Owned, but watching for a better pressing or copy."}
                  </p>
                ) : null}

                {record.notes ? (
                  <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-6 text-gray-600">
                    {record.notes}
                  </p>
                ) : null}

                <Link
                  href={`/vinyl/${record.id}`}
                  className="mt-4 inline-flex text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
                >
                  Back to catalog
                </Link>
              </div>
            </article>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Disc3 className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-950">No matching records</h2>
          <p className="mt-2 text-gray-600">Try clearing filters or changing the search.</p>
        </div>
      )}

      {selectedRecord ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-0 py-0 sm:items-center sm:px-4 sm:py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vinyl-modal-title"
          onClick={() => setSelectedRecord(null)}
        >
          {showConfetti ? <Confetti recycle={false} numberOfPieces={160} /> : null}
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                    Album details
                  </p>
                  <h2 id="vinyl-modal-title" className="text-3xl font-semibold text-gray-950">
                    {selectedRecord.title}
                  </h2>
                  <p className="mt-2 text-lg text-gray-600">{selectedRecord.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedRecord)}
                    disabled={favoriteRecordId === selectedRecord.id}
                    className={`rounded-full border p-2 transition-colors ${
                      selectedRecord.favorite
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-950"
                    }`}
                    aria-label={selectedRecord.favorite ? `Remove ${selectedRecord.title} from favorites` : `Add ${selectedRecord.title} to favorites`}
                  >
                    <Star className={`h-5 w-5 ${selectedRecord.favorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(null)}
                    className="rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-950"
                    aria-label="Close album details"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                      <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        <CoverArt
                          record={selectedRecord}
                          priority
                          sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 50vw, 42vw"
                        />
                      </div>
                      <p className="mt-3 text-sm font-medium text-gray-500">Front cover</p>
                    </div>

                    {selectedRecord.backCoverImage ? (
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                        <div className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                          <CoverArt
                            record={selectedRecord}
                            src={selectedRecord.backCoverImage}
                            side="back"
                            sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) 50vw, 34vw"
                          />
                        </div>
                        <p className="mt-3 text-sm font-medium text-gray-500">Back cover</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    {[
                      ["Released", selectedRecord.releaseYear?.toString()],
                      ["Status", statusLabel(selectedRecord.status)],
                      ["Pressing", selectedRecord.pressing],
                      ["Storage location", selectedRecord.storageLocation],
                      ["Vinyl color", selectedRecord.vinylColor],
                      ["Condition", selectedRecord.condition],
                      ["Source", selectedRecord.source],
                    ].map(([label, value]) =>
                      value ? (
                        <div key={label} className="rounded-md bg-gray-50 p-3">
                          <dt className="text-gray-500">{label}</dt>
                          <dd className="mt-1 font-medium text-gray-950">{value}</dd>
                        </div>
                      ) : null,
                    )}
                  </div>

                  {selectedRecord.status !== "owned" ? (
                    <div className={`rounded-lg border p-4 ${getStatusTone(selectedRecord.status).card}`}>
                      <p className="text-sm font-medium text-gray-950">{statusLabel(selectedRecord.status)}</p>
                      <p className="mt-1 text-sm text-gray-700">
                        {selectedRecord.status === "wishlist"
                          ? "This one is on Isabel's wishlist."
                          : "This copy is in the collection, but a better version is still on the radar."}
                      </p>
                      <button
                        type="button"
                        onClick={() => markAsOwned(selectedRecord)}
                        className="mt-4 inline-flex rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                      >
                        Mark as owned
                      </button>
                    </div>
                  ) : null}

                  {statusCelebrationMessage ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                      {statusCelebrationMessage}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <RecordMeta record={selectedRecord} />

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-950">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.genres.map((genre) => (
                        <span key={genre} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-950">Moods</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.moods.map((mood) => (
                        <span key={mood} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {mood}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedRecord.favoriteTracks?.length ? (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-950">Favorite tracks</p>
                      <p className="text-sm leading-6 text-gray-600">
                        {selectedRecord.favoriteTracks.join(", ")}
                      </p>
                    </div>
                  ) : null}

                  {selectedRecord.notes ? (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-950">Notes</p>
                      <p className="text-sm leading-6 text-gray-600">{selectedRecord.notes}</p>
                    </div>
                  ) : null}

                  {selectedRecord.favoriteStories ? (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-950">Favorite stories</p>
                      <p className="text-sm leading-6 text-gray-600">{selectedRecord.favoriteStories}</p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => window.open(selectedRecordAppleMusicUrl, "_blank", "noopener,noreferrer")}
                    className="inline-flex rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
                  >
                    Open in Apple Music
                  </button>

                  <Link
                    href={`/vinyl/${selectedRecord.id}`}
                    className="inline-flex rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                  >
                    Open album page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
