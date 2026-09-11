import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SearchClient, { type Memorial } from "./SearchClient";

const DIRECTORY_PAGE_SIZE = 24;

type SearchPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

type DirectoryData = {
  memorials: Memorial[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  errorMessage: string;
};

function parsePageNumber(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = Number.parseInt(rawValue ?? "1", 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function buildFullName(memorial: Memorial) {
  if (memorial.full_name?.trim()) return memorial.full_name.trim();

  return [memorial.first_name, memorial.middle_name, memorial.last_name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  const currentPage = parsePageNumber(page);
  const pageSuffix = currentPage > 1 ? ` - Page ${currentPage}` : "";
  const canonicalUrl = currentPage > 1 ? `/search?page=${currentPage}` : "/search";
  const title = `Browse Public Online Memorials${pageSuffix} | MyEMemorial`;
  const description =
    "Search and browse published MyEMemorials by name, cemetery, city, state, country, school, or award to find public online memorial pages.";

  return {
    title: {
      absolute: title,
    },
    description,
    keywords: [
      "browse online memorials",
      "search online memorials",
      "public online memorials",
      "online memorial pages",
      "find a memorial",
      "memorial search",
      "search obituaries",
      "find MyEMemorials",
      "family history search",
      "cemetery memorial search",
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

async function loadDirectoryPage(requestedPage: number): Promise<DirectoryData> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      memorials: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      errorMessage: "The public memorial directory is temporarily unavailable.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const publishedMemorials = supabase
    .from("memorials")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .not("slug", "is", null)
    .neq("slug", "");

  const { count, error: countError } = await publishedMemorials;

  if (countError) {
    return {
      memorials: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      errorMessage: "The public memorial directory could not be loaded.",
    };
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / DIRECTORY_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const rangeStart = (currentPage - 1) * DIRECTORY_PAGE_SIZE;
  const rangeEnd = rangeStart + DIRECTORY_PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from("memorials")
    .select(
      "id, slug, full_name, first_name, middle_name, last_name, birth_date, death_date, cemetery_name, city_lived, state_lived, country_lived, schools_attended, awards_won, featured_photo_url, headstone_photo_1, headstone_photo_2",
    )
    .eq("is_published", true)
    .not("slug", "is", null)
    .neq("slug", "")
    .order("id", { ascending: false })
    .range(rangeStart, rangeEnd);

  return {
    memorials: error ? [] : ((data as Memorial[] | null) ?? []),
    currentPage,
    totalPages,
    totalCount,
    errorMessage: error
      ? "The public memorial directory could not be loaded."
      : "",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { page } = await searchParams;
  const requestedPage = parsePageNumber(page);
  const directoryData = await loadDirectoryPage(requestedPage);

  if (!directoryData.errorMessage && requestedPage > directoryData.totalPages) {
    redirect(
      directoryData.totalPages === 1
        ? "/search"
        : `/search?page=${directoryData.totalPages}`,
    );
  }

  const firstPosition = (directoryData.currentPage - 1) * DIRECTORY_PAGE_SIZE;
  const directoryJsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Public Online Memorials",
    numberOfItems: directoryData.totalCount,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    itemListElement: directoryData.memorials.map((memorial, index) => ({
      "@type": "ListItem",
      position: firstPosition + index + 1,
      name: buildFullName(memorial) || "MyEMemorial",
      url: `https://www.myememorial.com/memorial/${memorial.slug}`,
    })),
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: directoryJsonLd }}
      />
      <SearchClient
        directoryMemorials={directoryData.memorials}
        directoryPage={directoryData.currentPage}
        directoryTotalPages={directoryData.totalPages}
        directoryTotalCount={directoryData.totalCount}
        directoryErrorMessage={directoryData.errorMessage}
      />
    </>
  );
}
