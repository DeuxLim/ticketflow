export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ApiPaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type Workspace = {
  id: number;
  name: string;
  slug: string;
  owner_user_id: number;
};

export type Customer = {
  id: number;
  workspace_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  website: string | null;
  timezone: string | null;
  preferred_contact_method: string | null;
  preferred_language: string | null;
  address: string | null;
  external_reference: string | null;
  support_tier: string | null;
  status: string | null;
  internal_notes: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminDashboardStats = {
  users_count: number;
  workspaces_count: number;
  memberships_count: number;
  tickets_count: number;
  suspended_workspaces_count: number;
  maintenance_workspaces_count: number;
  dedicated_workspaces_count: number;
  stale_idp_certificates_count: number;
  failed_automation_executions_count: number;
  pending_break_glass_count: number;
};

export type AdminUser = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  is_platform_admin: boolean;
  created_at: string;
};

export type AdminWorkspace = {
  id: number;
  name: string;
  slug: string;
  owner_user_id: number;
  owner: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
  } | null;
  memberships_count: number;
  tickets_count: number;
  tenant_mode: 'shared' | 'dedicated';
  lifecycle_status: 'active' | 'suspended';
  maintenance_mode: boolean;
  usage_limits: Record<string, unknown>;
  feature_flags: Record<string, unknown>;
  created_at: string;
};

export type Ticket = {
  id: number;
  workspace_id: number;
  customer_id: number;
  created_by_user_id: number | null;
  assigned_to_user_id: number | null;
  ticket_number: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  first_response_due_at?: string | null;
  resolution_due_at?: string | null;
  first_responded_at?: string | null;
  resolved_at?: string | null;
  queue_key?: string | null;
  category?: string | null;
  tags?: string[];
  watchers?: TicketWatcher[];
  related_tickets?: TicketRelatedTicket[];
  checklist_items?: TicketChecklistItem[];
  custom_fields?: TicketCustomFieldValue[];
  state_summary?: TicketStateSummary;
  customer?: {
    id: number;
    name: string;
    email: string | null;
  } | null;
  assignee?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  creator?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at?: string;
  updated_at?: string;
};

export type TicketWatcher = {
  id: number;
  user_id: number;
  added_by_user_id: number | null;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
};

export type TicketRelatedTicket = {
  id: number;
  related_ticket_id: number;
  relationship_type: string;
  ticket: Pick<Ticket, 'id' | 'ticket_number' | 'title' | 'status' | 'priority'> | null;
  created_at: string;
};

export type TicketChecklistItem = {
  id: number;
  title: string;
  description: string | null;
  assigned_to_user_id: number | null;
  is_completed: boolean;
  completed_by_user_id: number | null;
  completed_at: string | null;
  sort_order: number;
  assignee?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_at: string;
  updated_at?: string;
};

export type SavedViewRecord = {
  id: number;
  name: string;
  filters: Record<string, unknown>;
  is_shared: boolean;
  created_by_user_id: number | null;
  created_at?: string;
};

export type TicketCustomFieldValue = {
  id: number;
  ticket_custom_field_id: number;
  key: string | null;
  label: string | null;
  field_type: TicketCustomFieldConfig['field_type'] | null;
  value: unknown;
  field: (Pick<TicketCustomFieldConfig, 'id' | 'key' | 'label' | 'field_type' | 'options' | 'is_required' | 'sort_order'>) | null;
  updated_at?: string;
};

export type TicketStateSummary = {
  sla: {
    status: 'on_track' | 'breached';
    first_response: { due_at: string | null; completed_at: string | null; is_breached: boolean };
    resolution: { due_at: string | null; completed_at: string | null; is_breached: boolean };
    breaches: Array<{ id: number; metric_type: string; breached_at: string }>;
  };
  approval: {
    pending_count: number;
    latest_status: string | null;
    requested_transition_to_status: string | null;
  };
  workflow: {
    current_status: string;
    available_transitions: Array<{
      id: number;
      to_status: string;
      requires_approval: boolean;
      required_permission: string | null;
    }>;
  };
  automation: {
    recent_count: number;
    last_event_type: string | null;
    last_status: string | null;
    last_executed_at: string | null;
  };
  assignment: {
    strategy: string;
    assignee_id: number | null;
    queue_key: string | null;
    category: string | null;
  };
};

export type TicketComment = {
  id: number;
  workspace_id: number;
  ticket_id: number;
  user_id: number | null;
  customer_id: number | null;
  body: string;
  is_internal: boolean;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  customer?: {
    id: number;
    name: string;
    email: string | null;
  } | null;
  created_at: string;
  updated_at?: string;
};

export type WorkspaceGeneralSettings = {
  workspace_id: number;
  name: string;
  slug: string;
  timezone: string;
  branding: {
    display_name?: string;
    support_email?: string;
    [key: string]: unknown;
  };
  business_profile: {
    summary?: string;
    [key: string]: unknown;
  };
  updated_at?: string;
};

