import TravelEditButton from "@/components/TravelEditButton";
import type { TravelVideo } from "@/lib/travel";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/travel";
import { Youtube } from "lucide-react";

export default function TravelVideoEmbed({ video }: { video: TravelVideo }) {
  const embedUrl = youtubeEmbedUrl(video.url);
  const thumbnailUrl = video.thumbnail_url ?? youtubeThumbnailUrl(video.url);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
      {embedUrl && video.visibility !== "private" ? (
        <iframe
          src={embedUrl}
          title={video.title}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <a
          href={video.url}
          target="_blank"
          rel="noreferrer"
          className="relative flex aspect-video items-center justify-center gap-2 overflow-hidden bg-slate-100 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          ) : null}
          <span className="relative inline-flex items-center gap-2 rounded-md bg-white/90 px-3 py-2">
            <Youtube className="h-5 w-5" />
            Open video
          </span>
        </a>
      )}
      <div className="flex items-start justify-between gap-3 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{video.title}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{video.visibility}</p>
          {video.notes && <p className="mt-1 text-xs text-slate-500">{video.notes}</p>}
        </div>
        <TravelEditButton type="video" item={video} label={`Edit ${video.title}`} />
      </div>
    </div>
  );
}
