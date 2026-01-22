# Git 提交和推送指南

## 准备工作

### 1. 初始化 Git 仓库（如果还没有）

```bash
git init
```

### 2. 配置 Git 用户信息

```bash
git config user.name "你的名字"
git config user.email "你的邮箱"
```

## 提交代码到本地仓库

### 1. 查看文件状态

```bash
git status
```

### 2. 添加文件到暂存区

```bash
# 添加所有文件
git add .

# 或添加特定文件
git add src/storage/database/shared/schema.ts
git add src/storage/database/productManager.ts
```

### 3. 提交到本地仓库

```bash
git commit -m "修复数据库逻辑并优化产品添加功能

- 修复 Zod schema 验证问题
- 优化 numeric 类型处理
- 简化数据预处理逻辑
- 添加部署配置文件
- 更新 README 文档"
```

## 推送到 GitHub

### 1. 添加远程仓库

```bash
git remote add origin https://github.com/tangzongzi/lihe.git
```

### 2. 检查远程仓库

```bash
git remote -v
```

### 3. 推送到 GitHub

```bash
# 首次推送（设置上游分支）
git push -u origin main

# 后续推送
git push
```

### 如果遇到分支名称问题

如果你的默认分支是 `master` 而不是 `main`：

```bash
# 重命名分支
git branch -M main

# 然后推送
git push -u origin main
```

### 如果远程仓库已有内容

如果 GitHub 仓库已经有内容，需要先拉取：

```bash
# 拉取远程代码并合并
git pull origin main --allow-unrelated-histories

# 解决冲突（如果有）
# 编辑冲突文件，然后：
git add .
git commit -m "合并远程代码"

# 推送
git push origin main
```

## 完整操作流程

```bash
# 1. 查看状态
git status

# 2. 添加所有文件
git add .

# 3. 提交
git commit -m "修复数据库逻辑并优化产品添加功能"

# 4. 添加远程仓库（首次）
git remote add origin https://github.com/tangzongzi/lihe.git

# 5. 推送
git push -u origin main
```

## 常见问题

### 问题 1：推送被拒绝

```
! [rejected]        main -> main (fetch first)
```

**解决方案**：

```bash
# 先拉取远程代码
git pull origin main --rebase

# 然后推送
git push origin main
```

### 问题 2：认证失败

如果使用 HTTPS 推送时提示认证失败：

**解决方案 1：使用 Personal Access Token**

1. 访问 GitHub Settings → Developer settings → Personal access tokens
2. 生成新的 token（勾选 `repo` 权限）
3. 使用 token 作为密码推送

**解决方案 2：使用 SSH**

```bash
# 生成 SSH 密钥
ssh-keygen -t ed25519 -C "你的邮箱"

# 添加到 ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 在 GitHub Settings → SSH and GPG keys 中添加公钥

# 修改远程仓库 URL
git remote set-url origin git@github.com:tangzongzi/lihe.git

# 推送
git push origin main
```

### 问题 3：文件太大

如果有大文件无法推送：

```bash
# 查看大文件
find . -type f -size +50M

# 添加到 .gitignore
echo "大文件路径" >> .gitignore

# 从 Git 历史中移除
git rm --cached 大文件路径
git commit -m "移除大文件"
```

## 后续更新流程

当你修改代码后，使用以下流程更新：

```bash
# 1. 查看修改
git status
git diff

# 2. 添加修改
git add .

# 3. 提交
git commit -m "描述你的修改"

# 4. 推送
git push
```

## 分支管理（可选）

如果需要使用分支开发：

```bash
# 创建并切换到新分支
git checkout -b feature/new-feature

# 开发并提交
git add .
git commit -m "添加新功能"

# 推送分支
git push -u origin feature/new-feature

# 切换回主分支
git checkout main

# 合并分支
git merge feature/new-feature

# 推送主分支
git push
```

## 查看提交历史

```bash
# 查看提交日志
git log

# 查看简洁日志
git log --oneline

# 查看图形化日志
git log --graph --oneline --all
```

## 撤销操作

```bash
# 撤销工作区修改
git checkout -- 文件名

# 撤销暂存区修改
git reset HEAD 文件名

# 撤销最后一次提交（保留修改）
git reset --soft HEAD^

# 撤销最后一次提交（丢弃修改）
git reset --hard HEAD^
```

## 标签管理

```bash
# 创建标签
git tag v1.0.0

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push origin --tags
```

## 建议的提交信息格式

```
类型: 简短描述（不超过50字符）

详细描述（可选）：
- 修改了什么
- 为什么修改
- 影响范围

相关 Issue: #123
```

**常用类型**：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**：

```bash
git commit -m "fix: 修复产品添加时的数据验证问题

- 优化 Zod schema 处理 numeric 类型
- 修复空字符串导致的验证失败
- 简化数据预处理逻辑

相关 Issue: #1"
```
