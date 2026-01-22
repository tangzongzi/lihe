import { NextResponse } from 'next/server'
import { productStorage } from '@/lib/storage-adapter'

// 更新产品
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log('PUT: 更新产品请求 - ID:', id, '请求体:', body)

    const product = await productStorage.updateProduct(id, {
      name: body.name,
      supplierPrice: body.supplierPrice,
      shopPrice: body.shopPrice,
    })

    if (!product) {
      console.error('PUT: 产品不存在 - ID:', id)
      return NextResponse.json({ error: '产品不存在' }, { status: 404 })
    }

    // 转换 decimal 字段为字符串
    const formattedProduct = {
      ...product,
      supplierPrice: product.supplierPrice.toString(),
      shopPrice: product.shopPrice?.toString(),
    }

    console.log('PUT: 更新产品成功:', formattedProduct, '存储方式:', productStorage.getStorageType())

    return NextResponse.json(formattedProduct)
  } catch (error) {
    console.error('PUT: 更新产品失败:', error)

    // 处理 Zod 验证错误
    if (error && typeof error === 'object' && 'issues' in error) {
      const issues = (error as any).issues
      const errorMessages = issues.map((issue: any) => issue.message)
      console.error('PUT: Zod 验证错误详情:', issues)
      return NextResponse.json(
        { error: errorMessages.join(', ') },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : '更新产品失败'
    console.error('PUT: 详细错误:', {
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// 删除产品
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log('DELETE: 删除产品请求 - ID:', id)

    const success = await productStorage.deleteProduct(id)

    if (!success) {
      console.error('DELETE: 产品不存在 - ID:', id)
      return NextResponse.json({ error: '产品不存在' }, { status: 404 })
    }

    console.log('DELETE: 删除产品成功 - ID:', id, '存储方式:', productStorage.getStorageType())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE: 删除产品失败:', error)

    const errorMessage = error instanceof Error ? error.message : '删除产品失败'
    console.error('DELETE: 详细错误:', {
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
