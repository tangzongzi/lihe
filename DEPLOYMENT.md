# EdgeOne Pages 部署指南

本文档详细说明如何将礼盒报价计算器部署到腾讯 EdgeOne Pages 平台。

## 📋 前置要求

1. **GitHub 账号**：代码已推送到 GitHub 仓库
2. **Neon Database 账号**：用于数据库存储
3. **EdgeOne Pages 账号**：用于部署应用

## 🗄️ 第一步：设置 Neon Database

### 1.1 注册 Neon 账号

访问 [https://neon.tech](https://neon.tech) 并注册账号（免费层可用）。

### 1.2 创建数据库项目

1. 登录 Neon 控制台
2. 点击 "Create Project"
3. 选择区域（推荐选择离用户最近的区域）
4. 等待项目创建完成

### 1.3 获取连接字符串

1. 在项目页面，点击 "Connection Details"
2. 复制 "Connection string" 
3. 格式类似：`postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require`
4. **保存此连接字符串**，稍后需要配置到 EdgeOne Pages

### 1.4 初始化数据库表

在本地运行以下命令（需要先配置 `.env` 文件）：

```bash
# 复制环境变量示例
cp .env.example .env

# 编辑 .env，填入 DATABASE_URL

# 生成迁移文件
pnpm db:generate

# 应用迁移到数据库
pnpm db:push
```

或者，数据库表会在首次 API 调用时自动创建（Drizzle ORM 自动迁移）。

## 🚀 第二步：部署到 EdgeOne Pages

### 2.1 访问 EdgeOne Pages 控制台

访问 [https://edgeone.ai/pages](https://edgeone.ai/pages) 并登录。

### 2.2 连接 GitHub 仓库

1. 点击 "New Project" 或 "创建项目"
2. 选择 "Import from Git"
3. 授权 EdgeOne Pages 访问你的 GitHub 账号
4. 选择 `tangzongzi/lihe` 仓库
5. 选择 `main` 分支

### 2.3 配置构建设置

在构建配置页面，填写以下信息：

- **Framework Preset**: Next.js
- **Build Command**: `pnpm install && pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Node Version**: 20.x（推荐）或 18.x

### 2.4 配置环境变量

在 "Environment Variables" 部分，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require` | Neon 数据库连接字符串（必填） |
| `NODE_ENV` | `production` | 生产环境标识（可选） |

**重要**：确保 `DATABASE_URL` 正确无误，否则应用无法连接数据库。

### 2.5 开始部署

1. 检查所有配置是否正确
2. 点击 "Deploy" 或"部署"按钮
3. 等待构建完成（通常需要 2-3 分钟）

### 2.6 查看部署状态

在部署页面，你可以看到：
- 构建日志
- 部署进度
- 错误信息（如果有）

## ✅ 第三步：验证部署

### 3.1 访问应用

部署成功后，EdgeOne Pages 会分配一个域名，格式类似：
- `https://your-project.edgeone.app`

点击域名访问应用。

### 3.2 测试功能

1. **测试产品管理**：
   - 点击"添加产品"
   - 填写产品信息
   - 保存并查看产品列表

2. **测试价格计算**：
   - 输入供货价、数量、运费、店铺售价
   - 点击"计算"
   - 查看计算结果

3. **测试 OCR 识别**（如果已实现前端）：
   - 上传产品图片
   - 查看识别结果

4. **测试导入导出**：
   - 导出产品数据
   - 导入产品数据

### 3.3 检查数据库

访问 Neon 控制台，查看 `products` 表是否有数据。

## 🔄 第四步：自动部署

### 4.1 Git Push 自动部署

配置完成后，每次推送代码到 GitHub `main` 分支，EdgeOne Pages 会自动触发部署：

```bash
git add .
git commit -m "feat: 添加新功能"
git push origin main
```

### 4.2 预览部署

创建 Pull Request 时，EdgeOne Pages 会自动创建预览部署，方便测试。

### 4.3 回滚

如果新版本有问题，可以在 EdgeOne Pages 控制台回滚到之前的版本。

## 🐛 常见问题

### 问题 1：构建失败 - "DATABASE_URL is not defined"

**原因**：环境变量未配置或配置错误。

**解决方案**：
1. 检查 EdgeOne Pages 环境变量配置
2. 确保 `DATABASE_URL` 变量名正确（区分大小写）
3. 确保连接字符串格式正确
4. 重新部署

### 问题 2：运行时错误 - "Cannot connect to database"

**原因**：数据库连接失败。

**解决方案**：
1. 检查 Neon 数据库是否正常运行
2. 检查连接字符串是否正确
3. 确保 Neon 数据库允许来自 EdgeOne 的连接（默认允许）
4. 检查数据库用户权限

### 问题 3：API 返回 500 错误

**原因**：数据库表不存在或 API 代码错误。

**解决方案**：
1. 运行 `pnpm db:push` 创建数据库表
2. 查看 EdgeOne Pages 部署日志
3. 检查 API 代码是否有语法错误
4. 确保所有 API 路由声明了 `export const runtime = 'edge'`

### 问题 4：包体积过大

**原因**：依赖包过多或过大。

**解决方案**：
1. 检查 `package.json`，移除不必要的依赖
2. 使用动态导入（如 Tesseract.js）
3. 确保没有引入 Node.js 特定模块

### 问题 5：Edge Runtime 不兼容错误

**错误信息**：`The edge runtime does not support Node.js 'xxx' module`

**解决方案**：
1. 检查代码中是否使用了 `fs`, `path`, `crypto`（Node.js 版本）
2. 替换为 Web 标准 API 或 Edge 兼容的包
3. 确保使用 `@neondatabase/serverless` 而不是 `pg`

## 📊 性能优化

### 1. 启用 CDN 缓存

EdgeOne Pages 自动启用 CDN 缓存，无需额外配置。

### 2. 数据库查询优化

- 添加索引（如 `name` 字段）
- 使用分页查询
- 避免 N+1 查询

### 3. 前端优化

- 使用 `next/image` 优化图片
- 启用代码分割
- 使用动态导入

## 🔒 安全建议

### 1. 环境变量安全

- 不要在代码中硬编码敏感信息
- 使用 EdgeOne Pages 环境变量管理
- 定期更换数据库密码

### 2. 数据库安全

- 使用强密码
- 启用 SSL 连接（Neon 默认启用）
- 定期备份数据

### 3. API 安全

- 所有输入使用 Zod 验证
- 使用参数化查询防止 SQL 注入
- 添加速率限制（可选）

## 📈 监控和日志

### 1. EdgeOne Pages 日志

在 EdgeOne Pages 控制台查看：
- 构建日志
- 运行时日志
- 错误日志

### 2. Neon Database 监控

在 Neon 控制台查看：
- 数据库连接数
- 查询性能
- 存储使用情况

### 3. 应用监控

可以集成第三方监控服务（如 Sentry）：

```bash
pnpm add @sentry/nextjs
```

## 🎉 部署成功！

恭喜！你的礼盒报价计算器已成功部署到 EdgeOne Pages。

**下一步**：
- 配置自定义域名
- 添加更多功能
- 优化性能
- 收集用户反馈

## 📞 获取帮助

- [EdgeOne Pages 文档](https://edgeone.ai/docs)
- [Neon Database 文档](https://neon.tech/docs)
- [GitHub Issues](https://github.com/tangzongzi/lihe/issues)
