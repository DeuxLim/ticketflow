import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApiError } from '@/services/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { WorkspaceTicketingSettings } from '@/types/api';
import {
  createTicketCategory,
  createTicketTag,
  createTicketType,
  getTicketingSettings,
  listTicketCategories,
  listTicketTags,
  listTicketTypes,
  updateTicketCategory,
  updateTicketTag,
  updateTicketType,
  updateTicketingSettings,
} from './settings-api';

type TicketingSettingsSectionProps = {
  workspaceSlug: string;
};

type DictionaryKind = 'categories' | 'types' | 'tags';

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type DictionaryEditorProps<T extends { id: number; name: string; is_active: boolean }> = {
  title: string;
  rows: T[];
  selectedId: string;
  setSelectedId: (value: string) => void;
  nameDraft: string;
  setNameDraft: (value: string) => void;
  keyDraft?: string;
  setKeyDraft?: (value: string) => void;
  onSelect: (id: string) => void;
  onSave: () => void;
  onToggle: () => void;
  isSaving: boolean;
  errorMessage: string | null;
};

function DictionaryEditor<T extends { id: number; name: string; is_active: boolean }>(props: DictionaryEditorProps<T>) {
  const {
    title,
    rows,
    selectedId,
    setSelectedId,
    nameDraft,
    setNameDraft,
    keyDraft,
    setKeyDraft,
    onSelect,
    onSave,
    onToggle,
    isSaving,
    errorMessage,
  } = props;

  const selected = useMemo(() => rows.find((row) => String(row.id) === selectedId), [rows, selectedId]);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="outline">{rows.length} records</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-[220px_1fr_1fr_auto_auto]">
        <Select
          value={selectedId}
          onValueChange={(value) => {
            const selected = value ?? '';
            setSelectedId(selected);
            onSelect(selected);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${title.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {rows.map((row) => (
                <SelectItem key={row.id} value={String(row.id)}>
                  {row.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Input aria-label={`${title} name`} value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="Name" />
        {setKeyDraft ? (
          <Input aria-label={`${title} key`} value={keyDraft ?? ''} onChange={(event) => setKeyDraft(event.target.value)} placeholder="key-value" />
        ) : (
          <div />
        )}
        <Button type="button" variant="outline" onClick={onSave} disabled={!selected || !nameDraft.trim() || isSaving}>
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onToggle} disabled={!selected || isSaving}>
          {selected?.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
      {errorMessage ? <p className="mt-2 text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}

export function TicketingSettingsSection({ workspaceSlug }: TicketingSettingsSectionProps) {
  const queryClient = useQueryClient();
  const [ticketNumberFormatDraft, setTicketNumberFormatDraft] = useState<string | null>(null);
  const [assignmentStrategyDraft, setAssignmentStrategyDraft] = useState<WorkspaceTicketingSettings['assignment_strategy'] | null>(null);
  const [activeDictionary, setActiveDictionary] = useState<DictionaryKind | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [typeName, setTypeName] = useState('');
  const [tagName, setTagName] = useState('');
  const [dictionaryError, setDictionaryError] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryNameDraft, setCategoryNameDraft] = useState('');
  const [categoryKeyDraft, setCategoryKeyDraft] = useState('');

  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [typeNameDraft, setTypeNameDraft] = useState('');
  const [typeKeyDraft, setTypeKeyDraft] = useState('');

  const [selectedTagId, setSelectedTagId] = useState('');
  const [tagNameDraft, setTagNameDraft] = useState('');

  const ticketingQuery = useQuery({
    queryKey: ['workspace', workspaceSlug, 'settings', 'ticketing'],
    queryFn: () => getTicketingSettings(workspaceSlug),
  });

  const categoriesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-categories'], queryFn: () => listTicketCategories(workspaceSlug) });
  const typesQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-types'], queryFn: () => listTicketTypes(workspaceSlug) });
  const tagsQuery = useQuery({ queryKey: ['workspace', workspaceSlug, 'ticket-tags'], queryFn: () => listTicketTags(workspaceSlug) });

  const settings = ticketingQuery.data?.data;
  const ticketNumberFormat = ticketNumberFormatDraft ?? settings?.ticket_number_format ?? 'TKT-{seq:6}';
  const assignmentStrategy = assignmentStrategyDraft ?? settings?.assignment_strategy ?? 'manual';

  const categories = categoriesQuery.data?.data ?? [];
  const types = typesQuery.data?.data ?? [];
  const tags = tagsQuery.data?.data ?? [];

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

  const createCategory = useMutation({
    mutationFn: () => createTicketCategory(workspaceSlug, { key: slugify(categoryName), name: categoryName }),
    onSuccess: () => {
      setCategoryName('');
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-categories'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const createType = useMutation({
    mutationFn: () => createTicketType(workspaceSlug, { key: slugify(typeName), name: typeName }),
    onSuccess: () => {
      setTypeName('');
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-types'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const createTag = useMutation({
    mutationFn: () => createTicketTag(workspaceSlug, { name: tagName }),
    onSuccess: () => {
      setTagName('');
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-tags'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const updateCategory = useMutation({
    mutationFn: () => updateTicketCategory(workspaceSlug, Number(selectedCategoryId), { name: categoryNameDraft, key: slugify(categoryKeyDraft) }),
    onSuccess: () => {
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-categories'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const toggleCategory = useMutation({
    mutationFn: () => {
      const category = categories.find((item) => String(item.id) === selectedCategoryId);
      if (!category) {
        return Promise.reject(new Error('Select a category first.'));
      }
      return updateTicketCategory(workspaceSlug, category.id, { is_active: !category.is_active });
    },
    onSuccess: () => {
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-categories'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const updateType = useMutation({
    mutationFn: () => updateTicketType(workspaceSlug, Number(selectedTypeId), { name: typeNameDraft, key: slugify(typeKeyDraft) }),
    onSuccess: () => {
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-types'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const toggleType = useMutation({
    mutationFn: () => {
      const type = types.find((item) => String(item.id) === selectedTypeId);
      if (!type) {
        return Promise.reject(new Error('Select a ticket type first.'));
      }
      return updateTicketType(workspaceSlug, type.id, { is_active: !type.is_active });
    },
    onSuccess: () => {
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-types'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const updateTag = useMutation({
    mutationFn: () => updateTicketTag(workspaceSlug, Number(selectedTagId), { name: tagNameDraft }),
    onSuccess: () => {
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-tags'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  const toggleTag = useMutation({
    mutationFn: () => {
      const tag = tags.find((item) => String(item.id) === selectedTagId);
      if (!tag) {
        return Promise.reject(new Error('Select a tag first.'));
      }
      return updateTicketTag(workspaceSlug, tag.id, { is_active: !tag.is_active });
    },
    onSuccess: () => {
      setDictionaryError(null);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceSlug, 'ticket-tags'] });
    },
    onError: (error: ApiError) => setDictionaryError(error.message),
  });

  function hydrateCategoryDrafts(id: string): void {
    const category = categories.find((item) => String(item.id) === id);
    setCategoryNameDraft(category?.name ?? '');
    setCategoryKeyDraft(category?.key ?? '');
    setDictionaryError(null);
  }

  function hydrateTypeDrafts(id: string): void {
    const type = types.find((item) => String(item.id) === id);
    setTypeNameDraft(type?.name ?? '');
    setTypeKeyDraft(type?.key ?? '');
    setDictionaryError(null);
  }

  function hydrateTagDrafts(id: string): void {
    const tag = tags.find((item) => String(item.id) === id);
    setTagNameDraft(tag?.name ?? '');
    setDictionaryError(null);
  }

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
          <CardDescription>Review owner-managed terms first, then open the focused manager for changes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categories</TableHead>
                  <TableHead>Ticket types</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{categories.length}</TableCell>
                  <TableCell>{types.length}</TableCell>
                  <TableCell>{tags.length}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <DictionarySummary
              description="Routing and reporting labels."
              label="Categories"
              onOpen={() => setActiveDictionary('categories')}
              total={categories.length}
            />
            <DictionarySummary
              description="Intake and template grouping."
              label="Ticket types"
              onOpen={() => setActiveDictionary('types')}
              total={types.length}
            />
            <DictionarySummary
              description="Lightweight ticket markers."
              label="Tags"
              onOpen={() => setActiveDictionary('tags')}
              total={tags.length}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={activeDictionary === 'categories'} onOpenChange={(open) => setActiveDictionary(open ? 'categories' : null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Create or update ticket categories without crowding the settings overview.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <InlineCreate label="Category" value={categoryName} onChange={setCategoryName} onSubmit={() => createCategory.mutate()} disabled={!categoryName || createCategory.isPending} />
            <DictionaryEditor
              title="Categories"
              rows={categories}
              selectedId={selectedCategoryId}
              setSelectedId={setSelectedCategoryId}
              nameDraft={categoryNameDraft}
              setNameDraft={setCategoryNameDraft}
              keyDraft={categoryKeyDraft}
              setKeyDraft={setCategoryKeyDraft}
              onSelect={hydrateCategoryDrafts}
              onSave={() => updateCategory.mutate()}
              onToggle={() => toggleCategory.mutate()}
              isSaving={updateCategory.isPending || toggleCategory.isPending}
              errorMessage={dictionaryError}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDictionary === 'types'} onOpenChange={(open) => setActiveDictionary(open ? 'types' : null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Ticket Types</DialogTitle>
            <DialogDescription>Create or update intake types used by templates and routing.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <InlineCreate label="Ticket type" value={typeName} onChange={setTypeName} onSubmit={() => createType.mutate()} disabled={!typeName || createType.isPending} />
            <DictionaryEditor
              title="Ticket types"
              rows={types}
              selectedId={selectedTypeId}
              setSelectedId={setSelectedTypeId}
              nameDraft={typeNameDraft}
              setNameDraft={setTypeNameDraft}
              keyDraft={typeKeyDraft}
              setKeyDraft={setTypeKeyDraft}
              onSelect={hydrateTypeDrafts}
              onSave={() => updateType.mutate()}
              onToggle={() => toggleType.mutate()}
              isSaving={updateType.isPending || toggleType.isPending}
              errorMessage={dictionaryError}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDictionary === 'tags'} onOpenChange={(open) => setActiveDictionary(open ? 'tags' : null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>Create or update lightweight tags used to mark and filter tickets.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <InlineCreate label="Tag" value={tagName} onChange={setTagName} onSubmit={() => createTag.mutate()} disabled={!tagName || createTag.isPending} />
            <DictionaryEditor
              title="Tags"
              rows={tags}
              selectedId={selectedTagId}
              setSelectedId={setSelectedTagId}
              nameDraft={tagNameDraft}
              setNameDraft={setTagNameDraft}
              onSelect={hydrateTagDrafts}
              onSave={() => updateTag.mutate()}
              onToggle={() => toggleTag.mutate()}
              isSaving={updateTag.isPending || toggleTag.isPending}
              errorMessage={dictionaryError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DictionarySummary({
  description,
  label,
  onOpen,
  total,
}: {
  description: string;
  label: string;
  onOpen: () => void;
  total: number;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline" className="w-fit">
        {total} records
      </Badge>
      <Button type="button" variant="outline" onClick={onOpen}>
        Manage {label.toLowerCase()}
      </Button>
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
