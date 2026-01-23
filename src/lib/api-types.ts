/**
 * API 响应和请求类型定义
 */

/**
 * 统一 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * 产品响应类型
 */
export interface ProductResponse {
  id: number
  name: string
  supplyPrice: string
  shopPrice: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 计算结果类型
 */
export interface CalculationResult {
  quantity: number
  goodsCost: string          // 商品成本
  supplierShipping: string   // 供货商运费
  customerShipping: string   // 客户运费
  customerTotal: string      // 客户实付
  fee: string               // 手续费
  totalExpense: string      // 总支出
  profit: string            // 利润
  maxDiscount: string       // 最大可优惠金额
}

/**
 * 导出数据格式
 */
export interface ExportData {
  version: string
  exportDate: string
  products: ProductResponse[]
}

/**
 * 导入数据格式
 */
export interface ImportData {
  version: string
  exportDate: string
  products: Array<{
    name: string
    supplyPrice: string
    shopPrice: string | null
  }>
}
