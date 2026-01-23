# 礼盒报价计算器 - 技术设计文档（EdgeOne Pages 优化版）

## 概述

本设计文档描述了礼盒报价计算器系统的技术架构和实现方案，该系统专为腾讯 EdgeOne Pages 平台优化，完全兼容 Edge Runtime。系统采用 Next.js 16 App Router 架构，使用 Neon Database Serverless 作为数据存储，Tesseract.js 实现前端 OCR 识别，确保在全球边缘节点上高效运行。

核心设计原则：
- Edge Runtime 完全兼容（无 Node.js 特定 API）
- 轻量级包体积（< 2MB）
- Serverless 数据库连接
- 前端 OCR 处理（隐私保护）
- 响应式设计（桌面和移动端）

## 架构

### 系统架构图

```mermaid
graph TB
    Client[浏览器客户端]
    EdgeOne[EdgeOne Pages CDN]
    NextJS[Next.js Edge Runtime]
    Neon[Neon Database Serverless]
    Tesseract[Tesseract.js OCR]
    
    Client -->|HTTPS| EdgeOne
    EdgeOne -->|路由| NextJS
    NextJS -->|HTTP/WebSocket| Neon
    Client -->|本地处理| Tesseract
    
    subgraph "Edge Runtime 环境"
        NextJS
    end
    
    subgraph "客户端环境"
        Client
        Tesseract
    end
    
    subgraph "Serverless 数据库"
        Neon
    end
```

### 技术栈架构


```
前端层（React 19 + Next.js 16）
├── UI 组件（Radix UI + Tailwind CSS）
├── 状态管理（React Hooks）
├── OCR 处理（Tesseract.js - 客户端）
└── API 客户端（Fetch API）

API 层（Next.js Edge Runtime）
├── /api/products/*（产品 CRUD）
├── /api/calculate（价格计算）
└── /api/import-export（数据导入导出）

数据层（Neon + Drizzle ORM）
├── 数据库客户端（@neondatabase/serverless）
├── Schema 定义（Drizzle Schema）
└── 查询函数（Drizzle Queries）

外部服务
└── Neon Database（PostgreSQL Serverless）
```

### 部署架构

```
GitHub Repository
    ↓ (Git Push)
EdgeOne Pages 自动构建
    ↓ (pnpm build)
全球 3200+ 边缘节点
    ↓ (用户请求)
最近的边缘节点响应
    ↓ (数据库查询)
Neon Database（HTTP 连接）
```

### 关键架构决策

1. **Edge Runtime 优先**
   - 所有 API 路由使用 Edge Runtime
   - 避免 Node.js 特定 API（fs, path, crypto）
   - 使用 Web 标准 API（Fetch, Web Crypto）

2. **Serverless 数据库**
   - 选择 Neon Database（HTTP/WebSocket 连接）
   - 使用 @neondatabase/serverless 驱动
   - 自动连接池管理

3. **前端 OCR 处理**
   - Tesseract.js 在浏览器中运行
   - 无需服务器处理，保护隐私
   - 动态导入减少初始包体积

4. **移除文件存储**
   - 仅使用数据库存储
   - 避免 /tmp 目录依赖
   - 简化架构，提高可靠性

## 组件和接口

### 数据库层

#### 数据库客户端（db/client.ts）

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Neon HTTP 连接（Edge Runtime 兼容）
const sql = neon(process.env.DATABASE_URL!)

// Drizzle ORM 实例
export const db = drizzle(sql, { schema })

// 类型导出
export type Database = typeof db
```

#### 数据库 Schema（db/schema.ts）

```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// 产品表
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  supplyPrice: text('supply_price').notNull(), // 使用 string 存储价格
  shopPrice: text('shop_price'), // 可选
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 类型导出
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
```

#### 数据库查询函数（db/queries.ts）

```typescript
import { db } from './client'
import { products, type Product, type NewProduct } from './schema'
import { eq, desc, ilike } from 'drizzle-orm'

// 创建产品
export async function createProduct(data: NewProduct): Promise<Product> {
  const [product] = await db.insert(products).values(data).returning()
  return product
}

// 获取所有产品
export async function getAllProducts(): Promise<Product[]> {
  return db.select().from(products).orderBy(desc(products.createdAt))
}

// 搜索产品
export async function searchProducts(query: string): Promise<Product[]> {
  return db.select()
    .from(products)
    .where(ilike(products.name, `%${query}%`))
    .orderBy(desc(products.createdAt))
}

// 根据 ID 获取产品
export async function getProductById(id: number): Promise<Product | undefined> {
  const [product] = await db.select().from(products).where(eq(products.id, id))
  return product
}

// 更新产品
export async function updateProduct(id: number, data: Partial<NewProduct>): Promise<Product> {
  const [product] = await db.update(products)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning()
  return product
}

// 删除产品
export async function deleteProduct(id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id))
}
```

### API 层

#### API 响应类型（lib/api-types.ts）

```typescript
// 统一 API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 产品 API 类型
export interface ProductResponse {
  id: number
  name: string
  supplyPrice: string
  shopPrice: string | null
  createdAt: string
  updatedAt: string
}

