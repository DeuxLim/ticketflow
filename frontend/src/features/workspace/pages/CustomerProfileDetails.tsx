import type { ReactNode } from 'react';
import type { Customer } from '@/types/api';

export function CustomerProfileDetails({ customer }: { customer: Customer }) {
  return (
    <div className="grid gap-4">
      <DetailSection title="Identity">
        <DetailItem label="Name" value={customer.name} />
        <DetailItem label="Email" value={customer.email} />
        <DetailItem label="Phone" value={customer.phone} />
        <DetailItem label="Job title" value={customer.job_title} />
      </DetailSection>

      <DetailSection title="Account">
        <DetailItem label="Company" value={customer.company} />
        <DetailItem label="Website" value={customer.website} />
        <DetailItem label="External reference" value={customer.external_reference} />
        <DetailItem label="Address" value={customer.address} wide />
      </DetailSection>

      <DetailSection title="Preferences">
        <DetailItem label="Preferred contact" value={customer.preferred_contact_method} />
        <DetailItem label="Timezone" value={customer.timezone} />
        <DetailItem label="Preferred language" value={customer.preferred_language} />
      </DetailSection>

      <DetailSection title="Support">
        <DetailItem label="Support tier" value={customer.support_tier} />
        <DetailItem label="Lifecycle status" value={customer.status} />
        <DetailItem label="Internal notes" value={customer.internal_notes} wide />
      </DetailSection>
    </div>
  );
}

function DetailSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2">
      <h3 className="text-sm font-medium md:col-span-2">{title}</h3>
      {children}
    </div>
  );
}

function DetailItem({ label, value, wide = false }: { label: string; value: string | null | undefined; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value || '—'}</p>
    </div>
  );
}
