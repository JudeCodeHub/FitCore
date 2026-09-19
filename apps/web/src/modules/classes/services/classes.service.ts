import { apiFetch } from "@/shared/api-client/http";
import type { IClass } from "@/modules/classes/types/class";

export const classesService = {
  list(params?: { from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return apiFetch<IClass[]>(`/classes${suffix}`);
  },
};
