"use client";

import {
  vendorCategories,
  type Vendor,
  type VendorCategory,
} from "@/components/vendors/vendor-sample-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="mt-8">
      <CardHeader>
        <CardTitle as="h2">All vendors</CardTitle>
        <CardDescription>
          Filter vendor contacts, categories, and outstanding payables.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">Sample data</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl">
            <div className="relative w-full">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="vendor-search">
                Search vendors
              </label>
              <Input
                aria-describedby="vendor-search-results"
                className="h-10 pl-9"
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
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <ChevronDown
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="vendor-category-filter">
                Filter vendors by category
              </label>
              <select
                aria-describedby="vendor-search-results"
                className="h-10 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-9 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
            <p
              aria-live="polite"
              className="text-sm text-muted-foreground"
              id="vendor-search-results"
            >
              {resultsMessage}
            </p>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} size="sm" type="button" variant="ghost">
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>

        {filteredVendors.length > 0 ? (
          <>
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[48rem] text-left text-sm">
                <caption className="sr-only">Vendor sample data</caption>
                <thead className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="pb-3 font-medium" scope="col">
                      Vendor
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Contact
                    </th>
                    <th className="pb-3 font-medium" scope="col">
                      Category
                    </th>
                    <th className="pb-3 text-right font-medium" scope="col">
                      Open bills
                    </th>
                    <th className="pb-3 text-right font-medium" scope="col">
                      Outstanding payable
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredVendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td className="py-4 pr-4">
                        <Link
                          className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          href={`/vendors/${vendor.id}`}
                        >
                          {vendor.name}
                        </Link>
                        <p className="mt-0.5 text-muted-foreground">{vendor.email}</p>
                      </td>
                      <td className="py-4 pr-4 text-muted-foreground">{vendor.contactName}</td>
                      <td className="py-4 pr-4 text-muted-foreground">{vendor.category}</td>
                      <td className="py-4 pr-4 text-right tabular-nums text-foreground">
                        {vendor.openBills}
                      </td>
                      <td className="py-4 text-right font-medium tabular-nums text-foreground">
                        {vendor.outstandingPayable}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-6 space-y-3 md:hidden">
              {filteredVendors.map((vendor) => (
                <li
                  className="rounded-control border border-border bg-muted/40 p-3"
                  key={vendor.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        className="block truncate font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        href={`/vendors/${vendor.id}`}
                      >
                        {vendor.name}
                      </Link>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {vendor.email}
                      </p>
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
          </>
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
      </CardContent>
    </Card>
  );
}

export { VendorsList };
