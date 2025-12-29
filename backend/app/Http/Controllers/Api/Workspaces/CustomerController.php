<?php

namespace App\Http\Controllers\Api\Workspaces;

use App\Http\Controllers\Controller;
use App\Http\Requests\Workspaces\StoreCustomerRequest;
use App\Http\Requests\Workspaces\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Models\Workspace;
use App\Support\ActivityLogger;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request, Workspace $workspace): JsonResponse
    {
        $query = Customer::query()->where('workspace_id', $workspace->id);

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%")
                    ->orWhere('job_title', 'like', "%{$search}%")
                    ->orWhere('website', 'like', "%{$search}%")
                    ->orWhere('external_reference', 'like', "%{$search}%")
                    ->orWhere('support_tier', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        $perPage = min(max($request->integer('per_page', 15), 1), 200);
        $customers = $query->latest('id')->paginate($perPage);

        return response()->json([
            'data' => CustomerResource::collection($customers->items()),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function store(StoreCustomerRequest $request, Workspace $workspace): JsonResponse
    {
        $customer = Customer::query()->create([
            ...$request->validated(),
            'workspace_id' => $workspace->id,
        ]);

        ActivityLogger::log($workspace->id, $request->user()->id, 'customer.created', $customer);

        return (new CustomerResource($customer))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Workspace $workspace, Customer $customer): JsonResponse
    {
        return response()->json([
            'data' => new CustomerResource($customer),
        ]);
    }

    public function update(UpdateCustomerRequest $request, Workspace $workspace, Customer $customer): JsonResponse
    {
        $customer->update($request->validated());

        ActivityLogger::log($workspace->id, $request->user()->id, 'customer.updated', $customer);

        return response()->json([
            'data' => new CustomerResource($customer->fresh()),
        ]);
    }

    public function destroy(Request $request, Workspace $workspace, Customer $customer): JsonResponse
    {
        $customerId = $customer->id;

        try {
            $customer->delete();
        } catch (QueryException $exception) {
            return response()->json([
                'message' => 'Customer cannot be deleted while related tickets exist.',
            ], 422);
        }

        ActivityLogger::log($workspace->id, $request->user()->id, 'customer.deleted', null, [
            'customer_id' => $customerId,
        ]);

        return response()->json([
            'message' => 'Customer deleted.',
        ]);
    }
}
