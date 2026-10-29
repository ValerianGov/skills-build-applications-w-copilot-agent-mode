// Relative /api paths go through the Vite dev proxy, so port 8000 never needs to be public.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);
  if (!response.ok) {
    const body = await response.text();
    let message = body;
    try {
      const payload: unknown = JSON.parse(body);
      if (payload && typeof payload === 'object') {
        if ('error' in payload && typeof payload.error === 'string') message = payload.error;
        else if ('message' in payload && typeof payload.message === 'string') message = payload.message;
      }
    } catch {
      // Keep non-JSON error bodies available to the user.
    }
    throw new Error(message ? `${message} (status ${response.status})` : `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}