// 计算结果类型
export interface CalculationResult {
  quantity: number
  goodsCost: string
  supplierShipping: string
  customerShipping: string
  customerTotal: string
  fee: string
  totalExpense: string
  profit: string
  maxDiscount: string
}

// 导入导出类型
export interface ExportData {
  version: string
  exportDate: string
  products: ProductResponse[]
}
```

#### 产品 API 路由（app/api/products/route.ts）

```typescript
export const runtime = 'edge' // Edge Runtime 声明

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllProducts, createProduct, searchProducts } from '@/db/queries'
import type { ApiResponse, ProductResponse } from '@/lib/api-types'

// 验证 Schema
const createProductSchema = z.object({
  name: z.string().min(1, '产品名称不能为空'),
  supplyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '供货价格式不正确'),
  shopPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, '店铺价格式不正确').optional(),
})

// GET /api/products - 获取产品列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    const products = query 
      ? await searchProducts(query)
      : await getAllProducts()
    
    return NextResponse.json<ApiResponse<ProductResponse[]>>({
      success: true,
      data: products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '获取产品列表失败',
    }, { status: 500 })
  }
}

// POST /api/products - 创建产品
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createProductSchema.parse(body)
    
    const product = await createProduct(validated)
    
    return NextResponse.json<ApiResponse<ProductResponse>>({
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      message: '产品创建成功',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '创建产品失败',
    }, { status: 500 })
  }
}
```

#### 单个产品 API 路由（app/api/products/[id]/route.ts）

```typescript
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getProductById, updateProduct, deleteProduct } from '@/db/queries'
import type { ApiResponse, ProductResponse } from '@/lib/api-types'

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  supplyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  shopPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
})

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const product = await getProductById(id)
    
    if (!product) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '产品不存在',
      }, { status: 404 })
    }
    
    return NextResponse.json<ApiResponse<ProductResponse>>({
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '获取产品失败',
    }, { status: 500 })
  }
}

// PATCH /api/products/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const validated = updateProductSchema.parse(body)
    
    const product = await updateProduct(id, validated)
    
    return NextResponse.json<ApiResponse<ProductResponse>>({
      success: true,
      data: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      message: '产品更新成功',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '更新产品失败',
    }, { status: 500 })
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    await deleteProduct(id)
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: '产品删除成功',
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '删除产品失败',
    }, { status: 500 })
  }
}
```


#### 价格计算 API（app/api/calculate/route.ts）

```typescript
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ApiResponse, CalculationResult } from '@/lib/api-types'

const calculateSchema = z.object({
  supplyPrice: z.number().positive(),
  quantity: z.number().int().positive(),
  singleShipping: z.number().nonnegative().default(5),
  multiShipping: z.number().nonnegative().default(5),
  shopPrice: z.number().positive(),
})

// POST /api/calculate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = calculateSchema.parse(body)
    
    // 计算逻辑
    const goodsCost = data.supplyPrice * data.quantity
    
    // 供货商运费规则
    let supplierShipping = 0
    if (data.quantity === 1) supplierShipping = 3
    else if (data.quantity === 2) supplierShipping = 5
    else supplierShipping = 0
    
    // 客户运费
    const customerShipping = data.quantity === 1 
      ? data.singleShipping 
      : data.multiShipping * data.quantity
    
    // 客户实付
    const customerTotal = data.shopPrice * data.quantity + customerShipping
    
    // 手续费（0.6%）
    const fee = customerTotal * 0.006
    
    // 总支出
    const totalExpense = goodsCost + supplierShipping + fee
    
    // 利润
    const profit = customerTotal - totalExpense
    
    // 最大可优惠金额（利润为0时）
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
      maxDiscount: maxDiscount.toFixed(2),
    }
    
    return NextResponse.json<ApiResponse<CalculationResult>>({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: error.errors[0].message,
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '计算失败',
    }, { status: 500 })
  }
}
```

#### 导入导出 API（app/api/import-export/route.ts）

```typescript
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAllProducts, createProduct } from '@/db/queries'
import type { ApiResponse, ExportData, ProductResponse } from '@/lib/api-types'

const importSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  products: z.array(z.object({
    name: z.string(),
    supplyPrice: z.string(),
    shopPrice: z.string().nullable(),
  })),
})

// GET /api/import-export - 导出数据
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
    
    return NextResponse.json<ApiResponse<ExportData>>({
      success: true,
      data: exportData,
    })
  } catch (error) {
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '导出失败',
    }, { status: 500 })
  }
}

// POST /api/import-export - 导入数据
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = importSchema.parse(body)
    
    let successCount = 0
    let errorCount = 0
    
    for (const product of validated.products) {
      try {
        await createProduct({
          name: product.name,
          supplyPrice: product.supplyPrice,
          shopPrice: product.shopPrice,
        })
        successCount++
      } catch {
        errorCount++
      }
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      message: `导入完成：成功 ${successCount} 个，失败 ${errorCount} 个`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '数据格式不正确',
      }, { status: 400 })
    }
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: '导入失败',
    }, { status: 500 })
  }
}
```

### 前端组件层

#### OCR 处理模块（lib/ocr.ts）

```typescript
import Tesseract from 'tesseract.js'

