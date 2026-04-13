<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class WorkspaceRole extends Model
{
    protected $fillable = ['workspace_id', 'name', 'slug', 'description', 'is_system'];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            WorkspacePermission::class,
            'workspace_role_permissions',
            'workspace_role_id',
            'workspace_permission_id'
        )->withTimestamps();
    }
}
