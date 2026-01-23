/**
 * OCR 图片识别模块（前端处理）
 * 使用 Tesseract.js 在浏览器中识别图片文字
 */

export interface OcrResult {
  productName: string
  supplyPrice: string
  specification: string
}

// Tesseract Worker 实例（单例）
let worker: any = null

/**
 * 获取或创建 Tesseract Worker
 * 使用动态导入减少初始包体积
 */
async function getWorker() {
  if (!worker) {
    // 动态导入 Tesseract.js
    const Tesseract = (await import('tesseract.js')).default
    
    // 创建 Worker（支持中文简体 + 英文）
    worker = await Tesseract.createWorker('chi_sim+eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR 进度: ${Math.round(m.progress * 100)}%`)
        }
      },
    })
  }
  
  return worker
}

/**
 * 识别图片中的文字
 * @param imageFile 图片文件
 * @returns OCR 识别结果
 */
export async function recognizeImage(imageFile: File): Promise<OcrResult> {
  const worker = await getWorker()
  
  // 执行 OCR 识别
  const { data: { text } } = await worker.recognize(imageFile)
  
  // 解析识别的文本
  return parseOcrText(text)
}

/**
 * 解析 OCR 识别的文本
 * 提取产品名称、价格和规格信息
 */
function parseOcrText(text: string): OcrResult {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  let productName = ''
  let supplyPrice = ''
  let specification = ''
  
  // 规则1: 提取产品名称（第一行包含中文的较长文字）
  for (const line of lines) {
    // 跳过明显的非标题行
    if (line.includes('¥') || line.includes('元') || /^\d+$/.test(line)) {
      continue
    }
    
    // 标题通常较长且包含中文
    if (line.length > 3 && /[\u4e00-\u9fa5]/.test(line)) {
      productName = line
      break
    }
  }
  
  // 规则2: 提取价格
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // 匹配 ¥ 符号后的价格
    const priceMatch = line.match(/[¥￥]\s*(\d+\.?\d*)/)
    if (priceMatch) {
      supplyPrice = priceMatch[1]
      break
    }
    
    // 匹配"元"前的价格
    const yuanMatch = line.match(/(\d+\.?\d*)\s*元/)
    if (yuanMatch) {
      supplyPrice = yuanMatch[1]
      break
    }
    
    // 匹配"供货价"相关
    if (line.includes('供货价') || line.includes('价格')) {
      const currentPrice = line.match(/(\d+\.?\d*)/)
      if (currentPrice) {
        supplyPrice = currentPrice[1]
        break
      }
      
      // 在下一行查找
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const nextPrice = nextLine.match(/(\d+\.?\d*)/)
        if (nextPrice) {
          supplyPrice = nextPrice[1]
          break
        }
      }
    }
  }
  
  // 规则3: 提取规格（包含 * 或 × 以及 g 或 克）
  for (const line of lines) {
    if (/[*×]\s*\d+\s*[gG克]/.test(line)) {
      specification = line
      break
    }
  }
  
  return {
    productName,
    supplyPrice,
    specification,
  }
}

/**
 * 清理 Tesseract Worker
 * 释放资源
 */
export async function cleanupWorker() {
  if (worker) {
    await worker.terminate()
    worker = null
  }
}
