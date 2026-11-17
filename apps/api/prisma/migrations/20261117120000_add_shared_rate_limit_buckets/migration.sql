CREATE TABLE "rate_limit_buckets" (
    "bucket_key" CHAR(64) NOT NULL,
    "window_started_at" TIMESTAMPTZ(3) NOT NULL,
    "hit_count" INTEGER NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("bucket_key"),
    CONSTRAINT "rate_limit_buckets_hit_count_check" CHECK ("hit_count" > 0)
);

CREATE INDEX "rate_limit_buckets_expires_at_idx"
    ON "rate_limit_buckets"("expires_at");
