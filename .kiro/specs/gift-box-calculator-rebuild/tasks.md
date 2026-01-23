# 实施计划：礼盒报价计算器（EdgeOne Pages 优化版）

## 概述

本实施计划将礼盒报价计算器系统的设计转换为可执行的编码任务。系统专为腾讯 EdgeOne Pages 平台优化，完全兼容 Edge Runtime，使用 Next.js 16、Neon Database Serverless 和 Tesseract.js OCR。

实施策略：
- 从数据层开始，逐步向上构建
- 每个任务都包含具体的文件和组件
- 测试任务标记为可选（*），可根据需要跳过
- 在关键节点设置检查点，确保增量验证

## 任务列表

- [ ] 1. 项目初始化和基础配置
  - 初始化 Next.js 16 项目（App Router）
  - 安装核心依赖：@neondatabase/serverless, drizzle-orm, zod, tailwindcss
  - 配置 TypeScript 和 ESLint
  - 设置 Tailwind CSS 和 shadcn/ui
  - 创建基础目录结构：db/, lib/, components/, app/
  - _Requirements: 技术要求 1, 2_

- [ ] 2. 数据库层实现
  - [ ] 2.1 创建数据库 Schema 和客户端
    - 创建 `db/schema.ts`：定义 products 表（id, name, supply_price, shop_price, created_at, updated_at）
    - 创建 `db/client.ts`：配置 Neon 连接和 Drizzle 实例
    - 配置 `drizzle.config.ts`：数据库迁移配置
    - _Requirements: 4.1, 4.2_
  
  - [ ] 2.2 实现数据库查询函数
    - 创建 `db/queries.ts`：实现 createProduct, getAllProducts, searchProducts, getProductById, updateProduct, deleteProduct
    - 使用 Drizzle ORM 参数化查询
    - _Requirements: 1.1, 4.2_
  
  - [ ]* 2.3 编写数据库层属性测试
    - **Property 1: CRUD 操作数据一致性**
    - **Validates: 验收标准 1**
    - 使用 fast-check 生成随机产品数据
    - 测试创建→读取→更新→删除的完整流程
    - 验证数据一致性


- [ ] 3. API 层实现 - 产品管理
  - [ ] 3.1 创建 API 类型定义
    - 创建 `lib/api-types.ts`：定义 ApiResponse, ProductResponse, CalculationResult, ExportData 接口
    - _Requirements: 1.1, 2.1_
  
  - [ ] 3.2 实现产品列表和创建 API
    - 创建 `app/api/products/route.ts`
    - 声明 `export const runtime = 'edge'`
    - 实现 GET /api/products（支持搜索参数 ?q=）
    - 实现 POST /api/products（使用 Zod 验证）
    - 统一错误处理和响应格式
    - _Requirements: 1.1, 2.1, 技术要求 2_
  
  - [ ] 3.3 实现单个产品操作 API
    - 创建 `app/api/products/[id]/route.ts`
    - 声明 `export const runtime = 'edge'`
    - 实现 GET /api/products/[id]
    - 实现 PATCH /api/products/[id]（使用 Zod 验证）
    - 实现 DELETE /api/products/[id]
    - _Requirements: 1.1_
  
  - [ ]* 3.4 编写产品 API 单元测试
    - 测试空名称拒绝
    - 测试负数价格拒绝
    - 测试超过2位小数拒绝
    - 测试成功创建、读取、更新、删除
    - _Requirements: 1.1, 验收标准 20_

- [ ] 4. API 层实现 - 价格计算
  - [ ] 4.1 实现价格计算 API
    - 创建 `app/api/calculate/route.ts`
    - 声明 `export const runtime = 'edge'`
    - 实现 POST /api/calculate
    - 实现计算逻辑：商品成本、供货商运费、客户运费、手续费、利润、最大优惠
    - 使用 Zod 验证输入参数
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 4.2 编写价格计算属性测试
    - **Property 2: 价格计算数学正确性**
    - **Validates: 验收标准 2**
    - 使用 fast-check 生成随机计算参数
    - 独立计算预期结果
    - 验证每个计算字段（允许 0.01 浮点误差）
    - 最少 100 次迭代

- [ ] 5. API 层实现 - 导入导出
  - [ ] 5.1 实现导入导出 API
    - 创建 `app/api/import-export/route.ts`
    - 声明 `export const runtime = 'edge'`
    - 实现 GET /api/import-export（导出所有产品为 JSON）
    - 实现 POST /api/import-export（批量导入产品）
    - 使用 Zod 验证导入数据格式
    - _Requirements: 1.2_
  
  - [ ]* 5.2 编写导入导出属性测试
    - **Property 3: 导入导出往返一致性**
    - **Validates: 验收标准 4**
    - 生成随机产品数据集合
    - 导出→导入→验证数据一致性（忽略 ID 和时间戳）

- [ ] 6. 检查点 - API 层完成
  - 确保所有 API 路由都声明了 `export const runtime = 'edge'`
  - 确保所有测试通过
  - 如有问题，询问用户


