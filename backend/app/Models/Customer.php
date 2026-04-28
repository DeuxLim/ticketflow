<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    protected $fillable = [
        'workspace_id',
        'name',
        'email',
        'phone',
        'company',
        'job_title',
        'website',
        'timezone',
        'preferred_contact_method',
        'preferred_language',
        'address',
        'external_reference',
        'support_tier',
        'status',
        'internal_notes',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
