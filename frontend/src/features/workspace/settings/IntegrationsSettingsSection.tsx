import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
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
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">Integrations</Badge>
          <CardTitle>Webhook endpoints</CardTitle>
          <CardDescription>Create endpoints and subscribe to ticket lifecycle events.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createEndpoint.mutate();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="webhook-name">Endpoint name</FieldLabel>
                <Input id="webhook-name" value={endpointName} onChange={(event) => setEndpointName(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="webhook-url">Webhook URL</FieldLabel>
                <Input id="webhook-url" placeholder="https://example.com/webhooks/ticketing" value={endpointUrl} onChange={(event) => setEndpointUrl(event.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="webhook-secret">Signing secret</FieldLabel>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={endpointSecret}
                  onChange={(event) => setEndpointSecret(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Subscribed events</FieldLabel>
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
            <Button type="submit" disabled={!canCreateEndpoint || createEndpoint.isPending}>
              {createEndpoint.isPending ? 'Creating endpoint...' : 'Create endpoint'}
            </Button>
          </form>

          <div className="space-y-2">
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
        <CardContent className="space-y-2">
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
  );
}
