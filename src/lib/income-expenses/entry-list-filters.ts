type IncomeExpenseEntryType = "EXPENSE" | "INCOME";

type EntryListFilters = {
  categoryId?: string;
  from?: string;
  page: number;
  pageSize: number;
  to?: string;
  type?: IncomeExpenseEntryType;
};

type EntryListSearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function parseEntryListFilters(searchParams: EntryListSearchParams): EntryListFilters {
  const categoryId = getUuid(searchParams.categoryId);
  const from = getCalendarDate(searchParams.from);
  const to = getCalendarDate(searchParams.to);
  const type = getEntryType(searchParams.type);

  return {
    ...(categoryId === undefined ? {} : { categoryId }),
    ...(from === undefined ? {} : { from }),
    page: getPositiveInteger(searchParams.page) ?? DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    ...(to === undefined ? {} : { to }),
    ...(type === undefined ? {} : { type }),
  };
}

function createEntryListPath(filters: EntryListFilters, page: number): string {
  const searchParams = new URLSearchParams();

  if (filters.type !== undefined) {
    searchParams.set("type", filters.type);
  }

  if (filters.categoryId !== undefined) {
    searchParams.set("categoryId", filters.categoryId);
  }

  if (filters.from !== undefined) {
    searchParams.set("from", filters.from);
  }

  if (filters.to !== undefined) {
    searchParams.set("to", filters.to);
  }

  if (page > DEFAULT_PAGE) {
    searchParams.set("page", String(page));
  }

  const query = searchParams.toString();

  return query === "" ? "/income-expenses" : `/income-expenses?${query}`;
}

function getEntryType(value: string | string[] | undefined): IncomeExpenseEntryType | undefined {
  const parameter = getFirstParameter(value);

  return parameter === "INCOME" || parameter === "EXPENSE" ? parameter : undefined;
}

function getUuid(value: string | string[] | undefined): string | undefined {
  const parameter = getFirstParameter(value);

  return parameter !== undefined && UUID_PATTERN.test(parameter) ? parameter : undefined;
}

function getCalendarDate(value: string | string[] | undefined): string | undefined {
  const parameter = getFirstParameter(value);

  if (parameter === undefined || !CALENDAR_DATE_PATTERN.test(parameter)) {
    return undefined;
  }

  const date = new Date(`${parameter}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== parameter
    ? undefined
    : parameter;
}

function getPositiveInteger(value: string | string[] | undefined): number | undefined {
  const parameter = getFirstParameter(value);

  if (parameter === undefined || !/^\d+$/u.test(parameter)) {
    return undefined;
  }

  const number = Number(parameter);

  return Number.isSafeInteger(number) && number >= 1 ? number : undefined;
}

function getFirstParameter(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export { createEntryListPath, parseEntryListFilters };
export type { EntryListFilters, EntryListSearchParams, IncomeExpenseEntryType };
