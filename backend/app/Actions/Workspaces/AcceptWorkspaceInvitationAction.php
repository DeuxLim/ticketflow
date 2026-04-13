<?php

namespace App\Actions\Workspaces;

use App\Models\User;
use App\Models\WorkspaceInvitation;
use App\Models\WorkspaceMembership;
use App\Support\ActivityLogger;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AcceptWorkspaceInvitationAction
{
    public function execute(User $user, string $token): WorkspaceInvitation
    {
        $invitation = WorkspaceInvitation::query()
            ->with(['roles', 'workspace'])
            ->where('token_hash', hash('sha256', $token))
            ->first();

        if (! $invitation) {
            throw new ModelNotFoundException('Invitation not found.');
        }

        if ($invitation->status !== 'pending') {
            throw new HttpException(422, 'Invitation is no longer pending.');
        }

        if ($invitation->expires_at->isPast()) {
            $invitation->update(['status' => 'expired']);
            throw new HttpException(422, 'Invitation has expired.');
        }

        if (mb_strtolower($invitation->email) !== mb_strtolower($user->email)) {
            throw new HttpException(403, 'Invitation email does not match your account.');
        }

        DB::transaction(function () use ($user, $invitation): void {
            $membership = WorkspaceMembership::query()->firstOrCreate(
                [
                    'workspace_id' => $invitation->workspace_id,
                    'user_id' => $user->id,
                ],
                [
                    'joined_at' => now(),
                ]
            );

            $roleIds = $invitation->roles()
                ->where('workspace_id', $invitation->workspace_id)
                ->pluck('workspace_roles.id')
                ->all();

            $membership->roles()->syncWithoutDetaching($roleIds);

            $invitation->update([
                'status' => 'accepted',
                'accepted_at' => now(),
                'accepted_by_user_id' => $user->id,
            ]);

            ActivityLogger::log($invitation->workspace_id, $user->id, 'invitation.accepted', $invitation);
            ActivityLogger::log($invitation->workspace_id, $user->id, 'member.added', $membership);
        });

        return $invitation->fresh(['roles']);
    }
}
