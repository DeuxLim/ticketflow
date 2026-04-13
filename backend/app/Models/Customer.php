<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Customer extends Model
{
    protected $fillable = ['workspace_id', 'name', 'email', 'phone', 'company'];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }
}
