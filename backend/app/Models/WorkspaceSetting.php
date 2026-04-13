<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkspaceSetting extends Model
{
    protected $fillable = [
        'workspace_id',
        'timezone',
        'branding_json',
        'business_profile_json',
        'ticket_number_format',
        'assignment_strategy',
        'ticketing_json',
    ];

    protected function casts(): array
    {
        return [
            'branding_json' => 'array',
            'business_profile_json' => 'array',
            'ticketing_json' => 'array',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
