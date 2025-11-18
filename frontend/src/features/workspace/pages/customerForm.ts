import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { type CustomerPayload } from '@/features/workspace/api/customerApi';
import { ApiError } from '@/services/api/client';
import type { Customer } from '@/types/api';

export const customerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  company: z.string().optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  website: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  preferred_contact_method: z.string().optional(),
  preferred_language: z.string().optional(),
  address: z.string().optional(),
  external_reference: z.string().optional(),
  support_tier: z.string().optional(),
  status: z.string().optional(),
  internal_notes: z.string().optional(),
});

export type CustomerForm = z.infer<typeof customerSchema>;

export const emptyCustomerForm: CustomerForm = {
  name: '',
  email: '',
  company: '',
  phone: '',
  job_title: '',
  website: '',
  timezone: '',
  preferred_contact_method: '',
  preferred_language: '',
  address: '',
  external_reference: '',
  support_tier: '',
  status: '',
  internal_notes: '',
};

const customerFormFields = Object.keys(emptyCustomerForm) as Array<keyof CustomerForm>;

function nullable(value?: string): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
}

export function customerToForm(customer: Customer): CustomerForm {
  return {
    name: customer.name,
    email: customer.email ?? '',
    company: customer.company ?? '',
    phone: customer.phone ?? '',
    job_title: customer.job_title ?? '',
    website: customer.website ?? '',
    timezone: customer.timezone ?? '',
    preferred_contact_method: customer.preferred_contact_method ?? '',
    preferred_language: customer.preferred_language ?? '',
    address: customer.address ?? '',
    external_reference: customer.external_reference ?? '',
    support_tier: customer.support_tier ?? '',
    status: customer.status ?? '',
    internal_notes: customer.internal_notes ?? '',
  };
}

export function formToCustomerPayload(values: CustomerForm): CustomerPayload {
  return {
    name: values.name,
    email: nullable(values.email),
    company: nullable(values.company),
    phone: nullable(values.phone),
    job_title: nullable(values.job_title),
    website: nullable(values.website),
    timezone: nullable(values.timezone),
    preferred_contact_method: nullable(values.preferred_contact_method),
    preferred_language: nullable(values.preferred_language),
    address: nullable(values.address),
    external_reference: nullable(values.external_reference),
    support_tier: nullable(values.support_tier),
    status: nullable(values.status),
    internal_notes: nullable(values.internal_notes),
  };
}

export function applyCustomerFormFieldErrors(form: UseFormReturn<CustomerForm>, error: unknown) {
  if (!(error instanceof ApiError)) return;

  for (const [field, messages] of Object.entries(error.fieldErrors)) {
    if (!messages.length) continue;

    const customerField = field as keyof CustomerForm;
    if (customerFormFields.includes(customerField)) {
      form.setError(customerField, { type: 'server', message: messages[0] });
    }
  }
}
