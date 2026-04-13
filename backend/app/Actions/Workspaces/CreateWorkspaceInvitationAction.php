<?php

namespace App\Actions\Workspaces;

use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceInvitation;
use App\Support\ActivityLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateWorkspaceInvitationAction
{
    /**
     * @return array{invitation: WorkspaceInvitation, token: string}
     */
    public function execute(
        Workspace $workspace,
        User $inviter,
        string $email,
        array $roleIds,
        int $expiresInDays = 7,
    ): array {
        return DB::transaction(function () use ($workspace, $inviter, $email, $roleIds, $expiresInDays): array {
            $token = Str::random(64);
            $tokenHash = hash('sha256', $token);

            $invitation = WorkspaceInvitation::query()->create([
                'workspace_id' => $workspace->id,
                'email' => mb_strtolower($email),
                'invited_by_user_id' => $inviter->id,
                'token_hash' => $tokenHash,
                'status' => 'pending',
                'expires_at' => now()->addDays($expiresInDays),
            ]);

            $invitation->roles()->sync($roleIds);

            ActivityLogger::log($workspace->id, $inviter->id, 'invitation.sent', $invitation, [
                'email' => $email,
            ]);

            return [
                'invitation' => $invitation,
                'token' => $token,
            ];
        });
    }
}