export interface OcrResult {
  productName: string
  supplyPrice: string
  specification: string
}

// 动态导入 Tesseract（减少初始包体积）
let worker: Tesseract.Worker | null = null

async function getWorker(): Promise<Tesseract.Worker> {
  if (!worker) {
    worker = await Tesseract.createWorker('chi_sim+eng')
  }
  return worker
}

// 识别图片
export async function recognizeImage(imageFile: File): Promise<OcrResult> {
  const worker = await getWorker()
  
  const { data: { text } } = await worker.recognize(imageFile)
  
  return parseOcrText(text)
}

// 解析 OCR 文本
function parseOcrText(text: string): OcrResult {
  const lines = text.split('\n').filter(line => line.trim())
  
  // 提取产品名称（第一行包含中文的较长文字）
  let productName = ''
  for (const line of lines) {
    if (/[\u4e00-\u9fa5]/.test(line) && line.length > 3) {
      productName = line.trim()
      break
    }
  }
  
  // 提取价格（¥ 符号、"元"字、"供货价"关键词附近的数字）
  let supplyPrice = ''
  for (const line of lines) {
    const priceMatch = line.match(/[¥￥]?\s*(\d+\.?\d*)\s*元?/) ||
                       line.match(/供货价[：:]\s*(\d+\.?\d*)/)
    if (priceMatch) {
      supplyPrice = priceMatch[1]
      break
    }
  }
  
  // 提取规格（包含 * 或 × 以及 g 或 克）
  let specification = ''
  for (const line of lines) {
    if (/[*×]\s*\d+\s*[gG克]/.test(line)) {
      specification = line.trim()
      break
    }
  }
  
  return { productName, supplyPrice, specification }
}

// 清理 Worker
export async function cleanupWorker() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
```

#### 产品管理组件（components/ProductManager.tsx）

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductList } from './ProductList'
import { ProductForm } from './ProductForm'
import type { ProductResponse } from '@/lib/api-types'

export function ProductManager() {
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // 加载产品列表
  const loadProducts = async (query?: string) => {
    setIsLoading(true)
    try {
      const url = query 
        ? `/api/products?q=${encodeURIComponent(query)}`
        : '/api/products'
      
      const response = await fetch(url)
      const result = await response.json()
      
      if (result.success) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('加载产品失败:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    loadProducts()
  }, [])
  
  // 搜索处理
  const handleSearch = () => {
    loadProducts(searchQuery)
  }
  
  // 删除产品
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个产品吗？')) return
    
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (result.success) {
        loadProducts(searchQuery)
      }
    } catch (error) {
      console.error('删除产品失败:', error)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="搜索产品..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>搜索</Button>
        <Button onClick={() => setShowForm(true)}>添加产品</Button>
      </div>
      
      {showForm && (
        <ProductForm
          onSuccess={() => {
            setShowForm(false)
            loadProducts(searchQuery)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
      
      <ProductList
        products={products}
        isLoading={isLoading}
        onDelete={handleDelete}
        onEdit={(product) => {
          // 编辑逻辑
        }}
      />
    </div>
  )
}
```

#### 价格计算器组件（components/PriceCalculator.tsx）

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CalculationResult } from '@/lib/api-types'

export function PriceCalculator() {
  const [formData, setFormData] = useState({
    supplyPrice: '',
    quantity: '1',
    singleShipping: '5',
    multiShipping: '5',
    shopPrice: '',
  })
  
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplyPrice: parseFloat(formData.supplyPrice),
          quantity: parseInt(formData.quantity),
          singleShipping: parseFloat(formData.singleShipping),
          multiShipping: parseFloat(formData.multiShipping),
          shopPrice: parseFloat(formData.shopPrice),
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
      }
    } catch (error) {
      console.error('计算失败:', error)
    } finally {
      setIsCalculating(false)
    }
  }
  
  const handleDiscountClick = (percentage: number) => {
    if (!result) return
    
    const discount = parseFloat(result.customerTotal) * percentage
    const newProfit = parseFloat(result.profit) - discount
    
    alert(`优惠 ${percentage * 100}%：优惠金额 ¥${discount.toFixed(2)}，剩余利润 ¥${newProfit.toFixed(2)}`)
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>供货价</Label>
          <Input
            type="number"
            value={formData.supplyPrice}
            onChange={(e) => setFormData({ ...formData, supplyPrice: e.target.value })}
          />
        </div>
        
        <div>
          <Label>数量</Label>
          <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
          />
        </div>
        
        <div>
          <Label>单件运费</Label>
          <Input
            type="number"
            value={formData.singleShipping}
            onChange={(e) => setFormData({ ...formData, singleShipping: e.target.value })}
          />
        </div>
        
        <div>
          <Label>多件运费</Label>
          <Input
            type="number"
            value={formData.multiShipping}
            onChange={(e) => setFormData({ ...formData, multiShipping: e.target.value })}
          />
        </div>
        
        <div className="col-span-2">
          <Label>店铺售价</Label>
          <Input
            type="number"
            value={formData.shopPrice}
            onChange={(e) => setFormData({ ...formData, shopPrice: e.target.value })}
          />
        </div>
      </div>
      
      <Button onClick={handleCalculate} disabled={isCalculating}>
        {isCalculating ? '计算中...' : '计算'}
      </Button>
      
      {result && (
        <div className="space-y-2 p-4 border rounded">
          <div>商品成本: ¥{result.goodsCost}</div>
          <div>供货商运费: ¥{result.supplierShipping}</div>
          <div>客户运费: ¥{result.customerShipping}</div>
          <div>客户实付: ¥{result.customerTotal}</div>
          <div>手续费: ¥{result.fee}</div>
          <div>总支出: ¥{result.totalExpense}</div>
          <div className="font-bold">利润: ¥{result.profit}</div>
          <div>最大可优惠: ¥{result.maxDiscount}</div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleDiscountClick(0.1)}>10% 优惠</Button>
            <Button onClick={() => handleDiscountClick(0.2)}>20% 优惠</Button>
            <Button onClick={() => handleDiscountClick(0.3)}>30% 优惠</Button>
            <Button onClick={() => handleDiscountClick(0.5)}>50% 优惠</Button>
          </div>
        </div>
      )}
    </div>
  )
}
```


#### OCR 识别组件（components/OcrRecognizer.tsx）

```typescript
'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { recognizeImage, type OcrResult } from '@/lib/ocr'

