# 腾讯 EdgeOne 数据库配置指南

## 数据库部署方案

部署到腾讯 EdgeOne 时，你有以下几种数据库方案：

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 | 成本 |
|------|------|------|----------|------|
| **腾讯云数据库 PostgreSQL** | 高性能、自动备份、易管理 | 需要付费 | 生产环境 | ¥¥¥ |
| **腾讯云 Serverless PostgreSQL** | 按量付费、自动扩缩容 | 冷启动延迟 | 中小型应用 | ¥¥ |
| **Supabase** | 免费额度、易用 | 海外服务器 | 开发测试 | ¥ (免费额度) |
| **Neon** | 免费额度、Serverless | 海外服务器 | 开发测试 | ¥ (免费额度) |
| **文件存储** | 完全免费、无需配置 | 性能差、数据易丢失 | 仅测试 | 免费 |

---

## 🌟 推荐方案：腾讯云数据库 PostgreSQL

### 为什么推荐？

1. **同一云平台** - EdgeOne 和数据库在同一个腾讯云，网络延迟最低
2. **高性能** - 专业的数据库服务，性能有保障
3. **自动备份** - 每日自动备份，数据安全
4. **易于管理** - 腾讯云控制台统一管理
5. **内网连接** - 可以使用内网连接，更安全更快

### 配置步骤

#### 1. 创建腾讯云数据库

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 搜索 "云数据库 PostgreSQL"
3. 点击 "新建实例"

**推荐配置**：
- **版本**: PostgreSQL 14 或更高
- **规格**: 
  - 测试环境: 1核1GB (约 ¥100/月)
  - 生产环境: 2核4GB (约 ¥300/月)
- **存储**: 20GB SSD (可扩展)
- **地域**: 选择与 EdgeOne 相同的地域（如：广州、上海）
- **网络**: VPC 网络（推荐）或公网

#### 2. 配置数据库

创建完成后：

1. **设置账号密码**
   - 用户名: `postgres` (默认)
   - 密码: 设置强密码（至少8位，包含大小写字母、数字、特殊字符）

2. **配置白名单**
   - 如果使用公网访问：添加 EdgeOne 的出口 IP
   - 如果使用内网：配置 VPC 对等连接

3. **获取连接信息**
   - 内网地址: `xxx.postgres.tencentcdb.com:5432`
   - 公网地址: `xxx.postgres.tencentcdb.com:5432`
   - 数据库名: `postgres` (默认)

#### 3. 在 EdgeOne 配置环境变量

在 EdgeOne 控制台的应用设置中添加环境变量：

```bash
# 数据库连接 URL
DATABASE_URL=postgresql://postgres:你的密码@数据库地址:5432/postgres

# 或使用 PGDATABASE_URL（coze-coding-dev-sdk 使用）
PGDATABASE_URL=postgresql://postgres:你的密码@数据库地址:5432/postgres

# 存储类型
STORAGE_TYPE=database

# 生产环境
NODE_ENV=production
```

**连接 URL 格式**：
```
postgresql://用户名:密码@主机地址:端口/数据库名
```

**示例**：
```
postgresql://postgres:MyPassword123!@gz-cdb-xxx.postgres.tencentcdb.com:5432/postgres
```

#### 4. 初始化数据库

部署完成后，访问：
```
https://your-domain.com/api/init-db
```

这将自动创建所需的表和索引。

---

## 🚀 方案二：腾讯云 Serverless PostgreSQL

### 适合场景
- 流量不稳定的应用
- 预算有限的项目
- 需要自动扩缩容

### 优势
- **按量付费** - 只为实际使用付费
- **自动扩缩容** - 根据负载自动调整
- **无需运维** - 完全托管

### 配置步骤

1. 在腾讯云控制台搜索 "Serverless PostgreSQL"
2. 创建实例（选择按量付费）
3. 配置与方案一相同
4. 在 EdgeOne 配置环境变量

**注意**：Serverless 数据库可能有冷启动延迟（首次访问较慢）

---

## 🌍 方案三：使用 Supabase（免费方案）

### 适合场景
- 开发测试环境
- 个人项目
- 预算极其有限

### 优势
- **免费额度** - 500MB 数据库 + 1GB 文件存储
- **易于使用** - 提供友好的管理界面
- **自动备份** - 每日自动备份

### 配置步骤