- [ ] 7. OCR 识别模块实现
  - [ ] 7.1 实现 OCR 处理逻辑
    - 创建 `lib/ocr.ts`
    - 实现 recognizeImage 函数（使用 Tesseract.js）
    - 实现 parseOcrText 函数（提取产品名称、价格、规格）
    - 实现 Worker 管理（getWorker, cleanupWorker）
    - 使用动态导入减少初始包体积
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 7.2 编写 OCR 解析单元测试
    - 测试产品名称提取（包含中文的较长文字）
    - 测试价格提取（¥ 符号、"元"字、"供货价"关键词）
    - 测试规格提取（* 或 × 以及 g 或 克）
    - 使用模拟文本数据
    - _Requirements: 3.2_

- [ ] 8. UI 组件库设置
  - [ ] 8.1 安装和配置 shadcn/ui
    - 安装 @radix-ui 组件：button, input, label, dialog, toast
    - 创建 `components/ui/` 目录
    - 配置 Tailwind CSS 主题
    - _Requirements: 5.3_
  
  - [ ] 8.2 创建基础 UI 组件
    - 创建 `components/ui/button.tsx`
    - 创建 `components/ui/input.tsx`
    - 创建 `components/ui/label.tsx`
    - 创建 `components/ui/dialog.tsx`
    - 创建 `components/ui/toast.tsx`
    - _Requirements: 5.1, 5.3_

- [ ] 9. 产品管理前端组件
  - [ ] 9.1 实现产品表单组件
    - 创建 `components/ProductForm.tsx`
    - 实现产品创建/编辑表单
    - 集成 Zod 客户端验证
    - 实现错误提示和加载状态
    - _Requirements: 1.1, 5.2_
  
  - [ ] 9.2 实现产品列表组件
    - 创建 `components/ProductList.tsx`
    - 显示产品列表（ID、名称、供货价、店铺售价）
    - 实现编辑和删除操作
    - 实现加载状态和空状态
    - _Requirements: 1.1, 5.2_
  
  - [ ] 9.3 实现产品管理主组件
    - 创建 `components/ProductManager.tsx`
    - 集成搜索功能
    - 集成产品表单和列表
    - 实现数据加载和刷新
    - _Requirements: 1.1, 5.2_

- [ ] 10. 价格计算器前端组件
  - [ ] 10.1 实现价格计算器组件
    - 创建 `components/PriceCalculator.tsx`
    - 实现输入表单（供货价、数量、运费、店铺售价）
    - 实现计算结果显示
    - 实现优惠按钮（10%, 20%, 30%, 50%）
    - 实现加载状态和错误处理
    - _Requirements: 2.1, 2.2, 5.2_

- [ ] 11. OCR 识别前端组件
  - [ ] 11.1 实现 OCR 识别组件
    - 创建 `components/OcrRecognizer.tsx`
    - 实现文件上传功能
    - 实现粘贴图片功能（Ctrl+V）
    - 实现图片预览
    - 实现识别进度显示
    - 集成 lib/ocr.ts
    - _Requirements: 3.1, 3.2, 5.2_


- [ ] 12. 导入导出前端组件
  - [ ] 12.1 实现导入导出组件
    - 创建 `components/ImportExport.tsx`
    - 实现导出按钮（下载 JSON 文件）
    - 实现导入文件选择
    - 实现导入进度和结果显示
    - 实现确认对话框
    - _Requirements: 1.2, 5.2_

- [ ] 13. 主页面集成
  - [ ] 13.1 创建主页面布局
    - 创建 `app/page.tsx`
    - 实现响应式布局（桌面和移动端）
    - 集成产品管理、价格计算器、OCR 识别、导入导出组件
    - 实现标签页或分区布局
    - _Requirements: 5.1, 5.2_
  
  - [ ] 13.2 创建全局布局和样式
    - 创建 `app/layout.tsx`
    - 配置全局样式和字体
    - 实现暗色模式支持（可选）
    - 添加全局错误边界
    - _Requirements: 5.1, 5.3_

- [ ] 14. 输入验证和错误处理
  - [ ] 14.1 统一客户端验证
    - 创建 `lib/validation.ts`
    - 定义所有 Zod Schema（产品、计算、导入）
    - 实现验证辅助函数
    - _Requirements: 验收标准 20_
  
  - [ ] 14.2 统一错误处理
    - 创建 `lib/error-handler.ts`
    - 实现错误分类和处理逻辑
    - 实现用户友好的错误消息
    - 集成 Toast 通知
    - _Requirements: 错误处理_
  
  - [ ]* 14.3 编写输入验证属性测试
    - **Property 4: 输入验证拒绝无效数据**
    - **Validates: 验收标准 20**
    - 生成各种无效输入（空名称、负数价格、非数字、超过2位小数）
    - 验证返回 400 错误
    - 验证错误消息清晰
    - 验证数据库未被修改

