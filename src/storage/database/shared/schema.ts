import { pgTable, varchar, decimal, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { z } from "zod"

// 数据库表定义
export const products = pgTable("products", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  supplierPrice: decimal("supplier_price", { precision: 10, scale: 2 }).notNull(),
  shopPrice: decimal("shop_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
})

// Zod 验证 schemas
const priceSchema = z
  .union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, "价格格式不正确"),
    z.number().positive("价格必须大于0"),
  ])
  .transform((val) => String(val))

export const insertProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空").max(255),
  supplierPrice: priceSchema,
  shopPrice: z
    .union([priceSchema, z.string().length(0), z.null(), z.undefined()])
    .optional()
    .transform((val) => (val === "" || val === null || val === undefined ? undefined : val)),
})

export const updateProductSchema = insertProductSchema.partial()

// TypeScript 类型
export type Product = typeof products.$inferSelect
export type InsertProduct = z.infer<typeof insertProductSchema>
export type UpdateProduct = z.infer<typeof updateProductSchema>
