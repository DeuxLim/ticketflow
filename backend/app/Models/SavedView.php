<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavedView extends Model
{
    protected $fillable = [
        'workspace_id',
        'created_by_user_id',
        'name',
        'filters_json',
        'is_shared',
    ];

    protected function casts(): array
    {
        return [
            'is_shared' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function filters(): array
    {
        if (! $this->filters_json) {
            return [];
        }

        return json_decode($this->filters_json, true, 512, JSON_THROW_ON_ERROR);
    }
}
