<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProvisionedDirectoryUser extends Model
{
    protected $fillable = [
        'provisioning_directory_id',
        'user_id',
        'external_id',
        'active',
    ];

    protected function casts(): array
    {
        return [
            'active' => 'boolean',
        ];
    }

    public function directory(): BelongsTo
    {
        return $this->belongsTo(ProvisioningDirectory::class, 'provisioning_directory_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
