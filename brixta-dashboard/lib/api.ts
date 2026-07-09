// brixta-dashboard/lib/api.ts

export async function fetchPythonApi(endpoint: string, options?: RequestInit) {
  // Fallback to localhost if the env var is missing during build/dev
  const baseUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";
  
  // Ensure we don't end up with double slashes like http://localhost:8000//api
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const res = await fetch(`${baseUrl}${cleanEndpoint}`, {
      ...options,
    });
    
    if (!res.ok) {
      throw new Error(`API Error ${res.status}: ${res.statusText} at ${cleanEndpoint}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error(`Fetch failed for ${cleanEndpoint}:`, error);
    return { error: `Failed to connect to Python backend at ${cleanEndpoint}` };
  }
}