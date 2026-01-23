import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * 产品表 Schema
 * 使用 text 类型存储价格，避免浮点精度问题
 */
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  supplyPrice: text('supply_price').notNull(), // 供货价，格式：'12.50'
  shopPrice: text('shop_price'), // 店铺售价，可选
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

// TypeScript 类型导出
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
