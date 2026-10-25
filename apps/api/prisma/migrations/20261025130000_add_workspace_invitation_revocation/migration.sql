ALTER TABLE "workspace_invitations"
ADD COLUMN "revoked_at" TIMESTAMPTZ(3);

CREATE INDEX "workspace_invitations_pending_idx"
ON "workspace_invitations" ("workspace_id", "accepted_at", "revoked_at", "expires_at");
