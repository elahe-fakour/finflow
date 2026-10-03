import { Prisma, type PrismaClient } from "../generated/prisma/client.js";

const DEFAULT_MAX_WAIT_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_DELAY_MS = 25;
const TRANSACTION_CONFLICT_CODE = "P2034";

export type TransactionClient = Prisma.TransactionClient;

export type FinancialTransactionWork<Result> = (transaction: TransactionClient) => Promise<Result>;

export type FinancialTransactionOptions = Readonly<{
  maxWaitMs?: number;
  timeoutMs?: number;
  maxRetries?: number;
}>;

type TransactionRunner = Pick<PrismaClient, "$transaction">;

/**
 * Runs a financial workflow as one serializable database transaction.
 *
 * The callback can run more than once when PostgreSQL reports a write conflict.
 * It must therefore contain only database work and be safe to retry. Send
 * emails, call payment providers, and publish external messages after commit.
 */
export async function runFinancialTransaction<Result>(
  database: TransactionRunner,
  work: FinancialTransactionWork<Result>,
  options: FinancialTransactionOptions = {},
): Promise<Result> {
  const maxRetries = resolveNonNegativeInteger(
    "maxRetries",
    options.maxRetries,
    DEFAULT_MAX_RETRIES,
  );
  const transactionOptions = {
    maxWait: resolvePositiveInteger("maxWaitMs", options.maxWaitMs, DEFAULT_MAX_WAIT_MS),
    timeout: resolvePositiveInteger("timeoutMs", options.timeoutMs, DEFAULT_TIMEOUT_MS),
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  };

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await database.$transaction(work, transactionOptions);
    } catch (error) {
      if (!isTransactionConflict(error) || attempt >= maxRetries) {
        throw error;
      }

      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }
}

function isTransactionConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === TRANSACTION_CONFLICT_CODE
  );
}

function resolveNonNegativeInteger(
  name: string,
  value: number | undefined,
  defaultValue: number,
): number {
  const resolvedValue = value ?? defaultValue;

  if (!Number.isInteger(resolvedValue) || resolvedValue < 0) {
    throw new RangeError(`${name} must be a non-negative integer.`);
  }

  return resolvedValue;
}

function resolvePositiveInteger(
  name: string,
  value: number | undefined,
  defaultValue: number,
): number {
  const resolvedValue = value ?? defaultValue;

  if (!Number.isInteger(resolvedValue) || resolvedValue <= 0) {
    throw new RangeError(`${name} must be a positive integer.`);
  }

  return resolvedValue;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
