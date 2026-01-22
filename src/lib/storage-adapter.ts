import { promises as fs } from 'fs'
import path from 'path'
import { productManager, runMigrations, isDatabaseInitialized } from '@/storage/database'
import type { Product, InsertProduct, UpdateProduct } from '@/storage/database/shared/schema'

// 存储类型
type StorageType = 'database' | 'file'

// 从环境变量获取存储类型，默认使用数据库
const STORAGE_TYPE: StorageType = (process.env.STORAGE_TYPE as StorageType) || 'database'

// 数据库初始化标志
let dbInitialized = false

/**
 * 确保数据库已初始化
 */
async function ensureDatabaseReady(): Promise<void> {
  if (dbInitialized) return

  try {
    const isInit = await isDatabaseInitialized()
    if (!isInit) {
      console.log('[Storage] 首次使用，初始化数据库...')
      await runMigrations()
    }
    dbInitialized = true
  } catch (error) {
    console.error('[Storage] 数据库初始化失败:', error)
    throw error
  }
}

// 文件存储路径
const DATA_DIR = '/tmp/data'
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')

// 产品数据接口（文件存储用）
interface FileProduct {
  id: string
  name: string
  supplierPrice: string
  shopPrice?: string
  createdAt: string
  updatedAt?: string
}

// 确保数据目录和文件存在
async function ensureDataFile() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }

  try {
    await fs.access(PRODUCTS_FILE)
  } catch {
    await fs.writeFile(PRODUCTS_FILE, '[]', 'utf-8')
  }
}

// 读取产品数据（文件存储）
async function readProducts(): Promise<FileProduct[]> {
  await ensureDataFile()
  const content = await fs.readFile(PRODUCTS_FILE, 'utf-8')
  return JSON.parse(content)
}

// 写入产品数据（文件存储）
async function writeProducts(products: FileProduct[]): Promise<void> {
  await ensureDataFile()
  await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8')
}

// 生成 UUID
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 转换数据库产品到文件产品格式
function toFileProduct(product: Product): FileProduct {
  return {
    id: product.id,
    name: product.name,
    supplierPrice: product.supplierPrice.toString(),
    shopPrice: product.shopPrice?.toString(),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt || undefined,
  }
}

// 转换文件产品到数据库产品格式
function toDbProduct(product: FileProduct): Product {
  return {
    id: product.id,
    name: product.name,
    supplierPrice: product.supplierPrice as any, // Drizzle 会处理类型转换
    shopPrice: product.shopPrice as any,
    createdAt: product.createdAt as any,
    updatedAt: product.updatedAt as any,
  }
}

/**
 * 存储适配器 - 统一文件存储和数据库存储接口
 */
export class ProductStorageAdapter {
  private storageType: StorageType

  constructor() {
    this.storageType = STORAGE_TYPE
    console.log(`ProductStorageAdapter: 使用 ${this.storageType} 存储方式`)
  }

  /**
   * 创建产品
   */
  async createProduct(data: InsertProduct): Promise<Product> {
    if (this.storageType === 'database') {
      await ensureDatabaseReady()
      return productManager.createProduct(data)
    } else {
      // 使用文件存储
      const products = await readProducts()

      const newProduct: FileProduct = {
        id: generateId(),
        name: data.name,
        supplierPrice: String(data.supplierPrice),
        shopPrice: data.shopPrice ? String(data.shopPrice) : undefined,
        createdAt: new Date().toISOString(),
      }

      products.push(newProduct)
      await writeProducts(products)

      return toDbProduct(newProduct)
    }
  }

  /**
   * 获取产品列表
   */
  async getProducts(options: {
    skip?: number
    limit?: number
    search?: string
  } = {}): Promise<Product[]> {
    if (this.storageType === 'database') {
      await ensureDatabaseReady()
      return productManager.getProducts(options)
    } else {
      // 使用文件存储
      const { skip = 0, limit = 100, search } = options
      const products = await readProducts()

      let filteredProducts = products

      // 搜索过滤
      if (search && search.trim()) {
        const lowerSearch = search.toLowerCase().trim()
        filteredProducts = products.filter((p) =>
          p.name.toLowerCase().includes(lowerSearch)
        )
      }

      // 分页
      const paginatedProducts = filteredProducts.slice(skip, skip + limit)

      return paginatedProducts.map(toDbProduct)
    }
  }

  /**
   * 根据 ID 获取产品
   */
  async getProductById(id: string): Promise<Product | null> {
    if (this.storageType === 'database') {
      await ensureDatabaseReady()
      return productManager.getProductById(id)
    } else {
      const products = await readProducts()
      const product = products.find((p) => p.id === id)
      return product ? toDbProduct(product) : null
    }
  }

  /**
   * 更新产品
   */
  async updateProduct(id: string, data: UpdateProduct): Promise<Product | null> {
    if (this.storageType === 'database') {
      await ensureDatabaseReady()
      return productManager.updateProduct(id, data)
    } else {
      const products = await readProducts()
      const index = products.findIndex((p) => p.id === id)

      if (index === -1) {
        return null
      }

      // 更新字段
      if (data.name !== undefined) {
        products[index].name = data.name
      }
      if (data.supplierPrice !== undefined) {
        products[index].supplierPrice = String(data.supplierPrice)
      }
      if (data.shopPrice !== undefined) {
        products[index].shopPrice = data.shopPrice ? String(data.shopPrice) : undefined
      }
      products[index].updatedAt = new Date().toISOString()

      await writeProducts(products)

      return toDbProduct(products[index])
    }
  }

  /**
   * 删除产品
   */
  async deleteProduct(id: string): Promise<boolean> {
    if (this.storageType === 'database') {
      await ensureDatabaseReady()
      return productManager.deleteProduct(id)
    } else {
      const products = await readProducts()
      const index = products.findIndex((p) => p.id === id)

      if (index === -1) {
        return false
      }

      products.splice(index, 1)
      await writeProducts(products)

      return true
    }
  }

  /**
   * 获取当前存储类型
   */
  getStorageType(): StorageType {
    return this.storageType
  }
}

// 导出单例
export const productStorage = new ProductStorageAdapter()
