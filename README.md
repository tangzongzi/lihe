# 礼盒报价计算器

一个基于 Next.js 的礼盒报价计算系统，支持产品管理、价格计算、利润分析等功能。

## 功能特性

- ✅ **产品管理**：添加、编辑、删除产品信息
- ✅ **价格计算**：自动计算成本、运费、手续费和利润
- ✅ **优惠计算**：支持按百分比计算优惠金额
- ✅ **数据导入导出**：支持 JSON 格式的数据备份和恢复
- ✅ **文字识别**：通过 OCR 识别产品信息（实验性功能）
- ✅ **双存储模式**：支持数据库存储和文件存储

## 技术栈

- **前端框架**：Next.js 16 + React 19
- **UI 组件**：Radix UI + Tailwind CSS
- **数据库**：PostgreSQL + Drizzle ORM
- **表单验证**：Zod
- **包管理器**：pnpm 9.0.0+

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置存储方式：

```env
# 使用数据库存储（推荐）
STORAGE_TYPE=database

# 或使用文件存储（仅用于开发测试）
# STORAGE_TYPE=file
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

**注意**：如果使用数据库存储，首次添加产品时会自动创建数据库表。

## 项目结构

```
.
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── products/      # 产品 CRUD API
│   │   │   ├── init-db/       # 数据库初始化
│   │   │   └── text-recognize/# 文字识别 API
│   │   └── page.tsx           # 主页面
│   ├── components/            # React 组件
│   │   └── ui/               # UI 组件库
│   ├── storage/              # 数据存储层
│   │   └── database/         # 数据库相关
│   │       ├── productManager.ts  # 产品管理器
│   │       └── shared/
│   │           └── schema.ts      # 数据库 Schema
│   └── lib/                  # 工具函数
│       └── storage-adapter.ts # 存储适配器
├── public/                   # 静态资源
├── scripts/                  # 构建脚本
├── DEPLOYMENT.md            # 部署指南
└── STORAGE_README.md        # 存储方式说明
```

## 计算规则

### 费用计算

- **商品成本** = 供货价 × 数量
- **供货商运费**：
  - 1件：3元
  - 2件：5元
  - 3件及以上：免运费
- **客户运费**：
  - 1件：设定的单件运费
  - 多件：每件运费 × 数量
- **客户实付** = (店铺售价 × 数量) + 客户运费
- **手续费** = 客户实付 × 0.6%
- **利润** = 客户实付 - 手续费 - 商品成本 - 供货商运费

### 优惠计算

- **最大可优惠** = 客户实付 - (商品成本 + 供货商运费) ÷ 0.994
- 优惠后利润为 0（盈亏平衡点）

## 存储方式

### 数据库存储（推荐）

- 数据持久化到 PostgreSQL
- 支持大规模数据
- 高性能查询
- 适合生产环境

### 文件存储

- 数据存储在 `/tmp/data/products.json`
- 无需数据库配置
- 适合开发测试
- 系统重启后可能丢失数据

详细说明请查看 [STORAGE_README.md](./STORAGE_README.md)

## 部署

### 腾讯 EdgeOne 部署

详细部署步骤请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

快速部署：

1. 推送代码到 GitHub
2. 在 EdgeOne 控制台连接仓库
3. 配置环境变量（`STORAGE_TYPE=database` 和 `PGDATABASE_URL`）
4. 点击部署
5. 首次使用时数据库表会自动创建

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tangzongzi/lihe)

## 数据备份

### 导出数据

1. 打开应用
2. 点击"产品库管理"
3. 点击"导出"按钮
4. 保存 JSON 文件

### 导入数据

1. 打开应用
2. 点击"产品库管理"
3. 点击"导入"按钮
4. 选择之前导出的 JSON 文件

## 开发

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### 代码检查

```bash
pnpm lint
```

### 类型检查

```bash
pnpm ts-check
```

## 常见问题

### 1. 添加产品失败

**解决方案**：
- 检查数据库连接是否正常
- 查看浏览器控制台和服务器日志
- 首次使用时数据库表会自动创建，可能需要几秒钟

### 2. 数据丢失

**解决方案**：
- 如果使用文件存储，定期导出备份
- 推荐使用数据库存储以确保数据持久化
- 配置数据库自动备份

### 3. 部署后无法连接数据库

**解决方案**：
- 检查环境变量 `DATABASE_URL` 是否正确
- 确保数据库允许来自部署平台的连接
- 检查数据库用户权限

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

- GitHub: [tangzongzi/lihe](https://github.com/tangzongzi/lihe)
- 问题反馈: [Issues](https://github.com/tangzongzi/lihe/issues)
