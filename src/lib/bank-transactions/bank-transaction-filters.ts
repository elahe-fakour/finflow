type BankTransactionDirection = "INFLOW" | "OUTFLOW";

type BankTransactionListFilters = {
  bankAccountId?: string;
  direction?: BankTransactionDirection;
  from?: string;
  page: number;
  pageSize: number;
  q?: string;
  to?: string;
};

type BankTransactionListSearchParams = Record<string, string | string[] | undefined>;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function parseBankTransactionListFilters(
  searchParams: BankTransactionListSearchParams,
): BankTransactionListFilters {
  const bankAccountId = getUuid(searchParams.bankAccountId);
  const direction = getDirection(searchParams.direction);
  const from = getCalendarDate(searchParams.from);
  const q = getQuery(searchParams.q);
  const to = getCalendarDate(searchParams.to);

  return {
    ...(bankAccountId === undefined ? {} : { bankAccountId }),
    ...(direction === undefined ? {} : { direction }),
    ...(from === undefined ? {} : { from }),
    page: getPositiveInteger(searchParams.page) ?? DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
    ...(q === undefined ? {} : { q }),
    ...(to === undefined ? {} : { to }),
  };
}

function createBankTransactionListPath(filters: BankTransactionListFilters, page: number): string {
  const searchParams = new URLSearchParams();

  if (filters.q !== undefined) {
    searchParams.set("q", filters.q);
  }

  if (filters.bankAccountId !== undefined) {
    searchParams.set("bankAccountId", filters.bankAccountId);
  }

  if (filters.direction !== undefined) {
    searchParams.set("direction", filters.direction);
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

  return query === "" ? "/transactions" : `/transactions?${query}`;
}

function getDirection(value: string | string[] | undefined): BankTransactionDirection | undefined {
  const parameter = getFirstParameter(value);

  return parameter === "INFLOW" || parameter === "OUTFLOW" ? parameter : undefined;
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

function getQuery(value: string | string[] | undefined): string | undefined {
  const parameter = getFirstParameter(value)?.trim();

  return parameter === undefined || parameter === "" ? undefined : parameter.slice(0, 100);
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

export { createBankTransactionListPath, parseBankTransactionListFilters };
export type {
  BankTransactionDirection,
  BankTransactionListFilters,
  BankTransactionListSearchParams,
};
