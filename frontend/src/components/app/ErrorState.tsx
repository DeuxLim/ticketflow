import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ErrorState({ title = 'Unable to load data', message }: { title?: string; message: string }) {
  return (
    <Card className="border-destructive/25 bg-destructive/5 shadow-none">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{title}</CardTitle>
        <CardDescription className="text-destructive/85">{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}