interface OcrRecognizerProps {
  onResult: (result: OcrResult) => void
}

export function OcrRecognizer({ onResult }: OcrRecognizerProps) {
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 处理文件上传
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 显示预览
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
    
    // 识别
    setIsRecognizing(true)
    try {
      const result = await recognizeImage(file)
      onResult(result)
    } catch (error) {
      console.error('识别失败:', error)
    } finally {
      setIsRecognizing(false)
    }
  }
  
  // 处理粘贴
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        
        // 显示预览
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
        
        // 识别
        setIsRecognizing(true)
        try {
          const result = await recognizeImage(file)
          onResult(result)
        } catch (error) {
          console.error('识别失败:', error)
        } finally {
          setIsRecognizing(false)
        }
        
        break
      }
    }
  }
  
  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed rounded p-8 text-center"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <p>点击上传或粘贴图片（Ctrl+V）</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()}>
          选择图片
        </Button>
      </div>
      
      {preview && (
        <div>
          <img src={preview} alt="预览" className="max-w-full h-auto" />
        </div>
      )}
      
      {isRecognizing && (
        <div className="text-center">识别中...</div>
      )}
    </div>
  )
}
```

## 数据模型

### 产品数据模型

```typescript
// 数据库表结构
interface ProductTable {
  id: number              // 主键，自增
  name: string            // 产品名称，非空
  supply_price: string    // 供货价，字符串格式（避免浮点精度问题）
  shop_price: string | null  // 店铺售价，可选
  created_at: Date        // 创建时间，自动生成
  updated_at: Date        // 更新时间，自动更新
}

// 应用层类型
interface Product {
  id: number
  name: string
  supplyPrice: string     // 格式：'12.50'
  shopPrice: string | null
  createdAt: string       // ISO 8601 格式
  updatedAt: string
}

// 创建产品输入
interface CreateProductInput {
  name: string            // 必填，最少1个字符
  supplyPrice: string     // 必填，格式：数字.最多2位小数
  shopPrice?: string      // 可选，格式同上
}

// 更新产品输入
interface UpdateProductInput {
  name?: string
  supplyPrice?: string
  shopPrice?: string
}
```

### 计算数据模型

```typescript
// 计算输入
interface CalculationInput {
  supplyPrice: number     // 供货价，正数
  quantity: number        // 数量，正整数
  singleShipping: number  // 单件运费，非负数，默认5
  multiShipping: number   // 多件运费，非负数，默认5
  shopPrice: number       // 店铺售价，正数
}

// 计算输出
interface CalculationOutput {
  quantity: number
  goodsCost: string       // 商品成本 = 供货价 × 数量
  supplierShipping: string // 供货商运费（1件=3元，2件=5元，3+件=0元）
  customerShipping: string // 客户运费
  customerTotal: string   // 客户实付 = 店铺售价 × 数量 + 客户运费
  fee: string            // 手续费 = 客户实付 × 0.6%
  totalExpense: string   // 总支出 = 商品成本 + 供货商运费 + 手续费
  profit: string         // 利润 = 客户实付 - 总支出
  maxDiscount: string    // 最大可优惠金额（利润为0时）
}
```

### 导入导出数据模型

```typescript
// 导出数据格式
interface ExportData {
  version: string         // 数据格式版本，如 '1.0'
  exportDate: string      // 导出时间，ISO 8601 格式
  products: Product[]     // 产品列表
}

// 导入数据格式（同导出格式）
interface ImportData {
  version: string
  exportDate: string
  products: Array<{
    name: string
    supplyPrice: string
    shopPrice: string | null
  }>
}
```

### OCR 识别数据模型

```typescript
// OCR 识别结果
interface OcrResult {
  productName: string     // 识别的产品名称
  supplyPrice: string     // 识别的供货价
  specification: string   // 识别的规格信息
}

