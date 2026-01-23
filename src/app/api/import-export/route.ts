// Edge Runtime 声明（关键！）
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllProducts, createProduct } from '@/db/queries'
import type { ApiResponse, ExportData, ImportData } from '@/lib/api-types'

/**
 * 导入数据验证 Schema
 */
const importSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  products: z.array(z.object({
    name: z.string().min(1),
    supplyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
    shopPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).nullable(),
  })),
})

/**
 * GET /api/import-export - 导出所有产品数据
 */
export async function GET() {
  try {
    const products = await getAllProducts()
    
    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      products: products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    }
    
    const response: ApiResponse<ExportData> = {
      success: true,
      data: exportData,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] GET /api/import-export 失败:', error)
    
    const response: ApiResponse = {
      success: false,
      error: '导出失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}

/**
 * POST /api/import-export - 批量导入产品数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Zod 验证
    const validated = importSchema.parse(body) as ImportData
    
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    
    // 批量导入
    for (const product of validated.products) {
      try {
        await createProduct({
          name: product.name,
          supplyPrice: product.supplyPrice,
          shopPrice: product.shopPrice,
        })
        successCount++
      } catch (error) {
        errorCount++
        errors.push(`${product.name}: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
    
    const response: ApiResponse = {
      success: errorCount === 0,
      message: `导入完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
      data: errorCount > 0 ? { errors } : undefined,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] POST /api/import-export 失败:', error)
    
    // Zod 验证错误
    if (error instanceof z.ZodError) {
      const response: ApiResponse = {
        success: false,
        error: '数据格式不正确：' + (error.issues[0]?.message || '验证失败'),
      }
      return NextResponse.json(response, { status: 400 })
    }
    
    // 其他错误
    const response: ApiResponse = {
      success: false,
      error: '导入失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
