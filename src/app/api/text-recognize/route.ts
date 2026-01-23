import { NextResponse } from 'next/server';

// 提取规则函数
function extractProductInfo(text: string) {
  try {
    console.log('[Extract] 开始提取，原始文字:', text);
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('[Extract] 分割后行数:', lines.length, '内容:', lines);

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
        console.log('[Extract] 找到标题:', title);
        break;
      }
    }

    // 规则2: 提取价格 - 查找所有包含价格的行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 尝试匹配 ¥ 符号后的价格
      const priceMatch = line.match(/¥\s*([\d.]+)/);
      if (priceMatch) {
        price = priceMatch[1];
        console.log('[Extract] 找到价格（¥符号）:', price, '在行:', line);
        break;
      }
      
      // 尝试匹配"元"前的价格
      const yuanMatch = line.match(/([\d.]+)\s*元/);
      if (yuanMatch) {
        price = yuanMatch[1];
        console.log('[Extract] 找到价格（元）:', price, '在行:', line);
        break;
      }
      
      // 尝试匹配"供货价"相关
      if (line.includes('供货价') || line.includes('价格')) {
        // 在当前行查找
        const currentPrice = line.match(/([\d.]+)/);
        if (currentPrice) {
          price = currentPrice[1];
          console.log('[Extract] 找到价格（供货价当前行）:', price);
          break;
        }
        
        // 在下一行查找
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextPrice = nextLine.match(/([\d.]+)/);
          if (nextPrice) {
            price = nextPrice[1];
            console.log('[Extract] 找到价格（供货价下一行）:', price);
            break;
          }
        }
        
        // 在上一行查找
        if (i - 1 >= 0) {
          const prevLine = lines[i - 1];
          const prevPrice = prevLine.match(/([\d.]+)/);
          if (prevPrice) {
            price = prevPrice[1];
            console.log('[Extract] 找到价格（供货价上一行）:', price);
            break;
          }
        }
      }
    }

    // 规则3: 提取规格
    for (const line of lines) {
      if ((line.includes('*') || line.includes('×')) && (line.includes('g') || line.includes('克'))) {
        spec = line;
        console.log('[Extract] 找到规格:', spec);
        break;
      }
    }

    const result = {
      title: title || null,
      spec: spec || null,
      price: price || null,
    };
    
    console.log('[Extract] 最终提取结果:', result);
    return result;
  } catch (error) {
    console.error('[Extract] 提取过程出错:', error);
    return {
      title: null,
      spec: null,
      price: null,
    };
  }
}

export async function POST(request: Request) {
  try {
    console.log('[Text Recognize] 开始处理识别请求');
    console.log('[Text Recognize] 请求方法:', request.method);
    console.log('[Text Recognize] 请求头:', Object.fromEntries(request.headers.entries()));
    
    let body;
    try {
      body = await request.json();
      console.log('[Text Recognize] 请求体解析成功:', body);
    } catch (parseError: any) {
      console.error('[Text Recognize] 请求体解析失败:', parseError);
      return NextResponse.json(
        { error: '请求数据格式错误，请确保发送的是有效的 JSON', success: false },
        { status: 400 }
      );
    }
    
    const { text } = body;

    if (!text) {
      console.log('[Text Recognize] 错误: 文字内容为空');
      return NextResponse.json({ error: '请提供文字内容', success: false }, { status: 400 });
    }

    if (typeof text !== 'string') {
      console.log('[Text Recognize] 错误: 文字格式不正确，类型:', typeof text);
      return NextResponse.json({ error: '文字格式不正确', success: false }, { status: 400 });
    }

    console.log('[Text Recognize] 开始提取产品信息，文字长度:', text.length);
    console.log('[Text Recognize] 文字内容预览:', text.substring(0, 100));
    
    // 使用规则提取产品信息
    const productInfo = extractProductInfo(text);
    
    console.log('[Text Recognize] 提取结果:', productInfo);

    return NextResponse.json({
      ...productInfo,
      success: true,
    });
  } catch (error: any) {
    console.error('[Text Recognize] 识别失败:', error);
    console.error('[Text Recognize] 错误类型:', error?.constructor?.name);
    console.error('[Text Recognize] 错误消息:', error?.message);
    console.error('[Text Recognize] 错误堆栈:', error?.stack);
    
    return NextResponse.json(
      { 
        error: `文字识别失败: ${error?.message || '未知错误'}`,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        success: false,
      },
      { status: 500 }
    );
  }
}
