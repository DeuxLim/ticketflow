<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Workspace extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'owner_user_id',
        'tenant_mode',
        'dedicated_data_plane_key',
        'feature_flags',
        'lifecycle_status',
        'maintenance_mode',
        'usage_limits_json',
        'ops_notes_json',
    ];

    protected function casts(): array
    {
        return [
            'maintenance_mode' => 'boolean',
            'feature_flags' => 'array',
            'usage_limits_json' => 'array',
            'ops_notes_json' => 'array',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(WorkspaceMembership::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(WorkspaceRole::class);
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function securityPolicy(): HasOne
    {
        return $this->hasOne(TenantSecurityPolicy::class);
    }

    public function slaPolicies(): HasMany
    {
        return $this->hasMany(SlaPolicy::class);
    }

    public function webhookEndpoints(): HasMany
    {
        return $this->hasMany(WebhookEndpoint::class);
    }

    public function integrationEvents(): HasMany
    {
        return $this->hasMany(IntegrationEvent::class);
    }

    public function setting(): HasOne
    {
        return $this->hasOne(WorkspaceSetting::class);
    }

    public function ticketQueues(): HasMany
    {
        return $this->hasMany(TicketQueue::class);
    }

    public function ticketCategories(): HasMany
    {
        return $this->hasMany(TicketCategory::class);
    }

    public function ticketTags(): HasMany
    {
        return $this->hasMany(TicketTag::class);
    }

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function ticketCustomFields(): HasMany
    {
        return $this->hasMany(TicketCustomField::class);
    }

    public function ticketFormTemplates(): HasMany
    {
        return $this->hasMany(TicketFormTemplate::class);
    }

    public function automationExecutions(): HasMany
    {
        return $this->hasMany(AutomationExecution::class);
    }

    public function retentionPolicy(): HasOne
    {
        return $this->hasOne(RetentionPolicy::class);
    }

    public function legalHolds(): HasMany
    {
        return $this->hasMany(LegalHold::class);
    }

    public function tenantExports(): HasMany
    {
        return $this->hasMany(TenantExport::class);
    }

}
