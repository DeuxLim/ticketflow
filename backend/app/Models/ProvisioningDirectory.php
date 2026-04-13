<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProvisioningDirectory extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'token_hash',
        'status',
        'last_synced_at',
    ];

    protected function casts(): array
    {
        return [
            'last_synced_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(ProvisionedDirectoryUser::class);
    }
}
