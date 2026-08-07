import { Headphones } from "lucide-react";
import { site } from "@/lib/site";

// Shows Audarya's own narration of the piece, when she's uploaded one.
export function ArticleAudio({ src }: { src: string }) {
  return (
    <div className="mx-auto mt-8 max-w-xl rounded-lg border border-line bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Headphones size={16} /> Listen — read by {site.author}
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls preload="none" src={src} className="w-full">
        Your browser doesn&apos;t support audio playback.
      </audio>
    </div>
  );
}
