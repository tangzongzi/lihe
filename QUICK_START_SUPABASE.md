# 🚀 Supabase 快速开始（5分钟配置）

## 第一步：创建 Supabase 账号和项目（2分钟）

### 1. 访问并注册
👉 打开浏览器访问：https://supabase.com/

### 2. 点击 "Start your project" 或 "Sign Up"

### 3. 使用 GitHub 账号登录（最快）
- 点击 "Continue with GitHub"
- 授权 Supabase 访问

### 4. 创建新项目
点击 **"New Project"** 按钮

### 5. 填写项目信息
```
Project Name: lihe-giftbox
Database Password: [设置一个强密码，务必记住！]
Region: Northeast Asia (Tokyo) - 日本东京
Pricing Plan: Free
```

### 6. 点击 "Create new project"
等待 1-2 分钟...

---

## 第二步：获取数据库连接（1分钟）

### 1. 项目创建完成后，点击左侧 "Project Settings"（齿轮图标）

### 2. 点击 "Database" 标签

### 3. 向下滚动找到 "Connection string"

### 4. 选择 "URI" 模式

### 5. 复制连接字符串
看起来像这样：
```
postgresql://postgres.xxxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 6. 替换密码
将 `[YOUR-PASSWORD]` 替换为你刚才设置的密码

**最终连接字符串示例**：
```
postgresql://postgres.abcdefghijklmnop:MySecurePass123@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

---

## 第三步：配置本地环境（1分钟）

### 1. 打开项目根目录的 `.env` 文件

### 2. 修改内容为：
```bash
# 存储类型
STORAGE_TYPE=database

# Supabase 数据库连接（粘贴你的连接字符串）
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:你的密码@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres

# 开发环境
NODE_ENV=development
```

### 3. 保存文件

---

## 第四步：测试连接（1分钟）

### 1. 如果开发服务器正在运行，先停止它
按 `Ctrl + C` 停止

### 2. 重新启动开发服务器
```bash
npx next dev --port 3000
```

### 3. 打开浏览器访问
```
http://localhost:3000/api/init-db
```

### 4. 看到成功消息
```json
{
  "success": true,
  "message": "数据库初始化成功"
}
```

✅ **恭喜！数据库配置成功！**

---

## 第五步：测试功能（1分钟）

### 1. 访问应用首页
```
http://localhost:3000
```

### 2. 点击 "产品库管理"

### 3. 点击 "+ 添加产品"

### 4. 填写产品信息
```
产品名称: 测试产品
供货价: 10.50
店铺售价: 15.00（可选）
```

### 5. 点击保存

### 6. 验证数据
- 在应用中看到产品列表
- 或在 Supabase 控制台查看：
  - 左侧菜单 → Table Editor → products 表

✅ **完成！你的应用现在使用 Supabase 数据库了！**

---

## 🎯 EdgeOne 部署配置

当你准备部署到 EdgeOne 时：

### 在 EdgeOne 控制台添加环境变量

```bash
STORAGE_TYPE=database
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:你的密码@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
```

**注意**：生产环境使用端口 `5432`（不是 6543）

---

## ⚠️ 重要提示

### 1. 密码安全
- ✅ 使用强密码
- ❌ 不要分享密码
- ❌ 不要提交 `.env` 到 Git

### 2. 连接字符串
- 本地开发：端口 `6543`
- 生产环境：端口 `5432`

### 3. 数据备份
- 定期使用应用的"导出"功能备份数据
- Supabase 会自动备份，但额外备份更安全

---

## 🐛 遇到问题？

### 连接失败
1. 检查密码是否正确
2. 检查网络连接
3. 确认 Supabase 服务正常：https://status.supabase.com/

### 表不存在
访问 `/api/init-db` 初始化数据库

### 其他问题
查看详细文档：`SUPABASE_SETUP.md`

---

## 📋 配置检查清单

- [ ] 已创建 Supabase 账号和项目
- [ ] 已获取数据库连接字符串
- [ ] 已更新 `.env` 文件
- [ ] 已重启开发服务器
- [ ] 已访问 `/api/init-db` 初始化
- [ ] 已测试添加产品
- [ ] 数据在 Supabase 控制台可见

全部完成？🎉 **你已经成功配置 Supabase 数据库！**

---

## 📞 需要帮助？

- 详细文档：`SUPABASE_SETUP.md`
- 数据库指南：`EDGEONE_DATABASE_GUIDE.md`
- GitHub Issues: https://github.com/tangzongzi/lihe/issues
