<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BreakGlassRequest extends Model
{
    protected $fillable = [
        'workspace_id',
        'requested_by_user_id',
        'status',
        'reason',
        'duration_minutes',
        'approver_one_user_id',
        'approver_two_user_id',
        'approved_at',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
