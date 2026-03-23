import { mockRepository } from '../data/mock'
import type { MockDataRepository } from '../types/domain'

export interface CalendarAdapter {
  getUpcomingMeetings(): Promise<MockDataRepository['meetings']>
}

export interface CrmAdapter {
  getAccounts(): Promise<MockDataRepository['accounts']>
  getNotes(): Promise<MockDataRepository['crmNotes']>
  getOpportunities(): Promise<MockDataRepository['opportunities']>
}

export interface ErpAdapter {
  getPurchaseOrders(): Promise<MockDataRepository['purchaseOrders']>
  getQuotes(): Promise<MockDataRepository['quoteActivities']>
}

export interface SupplierAdapter {
  getPromotions(): Promise<MockDataRepository['promotions']>
  getCatalog(): Promise<MockDataRepository['catalog']>
}

export interface IntelligenceAdapter {
  getTrends(): Promise<MockDataRepository['trends']>
  getNews(): Promise<MockDataRepository['news']>
}

export interface ConnectorRegistry {
  calendar: CalendarAdapter
  crm: CrmAdapter
  erp: ErpAdapter
  supplier: SupplierAdapter
  intelligence: IntelligenceAdapter
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const mockConnectors: ConnectorRegistry = {
  calendar: {
    async getUpcomingMeetings() {
      return clone(mockRepository.meetings)
    },
  },
  crm: {
    async getAccounts() {
      return clone(mockRepository.accounts)
    },
    async getNotes() {
      return clone(mockRepository.crmNotes)
    },
    async getOpportunities() {
      return clone(mockRepository.opportunities)
    },
  },
  erp: {
    async getPurchaseOrders() {
      return clone(mockRepository.purchaseOrders)
    },
    async getQuotes() {
      return clone(mockRepository.quoteActivities)
    },
  },
  supplier: {
    async getPromotions() {
      return clone(mockRepository.promotions)
    },
    async getCatalog() {
      return clone(mockRepository.catalog)
    },
  },
  intelligence: {
    async getTrends() {
      return clone(mockRepository.trends)
    },
    async getNews() {
      return clone(mockRepository.news)
    },
  },
}
