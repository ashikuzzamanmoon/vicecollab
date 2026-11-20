"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Select } from "@/components/ui";
import { AUDIENCE_COUNTRIES, NICHES, PLATFORMS } from "@/lib/constants";

export interface DirectoryFilterValues {
  q: string;
  platform: string;
  niche: string;
  country: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

const SORT_OPTIONS = [
  { value: "followers", label: "Most followers" },
  { value: "rating", label: "Top rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}

/**
 * Directory filters. Selects update the URL immediately; the text search
 * and price inputs are debounced so typing does not spam navigation.
 */
export function DirectoryFilters({ initial }: { initial: DirectoryFilterValues }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(initial.q);
  const [minPrice, setMinPrice] = useState(initial.minPrice);
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice);

  const hasActiveFilters =
    q !== "" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    initial.platform !== "" ||
    initial.niche !== "" ||
    initial.country !== "" ||
    (initial.sort !== "" && initial.sort !== "followers");

  function replaceWith(params: URLSearchParams) {
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Debounced sync of the text search and price inputs into the URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      setOrDelete(params, "q", q.trim());
      setOrDelete(params, "minPrice", minPrice);
      setOrDelete(params, "maxPrice", maxPrice);
      if (params.toString() !== searchParams.toString()) {
        replaceWith(params);
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, minPrice, maxPrice]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    setOrDelete(params, key, value);
    replaceWith(params);
  }

  function clearAll() {
    setQ("");
    setMinPrice("");
    setMaxPrice("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mb-8 rounded-2xl border border-violet-400/15 bg-night-800/80 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="sm:col-span-2">
          <label htmlFor="directory-search" className="sr-only">
            Search creators
          </label>
          <Input
            id="directory-search"
            type="search"
            placeholder="Search creators, niches..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="filter-platform" className="sr-only">
            Platform
          </label>
          <Select
            id="filter-platform"
            value={initial.platform}
            onChange={(e) => updateParam("platform", e.target.value)}
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-niche" className="sr-only">
            Niche
          </label>
          <Select
            id="filter-niche"
            value={initial.niche}
            onChange={(e) => updateParam("niche", e.target.value)}
          >
            <option value="">All niches</option>
            {NICHES.map((niche) => (
              <option key={niche} value={niche}>
                {niche}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-country" className="sr-only">
            Audience country
          </label>
          <Select
            id="filter-country"
            value={initial.country}
            onChange={(e) => updateParam("country", e.target.value)}
          >
            <option value="">All countries</option>
            {AUDIENCE_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="filter-sort" className="sr-only">
            Sort by
          </label>
          <Select
            id="filter-sort"
            value={initial.sort || "followers"}
            onChange={(e) => updateParam("sort", e.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-min-price" className="text-xs font-medium text-slate-400">
            Price range ($)
          </label>
          <Input
            id="filter-min-price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24"
          />
          <span className="text-slate-500">-</span>
          <label htmlFor="filter-max-price" className="sr-only">
            Max price in dollars
          </label>
          <Input
            id="filter-max-price"
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24"
          />
        </div>

        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
