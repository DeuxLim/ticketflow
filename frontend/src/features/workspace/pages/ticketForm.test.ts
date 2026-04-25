import { describe, expect, it } from 'vitest';
import {
  buildCustomFieldPayload,
  filterCustomFieldsByTemplate,
  parseTicketTags,
} from '@/features/workspace/pages/ticketForm';
import type { TicketCustomFieldConfig, TicketFormTemplateConfig } from '@/types/api';

describe('ticketForm helpers', () => {
  it('parses ticket tags into trimmed values', () => {
    expect(parseTicketTags(' vip, billing , , escalation ')).toEqual(['vip', 'billing', 'escalation']);
    expect(parseTicketTags('   ')).toBeNull();
  });

  it('builds custom field payloads with typed values', () => {
    const fields = [
      { id: 1, key: 'asset_id', field_type: 'number' },
      { id: 2, key: 'approved', field_type: 'checkbox' },
      { id: 3, key: 'labels', field_type: 'multiselect' },
      { id: 4, key: 'notes', field_type: 'text' },
    ] as TicketCustomFieldConfig[];

    expect(buildCustomFieldPayload({
      asset_id: '42',
      approved: 'true',
      labels: 'vpn, urgent , billing',
      notes: 'Escalate to network',
      ignored: '',
    }, fields)).toEqual({
      asset_id: 42,
      approved: true,
      labels: ['vpn', 'urgent', 'billing'],
      notes: 'Escalate to network',
    });
  });

  it('filters custom fields by template schema keys', () => {
    const fields = [
      { id: 1, key: 'asset_id', label: 'Asset ID' },
      { id: 2, key: 'impact', label: 'Impact' },
      { id: 3, key: 'region', label: 'Region' },
    ] as TicketCustomFieldConfig[];

    const template = {
      id: 1,
      field_schema: [
        { key: 'impact' },
        { key: 'region' },
      ],
    } as unknown as TicketFormTemplateConfig;

    expect(filterCustomFieldsByTemplate(fields, template).map((field) => field.key)).toEqual(['impact', 'region']);
    expect(filterCustomFieldsByTemplate(fields, null).map((field) => field.key)).toEqual(['asset_id', 'impact', 'region']);
  });
});
