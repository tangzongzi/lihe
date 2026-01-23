// Edge Runtime 声明（关键！）
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse, CalculationResult } from '@/lib/api-types'

/**
 * 计算参数验证 Schema
 */
const calculateSchema = z.object({
  supplyPrice: z.number().positive('供货价必须大于0'),
  quantity: z.number().int('数量必须是整数').positive('数量必须大于0'),
  singleShipping: z.number().nonnegative('单件运费不能为负数').default(5),
  multiShipping: z.number().nonnegative('多件运费不能为负数').default(5),
  shopPrice: z.number().positive('店铺售价必须大于0'),
})

/**
 * POST /api/calculate - 价格计算
 * 
 * 计算规则：
 * - 商品成本 = 供货价 × 数量
 * - 供货商运费：1件=3元，2件=5元，3件及以上=0元
 * - 客户运费：1件=单件运费，多件=多件运费×数量
 * - 客户实付 = (店铺售价 × 数量) + 客户运费
 * - 手续费 = 客户实付 × 0.6%
 * - 总支出 = 商品成本 + 供货商运费 + 手续费
 * - 利润 = 客户实付 - 总支出
 * - 最大可优惠 = 客户实付 - (商品成本 + 供货商运费) ÷ 0.994
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Zod 验证
    const data = calculateSchema.parse(body)
    
    // 计算商品成本
    const goodsCost = data.supplyPrice * data.quantity
    
    // 计算供货商运费
    let supplierShipping = 0
    if (data.quantity === 1) {
      supplierShipping = 3
    } else if (data.quantity === 2) {
      supplierShipping = 5
    } else {
      supplierShipping = 0
    }
    
    // 计算客户运费
    const customerShipping = data.quantity === 1 
      ? data.singleShipping 
      : data.multiShipping * data.quantity
    
    // 计算客户实付
    const customerTotal = data.shopPrice * data.quantity + customerShipping
    
    // 计算手续费（0.6%）
    const fee = customerTotal * 0.006
    
    // 计算总支出
    const totalExpense = goodsCost + supplierShipping + fee
    
    // 计算利润
    const profit = customerTotal - totalExpense
    
    // 计算最大可优惠金额（利润为0时）
    const maxDiscount = customerTotal - (goodsCost + supplierShipping) / 0.994
    
    const result: CalculationResult = {
      quantity: data.quantity,
      goodsCost: goodsCost.toFixed(2),
      supplierShipping: supplierShipping.toFixed(2),
      customerShipping: customerShipping.toFixed(2),
      customerTotal: customerTotal.toFixed(2),
      fee: fee.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      profit: profit.toFixed(2),
      maxDiscount: Math.max(0, maxDiscount).toFixed(2), // 确保不为负数
    }
    
    const response: ApiResponse<CalculationResult> = {
      success: true,
      data: result,
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[API] POST /api/calculate 失败:', error)
    
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
      error: '计算失败',
    }
    
    return NextResponse.json(response, { status: 500 })
  }
}
