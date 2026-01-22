import { eq, like, sql, and, SQL } from "drizzle-orm"
import { getDb } from "coze-coding-dev-sdk"
import { products, insertProductSchema, updateProductSchema } from "./shared/schema"
import type { Product, InsertProduct, UpdateProduct } from "./shared/schema"

export class ProductManager {
  async createProduct(data: InsertProduct): Promise<Product> {
    const db = await getDb()

    console.log('ProductManager.createProduct - 输入数据:', data)

    // 验证数据
    const validated = insertProductSchema.parse(data)
    console.log('ProductManager.createProduct - 验证通过数据:', validated)

    // 转换为数据库期望的格式
    const dbData: any = {
      name: validated.name,
      supplierPrice: validated.supplierPrice,
      shopPrice: validated.shopPrice || null,
    }

    console.log('ProductManager.createProduct - 数据库数据:', dbData)

    const [product] = await db.insert(products).values(dbData).returning()
    console.log('ProductManager.createProduct - 创建成功:', product)

    return product
  }

  async getProducts(options: {
    skip?: number
    limit?: number
    search?: string
  } = {}): Promise<Product[]> {
    const { skip = 0, limit = 100, search } = options
    const db = await getDb()

    const conditions: SQL[] = []

    if (search && search.trim()) {
      conditions.push(like(products.name, `%${search.trim()}%`))
    }

    if (conditions.length > 0) {
      return db
        .select()
        .from(products)
        .where(and(...conditions))
        .limit(limit)
        .offset(skip)
        .orderBy(products.createdAt)
    }

    return db
      .select()
      .from(products)
      .limit(limit)
      .offset(skip)
      .orderBy(products.createdAt)
  }

  async getProductById(id: string): Promise<Product | null> {
    const db = await getDb()
    const [product] = await db.select().from(products).where(eq(products.id, id))
    return product || null
  }

  async updateProduct(id: string, data: UpdateProduct): Promise<Product | null> {
    const db = await getDb()

    // 验证数据
    const validated = updateProductSchema.parse(data)

    // 转换为数据库期望的格式
    const dbData: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (validated.name !== undefined) {
      dbData.name = validated.name
    }
    if (validated.supplierPrice !== undefined) {
      dbData.supplierPrice = validated.supplierPrice
    }
    if (validated.shopPrice !== undefined) {
      dbData.shopPrice = validated.shopPrice || null
    }

    const [product] = await db
      .update(products)
      .set(dbData)
      .where(eq(products.id, id))
      .returning()
    return product || null
  }

  async deleteProduct(id: string): Promise<boolean> {
    const db = await getDb()
    const result = await db.delete(products).where(eq(products.id, id))
    return (result.rowCount ?? 0) > 0
  }
}

export const productManager = new ProductManager()