// OCR 识别规则
interface OcrRules {
  productName: {
    pattern: /[\u4e00-\u9fa5]/  // 包含中文
    minLength: 3                 // 最少3个字符
    position: 'first'            // 取第一行
  }
  supplyPrice: {
    patterns: [
      /[¥￥]?\s*(\d+\.?\d*)\s*元?/,  // ¥12.50 或 12.50元
      /供货价[：:]\s*(\d+\.?\d*)/     // 供货价：12.50
    ]
  }
  specification: {
    pattern: /[*×]\s*\d+\s*[gG克]/  // 6*500g 或 6×500克
  }
}
```

## 数据流图

### 产品管理流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as React 组件
    participant API as Edge API
    participant DB as Neon Database
    
    User->>UI: 创建产品
    UI->>UI: Zod 验证
    UI->>API: POST /api/products
    API->>API: Zod 验证
    API->>DB: INSERT INTO products
    DB-->>API: 返回产品数据
    API-->>UI: JSON 响应
    UI-->>User: 显示成功消息
```

### 价格计算流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 计算器组件
    participant API as Edge API
    
    User->>UI: 输入参数
    UI->>API: POST /api/calculate
    API->>API: 验证输入
    API->>API: 执行计算逻辑
    API-->>UI: 返回计算结果
    UI-->>User: 显示结果和优惠选项
```

### OCR 识别流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as OCR 组件
    participant Tesseract as Tesseract.js
    participant Form as 产品表单
    
    User->>UI: 上传/粘贴图片
    UI->>UI: 显示预览
    UI->>Tesseract: 识别图片（本地）
    Tesseract->>Tesseract: OCR 处理
    Tesseract-->>UI: 返回文本
    UI->>UI: 解析文本
    UI-->>Form: 填充表单
    Form-->>User: 显示识别结果
```

### 数据导入导出流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant UI as 导入导出组件
    participant API as Edge API
    participant DB as Neon Database
    
    rect rgb(200, 220, 250)
        Note over User,DB: 导出流程
        User->>UI: 点击导出
        UI->>API: GET /api/import-export
        API->>DB: SELECT * FROM products
        DB-->>API: 返回所有产品
        API-->>UI: JSON 数据
        UI->>UI: 生成文件
        UI-->>User: 下载 JSON 文件
    end
    
    rect rgb(250, 220, 200)
        Note over User,DB: 导入流程
        User->>UI: 选择 JSON 文件
        UI->>UI: 读取文件
        UI->>API: POST /api/import-export
        API->>API: 验证数据格式
        loop 每个产品
            API->>DB: INSERT INTO products
        end
        API-->>UI: 导入结果
        UI-->>User: 显示成功/失败统计
    end
