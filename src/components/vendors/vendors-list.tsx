"use client";

import {
  vendorCategories,
  type Vendor,
  type VendorCategory,
} from "@/components/vendors/vendor-sample-data";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Building2, ChevronDown, Search, SearchX, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type VendorFilter = "all" | VendorCategory;

type VendorsListProps = {
  vendors: Vendor[];
};

function vendorMatchesSearch(vendor: Vendor, query: string) {
  return [vendor.name, vendor.contactName, vendor.email, vendor.category].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function VendorsList({ vendors }: VendorsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<VendorFilter>("all");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = normalizedQuery ? vendorMatchesSearch(vendor, normalizedQuery) : true;
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });
  const hasActiveFilters = normalizedQuery.length > 0 || selectedCategory !== "all";
  const resultsMessage = hasActiveFilters
    ? `${filteredVendors.length} vendor${filteredVendors.length === 1 ? "" : "s"} found`
    : `${vendors.length} vendor${vendors.length === 1 ? "" : "s"}`;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  return (
    <div className="mt-8 space-y-5">
      <section
        aria-label="Vendor filters"
        className="rounded-[1.5rem] border-2 border-border bg-card px-5 py-4 sm:px-7 sm:py-5"
      >
        <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Search and filter vendors
        </p>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <div className="relative w-full">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="vendor-search">
                Search vendors
              </label>
              <Input
                aria-describedby="vendor-search-results"
                className="pl-11"
                id="vendor-search"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search vendors"
                type="search"
                value={searchQuery}
              />
            </div>

            <div className="relative w-full sm:max-w-56">
              <SlidersHorizontal
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="vendor-category-filter">
                Filter vendors by category
              </label>
              <select
                aria-describedby="vendor-search-results"
                className="h-11 w-full appearance-none rounded-control border border-input bg-transparent py-2 pr-10 pl-11 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="vendor-category-filter"
                onChange={(event) => setSelectedCategory(event.target.value as VendorFilter)}
                value={selectedCategory}
              >
                <option value="all">All categories</option>
                {vendorCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:justify-end">
            {hasActiveFilters ? (
              <Button onClick={clearFilters} size="sm" type="button" variant="ghost">
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted px-5 py-3 sm:px-7">
        <p
          aria-live="polite"
          className="text-lg font-semibold text-foreground"
          id="vendor-search-results"
        >
          {resultsMessage}
        </p>
        <span className="rounded-full border border-border bg-card px-3 py-1 text-sm font-medium text-secondary-foreground">
          Sample data
        </span>
      </div>

      {filteredVendors.length > 0 ? (
        <section className="overflow-hidden rounded-[1.5rem] border-2 border-border bg-card px-5 py-4 sm:px-7 sm:py-6">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[48rem] text-left text-base">
              <caption className="sr-only">Vendor sample data</caption>
              <thead className="border-b-2 border-border text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Vendor
                  </th>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Contact
                  </th>
                  <th className="px-1 py-4 font-semibold" scope="col">
                    Category
                  </th>
                  <th className="px-1 py-4 text-right font-semibold" scope="col">
                    Open bills
                  </th>
                  <th className="px-1 py-4 text-right font-semibold" scope="col">
                    Outstanding payable
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="border-b border-border px-1 py-5">
                      <Link
                        className="font-semibold text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        href={`/vendors/${vendor.id}`}
                      >
                        {vendor.name}
                      </Link>
                      <p className="mt-0.5 text-secondary-foreground">{vendor.email}</p>
                    </td>
                    <td className="border-b border-border px-1 py-5 font-medium text-secondary-foreground">
                      {vendor.contactName}
                    </td>
                    <td className="border-b border-border px-1 py-5 text-secondary-foreground">
                      {vendor.category}
                    </td>
                    <td className="border-b border-border px-1 py-5 text-right tabular-nums text-secondary-foreground">
                      {vendor.openBills}
                    </td>
                    <td className="border-b border-border px-1 py-5 text-right font-semibold tabular-nums text-foreground">
                      {vendor.outstandingPayable}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {filteredVendors.map((vendor) => (
              <li className="rounded-control border border-border bg-muted/40 p-3" key={vendor.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      href={`/vendors/${vendor.id}`}
                    >
                      {vendor.name}
                    </Link>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{vendor.email}</p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-foreground">
                    {vendor.outstandingPayable}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <p className="truncate text-muted-foreground">{vendor.contactName}</p>
                  <p className="shrink-0 text-muted-foreground">{vendor.category}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState
          action={
            hasActiveFilters ? (
              <Button onClick={clearFilters} type="button" variant="outline">
                Clear filters
              </Button>
            ) : undefined
          }
          className="mt-6"
          description={
            normalizedQuery
              ? `No vendor matches “${searchQuery.trim()}”. Try a different name, email address, or category.`
              : "No vendors match the selected category. Try a different filter."
          }
          icon={hasActiveFilters ? SearchX : Building2}
          title={hasActiveFilters ? "No vendors found" : "No vendors yet"}
        />
      )}
    </div>
  );
}

export { VendorsList };
