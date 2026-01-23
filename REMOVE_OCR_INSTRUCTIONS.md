# 移除图片 OCR 功能的修改说明

## 需要修改的内容

### 1. 移除状态变量（第 66-67 行）
删除：
```typescript
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>('');
```

### 2. 移除图片处理函数（第 162-199 行）
删除以下函数：
- `handleImageUpload`
- `handleImagePaste`  
- `clearImage`

### 3. 修改识别函数名称和逻辑（第 201-260 行）
将 `handleRecognizeImage` 改为 `handleRecognizeText`，并移除 Tesseract.js 相关代码

### 4. 修改 UI 部分
在添加产品对话框中：
- 移除图片上传区域
- 移除图片预览
- 只保留文本输入框
- 按钮文字改为"识别文字"

### 5. 移除 tesseract.js 依赖
在 package.json 中删除：
```json
"tesseract.js": "^7.0.0"
```

### 6. 更新 clearImage 调用
在 handleAddProduct 中，将 `clearImage()` 改为只清空文本：
```typescript
setRecognitionText('');
```
