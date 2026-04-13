<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RetentionPolicy extends Model
{
    protected $fillable = [
        'workspace_id',
        'tickets_days',
        'comments_days',
        'attachments_days',
        'audit_days',
        'purge_enabled',
    ];

    protected function casts(): array
    {
        return [
            'purge_enabled' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
