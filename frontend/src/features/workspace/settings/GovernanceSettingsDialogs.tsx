import { SlaPolicyDialog } from './GovernanceOperationalDialogs';
import { RetentionPolicyDialog, SecurityPolicyDialog } from './GovernancePolicyDialogs';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TenantMode = 'shared' | 'dedicated';

type Props = {
  isRetentionDialogOpen: boolean;
  onRetentionDialogOpenChange: (open: boolean) => void;
  ticketsDays: number;
  commentsDays: number;
  attachmentsDays: number;
  auditDays: number;
  setTicketsDaysDraft: (value: number) => void;
  setCommentsDaysDraft: (value: number) => void;
  setAttachmentsDaysDraft: (value: number) => void;
  setAuditDaysDraft: (value: number) => void;
  onSaveRetention: () => void;
  saveRetentionPending: boolean;
  saveRetentionError: string | null;

  isSecurityPolicyDialogOpen: boolean;
  onSecurityPolicyDialogOpenChange: (open: boolean) => void;
  requireMfa: boolean;
  sessionTtl: number;
  tenantMode: TenantMode;
  dataPlaneKey: string;
  ipAllowlist: string;
  setRequireMfaDraft: (value: boolean) => void;
  setSessionTtlDraft: (value: number) => void;
  setTenantModeDraft: (value: TenantMode) => void;
  setDataPlaneKeyDraft: (value: string) => void;
  setIpAllowlistDraft: (value: string) => void;
  onSaveSecurityPolicy: () => void;
  saveSecurityPolicyPending: boolean;
  saveSecurityPolicyError: string | null;

  isSlaDialogOpen: boolean;
  onSlaDialogOpenChange: (open: boolean) => void;
  slaName: string;
  slaPriority: Priority;
  slaFirstResponseMinutes: number;
  slaResolutionMinutes: number;
  setSlaName: (value: string) => void;
  setSlaPriority: (value: Priority) => void;
  setSlaFirstResponseMinutes: (value: number) => void;
  setSlaResolutionMinutes: (value: number) => void;
  onCreateSlaPolicy: () => void;
  createSlaPolicyPending: boolean;
};

export function GovernanceSettingsDialogs({
  isRetentionDialogOpen,
  onRetentionDialogOpenChange,
  ticketsDays,
  commentsDays,
  attachmentsDays,
  auditDays,
  setTicketsDaysDraft,
  setCommentsDaysDraft,
  setAttachmentsDaysDraft,
  setAuditDaysDraft,
  onSaveRetention,
  saveRetentionPending,
  saveRetentionError,
  isSecurityPolicyDialogOpen,
  onSecurityPolicyDialogOpenChange,
  requireMfa,
  sessionTtl,
  tenantMode,
  dataPlaneKey,
  ipAllowlist,
  setRequireMfaDraft,
  setSessionTtlDraft,
  setTenantModeDraft,
  setDataPlaneKeyDraft,
  setIpAllowlistDraft,
  onSaveSecurityPolicy,
  saveSecurityPolicyPending,
  saveSecurityPolicyError,
  isSlaDialogOpen,
  onSlaDialogOpenChange,
  slaName,
  slaPriority,
  slaFirstResponseMinutes,
  slaResolutionMinutes,
  setSlaName,
  setSlaPriority,
  setSlaFirstResponseMinutes,
  setSlaResolutionMinutes,
  onCreateSlaPolicy,
  createSlaPolicyPending,
}: Props) {
  return (
    <>
      <RetentionPolicyDialog
        auditDays={auditDays}
        attachmentsDays={attachmentsDays}
        commentsDays={commentsDays}
        isOpen={isRetentionDialogOpen}
        onOpenChange={onRetentionDialogOpenChange}
        onSave={onSaveRetention}
        saveError={saveRetentionError}
        savePending={saveRetentionPending}
        setAttachmentsDaysDraft={setAttachmentsDaysDraft}
        setAuditDaysDraft={setAuditDaysDraft}
        setCommentsDaysDraft={setCommentsDaysDraft}
        setTicketsDaysDraft={setTicketsDaysDraft}
        ticketsDays={ticketsDays}
      />

      <SecurityPolicyDialog
        dataPlaneKey={dataPlaneKey}
        ipAllowlist={ipAllowlist}
        isOpen={isSecurityPolicyDialogOpen}
        onOpenChange={onSecurityPolicyDialogOpenChange}
        onSave={onSaveSecurityPolicy}
        requireMfa={requireMfa}
        saveError={saveSecurityPolicyError}
        savePending={saveSecurityPolicyPending}
        sessionTtl={sessionTtl}
        setDataPlaneKeyDraft={setDataPlaneKeyDraft}
        setIpAllowlistDraft={setIpAllowlistDraft}
        setRequireMfaDraft={setRequireMfaDraft}
        setSessionTtlDraft={setSessionTtlDraft}
        setTenantModeDraft={setTenantModeDraft}
        tenantMode={tenantMode}
      />

      <SlaPolicyDialog
        createSlaPolicyPending={createSlaPolicyPending}
        isOpen={isSlaDialogOpen}
        onCreateSlaPolicy={onCreateSlaPolicy}
        onOpenChange={onSlaDialogOpenChange}
        setSlaFirstResponseMinutes={setSlaFirstResponseMinutes}
        setSlaName={setSlaName}
        setSlaPriority={setSlaPriority}
        setSlaResolutionMinutes={setSlaResolutionMinutes}
        slaFirstResponseMinutes={slaFirstResponseMinutes}
        slaName={slaName}
        slaPriority={slaPriority}
        slaResolutionMinutes={slaResolutionMinutes}
      />
    </>
  );
}
