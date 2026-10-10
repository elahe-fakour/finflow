import { describe, expect, it } from "vitest";
import { createEntryListPath, parseEntryListFilters } from "./entry-list-filters";

const categoryId = "b3f34f4f-62f1-4f4f-9e4b-2e527b93bf5c";

describe("entry list filters", () => {
  it("accepts valid list filters and creates a shareable path", () => {
    const filters = parseEntryListFilters({
      categoryId,
      from: "2026-01-01",
      page: "2",
      to: "2026-01-31",
      type: "EXPENSE",
    });

    expect(filters).toEqual({
      categoryId,
      from: "2026-01-01",
      page: 2,
      pageSize: 25,
      to: "2026-01-31",
      type: "EXPENSE",
    });
    expect(createEntryListPath(filters, 3)).toBe(
      `/income-expenses?type=EXPENSE&categoryId=${categoryId}&from=2026-01-01&to=2026-01-31&page=3`,
    );
  });

  it("drops invalid URL values and uses the default page", () => {
    expect(
      parseEntryListFilters({
        categoryId: "not-a-uuid",
        from: "2026-02-30",
        page: "-1",
        to: "not-a-date",
        type: "TRANSFER",
      }),
    ).toEqual({ page: 1, pageSize: 25 });
  });
});
