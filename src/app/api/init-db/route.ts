import { NextResponse } from 'next/server'
import { getDb } from 'coze-coding-dev-sdk'
import { sql } from 'drizzle-orm'
import { products } from '@/storage/database/shared/schema'

export async function GET() {
  try {
    console.log('开始初始化数据库...')
    const db = await getDb()

    // 检查表是否已存在
    try {
      await db.execute(sql`SELECT 1 FROM products LIMIT 1`)
      console.log('products表已存在，跳过创建')
      return NextResponse.json({ 
        success: true, 
        message: '数据库表已存在，无需初始化' 
      })
    } catch (e) {
      console.log('products表不存在，开始创建...')
    }

    // 创建表
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
    console.log('products表创建成功')

    // 创建索引
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS products_name_idx ON products (name)
    `)
    console.log('索引创建成功')

    return NextResponse.json({ 
      success: true, 
      message: '数据库初始化成功' 
    })
  } catch (error) {
    console.error('数据库初始化失败:', error)
    const errorMessage = error instanceof Error ? error.message : '数据库初始化失败'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
