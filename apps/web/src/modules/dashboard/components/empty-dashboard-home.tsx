import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function EmptyDashboardHome({
  greetingName,
  roleLabel,
}: {
  greetingName: string;
  roleLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl font-semibold">
          Welcome, {greetingName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          This is your {roleLabel} dashboard. Features for this section are
          coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
