export type PlanDuration = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export interface IPlan {
  id: string;
  name: string;
  price: string;
  duration: PlanDuration;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPlanInput {
  name: string;
  price: number;
  duration: PlanDuration;
  features: string[];
}
