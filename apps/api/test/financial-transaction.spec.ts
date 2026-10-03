import {
  runFinancialTransaction,
  type TransactionClient,
} from "../src/database/financial-transaction.js";
import type { PrismaClient } from "../src/generated/prisma/client.js";
import { describe, expect, it, vi } from "vitest";

type TransactionRunner = Pick<PrismaClient, "$transaction">;
type TransactionCallback = (transaction: TransactionClient) => Promise<unknown>;
type TransactionRunnerImplementation = (callback: TransactionCallback) => Promise<unknown>;

describe("runFinancialTransaction", () => {
  it("uses serializable isolation and returns the transaction result", async () => {
    const transaction = {} as TransactionClient;
    const work = vi.fn().mockResolvedValue("committed");
    const database = createTransactionRunner(async (callback) => callback(transaction));

    await expect(runFinancialTransaction(database, work)).resolves.toBe("committed");

    expect(database.$transaction).toHaveBeenCalledWith(work, {
      maxWait: 5_000,
      timeout: 10_000,
      isolationLevel: "Serializable",
    });
    expect(work).toHaveBeenCalledWith(transaction);
  });

  it("retries a serialization conflict and commits the next successful attempt", async () => {
    const transaction = {} as TransactionClient;
    const work = vi.fn().mockResolvedValue("committed after retry");
    let attempts = 0;
    const database = createTransactionRunner(async (callback) => {
      attempts += 1;
      const result = await callback(transaction);

      if (attempts === 1) {
        throw { code: "P2034" };
      }

      return result;
    });

    await expect(runFinancialTransaction(database, work)).resolves.toBe("committed after retry");
    expect(database.$transaction).toHaveBeenCalledTimes(2);
    expect(work).toHaveBeenCalledTimes(2);
  });

  it("does not retry an error that is not a transaction conflict", async () => {
    const database = createTransactionRunner(async () => {
      throw new Error("database connection failed");
    });

    await expect(runFinancialTransaction(database, async () => "unreachable")).rejects.toThrow(
      "database connection failed",
    );
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });
});

function createTransactionRunner(
  implementation: TransactionRunnerImplementation,
): TransactionRunner {
  return {
    $transaction: vi.fn(implementation),
  } as unknown as TransactionRunner;
}
