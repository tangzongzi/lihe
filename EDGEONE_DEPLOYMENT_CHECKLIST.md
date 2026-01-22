# EdgeOne + Supabase 部署检查清单

## ✅ 部署前准备

### 1. Supabase 数据库配置

- [x] Supabase 项目已创建
- [x] 项目 URL: `https://kasisvmybixdjdmtnets.supabase.com`
- [x] 数据库密码: `iY8HLsPxEoX35iyZ`
- [x] 连接字符串已准备（Session Mode, 端口 6543）

### 2. GitHub 仓库

- [x] 代码已推送到: `https://github.com/tangzongzi/lihe.git`
- [x] 分支: `main`
- [x] 最新提交包含自动初始化功能

### 3. 代码优化

- [x] 数据库自动初始化已实现
- [x] 移除手动 `/api/init-db` 接口
- [x] 修复 Zod schema 验证问题
- [x] 使用自定义 numeric 验证

## 📋 EdgeOne 部署步骤

### 步骤 1: 登录 EdgeOne 控制台

访问: https://console.cloud.tencent.com/edgeone

### 步骤 2: 创建新应用

1. 点击"创建应用"或"新建项目"
2. 选择"从 Git 仓库导入"

### 步骤 3: 连接 GitHub 仓库

```
仓库 URL: https://github.com/tangzongzi/lihe.git
分支: main
```

### 步骤 4: 配置构建设置

```
框架: Next.js
构建命令: pnpm build
输出目录: .next
安装命令: pnpm install
Node.js 版本: 20.x
```

### 步骤 5: 配置环境变量

**必需的环境变量**：

```bash
STORAGE_TYPE=database
NODE_ENV=production
PGDATABASE_URL=postgresql://postgres.kasisvmybixdjdmtnets:iY8HLsPxEoX35iyZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**重要说明**：
- 使用 `PGDATABASE_URL` 而不是 `DATABASE_URL`
- 使用 Session Mode 连接（端口 6543）
- 密码中包含特殊字符，确保正确复制

### 步骤 6: 部署

1. 检查所有配置
2. 点击"部署"按钮
3. 等待构建完成（约 2-5 分钟）

### 步骤 7: 验证部署

1. 访问分配的域名
2. 尝试添加一个产品
3. **首次操作会自动创建数据库表（可能需要 1-3 秒）**
4. 检查产品是否成功保存
5. 测试搜索、编辑、删除功能
6. 测试导出/导入功能

## 🔍 部署后检查

### 功能测试

- [ ] 页面正常加载
- [ ] 添加产品成功
- [ ] 产品列表显示正常
- [ ] 搜索功能正常
- [ ] 编辑产品成功
- [ ] 删除产品成功
- [ ] 导出数据成功
- [ ] 导入数据成功
- [ ] 价格计算正确

### 性能检查

- [ ] 首次加载速度 < 3秒
- [ ] 后续操作响应快速
- [ ] 数据库查询正常
- [ ] 无明显错误日志

### 数据库检查

- [ ] 数据库表自动创建成功
- [ ] 数据正确保存到 Supabase
- [ ] 数据持久化正常
- [ ] 索引创建成功

## 🚨 常见问题排查

### 问题 1: 构建失败

**检查项**：
- Node.js 版本是否为 20.x
- pnpm 是否正确安装
- 构建命令是否正确

**解决方案**：
```bash
# 确保使用正确的构建命令
pnpm install
pnpm build
```

### 问题 2: 数据库连接失败

**检查项**：
- `PGDATABASE_URL` 环境变量是否正确
- 连接字符串格式是否正确
- Supabase 项目是否正常运行

**解决方案**：
1. 检查环境变量拼写
2. 确认密码正确（包含特殊字符）
3. 使用 Session Mode（端口 6543）

### 问题 3: 首次添加产品很慢

**原因**：首次操作需要创建数据库表

**解决方案**：
- 这是正常现象
- 只在首次发生
- 后续操作会很快
- 查看日志确认表创建成功

### 问题 4: 数据无法保存

**检查项**：
- 数据库连接是否正常
- 环境变量是否配置
- 查看应用日志

**解决方案**：
1. 检查 EdgeOne 日志
2. 确认数据库表已创建
3. 验证 Supabase 连接

## 📊 监控和日志

### 查看应用日志

在 EdgeOne 控制台：
1. 进入应用详情
2. 点击"日志"标签
3. 查看实时日志

### 关键日志信息

**数据库初始化日志**：
```
[DB Init] 检查数据库表...
[DB Init] products 表不存在，开始创建...
[DB Init] products 表创建成功
[DB Init] 索引创建成功
[DB Init] 数据库初始化完成
```

**后续操作日志**：
```
[DB Init] products 表已存在
ProductManager.createProduct - 输入数据: {...}
ProductManager.createProduct - 创建成功: {...}
```

## 🎯 性能优化建议

### 1. CDN 加速

EdgeOne 自动提供 CDN 加速，无需额外配置

### 2. 数据库连接池

coze-coding-dev-sdk 自动管理连接池

### 3. 缓存策略

静态资源自动缓存，API 响应根据需要配置

### 4. 监控告警

设置性能监控和错误告警

## 📝 环境变量说明

### STORAGE_TYPE

- **值**: `database`
- **说明**: 使用数据库存储（生产环境必须）
- **可选值**: `database` | `file`

### NODE_ENV

- **值**: `production`
- **说明**: 生产环境标识
- **影响**: 日志级别、错误处理、性能优化

### PGDATABASE_URL

- **值**: Supabase 连接字符串
- **格式**: `postgresql://user:password@host:port/database`
- **说明**: coze-coding-dev-sdk 使用此变量名

## 🔐 安全建议

1. **环境变量安全**
   - 不要在代码中硬编码
   - 使用 EdgeOne 环境变量管理
   - 定期更换数据库密码

2. **数据库安全**
   - 使用强密码
   - 启用 SSL 连接
   - 限制访问 IP（如需要）

3. **HTTPS**
   - EdgeOne 自动提供 HTTPS
   - 强制使用 HTTPS

4. **定期更新**
   - 及时更新依赖包
   - 修复安全漏洞

## ✨ 部署完成

恭喜！你的应用已成功部署到 EdgeOne + Supabase。

### 下一步

1. 绑定自定义域名（可选）
2. 配置 CDN 缓存策略
3. 设置监控告警
4. 定期备份数据

### 技术支持

- EdgeOne 文档: https://cloud.tencent.com/document/product/1552
- Supabase 文档: https://supabase.com/docs
- GitHub Issues: https://github.com/tangzongzi/lihe/issues

---

**部署日期**: _____________

**部署人员**: _____________

**应用 URL**: _____________

**备注**: _____________
