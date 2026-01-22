import { NextResponse } from 'next/server'
import { productStorage } from '@/lib/storage-adapter'
import type { InsertProduct } from '@/storage/database/shared/schema'

// 验证产品数据格式
function validateProduct(product: any): boolean {
  return (
    product &&
    typeof product.name === 'string' &&
    typeof product.supplierPrice === 'string' &&
    product.name.trim() !== '' &&
    product.supplierPrice.trim() !== ''
  )
}

// 导入产品数据
export async function POST(request: Request) {
  try {
    console.log('IMPORT: 开始导入产品数据')

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.error('IMPORT: 未上传文件')
      return NextResponse.json(
        { error: '请上传 JSON 文件' },
        { status: 400 }
      )
    }

    // 检查文件类型
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      console.error('IMPORT: 文件类型不正确:', file.name, file.type)
      return NextResponse.json(
        { error: '请上传 JSON 格式的文件' },
        { status: 400 }
      )
    }

    // 读取文件内容
    const content = await file.text()

    // 解析 JSON
    let importedProducts
    try {
      importedProducts = JSON.parse(content)
    } catch (e) {
      console.error('IMPORT: JSON 解析失败:', e)
      return NextResponse.json(
        { error: '文件格式不正确，无法解析 JSON' },
        { status: 400 }
      )
    }

    // 验证是否为数组
    if (!Array.isArray(importedProducts)) {
      console.error('IMPORT: 数据格式不正确，不是数组')
      return NextResponse.json(
        { error: '数据格式不正确，必须是产品数组' },
        { status: 400 }
      )
    }

    // 验证每个产品数据
    const validProducts = importedProducts.filter(validateProduct)

    if (validProducts.length === 0) {
      console.error('IMPORT: 没有有效的产品数据')
      return NextResponse.json(
        { error: '文件中没有有效的产品数据' },
        { status: 400 }
      )
    }

    // 逐个导入产品
    const imported: any[] = []
    const failed: any[] = []

    for (const product of validProducts) {
      try {
        const insertData: InsertProduct = {
          name: product.name.trim(),
          supplierPrice: product.supplierPrice.trim(),
          shopPrice: product.shopPrice ? product.shopPrice.trim() : undefined,
        }

        const created = await productStorage.createProduct(insertData)
        imported.push(created)
      } catch (error) {
        console.error('IMPORT: 导入单个产品失败:', product, error)
        failed.push({ product, error: error instanceof Error ? error.message : '未知错误' })
      }
    }

    console.log(`IMPORT: 导入完成，成功 ${imported.length} 条，失败 ${failed.length} 条，存储方式: ${productStorage.getStorageType()}`)

    return NextResponse.json({
      success: true,
      message: `成功导入 ${imported.length} 条产品数据${failed.length > 0 ? `，失败 ${failed.length} 条` : ''}`,
      imported: imported.length,
      failed: failed.length,
      failedDetails: failed.length > 0 ? failed : undefined,
    })
  } catch (error) {
    console.error('IMPORT: 导入产品数据失败:', error)

    const errorMessage = error instanceof Error ? error.message : '导入产品数据失败'
    console.error('IMPORT: 详细错误:', {
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