1. 访问 [Supabase](https://supabase.com/)
2. 注册账号并创建项目
3. 在项目设置中找到数据库连接信息
4. 复制 Connection String

**在 EdgeOne 配置环境变量**：
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
STORAGE_TYPE=database
NODE_ENV=production
```

**注意**：Supabase 服务器在海外，可能有网络延迟

---

## 🔧 方案四：使用 Neon（免费方案）

### 适合场景
- 开发测试
- Serverless 应用
- 需要分支功能

### 优势
- **免费额度** - 3GB 存储
- **Serverless** - 自动休眠和唤醒
- **分支功能** - 可以创建数据库分支

### 配置步骤

1. 访问 [Neon](https://neon.tech/)
2. 注册账号并创建项目
3. 复制连接字符串

**在 EdgeOne 配置环境变量**：
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb
STORAGE_TYPE=database
NODE_ENV=production
```

---

## ⚠️ 方案五：文件存储（不推荐生产环境）

### 仅用于测试

如果暂时不想配置数据库，可以使用文件存储：

```bash
STORAGE_TYPE=file
NODE_ENV=production
```

**警告**：
- ❌ 数据存储在 `/tmp` 目录，重启后丢失
- ❌ 不支持并发写入
- ❌ 性能差
- ❌ 不适合生产环境

**仅用于**：
- 快速测试部署
- 演示功能
- 临时使用

---

## 💡 推荐配置流程

### 第一步：选择方案

**如果你是**：
- 🏢 **企业用户** → 选择腾讯云数据库 PostgreSQL
- 💼 **中小型项目** → 选择腾讯云 Serverless PostgreSQL
- 🧪 **测试/开发** → 选择 Supabase 或 Neon
- 🎯 **快速演示** → 临时使用文件存储

### 第二步：创建数据库

根据选择的方案创建数据库实例

### 第三步：配置 EdgeOne

在 EdgeOne 控制台配置环境变量：

```bash
# 必需配置
STORAGE_TYPE=database
DATABASE_URL=postgresql://...
NODE_ENV=production
```

### 第四步：部署应用

1. 推送代码到 GitHub
2. 在 EdgeOne 连接仓库
3. 配置环境变量
4. 点击部署

### 第五步：初始化数据库

访问：`https://your-domain.com/api/init-db`

---

## 🔐 安全建议

### 1. 密码安全
- ✅ 使用强密码（至少12位）
- ✅ 包含大小写字母、数字、特殊字符
- ❌ 不要在代码中硬编码密码
- ❌ 不要提交 `.env` 文件到 Git

### 2. 网络安全
- ✅ 优先使用内网连接
- ✅ 配置 IP 白名单
- ✅ 使用 SSL 连接
- ❌ 不要开放所有 IP 访问

### 3. 权限管理
- ✅ 创建专用数据库用户
- ✅ 只授予必要的权限
- ✅ 定期更换密码
- ❌ 不要使用 root 用户

### 4. 备份策略
- ✅ 启用自动备份
- ✅ 定期测试恢复
- ✅ 保留多个备份版本
- ✅ 使用应用导出功能额外备份

---

## 📊 成本估算

### 腾讯云数据库 PostgreSQL

| 配置 | 月费用 | 适用场景 |
|------|--------|----------|
| 1核1GB + 20GB存储 | ¥100-150 | 测试环境 |
| 2核4GB + 50GB存储 | ¥300-400 | 小型生产 |
| 4核8GB + 100GB存储 | ¥800-1000 | 中型生产 |

### Serverless PostgreSQL

| 使用量 | 月费用 | 适用场景 |
|--------|--------|----------|
| 低流量（<1000次/天） | ¥20-50 | 个人项目 |
| 中流量（1000-10000次/天） | ¥100-200 | 小型应用 |
| 高流量（>10000次/天） | ¥300+ | 中型应用 |

### 免费方案

| 服务 | 免费额度 | 限制 |
|------|----------|------|
| Supabase | 500MB 数据库 | 海外服务器 |
| Neon | 3GB 存储 | 自动休眠 |

---

## 🛠️ 故障排查

### 问题 1：无法连接数据库

**检查清单**：
- [ ] 数据库 URL 是否正确
- [ ] 用户名密码是否正确
- [ ] IP 白名单是否配置
- [ ] 数据库是否正在运行
- [ ] 网络是否可达

**解决方案**：
```bash
# 测试数据库连接
psql "postgresql://user:password@host:5432/database"
```

### 问题 2：表不存在

**解决方案**：
访问 `/api/init-db` 初始化数据库

### 问题 3：连接超时

**可能原因**：
- 网络问题
- 数据库负载过高
- 连接池耗尽

**解决方案**：
- 检查网络连接
- 升级数据库配置
- 优化查询性能

---

## 📞 获取帮助

### 腾讯云支持
- 官方文档: https://cloud.tencent.com/document/product/409
- 工单系统: 腾讯云控制台 → 工单
- 电话支持: 4009100100

### 社区支持
- GitHub Issues: https://github.com/tangzongzi/lihe/issues
- 腾讯云开发者社区

---

## 总结

**推荐配置**：
1. **生产环境** → 腾讯云数据库 PostgreSQL（内网连接）
2. **测试环境** → Supabase 或 Neon（免费）
3. **快速演示** → 文件存储（临时）

**关键步骤**：
1. 创建数据库实例
2. 获取连接 URL
3. 在 EdgeOne 配置环境变量
4. 部署应用
5. 访问 `/api/init-db` 初始化

**安全第一**：
- 使用强密码
- 配置 IP 白名单
- 启用自动备份
- 定期更新密码
