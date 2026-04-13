<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'password',
        'is_platform_admin',
        'is_mfa_enrolled',
        'last_sso_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
            'is_mfa_enrolled' => 'boolean',
            'last_sso_at' => 'datetime',
        ];
    }

    public function ownedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'owner_user_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(WorkspaceMembership::class);
    }

    public function workspaceMembership(?int $workspaceId): ?WorkspaceMembership
    {
        if ($workspaceId === null) {
            return null;
        }

        return $this->memberships()->where('workspace_id', $workspaceId)->first();
    }

    public function hasWorkspacePermission(int $workspaceId, string $permissionSlug): bool
    {
        return $this->memberships()
            ->where('workspace_id', $workspaceId)
            ->whereHas('roles.permissions', fn ($query) => $query->where('slug', $permissionSlug))
            ->exists();
    }
}
