// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowAutomationSettingsSection } from './WorkflowAutomationSettingsSection';
import {
  activateWorkflow,
  approveApproval,
  createAutomationRule,
  createWorkflow,
  listApprovals,
  listAutomationExecutions,
  listAutomationRules,
  listWorkflows,
  rejectApproval,
  simulateWorkflowTransition,
  testAutomationRule,
  toggleAutomationRule,
  updateAutomationRule,
  updateWorkflow,
} from './settings-api';
import { apiRequest } from '@/services/api/client';

vi.mock('./settings-api', () => ({
  activateWorkflow: vi.fn(),
  approveApproval: vi.fn(),
  createAutomationRule: vi.fn(),
  createWorkflow: vi.fn(),
  listApprovals: vi.fn(),
  listAutomationExecutions: vi.fn(),
  listAutomationRules: vi.fn(),
  listWorkflows: vi.fn(),
  rejectApproval: vi.fn(),
  simulateWorkflowTransition: vi.fn(),
  testAutomationRule: vi.fn(),
  toggleAutomationRule: vi.fn(),
  updateAutomationRule: vi.fn(),
  updateWorkflow: vi.fn(),
}));

vi.mock('@/services/api/client', () => ({
  apiRequest: vi.fn(),
}));

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

function getEnabledButtonByName(name: string): HTMLButtonElement {
  const button = screen
    .getAllByRole('button', { name })
    .find((item) => !item.hasAttribute('disabled'));

  if (!button) {
    throw new Error(`No enabled button found with name: ${name}`);
  }

  return button as HTMLButtonElement;
}

describe('WorkflowAutomationSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listWorkflows).mockResolvedValue({ data: [] } as never);
    vi.mocked(listAutomationRules).mockResolvedValue({ data: [] } as never);
    vi.mocked(listApprovals).mockResolvedValue({ data: [] } as never);
    vi.mocked(listAutomationExecutions).mockResolvedValue({ data: [] } as never);
    vi.mocked(apiRequest).mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } } as never);
    vi.mocked(createWorkflow).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(simulateWorkflowTransition).mockResolvedValue({
      data: {
        allowed: true,
        reason: null,
        requires_approval: false,
        required_permission: 'tickets.manage',
        approver_mode: null,
        approval_timeout_minutes: null,
      },
    } as never);
    vi.mocked(createAutomationRule).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(updateWorkflow).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(updateAutomationRule).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(toggleAutomationRule).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(testAutomationRule).mockResolvedValue({ data: { matched: true } } as never);
    vi.mocked(activateWorkflow).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(approveApproval).mockResolvedValue({ data: { id: 1 } } as never);
    vi.mocked(rejectApproval).mockResolvedValue({ data: { id: 1 } } as never);
  });

  it('creates a workflow using form inputs', async () => {
    renderWithQueryClient(<WorkflowAutomationSettingsSection workspaceSlug="acme" />);

    fireEvent.change(screen.getByPlaceholderText('Workflow name'), { target: { value: 'Escalation Flow' } });
    fireEvent.change(screen.getByPlaceholderText('From status'), { target: { value: 'open' } });
    fireEvent.change(screen.getByPlaceholderText('To status'), { target: { value: 'in_progress' } });
    fireEvent.click(getEnabledButtonByName('Create workflow'));

    await waitFor(() => {
      expect(createWorkflow).toHaveBeenCalledWith('acme', expect.objectContaining({
        name: 'Escalation Flow',
      }));
    });
  });

  it('simulates a workflow transition and shows result', async () => {
    renderWithQueryClient(<WorkflowAutomationSettingsSection workspaceSlug="acme" />);

    const ticketIdInputs = screen.getAllByPlaceholderText('Ticket ID');
    fireEvent.change(ticketIdInputs[0], { target: { value: '123' } });
    const targetStatusInputs = screen.getAllByPlaceholderText('Target status');
    fireEvent.change(targetStatusInputs[0], { target: { value: 'resolved' } });
    fireEvent.click(getEnabledButtonByName('Simulate transition'));

    await waitFor(() => {
      expect(simulateWorkflowTransition).toHaveBeenCalledWith('acme', 123, 'resolved');
    });

    await waitFor(() => {
      expect(screen.getByText('Allowed: yes')).not.toBeNull();
    });
  });
});