export type WorkspaceTicketingSettings = {
  workspace_id: number;
  ticket_number_format: string;
  assignment_strategy: 'manual' | 'round_robin' | 'least_open_load';
  ticketing: {
    statuses?: string[];
    priorities?: string[];
    [key: string]: unknown;
  };
  updated_at?: string;
};

export type TicketQueueConfig = {
  id: number;
  workspace_id: number;
  key: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
};

export type TicketCategoryConfig = {
  id: number;
  workspace_id: number;
  key: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type TicketTagConfig = {
  id: number;
  workspace_id: number;
  name: string;
  color: string | null;
  description: string | null;
  is_active: boolean;
};

export type TicketTypeConfig = {
  id: number;
  workspace_id: number;
  key: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
};

export type TicketCustomFieldConfig = {
  id: number;
  workspace_id: number;
  key: string;
  label: string;
  field_type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date';
  options: unknown[];
  validation: Record<string, unknown>;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
};

export type TicketFormTemplateConfig = {
  id: number;
  workspace_id: number;
  ticket_type_id: number | null;
  name: string;
  field_schema: Array<Record<string, unknown>>;
  visibility_rules: Array<Record<string, unknown>>;
  required_rules: Array<Record<string, unknown>>;
  is_default: boolean;
  is_active: boolean;
  ticket_type?: {
    id: number;
    key: string;
    name: string;
  } | null;
};

export type WorkflowTransitionConfig = {
  id: number;
  ticket_workflow_id: number;
  from_status: string;
  to_status: string;
  required_permission: string | null;
  requires_approval: boolean;
  sort_order: number;
  approver_mode: 'role' | 'users' | null;
  approver_role_slug: string | null;
  approver_user_ids_json: number[] | null;
  approval_timeout_minutes: number | null;
};

export type TicketWorkflowConfig = {
  id: number;
  workspace_id: number;
  name: string;
  is_default: boolean;
  is_active: boolean;
  transitions: WorkflowTransitionConfig[];
};

export type AutomationRuleConfig = {
  id: number;
  workspace_id: number;
  name: string;
  event_type: string;
  priority: number;
  is_active: boolean;
};

export type AutomationExecutionLog = {
  id: number;
  event_type: string;
  status: 'applied' | 'skipped' | 'failed';
  error_message: string | null;
  executed_at: string;
  rule?: { id: number; name: string; event_type: string };
  ticket?: { id: number; ticket_number: string; title: string };
};

export type ApprovalRecord = {
  id: number;
  ticket_id: number;
  requested_transition_to_status: string | null;
  status: 'pending' | 'approved' | 'rejected';
  request_reason: string | null;
  decision_reason: string | null;
  created_at: string;
};

export type RetentionPolicyConfig = {
  id: number;
  workspace_id: number;
  tickets_days: number;
  comments_days: number;
  attachments_days: number;
  audit_days: number;
  purge_enabled: boolean;
};

export type SlaPolicyConfig = {
  id: number;
  workspace_id: number;
  business_calendar_id: number | null;
  name: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  first_response_minutes: number;
  resolution_minutes: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type TenantExportRecord = {
  id: number;
  workspace_id: number;
  status: string;
  download_token?: string | null;
  download_expires_at: string | null;
  created_at: string;
};

export type BreakGlassRecord = {
  id: number;
  workspace_id: number;
  status: string;
  reason: string;
  duration_minutes: number;
  approved_at: string | null;
  expires_at: string | null;
  created_at: string;
  approver_one_user_id?: number | null;
  approver_two_user_id?: number | null;
};

export type AuditEventRecord = {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string | null;
  actor_user_id: number | null;
  created_at: string;
};

export type TenantSecurityPolicyConfig = {
  id: number;
  workspace_id: number;
  require_sso: boolean;
  require_mfa: boolean;
  session_ttl_minutes: number;
  ip_allowlist: string[];
  tenant_mode: 'shared' | 'dedicated';
  dedicated_data_plane_key: string | null;
  feature_flags: Record<string, unknown>;
};

export type TenantIdentityProviderConfig = {
  id: number;
  workspace_id: number;
  provider_type: 'saml' | 'oidc';
  name: string;
  issuer: string | null;
  sso_url: string | null;
  authorization_url: string | null;
  token_url: string | null;
  userinfo_url: string | null;
  redirect_uri: string | null;
  metadata_url: string | null;
  x509_certificate: string | null;
  client_id: string | null;
  is_active: boolean;
  certificate_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProvisioningDirectoryRecord = {
  id: number;
  workspace_id: number;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WebhookEndpointRecord = {
  id: number;
  workspace_id: number;
  name: string;
  url: string;
  events: string | string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WebhookDeliveryRecord = {
  id: number;
  webhook_endpoint_id: number;
  integration_event_id: number;
  attempt_count: number;
  status: 'pending' | 'retrying' | 'delivered' | 'failed';
  response_status: number | null;
  response_body: string | null;
  next_attempt_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  endpoint?: {
    id: number;
    name: string;
    url: string;
  };
  event?: {
    id: number;
    event_type: string;
    occurred_at: string;
  };
};
