// Edge Runtime 声明
export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * GET /api/init-db - 初始化数据库表
 * 仅用于首次部署时创建表结构
 */
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL 环境变量未设置',
      }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // 创建 products 表
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        supply_price TEXT NOT NULL,
        shop_price TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `
    
    // 检查表是否存在
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'products'
    `
    
    return NextResponse.json({
      success: true,
      message: '数据库初始化成功',
      data: {
        tableExists: result.length > 0,
        tableName: result[0]?.table_name || null,
      },
    })
  } catch (error) {
    console.error('[API] 数据库初始化失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '数据库初始化失败',
      details: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
