import {author} from './documents/author'
import {post} from './documents/post'
import {seo} from './objects/seo'

/**
 * Documents first, then the objects they embed — the layout Sanity's own
 * guidance suggests, so this Studio reads like the ones the plugin is meant to
 * run inside.
 */
export const schemaTypes = [post, author, seo]
