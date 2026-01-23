// Edge Runtime 声明（关键！）
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProductById, updateProduct, deleteProduct } from '@/db/queries'
import type { ApiResponse, ProductResponse } from '@/lib/api-types'

/**
 * 更新产品验证 Schema
 */
const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  supplyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  shopPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
})

/**
 * GET /api/products/[id] - 获取单个产品
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      const response: ApiResponse = {
        success: false,
        error: '无效的产品 ID',
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    const product = await getProductById(id)
    
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: '产品不存在',
      }
      return NextResponse.json(response, { status: 404 })
    }
    
    const response: ApiResponse<ProductResponse> = {
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error(`[API] GET /api/products/${params.id} 失败:`, error)
    
    const response: ApiResponse = {
      success: false,
      error: '获取产品失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

/**
 * PATCH /api/products/[id] - 更新产品
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      const response: ApiResponse = {
        success: false,
        error: '无效的产品 ID',
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    const body = await request.json()
    
    // Zod 验证
    const validated = updateProductSchema.parse(body)
    
    // 更新产品
    const product = await updateProduct(id, validated)
    
    if (!product) {
      const response: ApiResponse = {
        success: false,
        error: '产品不存在',
      }
      return NextResponse.json(response, { status: 404 })
    }
    
    const response: ApiResponse<ProductResponse> = {
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      message: '产品更新成功',
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error(`[API] PATCH /api/products/${params.id} 失败:`, error)
    
    // Zod 验证错误
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: error.errors[0].message,
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    // 其他错误
    const response: ApiResponse = {
      success: false,
      error: '更新产品失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

/**
 * DELETE /api/products/[id] - 删除产品
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      const response: ApiResponse = {
        success: false,
        error: '无效的产品 ID',
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    const success = await deleteProduct(id)
    
    if (!success) {
      const response: ApiResponse = {
        success: false,
        error: '产品不存在',
      }
      return NextResponse.json(response, { status: 404 })
    }
    
    const response: ApiResponse = {
      success: true,
      message: '产品删除成功',
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error(`[API] DELETE /api/products/${params.id} 失败:`, error)
    
    const response: ApiResponse = {
      success: false,
      error: '删除产品失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
