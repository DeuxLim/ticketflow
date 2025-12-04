// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup } from '@testing-library/react';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { IntegrationsSettingsSection } from './IntegrationsSettingsSection';

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

describe('IntegrationsSettingsSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows integrations as deferred instead of exposing webhook controls', () => {
    renderWithQueryClient(<IntegrationsSettingsSection workspaceSlug="acme" />);

    expect(screen.getByText('Integrations deferred')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'New endpoint' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
});
