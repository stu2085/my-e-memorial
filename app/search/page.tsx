"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SideAd from "../components/SideAd";
import { supabase } from "../lib/supabase";
import { useRef } from "react";

type Memorial = {
  id: number;
  slug: string | null;
  full_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  death_date: string | null;
  cemetery_name: string | null;
  city_lived: string | null;
  state_lived: string | null;
  country_lived: string | null;
  schools_attended: string | null;
  awards_won: string | null;
  headstone_photo_1: string | null;
  headstone_photo_2: string | null;
};

function buildFullName(memorial: Memorial) {
  if (memorial.full_name?.trim()) return memorial.full_name.trim();

  return [
    memorial.first_name ?? "",
    memorial.middle_name ?? "",
    memorial.last_name ?? "",
  ]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getYear(dateString: string | null) {
  if (!dateString) return "";
  return dateString.slice(0, 4);
}

function getThumbnail(memorial: Memorial) {
  return memorial.headstone_photo_1 || memorial.headstone_photo_2 || "";
}

export default function SearchPage() {
  const [firstName, setFirstName] = useState("");
const [middleName, setMiddleName] = useState("");
const [lastName, setLastName] = useState("");
  const [cemetery, setCemetery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [school, setSchool] = useState("");
  const [award, setAward] = useState("");
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [visitorZip, setVisitorZip] = useState<string | null>(null);
  const adCategories = [
  "estate_planner",
  "attorney",
  "funeral_home",
  "monument_company",
];

const [leftAdCategory, setLeftAdCategory] = useState("estate_planner");
const [rightAdCategory, setRightAdCategory] = useState("attorney");
  const hasSearched =
  firstName.trim() !== "" ||
  middleName.trim() !== "" ||
  lastName.trim() !== "" ||
  cemetery.trim() !== "" ||
  city.trim() !== "" ||
  state.trim() !== "" ||
  country.trim() !== "" ||
  school.trim() !== "" ||
  award.trim() !== "";
useEffect(() => {
  async function loadVisitorZip() {
    try {
      const res = await fetch("/api/ip-lookup");
      const data = await res.json();

      if (data.zip) {
        setVisitorZip(data.zip);
      }
    } catch (err) {
      console.error("VISITOR ZIP ERROR:", err);
    }
  }

  loadVisitorZip();
}, []);
useEffect(() => {
  const shuffled = [...adCategories].sort(
    () => Math.random() - 0.5
  );

  setLeftAdCategory(shuffled[0]);
  setRightAdCategory(shuffled[1]);
}, []);
  useEffect(() => {
    async function loadMemorials() {
      setIsLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
  .from("memorials")
  .select("*")
  .eq("is_published", true)
  .order("id", { ascending: false });

      if (error) {
        setErrorMessage("Could not load memorials.");
        setIsLoading(false);
        return;
      }

      setMemorials((data as Memorial[]) || []);
      setIsLoading(false);
    }

    loadMemorials();
  }, []);

  const filteredMemorials = useMemo(() => {
  const filtered = memorials.filter((memorial) => {
    const fullName = buildFullName(memorial).toLowerCase();

    const matchesFirstName =
      firstName.trim() === "" ||
      fullName.includes(firstName.trim().toLowerCase());
const matchesMiddleName =
  middleName.trim() === "" ||
  fullName.includes(middleName.trim().toLowerCase());
    const matchesLastName =
  lastName.trim() === "" ||
  (memorial.last_name ?? "")
    .toLowerCase()
    .startsWith(lastName.trim().toLowerCase());

    const matchesCemetery =
      cemetery.trim() === "" ||
      (memorial.cemetery_name ?? "")
        .toLowerCase()
        .includes(cemetery.trim().toLowerCase());

    const matchesCity =
      city.trim() === "" ||
      (memorial.city_lived ?? "")
        .toLowerCase()
        .includes(city.trim().toLowerCase());

    const matchesState =
      state.trim() === "" ||
      (memorial.state_lived ?? "")
        .toLowerCase()
        .includes(state.trim().toLowerCase());

    const matchesCountry =
      country.trim() === "" ||
      (memorial.country_lived ?? "")
        .toLowerCase()
        .includes(country.trim().toLowerCase());

    const matchesSchool =
      school.trim() === "" ||
      (memorial.schools_attended ?? "")
        .toLowerCase()
        .includes(school.trim().toLowerCase());

    const matchesAward =
      award.trim() === "" ||
      (memorial.awards_won ?? "")
        .toLowerCase()
        .includes(award.trim().toLowerCase());

    return (
      memorial.slug &&
      matchesFirstName &&
      matchesMiddleName &&
      matchesLastName &&
      matchesCemetery &&
      matchesCity &&
      matchesState &&
      matchesCountry &&
      matchesSchool &&
      matchesAward
    );
  });

if (lastName.trim() !== "") {
  return [...filtered].sort((a, b) => {
    const aLast = (a.last_name || "").toLowerCase();
    const bLast = (b.last_name || "").toLowerCase();

    return aLast.localeCompare(bLast);
  });
}

if (lastName.trim() !== "") {
  return [...filtered].sort((a, b) => {
    const aLast = (a.last_name || "").toLowerCase();
    const bLast = (b.last_name || "").toLowerCase();

    return aLast.localeCompare(bLast);
  });
}

return [...filtered].sort(() => Math.random() - 0.5);
}, [memorials, firstName, middleName, lastName, cemetery, city, state, country, school, award]);
  useEffect(() => {
  if (hasSearched) {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }
}, [hasSearched]);

  function clearFilters() {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setCemetery("");
    setCity("");
    setState("");
    setCountry("");
    setSchool("");
    setAward("");
  }

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-10 md:px-8">
      <div className="mx-auto flex w-full max-w-[1800px] justify-between gap-6 px-4">
        <SideAd
  pageType="search"
  memorialZip={visitorZip}
  categorySlot={leftAdCategory}
/>

        <div className="flex-1">
          <div className="mx-auto w-full max-w-[1400px]">
            <section
              className="relative overflow-hidden rounded-3xl shadow-sm"
              style={{
                backgroundImage: "url('/gravestone1.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/60" />

              <div className="relative z-10 flex min-h-[325px] flex-col justify-center p-8 text-white md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-200">
                  Search Memorials
                </p>

                <h1 className="mt-3 text-3xl font-bold md:text-4xl text-center">
  Find loved ones and preserve family history
</h1>

                <p className="mt-4 text-base text-stone-100 md:text-lg">
                  Search by first, middle, or last name, cemetery, city, state, country, school, and award.
                </p>
              </div>
            </section>

            <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first or middle name"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>
<div>
  <label className="mb-2 block text-sm font-semibold text-stone-800">
    Middle Name
  </label>
  <input
    type="text"
    value={middleName}
    onChange={(e) => setMiddleName(e.target.value)}
    placeholder="Enter middle name"
    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
  />
</div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Cemetery
                  </label>
                  <input
                    type="text"
                    value={cemetery}
                    onChange={(e) => setCemetery(e.target.value)}
                    placeholder="Enter cemetery name"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    City Lived
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    State Lived
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Enter state"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Country Lived
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Enter country"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    School Attended
                  </label>
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Enter school"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-800">
                    Award Won
                  </label>
                  <input
                    type="text"
                    value={award}
                    onChange={(e) => setAward(e.target.value)}
                    placeholder="Enter award"
                    className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
                >
                  Clear Filters
                </button>

                <Link
                  href="/create"
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
                >
                  Create a Memorial
                </Link>
              </div>
            </section>

            {hasSearched && (
<section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-2xl font-bold text-stone-900">Results</h2>
                <p className="text-sm text-stone-600">
                  {isLoading
                    ? "Loading..."
                    : `${filteredMemorials.length} memorial${filteredMemorials.length === 1 ? "" : "s"} found`}
                </p>
              </div>

              {isLoading ? (
                <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <p className="text-lg font-semibold text-stone-800">
                    Loading memorials...
                  </p>
                </div>
              ) : errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              ) : filteredMemorials.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
                  <p className="text-lg font-semibold text-stone-800">
                    No memorials matched your search.
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    Try changing or clearing one or more filters.
                  </p>
                </div>
              ) : (
                <div ref={resultsRef} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {filteredMemorials.map((memorial) => {
                    const fullName = buildFullName(memorial) || "Unnamed Memorial";
                    const thumb = getThumbnail(memorial);

                    return (
                      <Link
                        key={memorial.id}
                        href={`/memorial/${memorial.slug}`}
                        className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {thumb ? (
                          <div
                            className="h-52 w-full bg-stone-200"
                            style={{
                              backgroundImage: `url('${thumb}')`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }}
                          />
                        ) : (
                          <div className="flex h-52 w-full items-center justify-center bg-stone-100 text-sm text-stone-400">
                            No Photo Yet
                          </div>
                        )}

                        <div className="p-6">
                          <h3 className="text-xl font-bold text-stone-900">
                            {fullName}
                          </h3>

                          <p className="mt-2 text-sm text-stone-600">
                            {getYear(memorial.birth_date) || "Unknown"} -{" "}
                            {getYear(memorial.death_date) || "Unknown"}
                          </p>

                          <div className="mt-4 space-y-2 text-sm text-stone-700">
                            {memorial.cemetery_name && (
                              <p>
                                <span className="font-semibold">Cemetery:</span>{" "}
                                {memorial.cemetery_name}
                              </p>
                            )}
                            {(memorial.city_lived || memorial.state_lived) && (
                              <p>
                                <span className="font-semibold">Location:</span>{" "}
                                {[memorial.city_lived, memorial.state_lived]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            )}
                            {memorial.country_lived && (
                              <p>
                                <span className="font-semibold">Country:</span>{" "}
                                {memorial.country_lived}
                              </p>
                            )}
                            {memorial.schools_attended && (
                              <p>
                                <span className="font-semibold">School:</span>{" "}
                                {memorial.schools_attended}
                              </p>
                            )}
                            {memorial.awards_won && (
                              <p>
                                <span className="font-semibold">Award:</span>{" "}
                                {memorial.awards_won}
                              </p>
                            )}
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
)}
          </div>
        </div>

        <SideAd
  pageType="search"
  memorialZip={visitorZip}
  categorySlot={rightAdCategory}
/>
      </div>
    </main>
  );
}