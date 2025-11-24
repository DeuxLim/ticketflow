import { GovernanceIdentityProviderDialog } from './GovernanceIdentityProviderDialog';
import { BreakGlassRequestDialog, ScimDirectoryDialog, SlaPolicyDialog } from './GovernanceOperationalDialogs';
import { RetentionPolicyDialog, SecurityPolicyDialog } from './GovernancePolicyDialogs';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type ProviderType = 'saml' | 'oidc';
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
  requireSso: boolean;
  requireMfa: boolean;
  sessionTtl: number;
  tenantMode: TenantMode;
  dataPlaneKey: string;
  ipAllowlist: string;
  setRequireSsoDraft: (value: boolean) => void;
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

  isBreakGlassDialogOpen: boolean;
  onBreakGlassDialogOpenChange: (open: boolean) => void;
  breakGlassReason: string;
  setBreakGlassReason: (value: string) => void;
  onRequestBreakGlass: () => void;
  requestBreakGlassPending: boolean;

  isProviderDialogOpen: boolean;
  onProviderDialogOpenChange: (open: boolean) => void;
  providerType: ProviderType;
  providerName: string;
  providerIssuer: string;
  providerSsoUrl: string;
  providerAuthUrl: string;
  providerTokenUrl: string;
  providerRedirectUrl: string;
  providerClientId: string;
  providerClientSecret: string;
  setProviderType: (value: ProviderType) => void;
  setProviderName: (value: string) => void;
  setProviderIssuer: (value: string) => void;
  setProviderSsoUrl: (value: string) => void;
  setProviderAuthUrl: (value: string) => void;
  setProviderTokenUrl: (value: string) => void;
  setProviderRedirectUrl: (value: string) => void;
  setProviderClientId: (value: string) => void;
  setProviderClientSecret: (value: string) => void;
  onCreateProvider: () => void;
  createProviderPending: boolean;

  isDirectoryDialogOpen: boolean;
  onDirectoryDialogOpenChange: (open: boolean) => void;
  directoryName: string;
  setDirectoryName: (value: string) => void;
  onCreateDirectory: () => void;
  createDirectoryPending: boolean;
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
  requireSso,
  requireMfa,
  sessionTtl,
  tenantMode,
  dataPlaneKey,
  ipAllowlist,
  setRequireSsoDraft,
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
  isBreakGlassDialogOpen,
  onBreakGlassDialogOpenChange,
  breakGlassReason,
  setBreakGlassReason,
  onRequestBreakGlass,
  requestBreakGlassPending,
  isProviderDialogOpen,
  onProviderDialogOpenChange,
  providerType,
  providerName,
  providerIssuer,
  providerSsoUrl,
  providerAuthUrl,
  providerTokenUrl,
  providerRedirectUrl,
  providerClientId,
  providerClientSecret,
  setProviderType,
  setProviderName,
  setProviderIssuer,
  setProviderSsoUrl,
  setProviderAuthUrl,
  setProviderTokenUrl,
  setProviderRedirectUrl,
  setProviderClientId,
  setProviderClientSecret,
  onCreateProvider,
  createProviderPending,
  isDirectoryDialogOpen,
  onDirectoryDialogOpenChange,
  directoryName,
  setDirectoryName,
  onCreateDirectory,
  createDirectoryPending,
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
        requireSso={requireSso}
        saveError={saveSecurityPolicyError}
        savePending={saveSecurityPolicyPending}
        sessionTtl={sessionTtl}
        setDataPlaneKeyDraft={setDataPlaneKeyDraft}
        setIpAllowlistDraft={setIpAllowlistDraft}
        setRequireMfaDraft={setRequireMfaDraft}
        setRequireSsoDraft={setRequireSsoDraft}
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

      <BreakGlassRequestDialog
        breakGlassReason={breakGlassReason}
        isOpen={isBreakGlassDialogOpen}
        onOpenChange={onBreakGlassDialogOpenChange}
        onRequestBreakGlass={onRequestBreakGlass}
        requestBreakGlassPending={requestBreakGlassPending}
        setBreakGlassReason={setBreakGlassReason}
      />

      <GovernanceIdentityProviderDialog
        createProviderPending={createProviderPending}
        isOpen={isProviderDialogOpen}
        onCreateProvider={onCreateProvider}
        onOpenChange={onProviderDialogOpenChange}
        providerAuthUrl={providerAuthUrl}
        providerClientId={providerClientId}
        providerClientSecret={providerClientSecret}
        providerIssuer={providerIssuer}
        providerName={providerName}
        providerRedirectUrl={providerRedirectUrl}
        providerSsoUrl={providerSsoUrl}
        providerTokenUrl={providerTokenUrl}
        providerType={providerType}
        setProviderAuthUrl={setProviderAuthUrl}
        setProviderClientId={setProviderClientId}
        setProviderClientSecret={setProviderClientSecret}
        setProviderIssuer={setProviderIssuer}
        setProviderName={setProviderName}
        setProviderRedirectUrl={setProviderRedirectUrl}
        setProviderSsoUrl={setProviderSsoUrl}
        setProviderTokenUrl={setProviderTokenUrl}
        setProviderType={setProviderType}
      />

      <ScimDirectoryDialog
        createDirectoryPending={createDirectoryPending}
        directoryName={directoryName}
        isOpen={isDirectoryDialogOpen}
        onCreateDirectory={onCreateDirectory}
        onOpenChange={onDirectoryDialogOpenChange}
        setDirectoryName={setDirectoryName}
      />
    </>
  );
}
