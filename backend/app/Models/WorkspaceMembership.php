<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WorkspaceMembership extends Model
{
    protected $fillable = ['workspace_id', 'user_id', 'joined_at'];

    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            WorkspaceRole::class,
            'workspace_membership_roles',
            'workspace_membership_id',
            'workspace_role_id'
        )->withTimestamps();
    }
}
