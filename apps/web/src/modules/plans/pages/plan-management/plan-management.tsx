"use client";

import { useEffect, useState } from "react";
import { PlanFormDialog } from "@/modules/plans/pages/plan-management/components/plan-form-dialog";
import { plansService } from "@/modules/plans/services/plans.service";
import type { IPlan, IPlanInput } from "@/modules/plans/types/plan";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/shared/api-client/http";
import { planManagementStyles as styles } from "./plan-management.styles";

const DURATION_LABEL: Record<IPlan["duration"], string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};

export function PlanManagementPage() {
  const [plans, setPlans] = useState<IPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<IPlan | null>(null);

  async function loadPlans() {
    setIsLoading(true);
    try {
      setPlans(await plansService.list());
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  function openCreateDialog() {
    setEditingPlan(null);
    setDialogOpen(true);
  }

  function openEditDialog(plan: IPlan) {
    setEditingPlan(plan);
    setDialogOpen(true);
  }

  async function handleSubmit(input: IPlanInput) {
    if (editingPlan) {
      await plansService.update(editingPlan.id, input);
    } else {
      await plansService.create(input);
    }
    await loadPlans();
  }

  async function handleToggleActive(plan: IPlan) {
    await plansService.update(plan.id, { isActive: !plan.isActive });
    await loadPlans();
  }

  async function handleDelete(plan: IPlan) {
    if (!confirm(`Delete "${plan.name}"? This cannot be undone.`)) return;
    try {
      await plansService.remove(plan.id);
      await loadPlans();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete plan");
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Plans</h1>
          <p className={styles.subtitle}>Manage the membership plans members can subscribe to.</p>
        </div>
        <Button onClick={openCreateDialog}>New plan</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No plans yet. Create your first one.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell className="font-mono tabular-nums">
                  ${plan.price}
                </TableCell>
                <TableCell>{DURATION_LABEL[plan.duration]}</TableCell>
                <TableCell className={styles.featuresCell}>
                  {plan.features.length > 0
                    ? plan.features.join(", ")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      plan.isActive
                        ? "bg-status-active text-status-active-foreground"
                        : "bg-status-expired text-status-expired-foreground"
                    }
                  >
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className={styles.actionsCell}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(plan)}
                  >
                    {plan.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(plan)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(plan)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <PlanFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPlan={editingPlan}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
