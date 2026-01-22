import { pgTable, index, varchar, numeric, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { z } from "zod"

export const products = pgTable("products", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	supplierPrice: numeric("supplier_price", { precision: 10, scale:  2 }).notNull(),
	shopPrice: numeric("shop_price", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("products_name_idx").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

// 自定义 Zod schemas for validation
// 处理 numeric 类型：接受字符串或数字，转换为字符串
const numericSchema = z.union([
  z.string().regex(/^\d+(\.\d{1,2})?$/, "必须是有效的数字格式（最多2位小数）"),
  z.number().transform(val => val.toFixed(2))
]).transform(val => String(val));

export const insertProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空").max(255, "产品名称不能超过255个字符"),
  supplierPrice: numericSchema,
  shopPrice: z.union([
    numericSchema,
    z.string().length(0).transform(() => undefined),
    z.undefined(),
    z.null()
  ]).optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, "产品名称不能为空").max(255, "产品名称不能超过255个字符").optional(),
  supplierPrice: numericSchema.optional(),
  shopPrice: z.union([
    numericSchema,
    z.string().length(0).transform(() => undefined),
    z.undefined(),
    z.null()
  ]).optional(),
});

// TypeScript types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
