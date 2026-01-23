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
    // 1. 读取请求体
    let body
    try {
      body = await request.json()
      console.log('[API] 接收到的请求数据:', body)
    } catch (parseError) {
      console.error('[API] JSON 解析失败:', parseError)
      return NextResponse.json({
        success: false,
        error: 'JSON 格式错误',
      }, { status: 400 })
    }
    
    // 2. Zod 验证
    let validated
    try {
      validated = createProductSchema.parse(body)
      console.log('[API] 验证通过:', validated)
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('[API] 验证失败:', validationError.issues)
        return NextResponse.json({
          success: false,
          error: validationError.issues[0]?.message || '验证失败',
        }, { status: 400 })
      }
      throw validationError
    }
    
    // 3. 创建产品
    let product
    try {
      product = await createProduct({
        name: validated.name,
        supplyPrice: validated.supplyPrice,
        shopPrice: validated.shopPrice || null,
      })
      console.log('[API] 产品创建成功:', product)
    } catch (dbError) {
      console.error('[API] 数据库错误:', dbError)
      return NextResponse.json({
        success: false,
        error: dbError instanceof Error ? dbError.message : '数据库操作失败',
      }, { status: 500 })
    }
    
    // 4. 返回响应
    const response: ApiResponse<ProductResponse> = {
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      message: '产品创建成功',
    }
    
    console.log('[API] 返回响应:', response)
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/products 未捕获错误:', error)
    
    // 确保总是返回 JSON 响应
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '创建产品失败',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
