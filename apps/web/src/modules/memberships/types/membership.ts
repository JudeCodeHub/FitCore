import type { IPlan } from "@/modules/plans";

export type MembershipStatus =
  | "PENDING"
  | "ACTIVE"
  | "FROZEN"
  | "EXPIRED"
  | "CANCELLED";

export interface IMembership {
  id: string;
  userId: string;
  planId: string;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  frozenUntil: string | null;
  createdAt: string;
  updatedAt: string;
  plan: IPlan;
}

export interface IMembershipOwner {
  id: string;
  name: string;
  email: string;
}

export interface IMyMembership {
  membership: IMembership;
  isDependent: boolean;
  owner: IMembershipOwner | null;
}
