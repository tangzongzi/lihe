import { NextResponse } from 'next/server'
import { productStorage } from '@/lib/storage-adapter'

// 获取产品列表
export async function GET(request: Request) {
  try {
    console.log('GET: 开始读取产品列表')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const products = await productStorage.getProducts({ search })

    console.log(`GET: 读取产品列表成功，共 ${products.length} 条数据，存储方式: ${productStorage.getStorageType()}`)

    // 转换 decimal 字段为字符串（统一接口）
    const formattedProducts = products.map(product => ({
      ...product,
      supplierPrice: product.supplierPrice.toString(),
      shopPrice: product.shopPrice?.toString(),
    }))

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('GET: 获取产品列表失败:', error)

    const errorMessage = error instanceof Error ? error.message : '获取产品列表失败'
    console.error('GET: 详细错误:', {
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// 创建产品
export async function POST(request: Request) {
  try {
    const body = await request.json()

    console.log('POST: 创建产品请求 - 请求体:', {
      name: body.name,
      supplierPrice: body.supplierPrice,
      shopPrice: body.shopPrice,
    })

    // 基本验证
    if (!body.name || !body.supplierPrice) {
      console.error('POST: 创建产品失败 - 基本验证失败:', {
        hasName: !!body.name,
        hasSupplierPrice: !!body.supplierPrice,
      })
      return NextResponse.json(
        { error: '产品名称和供货价不能为空' },
        { status: 400 }
      )
    }

    // 创建产品
    const product = await productStorage.createProduct({
      name: body.name.trim(),
      supplierPrice: body.supplierPrice,
      shopPrice: body.shopPrice,
    })

    // 转换 decimal 字段为字符串
    const formattedProduct = {
      ...product,
      supplierPrice: product.supplierPrice.toString(),
      shopPrice: product.shopPrice?.toString(),
    }

    console.log('POST: 创建产品成功:', formattedProduct, '存储方式:', productStorage.getStorageType())

    return NextResponse.json(formattedProduct, { status: 201 })
  } catch (error) {
    console.error('POST: 创建产品失败:', error)

    // 处理 Zod 验证错误
    if (error && typeof error === 'object' && 'issues' in error) {
      const issues = (error as any).issues
      const errorMessages = issues.map((issue: any) => issue.message)
      console.error('POST: Zod 验证错误详情:', issues)
      return NextResponse.json(
        { error: errorMessages.join(', ') },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : '创建产品失败'
    console.error('POST: 详细错误:', {
      errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
