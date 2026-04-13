<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantIdentityProvider extends Model
{
    protected $fillable = [
        'workspace_id',
        'provider_type',
        'name',
        'issuer',
        'sso_url',
        'authorization_url',
        'token_url',
        'userinfo_url',
        'redirect_uri',
        'metadata_url',
        'x509_certificate',
        'client_id',
        'client_secret_encrypted',
        'is_active',
        'certificate_expires_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'certificate_expires_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
