# Supabase 数据库配置指南

## 📋 配置步骤

### 第一步：注册 Supabase 账号

1. 访问 [Supabase 官网](https://supabase.com/)
2. 点击右上角 **"Start your project"** 或 **"Sign Up"**
3. 选择注册方式：
   - GitHub 账号（推荐，一键登录）
   - Google 账号
   - 邮箱注册

### 第二步：创建项目

1. 登录后，点击 **"New Project"**（新建项目）

2. 填写项目信息：
   ```
   Organization: 选择或创建组织（可以用默认的）
   Project Name: lihe-giftbox（或你喜欢的名字）
   Database Password: 设置一个强密码（重要！请记住）
   Region: 选择 Northeast Asia (Tokyo) - 日本东京（离中国最近）
   Pricing Plan: Free（免费版）
   ```

3. 点击 **"Create new project"**

4. 等待 1-2 分钟，数据库创建中...

### 第三步：获取数据库连接信息

项目创建完成后：

1. 在左侧菜单点击 **"Project Settings"**（项目设置）
2. 点击 **"Database"** 标签
3. 向下滚动找到 **"Connection string"** 部分
4. 选择 **"URI"** 模式
5. 复制连接字符串，格式类似：
   ```
   postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
   ```

6. **重要**：将 `[YOUR-PASSWORD]` 替换为你在第二步设置的密码

### 第四步：配置本地环境

更新你的 `.env` 文件：

```bash
# 存储类型
STORAGE_TYPE=database

# Supabase 数据库连接
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:你的密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# 开发环境
NODE_ENV=development
```

**示例**（假设密码是 MySecurePass123）：
```bash
STORAGE_TYPE=database
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MySecurePass123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
NODE_ENV=development
```

### 第五步：测试连接

1. 停止当前开发服务器（如果正在运行）
2. 重新启动：
   ```bash
   npx next dev --port 3000
   ```

3. 访问初始化 API：
   ```
   http://localhost:3000/api/init-db
   ```

4. 应该看到成功消息：
   ```json
   {
     "success": true,
     "message": "数据库初始化成功"
   }
   ```

5. 测试添加产品：
   - 打开 http://localhost:3000
   - 点击"产品库管理"
   - 点击"+ 添加产品"
   - 填写产品信息并保存

### 第六步：验证数据

在 Supabase 控制台验证数据：

1. 回到 Supabase 项目页面
2. 点击左侧菜单的 **"Table Editor"**（表编辑器）
3. 应该能看到 `products` 表
4. 点击表名查看数据

---

## 🔧 EdgeOne 部署配置

当你准备部署到 EdgeOne 时：

### 在 EdgeOne 控制台配置环境变量

```bash
# 存储类型
STORAGE_TYPE=database

# Supabase 数据库连接（使用 Transaction 模式以获得更好的性能）
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:你的密码@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# 生产环境
NODE_ENV=production
```

**注意**：
- 本地开发使用端口 `6543`（Session 模式）
- 生产环境使用端口 `5432`（Transaction 模式，性能更好）

### 连接模式说明

Supabase 提供三种连接模式：

| 模式 | 端口 | 适用场景 | 说明 |
|------|------|----------|------|
| **Transaction** | 5432 | 生产环境（推荐） | 短连接，性能最好 |
| **Session** | 6543 | 开发环境 | 长连接，适合开发 |
| **Direct** | 5432 | 特殊需求 | 直连数据库 |

**推荐配置**：
- 本地开发：使用 Session 模式（端口 6543）
- EdgeOne 部署：使用 Transaction 模式（端口 5432）

---

## 📊 Supabase 免费额度

| 资源 | 免费额度 | 说明 |
|------|----------|------|
| 数据库存储 | 500 MB | 足够存储数万条产品数据 |
| 带宽 | 5 GB/月 | 适合中小型应用 |
| API 请求 | 无限制 | 完全够用 |
| 文件存储 | 1 GB | 可存储产品图片 |
| 并发连接 | 60 | 足够大部分应用 |

**估算**：
- 每条产品数据约 1KB
- 500MB 可存储约 50 万条产品
- 对于礼盒报价系统完全够用

---

## 🔐 安全建议

### 1. 密码安全

✅ **推荐做法**：
- 使用强密码（至少 16 位）
- 包含大小写字母、数字、特殊字符
- 不要使用常见密码

❌ **避免**：
- 不要在代码中硬编码密码
- 不要提交 `.env` 文件到 Git
- 不要分享数据库密码

### 2. 连接安全

✅ **推荐做法**：
- 使用 SSL 连接（Supabase 默认启用）
- 定期更换密码
- 监控数据库访问日志

### 3. 数据备份

Supabase 自动备份，但建议：
- 定期使用应用的导出功能备份数据
- 保存备份文件到本地或云存储
- 测试恢复流程

---

## 🎯 完整配置示例

### 本地开发配置（.env）

```bash
# 存储类型
STORAGE_TYPE=database

# Supabase 数据库连接（Session 模式）
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MySecurePass123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# 开发环境
NODE_ENV=development
```

### EdgeOne 生产配置

```bash
# 存储类型
STORAGE_TYPE=database

# Supabase 数据库连接（Transaction 模式）
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MySecurePass123@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres

# 生产环境
NODE_ENV=production
```

---

## 🐛 常见问题

### 问题 1：连接超时

**症状**：
```
Error: connect ETIMEDOUT
```

**解决方案**：
1. 检查网络连接
2. 确认防火墙没有阻止连接
3. 尝试使用 VPN
4. 检查 Supabase 服务状态：https://status.supabase.com/

### 问题 2：密码错误

**症状**：
```
Error: password authentication failed
```

**解决方案**：
1. 确认密码正确（注意大小写）
2. 检查连接字符串中的密码是否正确替换
3. 在 Supabase 控制台重置密码

### 问题 3：表不存在

**症状**：
```
Error: relation "products" does not exist
```

**解决方案**：
访问 `/api/init-db` 初始化数据库表

### 问题 4：连接数耗尽

**症状**：
```
Error: remaining connection slots are reserved
```

**解决方案**：
1. 使用 Transaction 模式（端口 5432）
2. 优化代码，及时关闭连接
3. 考虑升级 Supabase 套餐

---

## 📈 监控和管理

### 在 Supabase 控制台

1. **查看数据**：
   - Table Editor → products 表

2. **查看日志**：
   - Logs → Database Logs

3. **查看使用量**：
   - Settings → Usage

4. **备份管理**：
   - Settings → Database → Backups

---

## 🚀 下一步

配置完成后：

1. ✅ 本地测试数据库连接
2. ✅ 测试添加、编辑、删除产品
3. ✅ 推送代码到 GitHub
4. ✅ 在 EdgeOne 配置环境变量
5. ✅ 部署应用
6. ✅ 访问 `/api/init-db` 初始化生产数据库

---

## 📞 获取帮助

### Supabase 支持

- 官方文档: https://supabase.com/docs
- 社区论坛: https://github.com/supabase/supabase/discussions
- Discord: https://discord.supabase.com/

### 项目支持

- GitHub Issues: https://github.com/tangzongzi/lihe/issues

---

## ✅ 配置检查清单

完成以下步骤确保配置正确：

- [ ] 已注册 Supabase 账号
- [ ] 已创建项目
- [ ] 已获取数据库连接字符串
- [ ] 已更新本地 `.env` 文件
- [ ] 已重启开发服务器
- [ ] 已访问 `/api/init-db` 初始化数据库
- [ ] 已测试添加产品功能
- [ ] 已在 Supabase 控制台验证数据
- [ ] 已准备好 EdgeOne 部署配置

---

## 🎉 完成！

现在你的应用已经连接到 Supabase 数据库，可以：
- 在本地开发和测试
- 部署到 EdgeOne 生产环境
- 享受免费的 PostgreSQL 数据库服务

数据将安全地存储在 Supabase 云端，不会因为重启而丢失！
