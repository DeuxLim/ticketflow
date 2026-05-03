<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTenantSecurityPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'require_mfa' => ['sometimes', 'boolean'],
            'session_ttl_minutes' => ['sometimes', 'integer', 'min:15', 'max:43200'],
            'ip_allowlist' => ['nullable', 'array'],
            'ip_allowlist.*' => ['ip'],
            'tenant_mode' => ['sometimes', 'in:shared,dedicated'],
            'dedicated_data_plane_key' => ['nullable', 'string', 'max:255'],
            'feature_flags' => ['nullable', 'array'],
        ];
    }
}
