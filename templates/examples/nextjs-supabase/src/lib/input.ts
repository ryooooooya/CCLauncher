export function documentBody(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 1 || typeof record.body !== "string")
    return null;
  return record.body.length > 0 && record.body.length <= 2000
    ? record.body
    : null;
}
export const validId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
