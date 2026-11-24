/**
 * Narrows an unknown to something whose properties can be read.
 *
 * Everything this plugin reads from outside its own code — Studio's compiled
 * schema, a query result, a model's JSON — arrives as `unknown`, and is walked
 * through this one guard rather than cast.
 *
 * @internal
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