```


## Correctness Properties

属性（Property）是系统在所有有效执行中应该保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。

基于需求文档的验收标准，我们定义以下可测试的正确性属性：

### Property 1: CRUD 操作数据一致性

*对于任何*产品数据，执行创建操作后，应该能够通过 ID 读取到相同的产品信息；执行更新操作后，读取的数据应该反映更新内容；执行删除操作后，该产品应该不再存在于数据库中。

**Validates: 验收标准 1（所有 CRUD 操作正常）**

**测试策略**：
- 生成随机产品数据（名称、供货价、店铺售价）
- 创建产品，验证返回的 ID 和数据
- 通过 ID 读取，验证数据一致性
- 更新部分字段，验证更新后的数据
- 删除产品，验证无法再读取

### Property 2: 价格计算数学正确性

*对于任何*有效的计算输入参数（供货价、数量、运费、店铺售价），计算结果应该严格遵循以下公式：
- 商品成本 = 供货价 × 数量
- 供货商运费 = (数量=1 ? 3 : 数量=2 ? 5 : 0)
- 客户运费 = (数量=1 ? 单件运费 : 多件运费 × 数量)
- 客户实付 = 店铺售价 × 数量 + 客户运费
- 手续费 = 客户实付 × 0.006
- 总支出 = 商品成本 + 供货商运费 + 手续费
- 利润 = 客户实付 - 总支出
- 最大优惠 = 客户实付 - (商品成本 + 供货商运费) / 0.994

**Validates: 验收标准 2（价格计算准确无误）**

**测试策略**：
- 生成随机的有效输入参数
- 调用计算 API
- 独立计算预期结果
- 验证每个计算字段的值（允许 0.01 的浮点误差）


### Property 3: 导入导出往返一致性（Round-trip Property）

*对于任何*产品数据集合，导出为 JSON 格式后再导入，应该能够恢复等价的产品数据（ID 可能不同，但名称、价格等业务数据应该一致）。

**Validates: 验收标准 4（导入导出功能正常）**

**测试策略**：
- 生成随机产品数据集合
- 创建这些产品到数据库
- 导出所有产品为 JSON
- 清空数据库或使用新数据库
- 导入 JSON 数据
- 验证导入后的产品数据与原始数据一致（忽略 ID 和时间戳）

### Property 4: 输入验证拒绝无效数据

*对于任何*不符合验证规则的输入数据（空名称、负数价格、非数字价格、超过2位小数等），系统应该拒绝该输入并返回明确的错误信息，而不是将无效数据存入数据库。

**Validates: 验收标准 20（输入验证完整）**

**测试策略**：
- 生成各种无效输入：
  - 空字符串名称
  - 负数价格
  - 非数字价格字符串
  - 超过2位小数的价格
  - 缺少必填字段
- 尝试创建/更新产品
- 验证返回 400 错误
- 验证错误消息清晰
- 验证数据库未被修改

## 错误处理

### 错误分类

系统采用分层错误处理策略，确保所有错误都能被适当捕获和处理：

#### 1. 客户端验证错误（400 Bad Request）

**触发条件**：
- 输入数据不符合 Zod Schema
- 必填字段缺失
- 数据格式不正确
- 数值超出范围

**处理方式**：
```typescript
// Zod 验证失败
if (error instanceof z.ZodError) {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: error.errors[0].message, // 返回第一个错误
  }, { status: 400 })
}
```

**用户体验**：
- 显示具体的错误字段和原因
- 保持用户已输入的数据
- 高亮错误字段


#### 2. 资源不存在错误（404 Not Found）

**触发条件**：
- 请求的产品 ID 不存在
- 查询结果为空

**处理方式**：
```typescript
const product = await getProductById(id)
if (!product) {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: '产品不存在',
  }, { status: 404 })
}
```

**用户体验**：
- 显示友好的"未找到"消息
- 提供返回列表的链接

#### 3. 数据库错误（500 Internal Server Error）

**触发条件**：
- 数据库连接失败
- SQL 查询错误
- 数据库超时

**处理方式**：
```typescript
try {
  const product = await createProduct(data)
  return NextResponse.json({ success: true, data: product })
} catch (error) {
  console.error('Database error:', error) // 记录详细错误
  return NextResponse.json<ApiResponse>({
    success: false,
    error: '数据库操作失败，请稍后重试', // 用户友好消息
  }, { status: 500 })
}
```

**用户体验**：
- 显示通用错误消息（不暴露内部细节）
- 提供重试按钮
- 记录错误日志供调试

#### 4. OCR 识别错误

**触发条件**：
- 图片格式不支持
- 图片损坏
- Tesseract.js 加载失败
- 识别超时

**处理方式**：
```typescript
try {
  const result = await recognizeImage(file)
  onResult(result)
} catch (error) {
  console.error('OCR error:', error)
  // 显示错误提示，允许用户手动输入
  showError('图片识别失败，请手动输入产品信息')
}
```

**用户体验**：
- 显示识别失败提示
- 允许用户手动输入
- 不阻塞其他功能

#### 5. 网络错误

**触发条件**：
- API 请求超时
- 网络连接中断
- CORS 错误

**处理方式**：
```typescript
try {
  const response = await fetch('/api/products')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  if (error instanceof TypeError) {
    // 网络错误
    showError('网络连接失败，请检查网络设置')
  } else {
    showError('请求失败，请稍后重试')
  }
}
```

**用户体验**：
- 显示网络错误提示
- 提供重试按钮
- 保存用户输入数据

### 统一错误响应格式

所有 API 端点使用统一的错误响应格式：

```typescript
interface ApiResponse<T = unknown> {
  success: boolean      // 操作是否成功
  data?: T             // 成功时的数据
  error?: string       // 失败时的错误消息
  message?: string     // 成功时的提示消息
}
```

### 错误日志记录

```typescript
// 生产环境错误日志
function logError(context: string, error: unknown) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  }
  
  console.error('[ERROR]', JSON.stringify(errorInfo))
  
  // 未来可以集成错误监控服务（如 Sentry）
}
```


## 测试策略

### 双重测试方法

系统采用单元测试和基于属性的测试（Property-Based Testing, PBT）相结合的策略，确保全面的代码覆盖和正确性验证。

**单元测试**：
- 验证特定示例和边界情况
- 测试错误条件和异常处理
- 测试组件集成点
- 快速反馈，易于调试

**属性测试**：
- 验证跨所有输入的通用属性
- 通过随机化实现全面的输入覆盖
- 发现边界情况和意外行为
- 每个测试最少 100 次迭代

**平衡原则**：
- 避免编写过多单元测试
- 属性测试处理大量输入覆盖
- 单元测试聚焦于：
  - 演示正确行为的具体示例
  - 组件之间的集成点
  - 边界情况和错误条件
- 属性测试聚焦于：
  - 对所有输入都成立的通用属性
  - 通过随机化实现全面覆盖

### 测试技术栈

**测试框架**：
- Vitest（快速、兼容 Vite）
- React Testing Library（组件测试）
- fast-check（属性测试库）

**配置示例**：
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'edge-runtime', // Edge Runtime 环境
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})
```

### 属性测试配置

每个属性测试必须：
1. 运行最少 100 次迭代（由于随机化）
2. 引用设计文档中的属性
3. 使用标签格式：**Feature: gift-box-calculator-rebuild, Property {number}: {property_text}**

