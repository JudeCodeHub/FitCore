-- AlterTable
ALTER TABLE "Plan" ADD COLUMN "maxMembers" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "MembershipDependent" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipDependent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipDependent_userId_key" ON "MembershipDependent"("userId");

-- CreateIndex
CREATE INDEX "MembershipDependent_membershipId_idx" ON "MembershipDependent"("membershipId");

-- AddForeignKey
ALTER TABLE "MembershipDependent" ADD CONSTRAINT "MembershipDependent_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipDependent" ADD CONSTRAINT "MembershipDependent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
