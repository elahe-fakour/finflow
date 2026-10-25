CREATE TYPE "InvitationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "invitation_delivery_outbox" (
    "id" UUID NOT NULL,
    "invitation_id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "recipient_email" VARCHAR(320) NOT NULL,
    "encrypted_token" TEXT NOT NULL,
    "status" "InvitationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),
    "last_error" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "invitation_delivery_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invitation_delivery_outbox_status_available_idx"
ON "invitation_delivery_outbox" ("status", "available_at");
CREATE INDEX "invitation_delivery_outbox_workspace_created_idx"
ON "invitation_delivery_outbox" ("workspace_id", "created_at");

ALTER TABLE "invitation_delivery_outbox"
ADD CONSTRAINT "invitation_delivery_outbox_invitation_id_fkey"
FOREIGN KEY ("invitation_id") REFERENCES "workspace_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitation_delivery_outbox"
ADD CONSTRAINT "invitation_delivery_outbox_workspace_id_fkey"
FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