- [ ] 15. 检查点 - 前端组件完成
  - 确保所有组件正常渲染
  - 确保所有功能可用
  - 确保响应式设计正常
  - 如有问题，询问用户


- [ ] 16. 测试配置和基础设施
  - [ ] 16.1 配置测试环境
    - 安装 vitest, @testing-library/react, fast-check
    - 创建 `vitest.config.ts`（配置 Edge Runtime 环境）
    - 创建测试辅助函数和 Mock
    - _Requirements: 测试策略_
  
  - [ ]* 16.2 编写集成测试
    - 测试完整的 CRUD 流程
    - 测试价格计算端到端流程
    - 测试导入导出端到端流程
    - _Requirements: 测试策略_

- [ ] 17. Edge Runtime 兼容性验证
  - [ ] 17.1 验证 Edge Runtime 声明
    - 检查所有 API 路由文件包含 `export const runtime = 'edge'`
    - 创建静态分析脚本（可选）
    - _Requirements: 验收标准 6_
  
  - [ ] 17.2 验证依赖兼容性
    - 检查 package.json 不包含 pg, fs, path, crypto（Node.js 版本）
    - 验证仅使用 @neondatabase/serverless
    - 检查包体积 < 2MB
    - _Requirements: 验收标准 7, 8, 9_
  
  - [ ]* 17.3 本地 Edge Runtime 测试
    - 使用 `next dev` 测试本地开发
    - 验证所有 API 路由正常工作
    - 验证数据库连接正常
    - _Requirements: 验收标准 10, 17_

- [ ] 18. 性能优化
  - [ ] 18.1 前端性能优化
    - 实现 Tesseract.js 动态导入
    - 优化图片加载（使用 next/image）
    - 配置静态资源缓存
    - _Requirements: 性能优化_
  
  - [ ] 18.2 API 性能优化
    - 添加数据库索引（name 字段）
    - 优化查询语句
    - 配置响应缓存（可选）
    - _Requirements: 性能优化_

- [ ] 19. 安全加固
  - [ ] 19.1 验证安全措施
    - 确认所有输入使用 Zod 验证
    - 确认所有数据库查询使用参数化
    - 确认 React 自动转义
    - 确认环境变量仅在服务器端使用
    - _Requirements: 验收标准 20, 21, 22_
  
  - [ ]* 19.2 安全测试
    - 测试 SQL 注入防护（尝试注入攻击）
    - 测试 XSS 防护（特殊字符转义）
    - 测试环境变量泄露
    - _Requirements: 验收标准 21, 22_

- [ ] 20. 部署准备
  - [ ] 20.1 配置环境变量
    - 创建 `.env.example` 文件
    - 文档化所有环境变量
    - 配置 DATABASE_URL
    - _Requirements: 部署要求 2_
  
  - [ ] 20.2 数据库迁移准备
    - 创建 `drizzle.config.ts`
    - 生成迁移文件（`pnpm drizzle-kit generate:pg`）
    - 测试迁移应用（`pnpm drizzle-kit push:pg`）
    - _Requirements: 部署和运维_
  
  - [ ] 20.3 构建验证
    - 运行 `pnpm build`
    - 验证构建成功无错误
    - 检查输出目录 `.next`
    - 验证包体积 < 2MB
    - _Requirements: 验收标准 9, 15_

- [ ] 21. 文档完善
  - [ ] 21.1 创建 README.md
    - 项目介绍和功能说明
    - 本地开发指南
    - EdgeOne Pages 部署指南
    - 环境变量配置说明
    - _Requirements: 部署要求_
  
  - [ ]* 21.2 创建 API 文档
    - 文档化所有 API 端点
    - 包含请求/响应示例
    - 包含错误代码说明
    - _Requirements: API 层_

- [ ] 22. 最终检查点
  - 运行所有测试（`pnpm test`）
  - 运行构建（`pnpm build`）
  - 验证所有功能正常
  - 验证 Edge Runtime 兼容性
  - 验证安全措施
  - 准备部署到 EdgeOne Pages
  - 如有问题，询问用户

## 注意事项

- 标记 `*` 的任务为可选任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求，确保可追溯性
- 检查点任务确保增量验证，及时发现问题
- 属性测试每个最少运行 100 次迭代
- 所有 API 路由必须声明 `export const runtime = 'edge'`
- 避免使用 Node.js 特定模块（fs, path, crypto）
- 使用 @neondatabase/serverless 连接数据库
- 包体积必须 < 2MB

## 测试标签格式

所有属性测试必须使用以下标签格式：

```typescript
it('Feature: gift-box-calculator-rebuild, Property {number}: {property_text}', () => {
  // 测试代码
})
```

## 部署流程

完成所有任务后：

1. 推送代码到 GitHub
2. 在 EdgeOne Pages 控制台连接仓库
3. 配置环境变量（DATABASE_URL）
4. 点击部署
5. 等待构建完成（约 2-3 分钟）
6. 访问分配的域名
7. 验证所有功能正常
