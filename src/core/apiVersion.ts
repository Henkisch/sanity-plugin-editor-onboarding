/**
 * The API version for the plugin's own read queries.
 *
 * Pinned so a Studio's configured version cannot change what a query returns
 * — perspectives and draft handling have both shifted between dated versions.
 *
 * @internal
 */
export const QUERY_API_VERSION = '2024-01-01'
