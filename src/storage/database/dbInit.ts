import { getDb } from "coze-coding-dev-sdk"
import { sql } from "drizzle-orm"

let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * 自动初始化数据库表
 * 在首次数据库操作时自动调用
 */
export async function ensureDbInitialized(): Promise<void> {
  // 如果已经初始化，直接返回
  if (isInitialized) {
    return
  }

  // 如果正在初始化，等待初始化完成
  if (initPromise) {
    return initPromise
  }

  // 开始初始化
  initPromise = (async () => {
    try {
      console.log('[DB Init] 检查数据库表...')
      const db = await getDb()

      // 检查表是否已存在
      try {
        await db.execute(sql`SELECT 1 FROM products LIMIT 1`)
        console.log('[DB Init] products 表已存在')
        isInitialized = true
        return
      } catch (e) {
        console.log('[DB Init] products 表不存在，开始创建...')
      }

      // 创建 products 表
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          supplier_price NUMERIC(10, 2) NOT NULL,
          shop_price NUMERIC(10, 2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE
        )
      `)
      console.log('[DB Init] products 表创建成功')

      // 创建索引
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS products_name_idx ON products (name)
      `)
      console.log('[DB Init] 索引创建成功')

      isInitialized = true
      console.log('[DB Init] 数据库初始化完成')
    } catch (error) {
      console.error('[DB Init] 数据库初始化失败:', error)
      // 重置状态，允许下次重试
      initPromise = null
      throw error
    }
  })()

  return initPromise
}

/**
 * 重置初始化状态（仅用于测试）
 */
export function resetInitState(): void {
  isInitialized = false
  initPromise = null
}
