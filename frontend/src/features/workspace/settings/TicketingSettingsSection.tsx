import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TicketCategoryConfig, TicketQueueConfig, TicketTagConfig, TicketTypeConfig, WorkspaceTicketingSettings } from '@/types/api';
import {
  createTicketCategory,
  createTicketQueue,
  createTicketTag,
  createTicketType,
  getTicketingSettings,
  listTicketCategories,
  listTicketQueues,
  listTicketTags,
  listTicketTypes,
  updateTicketingSettings,
  updateTicketQueue,
} from './settings-api';

type TicketingSettingsSectionProps = {
  workspaceSlug: string;
};

type DictionaryItem = TicketQueueConfig | TicketCategoryConfig | TicketTypeConfig | TicketTagConfig;

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function ConfigTable({ title, rows }: { title: string; rows: DictionaryItem[] }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">{rows.length} records</Badge>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${title}-${row.id}`}>
                <TableCell>{'name' in row ? row.name : '—'}</TableCell>
                <TableCell>{'key' in row ? row.key : row.name}</TableCell>
                <TableCell>
                  <Badge variant={row.is_active ? 'secondary' : 'outline'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function TicketingSettingsSection({ workspaceSlug }: TicketingSettingsSectionProps) {
  const queryClient = useQueryClient();
  const [ticketNumberFormatDraft, setTicketNumberFormatDraft] = useState<string | null>(null);
  const [assignmentStrategyDraft, setAssignmentStrategyDraft] = useState<WorkspaceTicketingSettings['assignment_strategy'] | null>(null);
  const [queueName, setQueueName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [typeName, setTypeName] = useState('');
  const [tagName, setTagName] = useState('');

  const ticketingQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'settings', 'ticketing'],
    queryFn: () => getTicketingSettings(workspaceSlug),
  });

  const queuesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-queues'], queryFn: () => listTicketQueues(workspaceSlug) });
  const categoriesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-categories'], queryFn: () => listTicketCategories(workspaceSlug) });
  const typesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-types'], queryFn: () => listTicketTypes(workspaceSlug) });
  const tagsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-tags'], queryFn: () => listTicketTags(workspaceSlug) });

  const settings = ticketingQuery.data?.data;
  const ticketNumberFormat = ticketNumberFormatDraft ?? settings?.ticket_number_format ?? 'TKT-{seq:6}';
  const assignmentStrategy = assignmentStrategyDraft ?? settings?.assignment_strategy ?? 'manual';

  const updateTicketing = useMutation({
    mutationFn: () =>
      updateTicketingSettings(workspaceSlug, {
        ticket_number_format: ticketNumberFormat,
        assignment_strategy: assignmentStrategy,
      }),
    onSuccess: () => {
      setTicketNumberFormatDraft(null);
      setAssignmentStrategyDraft(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'settings', 'ticketing'] });
    },
  });

  const createQueue = useMutation({
    mutationFn: () => createTicketQueue(workspaceSlug, { key: slugify(queueName), name: queueName }),
    onSuccess: () => {
      setQueueName('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-queues'] });
    },
  });

  const createCategory = useMutation({
    mutationFn: () => createTicketCategory(workspaceSlug, { key: slugify(categoryName), name: categoryName }),
    onSuccess: () => {
      setCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-categories'] });
    },
  });

  const createType = useMutation({
    mutationFn: () => createTicketType(workspaceSlug, { key: slugify(typeName), name: typeName }),
    onSuccess: () => {
      setTypeName('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-types'] });
    },
  });

  const createTag = useMutation({
    mutationFn: () => createTicketTag(workspaceSlug, { name: tagName }),
    onSuccess: () => {
      setTagName('');
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-tags'] });
    },
  });

  const toggleQueue = useMutation({
    mutationFn: (queue: TicketQueueConfig) => updateTicketQueue(workspaceSlug, queue.id, { is_active: !queue.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-queues'] }),
  });

  const queues = queuesQuery.data?.data ?? [];
  const categories = categoriesQuery.data?.data ?? [];
  const types = typesQuery.data?.data ?? [];
  const tags = tagsQuery.data?.data ?? [];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <Card className="shadow-none">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            Ticketing
          </Badge>
          <CardTitle>Ticket behavior</CardTitle>
          <CardDescription>Set numbering and assignment defaults without changing existing tickets.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              updateTicketing.mutate();
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ticket-number-format">Ticket number format</FieldLabel>
                <Input id="ticket-number-format" value={ticketNumberFormat} onChange={(event) => setTicketNumberFormatDraft(event.target.value)} />
                <FieldDescription>Must include a sequence placeholder such as {'{seq:6}'}.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Assignment strategy</FieldLabel>
                <Select value={assignmentStrategy} onValueChange={(value) => setAssignmentStrategyDraft(value as WorkspaceTicketingSettings['assignment_strategy'])}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="round_robin">Round-robin</SelectItem>
                      <SelectItem value="least_open_load">Least open load</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            <Button type="submit" disabled={updateTicketing.isPending || ticketingQuery.isLoading}>
              {updateTicketing.isPending ? 'Saving...' : 'Save ticketing settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Config dictionaries</CardTitle>
          <CardDescription>Owner-managed terms that later power forms, routing, and automation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-3 md:grid-cols-2">
            <InlineCreate label="Queue" value={queueName} onChange={setQueueName} onSubmit={() => createQueue.mutate()} disabled={!queueName || createQueue.isPending} />
            <InlineCreate label="Category" value={categoryName} onChange={setCategoryName} onSubmit={() => createCategory.mutate()} disabled={!categoryName || createCategory.isPending} />
            <InlineCreate label="Ticket type" value={typeName} onChange={setTypeName} onSubmit={() => createType.mutate()} disabled={!typeName || createType.isPending} />
            <InlineCreate label="Tag" value={tagName} onChange={setTagName} onSubmit={() => createTag.mutate()} disabled={!tagName || createTag.isPending} />
          </div>

          <ConfigTable title="Queues" rows={queues} />
          <div className="flex flex-wrap gap-2">
            {queues.map((queue) => (
              <Button key={queue.id} type="button" variant="outline" size="sm" onClick={() => toggleQueue.mutate(queue)}>
                {queue.is_active ? 'Deactivate' : 'Activate'} {queue.name}
              </Button>
            ))}
          </div>
          <ConfigTable title="Categories" rows={categories} />
          <ConfigTable title="Ticket types" rows={types} />
          <ConfigTable title="Tags" rows={tags} />
        </CardContent>
      </Card>
    </div>
  );
}

function InlineCreate({
  label,
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}) {
  return (
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input aria-label={`${label} name`} placeholder={`${label} name`} value={value} onChange={(event) => onChange(event.target.value)} />
      <Button type="submit" variant="outline" disabled={disabled}>
        Add
      </Button>
    </form>
  );
}
