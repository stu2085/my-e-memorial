"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

type MemorialRecord = {
  id?: number;
  slug?: string;
  full_name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  maiden_name?: string;
  nickname?: string;
  birth_date?: string;
  death_date?: string;
  cemetery_name?: string;
  grave_section?: string;
  grave_row?: string;
  grave_plot?: string;
  city_lived?: string;
  state_lived?: string;
  headstone_photos?: string[];
  gallery_photos?: string[];
};

function unslugify(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-");
}

function buildFullName(memorial: MemorialRecord) {
  if (memorial.full_name?.trim()) return memorial.full_name.trim();

  return [
    memorial.first_name || "",
    memorial.middle_name || "",
    memorial.last_name || "",
    memorial.maiden_name ? `(${memorial.maiden_name})` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatDate(date?: string) {
  return date || "";
}

export default function CemeteryPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  const [memorials, setMemorials] = useState<MemorialRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMemorials() {
      if (!slug || typeof slug !== "string") {
        setMemorials([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
  .from("memorials")
  .select(`
    id,
    slug,
    full_name,
    first_name,
    middle_name,
    last_name,
    maiden_name,
    nickname,
    birth_date,
    death_date,
    cemetery_name,
    grave_section,
    grave_row,
    grave_plot,
    city_lived,
    state_lived,
    headstone_photos,
    gallery_photos
  `)
  .ilike("cemetery_name", unslugify(slug));

if (error) {
  console.error("LOAD CEMETERY PAGE ERROR:", error);
  setMemorials([]);
  setLoading(false);
  return;
}

setMemorials(data || []);
setLoading(false);

      setMemorials(data || []);

      setMemorials(data || []);
      setLoading(false);
    }

    loadMemorials();
  }, [slug]);

  const cemeteryName = useMemo(() => {
    if (typeof slug !== "string") return "Cemetery";
    return memorials[0]?.cemetery_name || unslugify(slug);
  }, [memorials, slug]);

  const cemeteryCity = useMemo(() => {
    return memorials[0]?.city_lived || "—";
  }, [memorials]);

  const cemeteryState = useMemo(() => {
    return memorials[0]?.state_lived || "—";
  }, [memorials]);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            ← Back to Home
          </Link>
        </div>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="relative h-[260px] w-full">
            <img
              src="/gravestone1.jpg"
              alt={cemeteryName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-end">
              <div className="p-8 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-200">
                  Cemetery Page
                </p>
                <h1 className="mt-2 text-4xl font-bold">{cemeteryName}</h1>
                <p className="mt-3 max-w-2xl text-base text-stone-100">
                  Explore memorials, burial details, and location information
                  connected to this cemetery.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-8 lg:grid-cols-3">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <h2 className="text-xl font-bold text-stone-900">
                Cemetery Details
              </h2>

              <div className="mt-5 space-y-3 text-sm text-stone-700">
                <p>
                  <span className="font-semibold text-stone-900">Name:</span>{" "}
                  {cemeteryName}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">City:</span>{" "}
                  {cemeteryCity}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">State:</span>{" "}
                  {cemeteryState}
                </p>
                <p>
                  <span className="font-semibold text-stone-900">
                    Memorials Found:
                  </span>{" "}
                  {memorials.length}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6 lg:col-span-2">
              <h2 className="text-xl font-bold text-stone-900">
                Cemetery Map Area
              </h2>
              <div className="mt-5 flex h-[220px] items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-white text-center text-stone-500">
                <div>
                  <p className="text-lg font-semibold text-stone-700">
                    Future Interactive Map
                  </p>
                  <p className="mt-2 text-sm">
                    Later we can place grave pins, GPS coordinates, and clickable
                    memorial locations here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                Memorials in {cemeteryName}
              </h2>
              <p className="mt-2 text-stone-600">
                Browse all public memorials currently associated with this
                cemetery.
              </p>
            </div>

            <Link
              href="/search"
              className="rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Search More Memorials
            </Link>
          </div>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center text-stone-600">
              Loading cemetery memorials...
            </div>
          ) : memorials.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-stone-200 bg-stone-50 p-8 text-center">
              <h3 className="text-xl font-bold text-stone-900">
                No memorials found yet
              </h3>
              <p className="mt-3 text-stone-600">
                This cemetery page is connected to Supabase, but no memorials in
                your database match this cemetery yet.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {memorials.map((memorial, index) => {
                const fullName = buildFullName(memorial) || "Unnamed Memorial";
                const image =
                  memorial.headstone_photos?.[0] ||
                  memorial.gallery_photos?.[0] ||
                  "/gravestone1.jpg";

                const birthDeathLine =
                  memorial.birth_date || memorial.death_date
                    ? `${formatDate(memorial.birth_date) || "Unknown"} - ${
                        formatDate(memorial.death_date) || "Unknown"
                      }`
                    : "";

                return (
                  <Link
                    key={memorial.slug || memorial.id || index}
                    href={`/memorial/${memorial.slug}`}
                    className="group overflow-hidden rounded-3xl border border-stone-200 bg-stone-50 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative h-56 w-full overflow-hidden">
                      <img
                        src={image}
                        alt={fullName}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 transition group-hover:bg-black/30" />
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-stone-900">
                        {fullName}
                      </h3>

                      {memorial.nickname ? (
                        <p className="mt-2 text-stone-600">
                          Nickname: {memorial.nickname}
                        </p>
                      ) : null}

                      {birthDeathLine ? (
                        <p className="mt-2 text-stone-600">{birthDeathLine}</p>
                      ) : null}

                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-stone-700 sm:grid-cols-2">
                        {memorial.grave_section ? (
                          <p>
                            <span className="font-semibold text-stone-900">
                              Section:
                            </span>{" "}
                            {memorial.grave_section}
                          </p>
                        ) : null}

                        {memorial.grave_row ? (
                          <p>
                            <span className="font-semibold text-stone-900">
                              Row:
                            </span>{" "}
                            {memorial.grave_row}
                          </p>
                        ) : null}

                        {memorial.grave_plot ? (
                          <p>
                            <span className="font-semibold text-stone-900">
                              Plot:
                            </span>{" "}
                            {memorial.grave_plot}
                          </p>
                        ) : null}
                      </div>

                      <div className="mt-5 inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white">
                        View Memorial
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}