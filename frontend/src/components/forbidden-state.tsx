import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ForbiddenStateProps = {
  title?: string;
  description?: string;
};

export function ForbiddenState({
  title = 'Access restricted',
  description = 'Your workspace role does not include permission for this action.',
}: ForbiddenStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-md bg-amber-100 text-amber-700">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
