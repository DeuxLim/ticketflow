import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TicketCategoryConfig, TicketTagConfig, TicketTypeConfig } from '@/types/api';

export type DictionaryKind = 'categories' | 'types' | 'tags';

type TicketingDictionaryDialogsProps = {
  activeDictionary: DictionaryKind | null;
  categories: TicketCategoryConfig[];
  categoryKeyDraft: string;
  categoryName: string;
  categoryNameDraft: string;
  dictionaryError: string | null;
  isCreatingCategory: boolean;
  isCreatingTag: boolean;
  isCreatingType: boolean;
  isSavingCategory: boolean;
  isSavingTag: boolean;
  isSavingType: boolean;
  onCreateCategory: () => void;
  onCreateTag: () => void;
  onCreateType: () => void;
  onSelectCategory: (id: string) => void;
  onSelectTag: (id: string) => void;
  onSelectType: (id: string) => void;
  onSetActiveDictionary: (value: DictionaryKind | null) => void;
  onSaveCategory: () => void;
  onSaveTag: () => void;
  onSaveType: () => void;
  onToggleCategory: () => void;
  onToggleTag: () => void;
  onToggleType: () => void;
  selectedCategoryId: string;
  selectedTagId: string;
  selectedTypeId: string;
  setCategoryKeyDraft: (value: string) => void;
  setCategoryName: (value: string) => void;
  setCategoryNameDraft: (value: string) => void;
  setSelectedCategoryId: (value: string) => void;
  setSelectedTagId: (value: string) => void;
  setSelectedTypeId: (value: string) => void;
  setTagName: (value: string) => void;
  setTagNameDraft: (value: string) => void;
  setTypeKeyDraft: (value: string) => void;
  setTypeName: (value: string) => void;
  setTypeNameDraft: (value: string) => void;
  tagName: string;
  tagNameDraft: string;
  tags: TicketTagConfig[];
  typeKeyDraft: string;
  typeName: string;
  typeNameDraft: string;
  types: TicketTypeConfig[];
};

export function TicketingDictionaryDialogs({
  activeDictionary,
  categories,
  categoryKeyDraft,
  categoryName,
  categoryNameDraft,
  dictionaryError,
  isCreatingCategory,
  isCreatingTag,
  isCreatingType,
  isSavingCategory,
  isSavingTag,
  isSavingType,
  onCreateCategory,
  onCreateTag,
  onCreateType,
  onSelectCategory,
  onSelectTag,
  onSelectType,
  onSetActiveDictionary,
  onSaveCategory,
  onSaveTag,
  onSaveType,
  onToggleCategory,
  onToggleTag,
  onToggleType,
  selectedCategoryId,
  selectedTagId,
  selectedTypeId,
  setCategoryKeyDraft,
  setCategoryName,
  setCategoryNameDraft,
  setSelectedCategoryId,
  setSelectedTagId,
  setSelectedTypeId,
  setTagName,
  setTagNameDraft,
  setTypeKeyDraft,
  setTypeName,
  setTypeNameDraft,
  tagName,
  tagNameDraft,
  tags,
  typeKeyDraft,
  typeName,
  typeNameDraft,
  types,
}: TicketingDictionaryDialogsProps) {
  return (
    <>
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
          onOpen={() => onSetActiveDictionary('categories')}
          total={categories.length}
        />
        <DictionarySummary
          description="Intake and template grouping."
          label="Ticket types"
          onOpen={() => onSetActiveDictionary('types')}
          total={types.length}
        />
        <DictionarySummary
          description="Lightweight ticket markers."
          label="Tags"
          onOpen={() => onSetActiveDictionary('tags')}
          total={tags.length}
        />
      </div>

      <Dialog open={activeDictionary === 'categories'} onOpenChange={(open) => onSetActiveDictionary(open ? 'categories' : null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>Create or update ticket categories without crowding the settings overview.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <InlineCreate label="Category" value={categoryName} onChange={setCategoryName} onSubmit={onCreateCategory} disabled={!categoryName || isCreatingCategory} />
            <DictionaryEditor
              title="Categories"
              rows={categories}
              selectedId={selectedCategoryId}
              setSelectedId={setSelectedCategoryId}
              nameDraft={categoryNameDraft}
              setNameDraft={setCategoryNameDraft}
              keyDraft={categoryKeyDraft}
              setKeyDraft={setCategoryKeyDraft}
              onSelect={onSelectCategory}
              onSave={onSaveCategory}
              onToggle={onToggleCategory}
              isSaving={isSavingCategory}
              errorMessage={dictionaryError}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDictionary === 'types'} onOpenChange={(open) => onSetActiveDictionary(open ? 'types' : null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Ticket Types</DialogTitle>
            <DialogDescription>Create or update intake types used by templates and routing.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <InlineCreate label="Ticket type" value={typeName} onChange={setTypeName} onSubmit={onCreateType} disabled={!typeName || isCreatingType} />
            <DictionaryEditor
              title="Ticket types"
              rows={types}
              selectedId={selectedTypeId}
              setSelectedId={setSelectedTypeId}
              nameDraft={typeNameDraft}
              setNameDraft={setTypeNameDraft}
              keyDraft={typeKeyDraft}
              setKeyDraft={setTypeKeyDraft}
              onSelect={onSelectType}
              onSave={onSaveType}
              onToggle={onToggleType}
              isSaving={isSavingType}
              errorMessage={dictionaryError}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDictionary === 'tags'} onOpenChange={(open) => onSetActiveDictionary(open ? 'tags' : null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>Create or update lightweight tags used to mark and filter tickets.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <InlineCreate label="Tag" value={tagName} onChange={setTagName} onSubmit={onCreateTag} disabled={!tagName || isCreatingTag} />
            <DictionaryEditor
              title="Tags"
              rows={tags}
              selectedId={selectedTagId}
              setSelectedId={setSelectedTagId}
              nameDraft={tagNameDraft}
              setNameDraft={setTagNameDraft}
              onSelect={onSelectTag}
              onSave={onSaveTag}
              onToggle={onToggleTag}
              isSaving={isSavingTag}
              errorMessage={dictionaryError}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type DictionaryEditorProps<T extends { id: number; name: string; is_active: boolean }> = {
  errorMessage: string | null;
  isSaving: boolean;
  keyDraft?: string;
  nameDraft: string;
  onSave: () => void;
  onSelect: (id: string) => void;
  onToggle: () => void;
  rows: T[];
  selectedId: string;
  setKeyDraft?: (value: string) => void;
  setNameDraft: (value: string) => void;
  setSelectedId: (value: string) => void;
  title: string;
};

function DictionaryEditor<T extends { id: number; name: string; is_active: boolean }>(props: DictionaryEditorProps<T>) {
  const {
    errorMessage,
    isSaving,
    keyDraft,
    nameDraft,
    onSave,
    onSelect,
    onToggle,
    rows,
    selectedId,
    setKeyDraft,
    setNameDraft,
    setSelectedId,
    title,
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
  disabled,
  label,
  onChange,
  onSubmit,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
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
