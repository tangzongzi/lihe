import { getDb } from "coze-coding-dev-sdk"
import { sql } from "drizzle-orm"

/**
 * 运行数据库迁移
 * 创建 products 表和索引
 */
export async function runMigrations(): Promise<void> {
  const db = await getDb()

  try {
    console.log("[Migration] 开始数据库迁移...")

    // 创建 products 表
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        supplier_price DECIMAL(10, 2) NOT NULL,
        shop_price DECIMAL(10, 2),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE
      )
    `)

    console.log("[Migration] products 表创建成功")

    // 创建索引
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS products_name_idx ON products (name)
    `)

    console.log("[Migration] 索引创建成功")
    console.log("[Migration] 数据库迁移完成")
  } catch (error) {
    console.error("[Migration] 数据库迁移失败:", error)
    throw error
  }
}

/**
 * 检查数据库是否已初始化
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  const db = await getDb()

  try {
    await db.execute(sql`SELECT 1 FROM products LIMIT 1`)
    return true
  } catch {
    return false
  }
}
