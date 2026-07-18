// brixta-dashboard/lib/api.ts

export const browserApiUrl =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "/api/core";

export async function requestPythonApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isFormData = options?.body instanceof FormData;
  const response = await fetch(`${browserApiUrl}${cleanEndpoint}`, {
    ...options,
    headers: isFormData ? options?.headers : { "Content-Type": "application/json", ...options?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `BRIXTA API returned ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
