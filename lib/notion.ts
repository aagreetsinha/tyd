import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

// Notion API v3 wraps records as { spaceId, value: { value: actualData, role } }
// but react-notion-x@7.4.2 expects { role, value: actualData }. Flatten here.
function normalizeRecordMap(recordMap: ExtendedRecordMap): ExtendedRecordMap {
  const keys = [
    'block',
    'collection',
    'collection_view',
    'notion_user'
  ] as const
  for (const key of keys) {
    const map = (recordMap as any)[key]
    if (!map) continue
    for (const id of Object.keys(map)) {
      const record = map[id]
      if (
        record?.value &&
        typeof record.value === 'object' &&
        'value' in record.value
      ) {
        map[id] = { role: record.value.role, value: record.value.value }
      }
    }
  }
  return recordMap
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)
  normalizeRecordMap(recordMap)

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
