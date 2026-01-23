import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Neon Database 客户端（Edge Runtime 兼容）
 * 使用 HTTP 连接，支持 Serverless 环境
 */

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 环境变量未设置')
}

// Neon HTTP 连接
const sql = neon(process.env.DATABASE_URL)

// Drizzle ORM 实例
export const db = drizzle(sql, { schema })

// 类型导出
export type Database = typeof db
