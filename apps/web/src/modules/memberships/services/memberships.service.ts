import { apiFetch } from "@/shared/api-client/http";
import type { IMyMembership } from "@/modules/memberships/types/membership";

export const membershipsService = {
  getMine() {
    return apiFetch<IMyMembership | null>("/memberships/me");
  },
};
