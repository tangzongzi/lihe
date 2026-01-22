import { eq, like, desc } from "drizzle-orm"
import { getDb } from "coze-coding-dev-sdk"
import { products, insertProductSchema, updateProductSchema } from "./shared/schema"
import type { Product, InsertProduct, UpdateProduct } from "./shared/schema"

export class ProductManager {
  /**
   * 创建产品
   */
  async createProduct(data: InsertProduct): Promise<Product> {
    const db = await getDb()

    // 验证输入数据
    const validated = insertProductSchema.parse(data)

    // 插入数据库
    const [product] = await db
      .insert(products)
      .values({
        name: validated.name,
        supplierPrice: validated.supplierPrice,
        shopPrice: validated.shopPrice || null,
      })
      .returning()

    return product
  }

  /**
   * 获取产品列表
   */
  async getProducts(options: {
    skip?: number
    limit?: number
    search?: string
  } = {}): Promise<Product[]> {
    const { skip = 0, limit = 100, search } = options
    const db = await getDb()

    let query = db.select().from(products)

    // 搜索过滤
    if (search?.trim()) {
      query = query.where(like(products.name, `%${search.trim()}%`))
    }

    // 排序和分页
    const result = await query
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(skip)

    return result
  }

  /**
   * 根据 ID 获取产品
   */
  async getProductById(id: string): Promise<Product | null> {
    const db = await getDb()
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1)

    return product || null
  }

  /**
   * 更新产品
   */
  async updateProduct(id: string, data: UpdateProduct): Promise<Product | null> {
    const db = await getDb()

    // 验证输入数据
    const validated = updateProductSchema.parse(data)

    // 构建更新数据
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.supplierPrice !== undefined) updateData.supplierPrice = validated.supplierPrice
    if (validated.shopPrice !== undefined) updateData.shopPrice = validated.shopPrice || null

    // 更新数据库
    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()

    return product || null
  }

  /**
   * 删除产品
   */
  async deleteProduct(id: string): Promise<boolean> {
    const db = await getDb()
    const result = await db.delete(products).where(eq(products.id, id))
    return (result.rowCount ?? 0) > 0
  }
}

export const productManager = new ProductManager()
