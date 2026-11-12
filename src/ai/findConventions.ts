import {type SanityClient} from 'sanity'

import {
  CONVENTION_INSTRUCTION,
  CONVENTION_SAMPLE_LIMIT,
  conventionParams,
  MIN_EVIDENCE,
  validateConventions,
  type Convention,
} from './conventions'
import {fieldStats} from './fieldStats'
import {SAMPLE_QUERY, summarizeDocument} from './sampleContent'
import {type SerializedDocumentType} from './serializeSchema'

/**
 * One run of the convention finder: read published documents, count, ask, check.
 *
 * @internal
 */

/** Pinned so a Studio's own API version cannot change what the sample query returns. */
const QUERY_API_VERSION = '2024-01-01'

/** Agent Actions answer on this version only; a dated one is rejected with a 400. */
const AGENT_API_VERSION = 'vX'

/** What a run produced. @internal */
export type ConventionResult =
  | {status: 'too-few'; documentCount: number}
  | {
      status: 'done'
      documentCount: number
      kept: Convention[]
      dropped: Array<{item: unknown; reason: string}>
    }

/**
 * Find conventions for one document type.
 *
 * Checks the document count before asking anything: with fewer than
 * `MIN_EVIDENCE` published documents nothing can be a pattern, so spending the
 * project's AI credits would only buy a confident-sounding guess.
 *
 * Throws whatever the client throws; `classifyError` turns that into
 * something to show.
 */
export async function findConventions(
  client: SanityClient,
  type: SerializedDocumentType,
  language: string,
): Promise<ConventionResult> {
  const documents = await client
    .withConfig({apiVersion: QUERY_API_VERSION})
    .fetch<unknown[]>(SAMPLE_QUERY, {type: type.name, limit: CONVENTION_SAMPLE_LIMIT})

  if (documents.length < MIN_EVIDENCE) {
    return {status: 'too-few', documentCount: documents.length}
  }

  const response = await client
    .withConfig({apiVersion: AGENT_API_VERSION})
    .agent.action.prompt<Record<string, unknown>>({
      instruction: CONVENTION_INSTRUCTION,
      instructionParams: conventionParams({
        type,
        stats: fieldStats(type, documents),
        samples: documents.map(summarizeDocument),
        language,
      }),
      format: 'json',
    })

  return {
    status: 'done',
    documentCount: documents.length,
    ...validateConventions(response, type, documents.length),
  }
}

/** Why a run failed, in the terms the tool explains. @internal */
export type ConventionError = 'ai-disabled' | 'quota' | 'session' | 'unknown'

/**
 * Sort a failed request by status code, never by message.
 *
 * Agent Actions pass core API messages through unchanged, so the wording
 * varies while the code does not.
 */
export function classifyError(error: unknown): ConventionError {
  const status =
    typeof error === 'object' && error !== null && 'statusCode' in error
      ? error.statusCode
      : undefined

  if (status === 401) return 'session'
  if (status === 403) return 'ai-disabled'
  if (status === 429) return 'quota'
  return 'unknown'
}
