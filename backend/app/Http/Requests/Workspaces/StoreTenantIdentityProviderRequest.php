<?php

namespace App\Http\Requests\Workspaces;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantIdentityProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'provider_type' => ['required', 'in:saml,oidc'],
            'name' => ['required', 'string', 'max:120'],
            'issuer' => ['nullable', 'string', 'max:255'],
            'sso_url' => ['nullable', 'url', 'max:255'],
            'authorization_url' => ['nullable', 'url', 'max:255'],
            'token_url' => ['nullable', 'url', 'max:255'],
            'userinfo_url' => ['nullable', 'url', 'max:255'],
            'redirect_uri' => ['nullable', 'url', 'max:255'],
            'metadata_url' => ['nullable', 'url', 'max:255'],
            'x509_certificate' => ['nullable', 'string'],
            'client_id' => ['nullable', 'string', 'max:255'],
            'client_secret' => ['nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'certificate_expires_at' => ['nullable', 'date'],
        ];
    }
}
