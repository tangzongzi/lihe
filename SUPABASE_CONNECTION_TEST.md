# Supabase 连接测试

## 项目信息

- **Project URL**: https://kasisvmybixdjdmtnets.supabase.co
- **Project ID**: kasisvmybixdjdmtnets
- **Region**: Northeast Asia (Tokyo)
- **Password**: iY8HLsPxEoX35iyZ

## 连接字符串测试

### 尝试 1: Session 模式（端口 6543）
```
PGDATABASE_URL=postgresql://postgres.kasisvmybixdjdmtnets:iY8HLsPxEoX35iyZ@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```
**结果**: 连接超时，不断重试

### 尝试 2: Transaction 模式（端口 5432）
```
PGDATABASE_URL=postgresql://postgres.kasisvmybixdjdmtnets:iY8HLsPxEoX35iyZ@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
```
**结果**: 测试中...

## 可能的问题

1. **网络问题**: 从中国大陆连接 Supabase 可能有网络延迟或被阻断
2. **连接字符串格式**: 需要确认正确的主机地址
3. **防火墙**: 本地防火墙可能阻止连接

## 解决方案

### 方案 A: 使用 VPN
如果是网络问题，使用 VPN 连接可能解决

### 方案 B: 先用文件存储测试
暂时使用文件存储完成功能测试，部署到 EdgeOne 后再用 Supabase

### 方案 C: 获取正确的连接字符串
从 Supabase 控制台直接复制连接字符串：
1. Project Settings → Database
2. 向下滚动到 "Connection string"
3. 选择 "URI" 模式
4. 复制完整字符串

## 建议

**立即行动**：
1. 先切换回文件存储模式测试功能
2. 推送代码到 GitHub
3. 部署到 EdgeOne（EdgeOne 服务器可能能正常连接 Supabase）
4. 在 EdgeOne 上配置 Supabase 连接

**EdgeOne 部署时的配置**：
```bash
STORAGE_TYPE=database
PGDATABASE_URL=postgresql://postgres.kasisvmybixdjdmtnets:iY8HLsPxEoX35iyZ@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
```

EdgeOne 的服务器在国内，可能能够正常连接 Supabase。
