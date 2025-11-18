import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { CustomerForm } from './customerForm';

const emptySelectValue = '__none__';
const contactMethods = ['email', 'phone', 'portal', 'sms'] as const;
const supportTiers = ['standard', 'priority', 'enterprise', 'strategic'] as const;
const lifecycleStatuses = ['active', 'onboarding', 'at_risk', 'inactive'] as const;

export function CustomerFormFields({
  form,
  formId,
}: {
  form: UseFormReturn<CustomerForm>;
  formId: string;
}) {
  const { formState, register, setValue, watch } = form;
  const errors = formState.errors;

  return (
    <>
      <FormSection title="Identity">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor={`${formId}-name`}>Customer name</FieldLabel>
          <Input id={`${formId}-name`} {...register('name')} />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor={`${formId}-email`}>Email address</FieldLabel>
          <Input id={`${formId}-email`} type="email" placeholder="ops@acme.com" {...register('email')} />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-phone`}>Phone</FieldLabel>
          <Input id={`${formId}-phone`} placeholder="+63 917 000 0000" {...register('phone')} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-job-title`}>Job title</FieldLabel>
          <Input id={`${formId}-job-title`} placeholder="Operations Lead" {...register('job_title')} />
        </Field>
      </FormSection>

      <FormSection title="Account">
        <Field>
          <FieldLabel htmlFor={`${formId}-company`}>Company</FieldLabel>
          <Input id={`${formId}-company`} placeholder="Acme Inc." {...register('company')} />
        </Field>

        <Field data-invalid={Boolean(errors.website)}>
          <FieldLabel htmlFor={`${formId}-website`}>Website</FieldLabel>
          <Input id={`${formId}-website`} placeholder="https://acme.com" {...register('website')} />
          <FieldError errors={[errors.website]} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-external-reference`}>External reference</FieldLabel>
          <Input id={`${formId}-external-reference`} placeholder="CRM-1001" {...register('external_reference')} />
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-address`}>Address</FieldLabel>
          <Textarea id={`${formId}-address`} placeholder="Customer billing or office address" {...register('address')} />
        </Field>
      </FormSection>

      <FormSection title="Preferences">
        <Field>
          <FieldLabel htmlFor={`${formId}-preferred-contact-method`}>Preferred contact</FieldLabel>
          <Select
            value={watch('preferred_contact_method') || emptySelectValue}
            onValueChange={(value) => setValue('preferred_contact_method', value === emptySelectValue ? '' : (value ?? ''))}
          >
            <SelectTrigger id={`${formId}-preferred-contact-method`} className="w-full">
              <SelectValue placeholder="Select contact method" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptySelectValue}>Not set</SelectItem>
                {contactMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-timezone`}>Timezone</FieldLabel>
          <Input id={`${formId}-timezone`} placeholder="Asia/Manila" {...register('timezone')} />
          <FieldDescription>Use an IANA timezone such as Asia/Manila.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-preferred-language`}>Preferred language</FieldLabel>
          <Input id={`${formId}-preferred-language`} placeholder="English" {...register('preferred_language')} />
        </Field>
      </FormSection>

      <FormSection title="Support">
        <Field>
          <FieldLabel htmlFor={`${formId}-support-tier`}>Support tier</FieldLabel>
          <Select
            value={watch('support_tier') || emptySelectValue}
            onValueChange={(value) => setValue('support_tier', value === emptySelectValue ? '' : (value ?? ''))}
          >
            <SelectTrigger id={`${formId}-support-tier`} className="w-full">
              <SelectValue placeholder="Select support tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptySelectValue}>Not set</SelectItem>
                {supportTiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${formId}-status`}>Lifecycle status</FieldLabel>
          <Select
            value={watch('status') || emptySelectValue}
            onValueChange={(value) => setValue('status', value === emptySelectValue ? '' : (value ?? ''))}
          >
            <SelectTrigger id={`${formId}-status`} className="w-full">
              <SelectValue placeholder="Select lifecycle status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={emptySelectValue}>Not set</SelectItem>
                {lifecycleStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field className="md:col-span-2">
          <FieldLabel htmlFor={`${formId}-internal-notes`}>Internal notes</FieldLabel>
          <Textarea id={`${formId}-internal-notes`} placeholder="Private support context for workspace operators" {...register('internal_notes')} />
          <FieldDescription>Internal only. These notes are not used in ticket selectors.</FieldDescription>
        </Field>
      </FormSection>
    </>
  );
}

function FormSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
      <h3 className="text-sm font-medium md:col-span-2">{title}</h3>
      {children}
    </div>
  );
}