**示例**：
```typescript
import fc from 'fast-check'
import { describe, it, expect } from 'vitest'

describe('Property 2: 价格计算数学正确性', () => {
  it('Feature: gift-box-calculator-rebuild, Property 2: 价格计算数学正确性', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 1000 }), // supplyPrice
        fc.integer({ min: 1, max: 100 }),   // quantity
        fc.float({ min: 0, max: 50 }),      // singleShipping
        fc.float({ min: 0, max: 50 }),      // multiShipping
        fc.float({ min: 0.01, max: 1000 }), // shopPrice
        async (supplyPrice, quantity, singleShipping, multiShipping, shopPrice) => {
          // 调用计算 API
          const result = await calculate({
            supplyPrice,
            quantity,
            singleShipping,
            multiShipping,
            shopPrice,
          })
          
          // 独立计算预期值
          const expectedGoodsCost = supplyPrice * quantity
          const expectedSupplierShipping = quantity === 1 ? 3 : quantity === 2 ? 5 : 0
          const expectedCustomerShipping = quantity === 1 ? singleShipping : multiShipping * quantity
          const expectedCustomerTotal = shopPrice * quantity + expectedCustomerShipping
          const expectedFee = expectedCustomerTotal * 0.006
          const expectedTotalExpense = expectedGoodsCost + expectedSupplierShipping + expectedFee
          const expectedProfit = expectedCustomerTotal - expectedTotalExpense
          
          // 验证（允许浮点误差）
          expect(parseFloat(result.goodsCost)).toBeCloseTo(expectedGoodsCost, 2)
          expect(parseFloat(result.profit)).toBeCloseTo(expectedProfit, 2)
        }
      ),
      { numRuns: 100 } // 最少 100 次迭代
    )
  })
})
```

### 单元测试示例

```typescript
describe('产品 API', () => {
  it('应该拒绝空名称', async () => {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        supplyPrice: '10.00',
      }),
    })
    
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('名称')
  })
  
  it('应该拒绝负数价格', async () => {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试产品',
        supplyPrice: '-10.00',
      }),
    })
    
    expect(response.status).toBe(400)
  })
  
  it('应该成功创建有效产品', async () => {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: '测试产品',
        supplyPrice: '10.50',
        shopPrice: '15.00',
      }),
    })
    
    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('测试产品')
  })
})
```

### 集成测试

```typescript
describe('端到端产品管理流程', () => {
  it('应该完成完整的 CRUD 流程', async () => {
    // 创建
    const createRes = await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: '集成测试产品',
        supplyPrice: '20.00',
      }),
    })
    const created = await createRes.json()
    const productId = created.data.id
    
    // 读取
    const getRes = await fetch(`/api/products/${productId}`)
    const fetched = await getRes.json()
    expect(fetched.data.name).toBe('集成测试产品')
    
    // 更新
    const updateRes = await fetch(`/api/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ shopPrice: '30.00' }),
    })
    const updated = await updateRes.json()
    expect(updated.data.shopPrice).toBe('30.00')
    
    // 删除
    const deleteRes = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    })
    expect(deleteRes.status).toBe(200)
    
    // 验证已删除
    const getDeletedRes = await fetch(`/api/products/${productId}`)
    expect(getDeletedRes.status).toBe(404)
  })
})
```

### Edge Runtime 兼容性测试

```typescript
describe('Edge Runtime 兼容性', () => {
  it('所有 API 路由应该声明 Edge Runtime', () => {
    // 静态分析测试
    const apiRoutes = [
      'app/api/products/route.ts',
      'app/api/products/[id]/route.ts',
      'app/api/calculate/route.ts',
      'app/api/import-export/route.ts',
    ]
    
    for (const route of apiRoutes) {
      const content = fs.readFileSync(route, 'utf-8')
      expect(content).toContain("export const runtime = 'edge'")
    }
  })
  
  it('不应该导入 Node.js 特定模块', () => {
    const forbiddenModules = ['fs', 'path', 'crypto']
    const sourceFiles = glob.sync('app/**/*.ts')
    
    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      for (const module of forbiddenModules) {
        expect(content).not.toMatch(new RegExp(`from ['"]${module}['"]`))
      }
    }
  })
})
```

### 测试覆盖率目标

- 代码覆盖率：> 80%
- 分支覆盖率：> 75%
- 函数覆盖率：> 90%
- 属性测试：每个属性最少 100 次迭代

### 持续集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## 部署和运维

### EdgeOne Pages 部署配置

**构建设置**：
```json
{
  "buildCommand": "pnpm install && pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

**环境变量**：
```env
# 必填
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# 可选
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.edgeone.app
```

### 数据库迁移

使用 Drizzle Kit 管理数据库 Schema：

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config
```

**迁移命令**：
```bash
# 生成迁移文件
pnpm drizzle-kit generate:pg

# 应用迁移
pnpm drizzle-kit push:pg
```

### 监控和日志

**性能监控**：
- EdgeOne Pages 内置性能监控
- 监控 API 响应时间
- 监控数据库查询性能

**错误监控**：
- 集成 Sentry（可选）
- 记录所有 500 错误
- 记录数据库连接失败

**日志级别**：
```typescript
enum LogLevel {
  ERROR = 'error',   // 错误和异常
  WARN = 'warn',     // 警告信息
  INFO = 'info',     // 一般信息
  DEBUG = 'debug',   // 调试信息
}
```

### 备份策略

**数据库备份**：
- Neon Database 自动每日备份
- 保留 7 天备份历史
- 支持时间点恢复（PITR）

**手动备份**：
```bash
# 导出所有产品数据
curl https://your-domain.edgeone.app/api/import-export > backup.json
```

### 回滚策略

**代码回滚**：
- EdgeOne Pages 支持一键回滚到历史版本
- 保留最近 10 个部署版本

**数据库回滚**：
- 使用 Neon Database 时间点恢复
- 或从备份文件恢复

## 性能优化

### 前端优化

1. **代码分割**：
```typescript
// 动态导入 Tesseract.js
const Tesseract = dynamic(() => import('tesseract.js'), {
  ssr: false,
  loading: () => <div>加载 OCR 引擎...</div>,
})
```

2. **图片优化**：
```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Logo"
  priority
/>
```

3. **缓存策略**：
```typescript
// 静态资源缓存
export const revalidate = 3600 // 1 小时
```

### API 优化

1. **数据库连接池**：
```typescript
// Neon 自动管理连接池
const sql = neon(process.env.DATABASE_URL!, {
  fetchConnectionCache: true,
})
```

2. **查询优化**：
```typescript
// 使用索引
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  // 添加索引以加速搜索
}, (table) => ({
  nameIdx: index('name_idx').on(table.name),
}))
```

3. **响应压缩**：
```typescript
// Next.js 自动启用 gzip/brotli 压缩
```

### Edge Runtime 优化

1. **减少包体积**：
- 使用 Tree Shaking
- 避免大型依赖
- 动态导入非关键代码

2. **利用 CDN 缓存**：
- 静态资源自动缓存
- API 响应可选缓存

3. **全球分发**：
- EdgeOne 3200+ 节点
- 自动路由到最近节点

## 安全考虑

### 输入验证

所有用户输入必须通过 Zod 验证：

```typescript
const productSchema = z.object({
  name: z.string().min(1).max(200),
  supplyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/),
  shopPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
})
```

### SQL 注入防护

使用 Drizzle ORM 参数化查询：

```typescript
// 安全：参数化查询
await db.select()
  .from(products)
  .where(ilike(products.name, `%${query}%`))

