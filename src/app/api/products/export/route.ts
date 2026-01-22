import { NextResponse } from 'next/server'
import { productStorage } from '@/lib/storage-adapter'

// 导出产品数据
export async function GET() {
  try {
    console.log('EXPORT: 开始导出产品数据')

    // 获取所有产品数据
    const products = await productStorage.getProducts()

    console.log(`EXPORT: 获取到 ${products.length} 条产品数据`)

    if (!products || products.length === 0) {
      console.log('EXPORT: 没有产品数据可导出')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `products-backup-${timestamp}.json`

      // 导出空数组
      return new NextResponse(JSON.stringify([], null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // 转换 decimal 字段为字符串，确保数据格式统一
    const formattedProducts = products.map(product => {
      const formatted: any = {
        id: product.id,
        name: product.name,
        supplierPrice: product.supplierPrice.toString(),
        createdAt: product.createdAt,
      }

      // 只有当 shopPrice 存在时才添加
      if (product.shopPrice != null && product.shopPrice !== undefined) {
        formatted.shopPrice = product.shopPrice.toString()
      }

      // 只有当 updatedAt 存在时才添加
      if (product.updatedAt != null && product.updatedAt !== undefined) {
        formatted.updatedAt = product.updatedAt
      }

      return formatted
    })

    console.log(`EXPORT: 格式化完成，准备导出 ${formattedProducts.length} 条数据`)

    // 生成文件名，包含时间戳
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `products-backup-${timestamp}.json`

    console.log(`EXPORT: 文件名: ${filename}`)

    // 返回 JSON 文件供下载
    const jsonContent = JSON.stringify(formattedProducts, null, 2)

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(jsonContent, 'utf-8').toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('EXPORT: 导出产品数据失败:', error)

    const errorMessage = error instanceof Error ? error.message : '导出产品数据失败'
    console.error('EXPORT: 详细错误:', {
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })

    // 返回错误响应
    return NextResponse.json(
      {
        error: errorMessage,
        message: '导出失败，请稍后重试'
      },
      { status: 500 }
    )
  }
}
