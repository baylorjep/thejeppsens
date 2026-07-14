import TravelEditButton from "@/components/TravelEditButton";
import type { TravelVideo } from "@/lib/travel";
import { youtubeEmbedUrl } from "@/lib/travel";
import { Youtube } from "lucide-react";

export default function TravelVideoEmbed({ video }: { video: TravelVideo }) {
  const embedUrl = youtubeEmbedUrl(video.url);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
      {embedUrl ? (
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
          className="flex aspect-video items-center justify-center gap-2 bg-slate-100 text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          <Youtube className="h-5 w-5" />
          Open video
        </a>
      )}
      <div className="flex items-start justify-between gap-3 px-3 py-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">{video.title}</p>
          {video.notes && <p className="mt-1 text-xs text-slate-500">{video.notes}</p>}
        </div>
        <TravelEditButton type="video" item={video} label={`Edit ${video.title}`} />
      </div>
    </div>
  );
}
