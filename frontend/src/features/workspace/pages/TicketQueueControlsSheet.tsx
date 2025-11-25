import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { SavedViewRecord } from '@/types/api';
import type { TicketForm } from '@/features/workspace/pages/ticketForm';

type MemberOption = {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
};

type QueueOption = { id: number; key: string; name: string };
type CategoryOption = { id: number; key: string; name: string };
type CustomerOption = { id: number; name: string };

type TicketQueueControlsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSavedViewId: string;
  onSelectedSavedViewIdChange: (value: string) => void;
  savedViews: SavedViewRecord[];
  applySavedFilters: (filters: Record<string, unknown>) => void;
  savedViewName: string;
  onSavedViewNameChange: (value: string) => void;
  savedViewShared: boolean;
  onSavedViewSharedChange: (value: boolean) => void;
  canSaveView: boolean;
  canManage: boolean;
  saveViewPending: boolean;
  onSaveView: () => void;
  removeSavedViewPending: boolean;
  onRemoveSavedView: (viewId: number) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  queueFilter: string;
  onQueueFilterChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  customerFilter: string;
  onCustomerFilterChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  activeQueueConfigs: QueueOption[];
  activeCategoryConfigs: CategoryOption[];
  customers: CustomerOption[];
  customerCoverageHint: string | null;
  members: MemberOption[];
  bulkStatus: 'none' | TicketForm['status'];
  onBulkStatusChange: (value: 'none' | TicketForm['status']) => void;
  bulkPriority: 'none' | TicketForm['priority'];
  onBulkPriorityChange: (value: 'none' | TicketForm['priority']) => void;
  bulkAssignee: string;
  onBulkAssigneeChange: (value: string) => void;
  selectedVisibleTicketIdsCount: number;
  bulkUpdatePending: boolean;
  onBulkApply: () => void;
  onResetControls: () => void;
};

