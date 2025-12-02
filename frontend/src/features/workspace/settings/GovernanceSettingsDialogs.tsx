import { SlaPolicyDialog } from './GovernanceOperationalDialogs';
import { SecurityPolicyDialog } from './GovernancePolicyDialogs';

type Priority = 'low' | 'medium' | 'high' | 'urgent';
type TenantMode = 'shared' | 'dedicated';

type Props = {
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
