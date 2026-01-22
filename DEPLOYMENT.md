# 部署指南

## 腾讯 EdgeOne 部署步骤

### 1. 准备工作

确保你已经：
- 注册腾讯云账号
- 开通 EdgeOne 服务
- 准备好 PostgreSQL 数据库（推荐使用腾讯云数据库 PostgreSQL）

### 2. 配置数据库

EdgeOne 部署需要配置数据库。你有以下选择：

#### 选项 A：腾讯云数据库 PostgreSQL（推荐）

**优势**：同一云平台、低延迟、高性能

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 搜索 "云数据库 PostgreSQL"
3. 创建实例（推荐配置：2核4GB + 50GB存储）
4. 获取连接信息

**连接 URL 格式**：
```
postgresql://postgres:密码@数据库地址:5432/postgres
```

#### 选项 B：Supabase（免费方案）

**优势**：免费额度、易用

1. 访问 [Supabase](https://supabase.com/)
2. 创建项目
3. 复制 Connection String

#### 选项 C：文件存储（仅测试）

**警告**：数据会在重启后丢失，不适合生产环境

详细的数据库配置指南请查看 [EDGEONE_DATABASE_GUIDE.md](./EDGEONE_DATABASE_GUIDE.md)

### 3. 配置环境变量

在 EdgeOne 控制台配置以下环境变量：

```bash
# 必需配置
STORAGE_TYPE=database
NODE_ENV=production

# 数据库配置（使用 Supabase）
PGDATABASE_URL=postgresql://postgres.kasisvmybixdjdmtnets:iY8HLsPxEoX35iyZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**重要说明**：
- 数据库表会在首次使用时自动创建，无需手动初始化
- 使用 `PGDATABASE_URL` 而不是 `DATABASE_URL`（coze-coding-dev-sdk 要求）
- Supabase 连接使用 Session Mode（端口 6543）

### 4. 构建和部署

#### 方式一：通过 EdgeOne 控制台

1. 登录腾讯云 EdgeOne 控制台
2. 创建新的应用
3. 选择 "从 Git 仓库导入"
4. 连接你的 GitHub 仓库：https://github.com/tangzongzi/lihe.git
5. 配置构建设置：
   - 构建命令：`pnpm build`
   - 输出目录：`.next`
   - 安装命令：`pnpm install`
   - Node.js 版本：`20.x`
6. 添加环境变量（见上方）
7. 点击"部署"
8. **数据库会在首次访问时自动初始化，无需手动操作**

#### 方式二：使用 CLI 部署

```bash
# 安装 EdgeOne CLI
npm install -g @tencent/edgeone-cli

# 登录
edgeone login

# 部署
edgeone deploy
```

### 4. 验证部署

1. 访问你的应用 URL
2. 尝试添加一个产品（数据库表会自动创建）
3. 检查产品是否成功保存
4. 测试导出/导入功能

**注意**：首次添加产品时可能需要几秒钟来创建数据库表，这是正常的。

## 常见问题

### 问题 1：数据库连接失败

**解决方案：**
- 检查 `DATABASE_URL` 环境变量是否正确配置
- 确保数据库允许来自 EdgeOne 的连接
- 检查数据库用户权限

### 问题 2：构建失败

**解决方案：**
- 确保使用 pnpm 9.0.0 或更高版本
- 检查 Node.js 版本（推荐 20.x）
- 清除缓存后重新构建

### 问题 3：首次添加产品较慢

**原因**：首次操作时需要创建数据库表

**解决方案**：
- 这是正常现象，只在首次使用时发生
- 后续操作会很快
- 数据库表创建后会自动缓存

## 性能优化建议

1. **启用 CDN 加速**：EdgeOne 自动提供 CDN 加速
2. **数据库连接池**：使用 coze-coding-dev-sdk 自动管理连接池
3. **缓存策略**：配置静态资源缓存
4. **监控告警**：设置性能监控和告警

## 备份策略

### 自动备份

使用腾讯云数据库的自动备份功能：
- 每日自动备份
- 保留 7 天备份数据

### 手动备份

通过应用导出功能：
1. 访问应用
2. 点击"产品库管理"
3. 点击"导出"按钮
4. 保存 JSON 备份文件

## 回滚策略

如果部署出现问题：

1. **通过 EdgeOne 控制台回滚**：
   - 进入部署历史
   - 选择上一个稳定版本
   - 点击"回滚"

2. **通过 Git 回滚**：
   ```bash
   git revert HEAD
   git push origin main
   ```

## 监控和日志

### 查看应用日志

在 EdgeOne 控制台：
1. 进入应用详情
2. 点击"日志"标签
3. 查看实时日志和历史日志

### 性能监控

EdgeOne 提供以下监控指标：
- 请求量
- 响应时间
- 错误率
- 带宽使用

## 安全建议

1. **环境变量安全**：不要在代码中硬编码敏感信息
2. **数据库安全**：使用强密码，限制访问 IP
3. **HTTPS**：EdgeOne 自动提供 HTTPS 支持
4. **定期更新**：及时更新依赖包修复安全漏洞

## 技术支持

如遇到问题，可以：
- 查看 EdgeOne 官方文档
- 联系腾讯云技术支持
- 查看应用日志排查问题
