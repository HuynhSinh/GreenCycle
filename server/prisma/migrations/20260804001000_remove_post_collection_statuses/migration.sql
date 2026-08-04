UPDATE "PickupRequest"
SET "status" = 'COLLECTED'
WHERE "status" IN ('IN_TRANSIT', 'AT_WAREHOUSE', 'COMPLETED');

UPDATE "PickupTimeline"
SET "status" = 'COLLECTED'
WHERE "status" IN ('IN_TRANSIT', 'AT_WAREHOUSE', 'COMPLETED');

CREATE TYPE "PickupStatus_new" AS ENUM (
  'PENDING',
  'VERIFYING',
  'APPROVED',
  'ASSIGNED',
  'COLLECTING',
  'ARRIVED',
  'COLLECTED',
  'CANCELLED',
  'REJECTED',
  'FAILED',
  'RESCHEDULED'
);

ALTER TABLE "PickupRequest"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PickupStatus_new" USING ("status"::text::"PickupStatus_new"),
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

ALTER TABLE "PickupTimeline"
  ALTER COLUMN "status" TYPE "PickupStatus_new" USING ("status"::text::"PickupStatus_new");

DROP TYPE "PickupStatus";
ALTER TYPE "PickupStatus_new" RENAME TO "PickupStatus";