export function TicketQueueControlsSheet({
  open,
  onOpenChange,
  selectedSavedViewId,
  onSelectedSavedViewIdChange,
  savedViews,
  applySavedFilters,
  savedViewName,
  onSavedViewNameChange,
  savedViewShared,
  onSavedViewSharedChange,
  canSaveView,
  canManage,
  saveViewPending,
  onSaveView,
  removeSavedViewPending,
  onRemoveSavedView,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  queueFilter,
  onQueueFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  customerFilter,
  onCustomerFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  activeQueueConfigs,
  activeCategoryConfigs,
  customers,
  customerCoverageHint,
  members,
  bulkStatus,
  onBulkStatusChange,
  bulkPriority,
  onBulkPriorityChange,
  bulkAssignee,
  onBulkAssigneeChange,
  selectedVisibleTicketIdsCount,
  bulkUpdatePending,
  onBulkApply,
  onResetControls,
}: TicketQueueControlsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Views, Filters, and Bulk Actions</SheetTitle>
          <SheetDescription>Use this panel for queue shaping and multi-ticket changes without crowding the list.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 px-4 pb-4">
          <div className="rounded-md border p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="saved-view-select">Saved view</FieldLabel>
                <Select value={selectedSavedViewId} onValueChange={(value) => {
                  const next = value ?? 'none';
                  onSelectedSavedViewIdChange(next);
                  if (next === 'none') return;
                  const selected = savedViews.find((view) => String(view.id) === next);
                  if (selected) {
                    applySavedFilters(selected.filters);
                  }
                }}>
                  <SelectTrigger id="saved-view-select"><SelectValue placeholder="Select a saved view" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">None</SelectItem>
                      {savedViews.map((view) => (
                        <SelectItem key={view.id} value={String(view.id)}>
                          {view.name}{view.is_shared ? ' (shared)' : ''}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>Apply a saved queue setup or capture the current filter combination as a reusable view.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="saved-view-name">New view name</FieldLabel>
                <Input
                  id="saved-view-name"
                  value={savedViewName}
                  onChange={(event) => onSavedViewNameChange(event.target.value)}
                  placeholder="My open high-priority tickets"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={savedViewShared}
                  onChange={(event) => onSavedViewSharedChange(event.target.checked)}
                  type="checkbox"
                />
                <span>Make this saved view shared</span>
              </label>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  disabled={!canSaveView || saveViewPending}
                  onClick={onSaveView}
                >
                  {saveViewPending ? 'Saving...' : 'Save current filters'}
                </Button>

                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  disabled={selectedSavedViewId === 'none' || removeSavedViewPending}
                  onClick={() => {
                    if (selectedSavedViewId === 'none') return;
                    onRemoveSavedView(Number(selectedSavedViewId));
                  }}
                >
                  {removeSavedViewPending ? 'Deleting...' : 'Delete view'}
                </Button>
              </div>
            </FieldGroup>
          </div>

          <div className="rounded-md border p-4">
            <FieldGroup>
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="status-filter">Status</FieldLabel>
                <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value ?? 'all')}>
                  <SelectTrigger className="w-full" id="status-filter"><SelectValue placeholder="All status" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="priority-filter">Priority</FieldLabel>
                <Select value={priorityFilter} onValueChange={(value) => onPriorityFilterChange(value ?? 'all')}>
                  <SelectTrigger className="w-full" id="priority-filter"><SelectValue placeholder="All priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="queue-filter">Queue</FieldLabel>
                <Select value={queueFilter} onValueChange={(value) => onQueueFilterChange(value ?? 'all')}>
                  <SelectTrigger className="w-full" id="queue-filter"><SelectValue placeholder="All queues" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All queues</SelectItem>
                      {activeQueueConfigs.map((queue) => (
                        <SelectItem key={queue.id} value={queue.key}>
                          {queue.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="category-filter">Category</FieldLabel>
                <Select value={categoryFilter} onValueChange={(value) => onCategoryFilterChange(value ?? 'all')}>
                  <SelectTrigger className="w-full" id="category-filter"><SelectValue placeholder="All categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All categories</SelectItem>
                      {activeCategoryConfigs.map((category) => (
                        <SelectItem key={category.id} value={category.key}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="customer-filter">Customer</FieldLabel>
                <Select value={customerFilter} onValueChange={(value) => onCustomerFilterChange(value ?? 'all')}>
                  <SelectTrigger className="w-full" id="customer-filter"><SelectValue placeholder="All customers" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All customers</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {customerCoverageHint && (
                  <FieldDescription>{customerCoverageHint}</FieldDescription>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="assignee-filter">Assignee</FieldLabel>
                <Select value={assigneeFilter} onValueChange={(value) => onAssigneeFilterChange(value ?? 'all')}>
                  <SelectTrigger className="w-full" id="assignee-filter"><SelectValue placeholder="All assignees" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.user.id} value={String(member.user.id)}>
                          {member.user.first_name} {member.user.last_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
          </div>

          <div className="rounded-md border p-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="bulk-status">Bulk status</FieldLabel>
                <Select value={bulkStatus} onValueChange={(value) => onBulkStatusChange((value ?? 'none') as 'none' | TicketForm['status'])}>
                  <SelectTrigger className="w-full" id="bulk-status"><SelectValue placeholder="Keep status" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Keep status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="bulk-priority">Bulk priority</FieldLabel>
                <Select value={bulkPriority} onValueChange={(value) => onBulkPriorityChange((value ?? 'none') as 'none' | TicketForm['priority'])}>
                  <SelectTrigger className="w-full" id="bulk-priority"><SelectValue placeholder="Keep priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Keep priority</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="bulk-assignee">Bulk assignee</FieldLabel>
                <Select value={bulkAssignee} onValueChange={(value) => onBulkAssigneeChange(value ?? 'none')}>
                  <SelectTrigger className="w-full" id="bulk-assignee"><SelectValue placeholder="Keep assignee" /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="none">Keep assignee</SelectItem>
                      <SelectItem value="">Unassigned</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.user.id} value={String(member.user.id)}>
                          {member.user.first_name} {member.user.last_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {selectedVisibleTicketIdsCount > 0
                    ? `${selectedVisibleTicketIdsCount} visible ticket${selectedVisibleTicketIdsCount === 1 ? '' : 's'} selected.`
                    : 'Select tickets in the list before applying a bulk edit.'}
                </FieldDescription>
              </Field>

              <Button
                disabled={
                  !canManage ||
                  selectedVisibleTicketIdsCount === 0 ||
                  (bulkStatus === 'none' && bulkPriority === 'none' && bulkAssignee === 'none') ||
                  bulkUpdatePending
                }
                onClick={onBulkApply}
                size="sm"
                type="button"
              >
                {bulkUpdatePending ? 'Applying...' : `Apply to ${selectedVisibleTicketIdsCount}`}
              </Button>
            </FieldGroup>
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button onClick={onResetControls} type="button" variant="outline">
            Reset controls
          </Button>
          <Button onClick={() => onOpenChange(false)} type="button">
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