// 危险：字符串拼接（不要这样做）
// await db.execute(`SELECT * FROM products WHERE name LIKE '%${query}%'`)
```

### XSS 防护

React 自动转义：

```typescript
// 安全：React 自动转义
<div>{productName}</div>

// 危险：dangerouslySetInnerHTML（避免使用）
// <div dangerouslySetInnerHTML={{ __html: productName }} />
```

### HTTPS 强制

EdgeOne Pages 自动强制 HTTPS，所有 HTTP 请求自动重定向到 HTTPS。

### 环境变量保护

```typescript
// 永远不要在客户端代码中使用敏感环境变量
// ❌ 错误
const dbUrl = process.env.DATABASE_URL // 在客户端组件中

// ✅ 正确
// 仅在服务器端（API 路由）使用
export async function GET() {
  const dbUrl = process.env.DATABASE_URL // 安全
}
```

## 未来扩展

### 可能的功能增强

1. **用户认证**：
   - 集成 NextAuth.js
   - 支持多用户管理
   - 角色权限控制

2. **高级报表**：
   - 利润趋势分析
   - 产品销售统计
   - 导出 Excel 报表

3. **批量操作**：
   - 批量编辑产品
   - 批量删除
   - 批量价格调整

4. **API 扩展**：
   - RESTful API 完整支持
   - GraphQL API（可选）
   - Webhook 通知

5. **移动应用**：
   - React Native 应用
   - 共享业务逻辑
   - 离线支持

### 技术债务

当前版本的已知限制：

1. **OCR 准确性**：
   - 依赖 Tesseract.js 能力
   - 复杂图片识别率较低
   - 未来可考虑云端 OCR API

2. **搜索功能**：
   - 当前仅支持简单模糊搜索
   - 未来可集成全文搜索（如 Algolia）

3. **数据验证**：
   - 价格精度限制为 2 位小数
   - 未来可支持更多货币格式

4. **测试覆盖**：
   - 需要增加更多边界情况测试
   - 需要端到端测试

## 总结

本设计文档描述了礼盒报价计算器系统的完整技术架构，专为 EdgeOne Pages 平台优化。系统采用 Edge Runtime 兼容的技术栈，使用 Neon Database Serverless 作为数据存储，Tesseract.js 实现前端 OCR 识别，确保在全球边缘节点上高效运行。

关键设计决策：
- Edge Runtime 完全兼容（无 Node.js API）
- Serverless 数据库连接（Neon + Drizzle）
- 前端 OCR 处理（隐私保护）
- 统一错误处理和 API 响应格式
- 双重测试策略（单元测试 + 属性测试）
- 全球 CDN 分发（EdgeOne 3200+ 节点）

系统设计遵循 SOLID 原则，具有良好的可维护性和可扩展性，为未来功能增强奠定了坚实基础。
