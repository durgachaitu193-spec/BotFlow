import { db } from '@botflow/db'
import { launchpadTokens } from '@botflow/db/schema'
import { eq } from 'drizzle-orm'

interface ISaveAssetID {
  assetId: string
  hydradxId: string
}

export const saveAssetID = async ({ assetId, hydradxId }: ISaveAssetID) => {
  // This function is responsible for saving the asset ID to the database
  // after the asset is registered on the HydraDX network.

  await db
    .update(launchpadTokens)
    .set({
      hydradxId,
    })
    .where(eq(launchpadTokens.id, assetId))
}
