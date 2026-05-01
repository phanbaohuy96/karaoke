export async function readJsonResponse<T>(response: Response, fallbackMessage = 'Request failed.'): Promise<T> {
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message ?? fallbackMessage);
  }

  return payload as T;
}
