# 礼盒报价计算器 - 功能需求文档（EdgeOne Pages 优化版）

## 项目概述

一个基于 Next.js 的礼盒报价计算系统，**专为腾讯 EdgeOne Pages 平台部署优化**，完全兼容 Edge Runtime，支持产品管理、价格计算、利润分析和 OCR 识别功能。

## EdgeOne Pages 平台特性

### 平台优势
- ✅ 全球 3200+ 边缘节点
- ✅ 自动 SSL 证书
- ✅ 支持 Next.js 全栈部署
- ✅ Serverless 函数支持
- ✅ 环境变量管理
- ✅ Git 自动部署

### 平台限制（必须遵守）
- ❌ **不支持 Node.js 特定模块**：fs, path, crypto（Node.js 版本）
- ❌ **不支持文件系统操作**：/tmp 目录不可靠
- ❌ **包体积限制**：Edge Runtime 代码 1-4MB
- ✅ **必须使用 Web 标准 API**
- ✅ **数据库必须支持 Serverless**：推荐 Neon、Supabase、Vercel Postgres

## 核心功能需求

### 1. 产品管理

#### 1.1 产品 CRUD 操作
- **添加产品**
  - 输入：产品名称（必填）、供货价（必填）、店铺售价（可选）
  - 验证：名称不为空，价格为正数，最多2位小数
  - 输出：创建成功返回产品信息

- **查看产品列表**
  - 显示所有产品：ID、名称、供货价、店铺售价
  - 支持搜索：按产品名称模糊搜索
  - 排序：按创建时间倒序

- **编辑产品**
  - 可修改：产品名称、供货价、店铺售价
  - 验证规则同添加产品

- **删除产品**
  - 确认后删除
  - 删除后从列表移除

#### 1.2 产品数据导入导出
- **导出功能**
  - 格式：JSON
  - 文件名：products-backup-{时间戳}.json
  - 包含所有产品数据

- **导入功能**
  - 支持 JSON 格式
  - 验证数据格式
  - 批量导入产品

### 2. 价格计算功能

#### 2.1 基础计算
- **输入参数**
  - 供货价（必填）
  - 数量（必填，默认1）
  - 单件运费（默认5元）
  - 多件运费（默认5元/件）
  - 店铺售价（必填）

- **计算规则**
  - 商品成本 = 供货价 × 数量
  - 供货商运费：1件=3元，2件=5元，3件及以上=0元
  - 客户运费：1件=单件运费，多件=多件运费×数量
  - 客户实付 = (店铺售价 × 数量) + 客户运费
  - 手续费 = 客户实付 × 0.6%
  - 总支出 = 商品成本 + 供货商运费 + 手续费
  - 利润 = 客户实付 - 总支出

#### 2.2 优惠计算
- **最大可优惠金额**
  - 计算公式：使优惠后利润为0的最大优惠额
  - 公式：最大优惠 = 客户实付 - (商品成本 + 供货商运费) ÷ 0.994

- **按百分比优惠**
  - 支持快捷按钮：10%、20%、30%、50%
  - 自动计算对应的优惠金额
  - 显示优惠后利润

### 3. OCR 图片识别功能

#### 3.1 图片输入方式
- **上传图片**
  - 支持格式：PNG、JPG、JPEG
  - 文件大小：建议 < 5MB
  - 显示图片预览

- **粘贴图片**
  - 支持 Ctrl+V 粘贴
  - 支持截图直接粘贴
  - 显示图片预览

- **文字输入**
  - 支持直接粘贴文字
  - 无需图片识别

#### 3.2 OCR 识别
- **技术方案**
  - 使用 Tesseract.js 纯前端识别
  - 支持中文简体 + 英文
  - 完全本地处理，保护隐私

- **识别规则**
  - 产品名称：提取第一行包含中文的较长文字
  - 价格：识别 ¥ 符号、"元"字、"供货价"关键词附近的数字
  - 规格：识别包含 * 或 × 以及 g 或 克的行

- **识别结果**
  - 自动填充产品名称
  - 自动填充供货价
  - 用户可手动调整

### 4. 数据存储（EdgeOne 优化）

