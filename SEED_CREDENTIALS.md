# Seed Credentials

These accounts are created by `backend/database/seeders/DatabaseSeeder.php`.

| Purpose | Name | Email | Password | Access |
| --- | --- | --- | --- | --- |
| Platform admin | Platform Admin | `admin@ticketing.local` | `Admin@12345` | Platform admin, demo workspace admin |
| Demo workspace admin | Demo User | `user@ticketing.local` | `User@12345` | Demo workspace admin |
| Demo workspace agent | Demo Agent | `member@ticketing.local` | `Member@12345` | Demo workspace agent |
| Demo workspace viewer | Demo Viewer | `viewer@ticketing.local` | `Viewer@12345` | Demo workspace viewer |

Demo workspace slug: `demo-workspace`

## Workspace Roles

- Admin: full workspace access, including settings, members, invitations, and ticket management.
- Agent: manages customers and tickets, can comment, and can view reports.
- Viewer: read-only access to customers, tickets, and reports.

Demo data includes customers, tickets in every lifecycle status, assigned and unassigned tickets, comments, and activity history.
