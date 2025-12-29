<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'workspace_id' => $this->workspace_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'company' => $this->company,
            'job_title' => $this->job_title,
            'website' => $this->website,
            'timezone' => $this->timezone,
            'preferred_contact_method' => $this->preferred_contact_method,
            'preferred_language' => $this->preferred_language,
            'address' => $this->address,
            'external_reference' => $this->external_reference,
            'support_tier' => $this->support_tier,
            'status' => $this->status,
            'internal_notes' => $this->internal_notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
