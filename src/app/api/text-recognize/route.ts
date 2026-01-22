import { NextResponse } from 'next/server';

// 提取规则函数
function extractProductInfo(text: string) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let title = null;
  let spec = null;
  let price = null;

  // 规则1: 提取标题 - 通常是第一行最长的文字
  for (const line of lines) {
    // 跳过明显的非标题行（包含数字较多的、价格符号等）
    if (line.includes('¥') || line.includes('元') || /^\d+$/.test(line)) {
      continue;
    }
    // 标题通常较长且包含中文和数字
    if (line.length > 5 && /[\u4e00-\u9fa5]/.test(line)) {
      title = line;
      break;
    }
  }

  // 规则2: 提取规格和价格
  // 方法A: 从规格行（带*符号）提取
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\*/.test(line) && /g/.test(line)) {
      // 提取规格部分
      const specMatch = line.match(/[^¥\d\s]+(?:\*|×)\d+[g克]/);
      if (specMatch) {
        spec = specMatch[0];
      } else if (line.includes('g') || line.includes('克')) {
        spec = line;
      }

      // 提取价格 - 先找当前行，再找下一行
      const currentLinePrice = line.match(/¥([\d.]+)/);
      if (currentLinePrice) {
        price = currentLinePrice[1];
      } else if (i + 1 < lines.length) {
        const nextLinePrice = lines[i + 1].match(/¥([\d.]+)/);
        if (nextLinePrice) {
          price = nextLinePrice[1];
        }
      }

      if (spec || price) {
        break;
      }
    }
  }

  // 规则3: 如果没有找到价格，尝试从"供货价"标签提取
  // 供货价通常是"供货价"文字上面一行的价格
  if (!price) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('供货价')) {
        // 往上找一行的价格
        if (i - 1 >= 0) {
          const prevLinePrice = lines[i - 1].match(/¥([\d.]+)/);
          if (prevLinePrice) {
            price = prevLinePrice[1];
          }
        }

        if (price) {
          break;
        }
      }
    }
  }

  return {
    title: title || null,
    spec: spec || null,
    price: price || null,
  };
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: '请提供文字内容' }, { status: 400 });
    }

    if (typeof text !== 'string') {
      return NextResponse.json({ error: '文字格式不正确' }, { status: 400 });
    }

    // 使用规则提取产品信息
    const productInfo = extractProductInfo(text);

    return NextResponse.json({
      ...productInfo,
    });
  } catch (error: any) {
    console.error('文字识别失败:', error);
    return NextResponse.json(
      { error: `文字识别失败: ${error?.message || '未知错误'}` },
      { status: 500 }
    );
  }
}
