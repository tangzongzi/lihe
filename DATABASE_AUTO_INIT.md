# 数据库自动初始化说明

## 概述

本项目已实现数据库自动初始化功能，**无需手动访问 `/api/init-db` 接口**。数据库表会在首次使用时自动创建。

## 工作原理

### 1. 自动初始化机制

在 `src/storage/database/dbInit.ts` 中实现了自动初始化逻辑：

```typescript
export async function ensureDbInitialized(): Promise<void>
```

该函数会：
1. 检查数据库表是否已存在
2. 如果不存在，自动创建 `products` 表和索引
3. 使用单例模式，确保只初始化一次
4. 支持并发调用，避免重复初始化

### 2. 集成到 ProductManager

每个数据库操作方法都会先调用 `ensureDbInitialized()`：

```typescript
async createProduct(data: InsertProduct): Promise<Product> {
  // 确保数据库已初始化
  await ensureDbInitialized()
  
  const db = await getDb()
  // ... 后续操作
}
```

这确保了：
- 首次操作时自动创建表
- 后续操作直接使用已创建的表
- 无需用户手动干预

## 优势

### ✅ 用户体验优化

- **零配置**：用户无需手动初始化数据库
- **自动化**：首次使用时自动创建表结构
- **透明化**：用户无感知，自动完成

### ✅ 部署简化

- **EdgeOne 部署**：配置环境变量后直接部署
- **无需额外步骤**：不需要访问特殊 URL
- **生产就绪**：适合正式环境使用

### ✅ 开发友好

- **本地开发**：启动后直接使用
- **测试环境**：自动创建测试数据库
- **CI/CD**：无需额外初始化脚本

## 技术实现

### 初始化流程

```
用户首次操作
    ↓
调用 ProductManager 方法
    ↓
ensureDbInitialized()
    ↓
检查表是否存在
    ↓
不存在 → 创建表和索引
    ↓
标记已初始化
    ↓
执行实际操作
```

### 并发安全

使用 Promise 缓存机制，确保多个并发请求不会重复初始化：

```typescript
let isInitialized = false
let initPromise: Promise<void> | null = null

if (isInitialized) return
if (initPromise) return initPromise

initPromise = (async () => {
  // 初始化逻辑
})()
```

### 错误处理

- 初始化失败时会重置状态，允许下次重试
- 详细的日志输出，便于排查问题
- 不影响后续正常操作

## 数据库表结构

自动创建的 `products` 表结构：

```sql
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  supplier_price NUMERIC(10, 2) NOT NULL,
  shop_price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
)

CREATE INDEX IF NOT EXISTS products_name_idx ON products (name)
```

## 性能考虑

### 首次操作延迟

- **首次添加产品**：可能需要 1-3 秒（创建表）
- **后续操作**：毫秒级响应（表已存在）
- **用户体验**：首次略慢，但无需手动操作

### 优化措施

1. **单例模式**：确保只初始化一次
2. **快速检查**：先检查表是否存在
3. **并发控制**：避免重复创建
4. **日志输出**：便于监控和调试

## 与旧版本对比

### 旧版本（手动初始化）

```
部署 → 访问 /api/init-db → 手动初始化 → 开始使用
```

**缺点**：
- 需要额外步骤
- 容易忘记初始化
- 用户体验差

### 新版本（自动初始化）

```
部署 → 直接使用（自动初始化）
```

**优点**：
- 零配置
- 自动化
- 生产就绪

## 日志输出

初始化过程会输出详细日志：

```
[DB Init] 检查数据库表...
[DB Init] products 表不存在，开始创建...
[DB Init] products 表创建成功
[DB Init] 索引创建成功
[DB Init] 数据库初始化完成
```

后续操作：

```
[DB Init] products 表已存在
```

## 环境变量配置

### EdgeOne + Supabase

```bash
STORAGE_TYPE=database
NODE_ENV=production
PGDATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 本地开发

```bash
STORAGE_TYPE=database
PGDATABASE_URL=postgresql://localhost:5432/mydb
```

### 文件存储（测试）

```bash
STORAGE_TYPE=file
```

## 常见问题

### Q: 首次添加产品很慢？

A: 这是正常的，因为需要创建数据库表。后续操作会很快。

### Q: 如何确认表已创建？

A: 查看应用日志，会显示 `[DB Init] products 表已存在`。

### Q: 初始化失败怎么办？

A: 检查数据库连接配置，查看错误日志。系统会在下次操作时自动重试。

### Q: 可以手动初始化吗？

A: 不需要，系统会自动处理。旧的 `/api/init-db` 接口已移除。

## 总结

数据库自动初始化功能让部署和使用更加简单：

- ✅ **EdgeOne 部署**：配置环境变量后直接部署
- ✅ **Supabase 集成**：自动创建表结构
- ✅ **零配置使用**：首次操作自动初始化
- ✅ **生产就绪**：适合正式环境

无需任何手动步骤，开箱即用！
