"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Memorial = {
  id: number;
  slug: string;
  full_name: string | null;
  is_published: boolean | null;
  is_living_preplan: boolean | null;
  created_at: string | null;
  
};

export default function MyMemorialsPage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMemorials() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage("Please log in to view your memorials.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("memorials")
        .select("id, slug, full_name, is_published, is_living_preplan, created_at")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMemorials((data as Memorial[]) || []);
      setLoading(false);
    }

    loadMemorials();
  }, []);

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10">
      <section className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">My Memorials</h1>

        <p className="mt-3 text-stone-600">
          View and manage memorials you created, including unpublished personal
          E-Memorials.
        </p>

        {loading && (
          <p className="mt-8 text-stone-500">Loading your memorials...</p>
        )}

        {!loading && message && (
          <p className="mt-8 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            {message}
          </p>
        )}

        {!loading && !message && memorials.length === 0 && (
          <p className="mt-8 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
            You have not created any memorials yet.
          </p>
        )}

        {!loading && memorials.length > 0 && (
          <div className="mt-8 space-y-4">
            {memorials.map((memorial) => (
              <div
                key={memorial.id}
                className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    {memorial.full_name || "Unnamed Memorial"}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    {memorial.is_living_preplan && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                        Personal E-Memorial
                      </span>
                    )}

                    {memorial.is_published ? (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
                        Published
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
                        Unpublished
                      </span>
                    )}
                  </div>

                  {memorial.created_at && (
                    <p className="mt-2 text-xs text-stone-500">
                      Created {new Date(memorial.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                 <Link
  href={`/memorial/${memorial.slug}`}
  className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100"
>
  {memorial.is_published ? "View" : "Preview"}
</Link>

<Link
  href={`/memorial/${memorial.slug}/edit`}
  className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
>
  Edit
</Link>
                    
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}