-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "idPasswordResetToken" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "idAccount" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("idPasswordResetToken")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_idAccount_idx" ON "PasswordResetToken"("idAccount");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_idAccount_fkey" FOREIGN KEY ("idAccount") REFERENCES "Account"("idAccount") ON DELETE CASCADE ON UPDATE CASCADE;