#### 4.1 存储方案（仅数据库）
- **PostgreSQL Serverless（唯一方案）**
  - 推荐：Neon Database（免费层可用）
  - 备选：Supabase、Vercel Postgres
  - 使用 `@neondatabase/serverless` 驱动
  - 支持 HTTP/WebSocket 连接
  - 完全兼容 Edge Runtime

- **移除文件存储**
  - ❌ 不再支持文件存储
  - ❌ 移除 /tmp 目录依赖
  - ❌ 移除 fs 模块使用
  - 原因：Edge 环境不可靠，违反平台限制

#### 4.2 数据库连接
- 使用 Drizzle ORM + Neon Serverless
- 连接池自动管理
- 环境变量：DATABASE_URL
- 支持连接字符串格式：`postgresql://user:pass@host/db`

### 5. UI/UX 要求

#### 5.1 响应式设计
- 支持桌面端和移动端
- 使用 Tailwind CSS
- 暗色模式支持

#### 5.2 用户体验
- 清晰的操作提示
- 加载状态显示
- 错误信息友好
- 操作确认对话框

#### 5.3 组件库
- 使用 Radix UI 组件
- shadcn/ui 风格
- 统一的设计语言

## 技术要求（EdgeOne 专用）

### 1. 框架和库
- **Next.js 16**（App Router）
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**

### 2. Edge Runtime 完全兼容
- **✅ 必须使用的包**
  - `@neondatabase/serverless`：数据库驱动
  - `drizzle-orm`：ORM（Edge 兼容）
  - `tesseract.js`：OCR（纯前端）
  - `zod`：数据验证
  - `@radix-ui/*`：UI 组件

- **❌ 禁止使用的包**
  - `pg`（Node.js PostgreSQL 驱动）
  - `fs`、`path`（Node.js 文件系统）
  - `crypto`（Node.js 加密模块）
  - 任何依赖 Node.js API 的包

- **🔧 API 路由配置**
  ```typescript
  // 所有 API 路由必须声明 Edge Runtime
  export const runtime = 'edge'
  ```

### 3. 数据库方案
- **Neon Database Serverless**
  - 免费层：0.5GB 存储，100 小时计算
  - HTTP/WebSocket 连接
  - 完全兼容 Edge Runtime
  - 自动休眠和唤醒

- **连接配置**
  ```typescript
  import { neon } from '@neondatabase/serverless'
  import { drizzle } from 'drizzle-orm/neon-http'
  
  const sql = neon(process.env.DATABASE_URL!)
  const db = drizzle(sql)
  ```

### 4. 性能优化（Edge 特定）
- 动态导入 Tesseract.js（减少初始包体积）
- 使用 Web Crypto API 替代 Node.js crypto
- 避免大型依赖包
- 最小化 Edge 函数代码
- 利用 EdgeOne CDN 缓存静态资源

### 5. 安全性
- 输入验证（Zod）
- SQL 注入防护（Drizzle ORM 参数化查询）
- XSS 防护（React 自动转义）
- 环境变量加密存储

## 部署要求（EdgeOne Pages 专用）

### 1. EdgeOne Pages 配置
- **构建命令**：`pnpm install && pnpm build`
- **输出目录**：`.next`
- **Node 版本**：18.x 或 20.x
- **包管理器**：pnpm 9.0.0+

### 2. 环境变量配置
```env
# 数据库连接（必填）
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# 可选配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.edgeone.app
```

