import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ApiError } from '@/services/api/client';
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
import { type DictionaryKind, TicketingDictionaryDialogs } from './TicketingDictionaryDialogs';

type TicketingSettingsSectionProps = {
  workspaceSlug: string;
};

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
          <TicketingDictionaryDialogs
            activeDictionary={activeDictionary}
            categories={categories}
            categoryKeyDraft={categoryKeyDraft}
            categoryName={categoryName}
            categoryNameDraft={categoryNameDraft}
            dictionaryError={dictionaryError}
            isCreatingCategory={createCategory.isPending}
            isCreatingTag={createTag.isPending}
            isCreatingType={createType.isPending}
            isSavingCategory={updateCategory.isPending || toggleCategory.isPending}
            isSavingTag={updateTag.isPending || toggleTag.isPending}
            isSavingType={updateType.isPending || toggleType.isPending}
            onCreateCategory={() => createCategory.mutate()}
            onCreateTag={() => createTag.mutate()}
            onCreateType={() => createType.mutate()}
            onSelectCategory={hydrateCategoryDrafts}
            onSelectTag={hydrateTagDrafts}
            onSelectType={hydrateTypeDrafts}
            onSetActiveDictionary={setActiveDictionary}
            onSaveCategory={() => updateCategory.mutate()}
            onSaveTag={() => updateTag.mutate()}
            onSaveType={() => updateType.mutate()}
            onToggleCategory={() => toggleCategory.mutate()}
            onToggleTag={() => toggleTag.mutate()}
            onToggleType={() => toggleType.mutate()}
            selectedCategoryId={selectedCategoryId}
            selectedTagId={selectedTagId}
            selectedTypeId={selectedTypeId}
            setCategoryKeyDraft={setCategoryKeyDraft}
            setCategoryName={setCategoryName}
            setCategoryNameDraft={setCategoryNameDraft}
            setSelectedCategoryId={setSelectedCategoryId}
            setSelectedTagId={setSelectedTagId}
            setSelectedTypeId={setSelectedTypeId}
            setTagName={setTagName}
            setTagNameDraft={setTagNameDraft}
            setTypeKeyDraft={setTypeKeyDraft}
            setTypeName={setTypeName}
            setTypeNameDraft={setTypeNameDraft}
            tagName={tagName}
            tagNameDraft={tagNameDraft}
            tags={tags}
            typeKeyDraft={typeKeyDraft}
            typeName={typeName}
            typeNameDraft={typeNameDraft}
            types={types}
          />
        </CardContent>
      </Card>
    </div>
  );
}
