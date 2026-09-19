import { apiFetch } from "@/shared/api-client/http";
import type { IPlan, IPlanInput } from "@/modules/plans/types/plan";

export const plansService = {
  list() {
    return apiFetch<IPlan[]>("/plans");
  },

  create(input: IPlanInput) {
    return apiFetch<IPlan>("/plans", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: string, input: Partial<IPlanInput> & { isActive?: boolean }) {
    return apiFetch<IPlan>(`/plans/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  remove(id: string) {
    return apiFetch<void>(`/plans/${id}`, { method: "DELETE" });
  },
};