### 3. Neon Database 设置
1. 注册 [Neon](https://neon.tech)
2. 创建新项目
3. 获取连接字符串
4. 在 EdgeOne Pages 环境变量中配置
5. 首次部署时自动创建表

### 4. 部署流程
1. 推送代码到 GitHub
2. 在 EdgeOne Pages 控制台连接仓库
3. 配置环境变量（DATABASE_URL）
4. 点击部署
5. 等待构建完成（约 2-3 分钟）
6. 访问分配的域名

### 5. 自动部署
- Git push 自动触发部署
- 支持预览部署（PR）
- 支持回滚到历史版本

## 非功能性需求

### 1. 可用性
- 系统可用性 > 99%
- 响应时间 < 2秒
- 支持并发用户 > 100

### 2. 可维护性
- 代码注释清晰
- 模块化设计
- 易于扩展

### 3. 兼容性
- Chrome / Edge（推荐）
- Firefox
- Safari
- 移动端浏览器

### 4. 数据安全
- 定期备份
- 数据加密传输
- 隐私保护（OCR 本地处理）

## 已知问题和改进方向

### 当前版本问题（需要重构）
1. ❌ **使用了 `pg` 包**：不兼容 Edge Runtime
2. ❌ **使用了 `fs` 模块**：文件存储方案不可靠
3. ❌ **使用了 `coze-coding-dev-sdk`**：可能不兼容 Edge
4. ❌ **复杂的存储适配器**：不必要的抽象
5. ❌ **类型定义不严格**：decimal 类型转换混乱
6. ❌ **错误处理不统一**：缺少标准化错误响应

### 重构方案（EdgeOne 优化）
1. ✅ **替换为 `@neondatabase/serverless`**
2. ✅ **完全移除文件存储**：仅支持数据库
3. ✅ **移除 `coze-coding-dev-sdk`**：直接使用 Neon + Drizzle
4. ✅ **简化数据层**：直接使用 Drizzle ORM
5. ✅ **统一类型定义**：使用 string 存储价格
6. ✅ **标准化错误处理**：统一 API 响应格式
7. ✅ **添加 Edge Runtime 声明**：所有 API 路由
8. ✅ **优化包体积**：移除不必要的依赖

### 架构改进
```
旧架构（不兼容）:
├── storage-adapter.ts (复杂抽象)
├── productManager.ts (使用 coze-sdk)
└── pg 驱动 (Node.js only)

新架构（Edge 兼容）:
├── db/
│   ├── client.ts (Neon + Drizzle)
│   ├── schema.ts (表定义)
│   └── queries.ts (查询函数)
└── @neondatabase/serverless (Edge 兼容)
```

## 验收标准

### 功能验收
- [ ] 所有 CRUD 操作正常
- [ ] 价格计算准确无误
- [ ] OCR 识别基本可用
- [ ] 导入导出功能正常
- [ ] 响应式设计完整

### Edge Runtime 兼容性验收（关键）
- [ ] ✅ 所有 API 路由声明 `export const runtime = 'edge'`
- [ ] ✅ 不使用任何 Node.js 特定模块（fs, path, crypto）
- [ ] ✅ 使用 `@neondatabase/serverless` 连接数据库
- [ ] ✅ 包体积 < 2MB
- [ ] ✅ 本地 Edge Runtime 测试通过

### 性能验收
- [ ] 首屏加载 < 3秒
- [ ] API 响应 < 1秒（全球平均）
- [ ] OCR 识别 < 10秒
- [ ] 数据库查询 < 500ms

### EdgeOne Pages 部署验收
- [ ] ✅ 构建成功（无错误）
- [ ] ✅ 部署成功（无运行时错误）
- [ ] ✅ 数据库连接正常
- [ ] ✅ 所有功能在生产环境可用
- [ ] ✅ 全球访问速度快（< 2秒）

### 安全性验收
- [ ] 输入验证完整（Zod）
- [ ] 无 SQL 注入风险（Drizzle 参数化）
- [ ] 无 XSS 漏洞（React 转义）
- [ ] 环境变量安全存储

## 技术栈总结（EdgeOne 优化版）

### 前端
- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- Radix UI
- Tesseract.js (OCR)

### 后端（Edge Runtime）
- Next.js API Routes (Edge Runtime)
- Neon Database Serverless
- Drizzle ORM
- Zod 验证

### 部署
- EdgeOne Pages
- GitHub 自动部署
- 环境变量管理

### 开发工具
- pnpm 9.0.0+
- ESLint
- TypeScript

## 关键依赖包

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^0.10.0",
    "drizzle-orm": "^0.45.0",
    "next": "16.1.1",
    "react": "19.2.3",
    "tesseract.js": "^7.0.0",
    "zod": "^4.3.5",
    "@radix-ui/react-*": "latest"
  },
  "devDependencies": {
    "drizzle-kit": "^0.31.8",
    "typescript": "^5.9.0",
    "@types/node": "^20.0.0"
  }
}
```

## 移除的依赖（不兼容 Edge）

```json
{
  "removed": {
    "pg": "不兼容 Edge Runtime",
    "coze-coding-dev-sdk": "可能不兼容 Edge",
    "@aws-sdk/*": "不需要（移除文件存储）"
  }
}
```
