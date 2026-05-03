import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

export function SlaPolicyDialog({
  createSlaPolicyPending,
  isOpen,
  onCreateSlaPolicy,
  onOpenChange,
  setSlaFirstResponseMinutes,
  setSlaName,
  setSlaPriority,
  setSlaResolutionMinutes,
  slaFirstResponseMinutes,
  slaName,
  slaPriority,
  slaResolutionMinutes,
}: {
  createSlaPolicyPending: boolean;
  isOpen: boolean;
  onCreateSlaPolicy: () => void;
  onOpenChange: (open: boolean) => void;
  setSlaFirstResponseMinutes: (value: number) => void;
  setSlaName: (value: string) => void;
  setSlaPriority: (value: Priority) => void;
  setSlaResolutionMinutes: (value: number) => void;
  slaFirstResponseMinutes: number;
  slaName: string;
  slaPriority: Priority;
  slaResolutionMinutes: number;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Ticket Timing Target</DialogTitle>
          <DialogDescription>
            Set optional first-reply and resolution targets for tickets with this priority. These are internal timing goals, not customer contracts.
          </DialogDescription>
        </DialogHeader>
        <form
          id="sla-policy-form"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateSlaPolicy();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sla-policy-name">Target name</FieldLabel>
              <Input id="sla-policy-name" value={slaName} onChange={(event) => setSlaName(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Priority</FieldLabel>
              <Select value={slaPriority} onValueChange={(value) => setSlaPriority((value as Priority) ?? 'high')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="low">low</SelectItem>
                    <SelectItem value="medium">medium</SelectItem>
                    <SelectItem value="high">high</SelectItem>
                    <SelectItem value="urgent">urgent</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="sla-first-response">First reply target (minutes)</FieldLabel>
                <Input
                  id="sla-first-response"
                  type="number"
                  value={slaFirstResponseMinutes}
                  onChange={(event) => setSlaFirstResponseMinutes(Number(event.target.value) || 0)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sla-resolution">Resolution target (minutes)</FieldLabel>
                <Input
                  id="sla-resolution"
                  type="number"
                  value={slaResolutionMinutes}
                  onChange={(event) => setSlaResolutionMinutes(Number(event.target.value) || 0)}
                />
              </Field>
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={createSlaPolicyPending || slaName.trim().length < 2}
            form="sla-policy-form"
            type="submit"
          >
            {createSlaPolicyPending ? 'Adding target...' : 'Add target'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BreakGlassRequestDialog({
  breakGlassReason,
  isOpen,
  onOpenChange,
  onRequestBreakGlass,
  requestBreakGlassPending,
  setBreakGlassReason,
}: {
  breakGlassReason: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestBreakGlass: () => void;
  requestBreakGlassPending: boolean;
  setBreakGlassReason: (value: string) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Break-Glass Access</DialogTitle>
          <DialogDescription>
            Explain why emergency elevated access is required. Requests remain pending until approved.
          </DialogDescription>
        </DialogHeader>
        <form
          id="break-glass-form"
          onSubmit={(event) => {
            event.preventDefault();
            onRequestBreakGlass();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="break-glass-reason">Reason</FieldLabel>
              <Input id="break-glass-reason" value={breakGlassReason} onChange={(event) => setBreakGlassReason(event.target.value)} />
              <FieldDescription>Include the incident or ticket context for audit review.</FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={requestBreakGlassPending} form="break-glass-form" type="submit">
            {requestBreakGlassPending ? 'Requesting...' : 'Request access'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
