<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SsoLoginState extends Model
{
    protected $fillable = [
        'workspace_id',
        'tenant_identity_provider_id',
        'state',
        'nonce',
        'expires_at',
        'consumed_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(TenantIdentityProvider::class, 'tenant_identity_provider_id');
    }
}
