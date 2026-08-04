ALTER TABLE "RewardExchange"
ADD COLUMN "idempotencyKey" TEXT;

CREATE UNIQUE INDEX "RewardExchange_idempotencyKey_key"
ON "RewardExchange"("idempotencyKey");
