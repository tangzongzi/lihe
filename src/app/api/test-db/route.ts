// Edge Runtime 声明
export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { products } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * GET /api/test-db - 测试数据库连接和查询
 */
export async function GET() {
  try {
    // 测试 1: 检查环境变量
    const hasDbUrl = !!process.env.DATABASE_URL
    
    // 测试 2: 尝试查询
    const allProducts = await db.select().from(products)
    
    // 测试 3: 尝试插入测试数据
    const testProduct = await db
      .insert(products)
      .values({
        name: '测试产品',
        supplyPrice: '10.00',
        shopPrice: '20.00',
        updatedAt: new Date(),
      })
      .returning()
    
    // 测试 4: 删除测试数据
    if (testProduct[0]) {
      await db.delete(products).where(eq(products.id, testProduct[0].id))
    }
    
    return NextResponse.json({
      success: true,
      message: '数据库连接正常',
      data: {
        hasDbUrl,
        productCount: allProducts.length,
        testInsertSuccess: !!testProduct[0],
      },
    })
  } catch (error) {
    console.error('[API] 数据库测试失败:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '数据库测试失败',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    }, { status: 500 })
  }
}
