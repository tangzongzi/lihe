# 更新日志

## [2.0.0] - 2025-01-23 - EdgeOne Pages 优化版

### 🎉 重大重构

完全重构项目以兼容腾讯 EdgeOne Pages 平台和 Edge Runtime。

### ✨ 新增

- **Edge Runtime 完全兼容**
  - 所有 API 路由声明 `export const runtime = 'edge'`
  - 使用 Web 标准 API
  - 包体积优化 < 2MB

- **Neon Database Serverless**
  - 使用 `@neondatabase/serverless` 驱动
  - HTTP/WebSocket 连接
  - 完全兼容 Edge Runtime
  - 免费层可用

- **简化架构**
  - 移除复杂的存储适配器
  - 直接使用 Drizzle ORM
  - 统一的 API 响应格式
  - 标准化错误处理

- **新的 API 端点**
  - `POST /api/calculate` - 价格计算
  - `GET /api/import-export` - 导出数据
  - `POST /api/import-export` - 导入数据

- **文档完善**
  - EdgeOne Pages 部署指南
  - Neon Database 设置指南
  - API 文档
  - 故障排除指南

### 🔄 变更

- **数据库层**
  - 从 `pg` 迁移到 `@neondatabase/serverless`
  - 从 `coze-coding-dev-sdk` 迁移到直接使用 Drizzle ORM
  - 价格字段从 `decimal` 改为 `text` 类型
  - 简化 Schema 定义

- **API 层**
  - 统一响应格式：`{ success, data?, error?, message? }`
  - 所有路由添加 Edge Runtime 声明
  - 改进错误处理和验证
  - 移除文件存储相关 API

- **类型定义**
  - 统一 API 类型定义到 `lib/api-types.ts`
  - 改进 TypeScript 类型安全
  - 移除不必要的类型转换

### ❌ 移除

- **不兼容的依赖**
  - `pg` - Node.js PostgreSQL 驱动
  - `coze-coding-dev-sdk` - 不兼容 Edge Runtime
  - `@aws-sdk/*` - 不需要（移除文件存储）
  - `drizzle-zod` - 不需要
  - `react-hook-form` - 简化表单处理
  - `@hookform/resolvers` - 不需要

- **文件存储**
  - 移除 `src/lib/storage-adapter.ts`
  - 移除 `src/storage/` 目录
  - 移除 `/tmp` 目录依赖
  - 移除 `fs` 模块使用

- **旧的 API 端点**
  - `GET /api/db/init` - 不需要（自动迁移）
  - `POST /api/text-recognize` - 移到前端处理
  - `GET /api/products/export` - 合并到 `/api/import-export`
  - `POST /api/products/import` - 合并到 `/api/import-export`

### 🐛 修复

- 修复 TypeScript 类型错误（`productInfo.title` 可能为 null）
- 修复价格计算精度问题（使用 string 存储）
- 修复 Edge Runtime 兼容性问题
- 修复数据库连接池问题

### 📦 依赖更新

**新增依赖：**
- `@neondatabase/serverless@^0.10.0` - Edge 兼容的数据库驱动

**移除依赖：**
- `pg@^8.16.3`
- `coze-coding-dev-sdk@^0.7.3`
- `@aws-sdk/client-s3@^3.958.0`
- `@aws-sdk/lib-storage@^3.958.0`
- `drizzle-zod@^0.8.3`
- `react-hook-form@^7.70.0`
- `@hookform/resolvers@^5.2.2`
- `@types/pg@^8.16.0`

**保留依赖：**
- `next@16.1.1`
- `react@19.2.3`
- `drizzle-orm@^0.45.1`
- `tesseract.js@^7.0.0`
- `zod@^4.3.5`
- 所有 `@radix-ui/*` 组件

### 📝 文档

- 新增 `DEPLOYMENT.md` - EdgeOne Pages 部署指南
- 更新 `README.md` - 完整的项目文档
- 新增 `.env.example` - 环境变量示例
- 新增 `drizzle.config.ts` - Drizzle 配置
- 新增 `.kiro/specs/gift-box-calculator-rebuild/` - 需求、设计和任务文档

### 🔧 配置

- 新增 `db:generate` 脚本 - 生成数据库迁移
- 新增 `db:push` 脚本 - 应用数据库迁移
- 新增 `db:studio` 脚本 - 打开 Drizzle Studio
- 更新构建脚本以支持 Edge Runtime

### 🎯 性能

- 包体积减少约 40%（移除不必要的依赖）
- API 响应时间减少（Edge Runtime + Serverless DB）
- 全球访问速度提升（EdgeOne CDN）
- 数据库查询优化（Drizzle ORM）

### 🔒 安全

- 所有输入使用 Zod 验证
- 所有查询使用参数化（防止 SQL 注入）
- React 自动转义（防止 XSS）
- 环境变量安全存储

### 📊 兼容性

- ✅ EdgeOne Pages 平台
- ✅ Vercel Edge Runtime
- ✅ Cloudflare Workers
- ✅ 所有支持 Edge Runtime 的平台

### 🚀 部署

- 支持 EdgeOne Pages 一键部署
- 支持 GitHub 自动部署
- 支持预览部署（PR）
- 支持回滚到历史版本

---

## [1.0.0] - 2025-01-22 - 初始版本

### ✨ 功能

- 产品管理（CRUD）
- 价格计算
- 优惠计算
- OCR 识别
- 数据导入导出
- 双存储模式（数据库 + 文件）

### 🐛 已知问题

- 使用 `pg` 包，不兼容 Edge Runtime
- 使用 `fs` 模块，不兼容 Serverless
- 复杂的存储适配器
- 类型定义不严格
- 错误处理不统一

---

## 迁移指南

### 从 1.0.0 迁移到 2.0.0

#### 1. 更新依赖

```bash
# 删除旧依赖
pnpm remove pg coze-coding-dev-sdk @aws-sdk/client-s3 @aws-sdk/lib-storage

# 安装新依赖
pnpm add @neondatabase/serverless

# 重新安装所有依赖
pnpm install
```

#### 2. 配置数据库

```bash
# 注册 Neon Database
# 获取连接字符串

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL

# 初始化数据库
pnpm db:generate
pnpm db:push
```

#### 3. 更新代码

- 所有 API 路由添加 `export const runtime = 'edge'`
- 移除 `src/storage/` 目录
- 移除 `src/lib/storage-adapter.ts`
- 使用新的 API 响应格式

#### 4. 测试

```bash
# 本地测试
pnpm dev

# 构建测试
pnpm build
```

#### 5. 部署

参考 `DEPLOYMENT.md` 部署到 EdgeOne Pages。

### 数据迁移

如果你有旧版本的数据，可以：

1. 从旧版本导出数据（JSON 格式）
2. 在新版本中导入数据

```bash
# 旧版本
curl http://localhost:3000/api/products/export > backup.json

# 新版本
curl -X POST http://localhost:3000/api/import-export \
  -H "Content-Type: application/json" \
  -d @backup.json
```

---

## 贡献者

- [@tangzongzi](https://github.com/tangzongzi) - 项目维护者

## 许可证

MIT License
