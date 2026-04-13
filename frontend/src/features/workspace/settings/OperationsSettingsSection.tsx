import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type OperationsSettingsSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  rows: Array<[string, string]>;
};

export function OperationsSettingsSection({ eyebrow, title, description, rows }: OperationsSettingsSectionProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <Badge variant="secondary" className="w-fit">
          {eyebrow}
        </Badge>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.map(([label, detail], index) => (
          <div key={label} className="flex flex-col gap-4">
            {index > 0 && <Separator />}
            <div className="grid gap-1 md:grid-cols-[220px_1fr]">
              <p className="text-sm font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">{detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
