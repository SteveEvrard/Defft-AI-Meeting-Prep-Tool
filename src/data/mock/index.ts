import { accounts, contacts, customerProfiles } from './accounts'
import { crmNotes, opportunities, promotions, purchaseOrders, quoteActivities, catalog } from './commercial'
import { meetings } from './meetings'
import { news, trends } from './market'
import type { MockDataRepository } from '../../types/domain'

export const mockRepository: MockDataRepository = {
  meetings,
  accounts,
  contacts,
  customerProfiles,
  purchaseOrders,
  quoteActivities,
  crmNotes,
  opportunities,
  promotions,
  catalog,
  trends,
  news,
}
