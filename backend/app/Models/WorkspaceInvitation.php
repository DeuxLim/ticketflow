<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WorkspaceInvitation extends Model
{
    protected $fillable = [
        'workspace_id',
        'email',
        'invited_by_user_id',
        'token_hash',
        'status',
        'expires_at',
        'accepted_at',
        'accepted_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }

    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            WorkspaceRole::class,
            'workspace_invitation_roles',
            'workspace_invitation_id',
            'workspace_role_id'
        )->withTimestamps();
    }
}
