<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantExport extends Model
{
    protected $fillable = [
        'workspace_id',
        'requested_by_user_id',
        'status',
        'filters_json',
        'download_token',
        'download_expires_at',
        'result_json',
    ];

    protected function casts(): array
    {
        return [
            'filters_json' => 'array',
            'result_json' => 'array',
            'download_expires_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }
}
