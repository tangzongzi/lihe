import { db } from './client'
import { products, type Product, type NewProduct } from './schema'
import { eq, desc, ilike } from 'drizzle-orm'

/**
 * 数据库查询函数
 * 所有函数都使用参数化查询，防止 SQL 注入
 */

/**
 * 创建产品
 */
export async function createProduct(data: NewProduct): Promise<Product> {
  const [product] = await db
    .insert(products)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning()
  
  return product
}

/**
 * 获取所有产品（按创建时间倒序）
 */
export async function getAllProducts(): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
}

/**
 * 搜索产品（按名称模糊匹配）
 */
export async function searchProducts(query: string): Promise<Product[]> {
  return db
    .select()
    .from(products)
    .where(ilike(products.name, `%${query}%`))
    .orderBy(desc(products.createdAt))
}

/**
 * 根据 ID 获取产品
 */
export async function getProductById(id: number): Promise<Product | undefined> {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1)
  
  return product
}

/**
 * 更新产品
 */
export async function updateProduct(
  id: number,
  data: Partial<NewProduct>
): Promise<Product | undefined> {
  const [product] = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning()
  
  return product
}

/**
 * 删除产品
 */
export async function deleteProduct(id: number): Promise<boolean> {
  const result = await db
    .delete(products)
    .where(eq(products.id, id))
  
  return result.rowCount !== null && result.rowCount > 0
}
