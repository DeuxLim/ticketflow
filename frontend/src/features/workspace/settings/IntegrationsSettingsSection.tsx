import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  createWebhookEndpoint,
  listWebhookDeliveries,
  listWebhookEndpoints,
  retryWebhookDelivery,
} from './settings-api';

type IntegrationsSettingsSectionProps = {
  workspaceSlug: string;
};

const knownEvents = [
  'ticket.created',
  'ticket.updated',
  'ticket.deleted',
  'ticket.comment_added',
  'ticket.comment_updated',
  'ticket.comment_deleted',
  'ticket.attachment_added',
];

function normalizeEvents(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(',')
    .map((event) => event.trim())
    .filter(Boolean);
}

export function IntegrationsSettingsSection({ workspaceSlug }: IntegrationsSettingsSectionProps) {
  const queryClient = useQueryClient();
  const endpointsQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'webhooks'],
    queryFn: () => listWebhookEndpoints(workspaceSlug),
  });
  const deliveriesQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'webhook-deliveries'],
    queryFn: () => listWebhookDeliveries(workspaceSlug),
  });

  const [endpointName, setEndpointName] = useState('');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [endpointSecret, setEndpointSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['ticket.created', 'ticket.updated']);
  const [isCreateEndpointDialogOpen, setIsCreateEndpointDialogOpen] = useState(false);

  const createEndpoint = useMutation({
    mutationFn: () =>
      createWebhookEndpoint(workspaceSlug, {
        name: endpointName.trim(),
        url: endpointUrl.trim(),
        secret: endpointSecret,
        events: selectedEvents,
        is_active: true,
      }),
    onSuccess: () => {
      setEndpointName('');
      setEndpointUrl('');
      setEndpointSecret('');
      setSelectedEvents(['ticket.created', 'ticket.updated']);
      setIsCreateEndpointDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'webhooks'] });
    },
  });

  const retryDelivery = useMutation({
    mutationFn: (deliveryId: number) => retryWebhookDelivery(workspaceSlug, deliveryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'webhook-deliveries'] }),
  });

  const endpoints = endpointsQuery.data?.data ?? [];
  const deliveries = deliveriesQuery.data?.data ?? [];
  const canCreateEndpoint = endpointName.trim().length > 0
    && endpointUrl.trim().length > 0
    && endpointSecret.length >= 12
    && selectedEvents.length > 0;
  const retryingId = retryDelivery.isPending ? retryDelivery.variables : null;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className="w-fit">Integrations</Badge>
              <div className="flex flex-col gap-1">
                <CardTitle>Webhook endpoints</CardTitle>
                <CardDescription>Review subscribed endpoints and add new destinations only when needed.</CardDescription>
              </div>
            </div>
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateEndpointDialogOpen(true)}>
              New endpoint
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Configured endpoints</p>
              {endpointsQuery.isLoading ? (
                <p className="text-xs text-muted-foreground">Loading endpoints...</p>
              ) : endpoints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No webhook endpoints configured.</p>
              ) : (
                endpoints.map((endpoint) => {
                  const events = normalizeEvents(endpoint.events);
                  return (
                    <div key={endpoint.id} className="rounded-md border p-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{endpoint.name}</p>
                        <Badge variant={endpoint.is_active ? 'secondary' : 'outline'}>
                          {endpoint.is_active ? 'active' : 'inactive'}
                        </Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{endpoint.url}</p>
                      <p className="mt-1 text-muted-foreground">
                        {events.length > 0 ? events.join(', ') : 'No events subscribed'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle>Delivery logs</CardTitle>
            <CardDescription>Inspect recent webhook deliveries and retry failed deliveries.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {deliveriesQuery.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading deliveries...</p>
            ) : deliveries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No deliveries yet.</p>
            ) : (
              deliveries.slice(0, 20).map((delivery) => (
                <div key={delivery.id} className="rounded-md border p-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {delivery.endpoint?.name ?? `Endpoint #${delivery.webhook_endpoint_id}`} - {delivery.event?.event_type ?? 'unknown'}
                      </p>
                      <p className="text-muted-foreground">
                        attempts: {delivery.attempt_count} - status: {delivery.status}
                      </p>
                      <p className="text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleString()}
                      </p>
                      {delivery.response_status && (
                        <p className="text-muted-foreground">HTTP {delivery.response_status}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={delivery.status === 'delivered' || retryDelivery.isPending}
                      onClick={() => retryDelivery.mutate(delivery.id)}
                    >
                      {retryingId === delivery.id ? 'Retrying...' : 'Retry'}
                    </Button>
                  </div>
                </div>
              ))
            )}
            {retryDelivery.isError && (
              <p className="text-xs text-destructive">{(retryDelivery.error as Error).message}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateEndpointDialogOpen} onOpenChange={setIsCreateEndpointDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Add one destination URL and choose the ticket events that should be delivered to it.
            </DialogDescription>
          </DialogHeader>
          <form
            id="create-webhook-endpoint-form"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              createEndpoint.mutate();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="webhook-name">Endpoint name</FieldLabel>
                <Input id="webhook-name" value={endpointName} onChange={(event) => setEndpointName(event.target.value)} />
                <FieldDescription>Use a human-readable name such as "Production CRM".</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="webhook-url">Webhook URL</FieldLabel>
                <Input id="webhook-url" placeholder="https://example.com/webhooks/ticketing" value={endpointUrl} onChange={(event) => setEndpointUrl(event.target.value)} />
                <FieldDescription>The endpoint must accept signed POST requests from Ticketing Cloud.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="webhook-secret">Signing secret</FieldLabel>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={endpointSecret}
                  onChange={(event) => setEndpointSecret(event.target.value)}
                />
                <FieldDescription>Use at least 12 characters. Store this securely in the receiving system.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Subscribed events</FieldLabel>
                <FieldDescription>Select at least one event that should trigger this endpoint.</FieldDescription>
                <div className="grid gap-2 sm:grid-cols-2">
                  {knownEvents.map((eventName) => {
                    const isChecked = selectedEvents.includes(eventName);
                    return (
                      <label key={eventName} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            setSelectedEvents((previous) => {
                              if (checked) return Array.from(new Set([...previous, eventName]));
                              return previous.filter((item) => item !== eventName);
                            });
                          }}
                        />
                        <span>{eventName}</span>
                      </label>
                    );
                  })}
                </div>
              </Field>
            </FieldGroup>
            {createEndpoint.isError && (
              <p className="text-xs text-destructive">{(createEndpoint.error as Error).message}</p>
            )}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateEndpointDialogOpen(false)}>
              Cancel
            </Button>
            <Button form="create-webhook-endpoint-form" type="submit" disabled={!canCreateEndpoint || createEndpoint.isPending}>
              {createEndpoint.isPending ? 'Creating endpoint...' : 'Create endpoint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
