"use client";

type ArrangePresentationItem = {
  id: number;
  item_type: "photo" | "video";
  photo_url: string | null;
  mux_playback_id: string | null;
  caption: string;
};

type ArrangePresentationSectionProps = {
  items: ArrangePresentationItem[];
  movingItemId: number | null;
  onMove: (
    itemId: number,
    direction: "earlier" | "later"
  ) => void | Promise<void>;
};

export default function ArrangePresentationSection({
  items,
  movingItemId,
  onMove,
}: ArrangePresentationSectionProps) {
  return (
    <section className="mt-4 rounded-2xl border border-[#d8d3c7] bg-white/95 p-5 shadow-[0_6px_18px_rgba(64,50,30,0.10)] backdrop-blur-[2px] sm:p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#244f40] text-white shadow-sm">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M8 6h12" />
            <path d="M8 12h12" />
            <path d="M8 18h12" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
          </svg>
        </span>

        <h2 className="font-serif text-[25px] font-bold text-[#173a31]">
          Arrange Presentation
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-center text-base text-stone-500">
          Add photos or videos to arrange your presentation.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === items.length - 1;
            const isMoving = movingItemId === item.id;

            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-[#e1ddd4] bg-white/90 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-4 sm:min-w-0 sm:flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#244f40] text-base font-bold text-white shadow-sm">
                    {index + 1}
                  </div>

                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100 shadow-sm">
                    {item.item_type === "photo" && item.photo_url ? (
                      <img
                        src={item.photo_url}
                        alt={`Presentation item ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    ) : item.item_type === "video" &&
                      item.mux_playback_id ? (
                      <div className="relative h-full w-full">
                        <img
                          src={`https://image.mux.com/${encodeURIComponent(
                            item.mux_playback_id
                          )}/thumbnail.jpg?time=0`}
                          alt={`Video ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/75 pl-0.5 text-sm text-white">
                            ▶
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        ▶
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-base font-bold text-[#173a31]">
                      {item.item_type === "photo"
                        ? "Photo"
                        : "Video"}
                    </p>

                    {item.caption?.trim() ? (
                      <p className="mt-1 line-clamp-2 text-base text-stone-600">
                        {item.caption}
                      </p>
                    ) : (
                      <p className="mt-1 text-base text-stone-400">
                        No caption
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:w-64">
                  <button
                    type="button"
                    onClick={() =>
                      void onMove(item.id, "earlier")
                    }
                    disabled={
                      isFirst ||
                      movingItemId !== null
                    }
                    className="min-h-12 rounded-xl border border-[#cfc9bd] bg-white px-3 py-2 text-base font-bold text-[#173a31] transition hover:bg-[#f5f4ed] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {isMoving ? "Saving..." : "Move Earlier"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void onMove(item.id, "later")
                    }
                    disabled={
                      isLast ||
                      movingItemId !== null
                    }
                    className="min-h-12 rounded-xl border border-[#cfc9bd] bg-white px-3 py-2 text-base font-bold text-[#173a31] transition hover:bg-[#f5f4ed] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    {isMoving ? "Saving..." : "Move Later"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
