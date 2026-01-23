// Edge Runtime 声明（关键！）
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllProducts, createProduct, searchProducts } from '@/db/queries'
import type { ApiResponse, ProductResponse } from '@/lib/api-types'

/**
 * 创建产品验证 Schema
 */
const createProductSchema = z.object({
  name: z.string().min(1, '产品名称不能为空').max(255, '产品名称过长'),
  supplyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '供货价格式不正确（例如：12.50）'),
  shopPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '店铺价格式不正确').optional(),
})

/**
 * GET /api/products - 获取产品列表
 * 支持搜索参数：?q=关键词
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    const products = query 
      ? await searchProducts(query)
      : await getAllProducts()
    
    const response: ApiResponse<ProductResponse[]> = {
      success: true,
      data: products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] GET /api/products 失败:', error)
    
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '获取产品列表失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

/**
 * POST /api/products - 创建产品
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Zod 验证
    const validated = createProductSchema.parse(body)
    
    // 创建产品
    const product = await createProduct({
      name: validated.name,
      supplyPrice: validated.supplyPrice,
      shopPrice: validated.shopPrice || null,
    })
    
    const response: ApiResponse<ProductResponse> = {
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      message: '产品创建成功',
    }
    
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/products 失败:', error)
    
    // Zod 验证错误
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.issues[0]?.message || '验证失败',
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    // 其他错误
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '创建产品失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
