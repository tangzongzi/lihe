'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CalculationResult {
  totalCost: number;
  supplierFreight: number;
  customerFreight: number;
  customerPayment: number;
  fee: number;
  totalExpense: number;
  profit: number;
  maxDiscount: number;
}

interface Product {
  id: string;
  name: string;
  supplierPrice: string;
  shopPrice?: string;
}

export default function GiftBoxCalculator() {
  const [formData, setFormData] = useState({
    supplierPrice: '',
    quantity: '1',
    singleFreight: '5',
    multipleFreight: '5',
    shopPrice: '',
  });

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [discountAmount, setDiscountAmount] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCalculationRulesDialogOpen, setIsCalculationRulesDialogOpen] = useState(false);
  const [isProductLibraryDialogOpen, setIsProductLibraryDialogOpen] = useState(false);
  const [isExpenseDetailOpen, setIsExpenseDetailOpen] = useState(false);
  const [isPriceAnalysisOpen, setIsPriceAnalysisOpen] = useState(false);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string>('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductShopPrice, setEditProductShopPrice] = useState('');
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  
  // 添加产品对话框状态
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProductForm, setAddProductForm] = useState({
    name: '',
    supplierPrice: '',
    shopPrice: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  
  // 文字识别状态
  const [recognitionText, setRecognitionText] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  // 添加产品功能
  const handleAddProduct = async () => {
    if (!addProductForm.name.trim() || !addProductForm.supplierPrice.trim()) {
      alert('请填写产品名称和供货价');
      return;
    }

    setIsAdding(true);

    try {
      // 构建请求数据，只在有值时包含 shopPrice
      const requestData: {
        name: string;
        supplyPrice: string;
        shopPrice?: string;
      } = {
        name: addProductForm.name.trim(),
        supplyPrice: addProductForm.supplierPrice.trim(),
      };

      // 只在有值时添加 shopPrice
      if (addProductForm.shopPrice.trim()) {
        requestData.shopPrice = addProductForm.shopPrice.trim();
      }

      console.log('开始添加产品，请求数据:', requestData);

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('添加产品响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('响应Content-Type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          console.log('添加产品成功，返回数据:', result);
          
          if (result.success && result.data) {
            setProducts([...products, result.data]);
            setAddProductForm({ name: '', supplierPrice: '', shopPrice: '' });
            setRecognitionText('');
            setIsAddProductOpen(false);
            alert('产品添加成功！');
          } else {
            alert(`添加产品失败：${result.error || '未知错误'}`);
          }
        } else {
          const errorText = await response.text();
          console.error('添加产品失败 - 响应不是JSON格式:', errorText);
          alert(`添加产品失败：服务器返回了非JSON格式响应 (${response.status})`);
        }
      } else {
        const errorText = await response.text();
        console.error('添加产品失败 - HTTP错误:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        
        try {
          const errorData = JSON.parse(errorText);
          const errorMsg = errorData.error || '服务器错误';
          
          // 特殊错误处理
          if (errorMsg.includes('数据库表不存在')) {
            alert('数据库未初始化，请访问 /api/init-db 初始化数据库');
          } else {
            alert(`添加产品失败：${errorMsg}`);
          }
        } catch {
          alert(`添加产品失败：服务器错误 (${response.status})`);
        }
      }
    } catch (error) {
      console.error('添加产品失败 - 网络或解析错误:', error);
      alert(`添加产品失败：${error instanceof Error ? error.message : '网络错误'}`);
    } finally {
      setIsAdding(false);
    }
  };

  // 文字识别功能（仅文本解析，不使用 OCR）
  const handleRecognizeText = async () => {
    if (!recognitionText.trim()) {
      alert('请输入或粘贴产品信息文字');
      return;
    }

    setIsRecognizing(true);

    try {
      // 提取产品信息
      console.log('开始提取产品信息:', recognitionText);
      const productInfo = extractProductInfo(recognitionText);
      console.log('提取结果:', productInfo);

      let hasData = false;

      if (productInfo.title) {
        setAddProductForm(prev => ({ ...prev, name: productInfo.title || '' }));
        hasData = true;
      }
      if (productInfo.price) {
        setAddProductForm(prev => ({ ...prev, supplierPrice: productInfo.price || '' }));
        hasData = true;
      }

      if (hasData) {
        alert('识别成功！已自动填充产品信息');
      } else {
        alert('未能识别出产品信息，请检查文字格式，或手动填写');
      }
    } catch (error) {
      console.error('识别失败:', error);
      alert(`识别失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsRecognizing(false);
    }
  };

  // 前端提取产品信息的函数
  const extractProductInfo = (text: string) => {
    try {
      console.log('[Extract] 开始提取，原始文字:', text);

      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      console.log('[Extract] 分割后行数:', lines.length);

      let title = null;
      let spec = null;
      let price = null;

      // 规则1: 提取标题 - 通常是第一行最长的文字
      for (const line of lines) {
        // 跳过明显的非标题行
        if (line.includes('¥') || line.includes('元') || /^\d+$/.test(line)) {
          continue;
        }
        // 标题通常较长且包含中文
        if (line.length > 5 && /[\u4e00-\u9fa5]/.test(line)) {
          title = line;
          console.log('[Extract] 找到标题:', title);
          break;
        }
      }

      // 规则2: 提取价格
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 匹配 ¥ 符号后的价格
        const priceMatch = line.match(/¥\s*([\d.]+)/);
        if (priceMatch) {
          price = priceMatch[1];
          console.log('[Extract] 找到价格（¥符号）:', price);
          break;
        }

        // 匹配"元"前的价格
        const yuanMatch = line.match(/([\d.]+)\s*元/);
        if (yuanMatch) {
          price = yuanMatch[1];
          console.log('[Extract] 找到价格（元）:', price);
          break;
        }

        // 匹配"供货价"相关
        if (line.includes('供货价') || line.includes('价格')) {
          const currentPrice = line.match(/([\d.]+)/);
          if (currentPrice) {
            price = currentPrice[1];
            console.log('[Extract] 找到价格（供货价）:', price);
            break;
          }

          // 在下一行查找
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextPrice = nextLine.match(/([\d.]+)/);
            if (nextPrice) {
              price = nextPrice[1];
              console.log('[Extract] 找到价格（下一行）:', price);
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
  };

  // 导出产品数据
  const handleExportProducts = async () => {
    try {
      console.log('前端: 开始导出产品数据')

      const response = await fetch('/api/products/export', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log('前端: 导出响应状态:', response.status, response.statusText)

      // 检查 Content-Type
      const contentType = response.headers.get('content-type')
      console.log('前端: Content-Type:', contentType)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('前端: 导出失败:', errorText)
        alert(`导出失败：${errorText}`)
        return
      }

      // 检查是否是 JSON 错误响应
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json()
        if (errorData.error) {
          console.error('前端: 导出失败（JSON）:', errorData)
          alert(`导出失败：${errorData.error}`)
          return
        }
      }

      // 获取文件名
      const contentDisposition = response.headers.get('content-disposition')
      let filename = `products-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.json`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      console.log('前端: 文件名:', filename)

      // 获取 Blob 数据
      const blob = await response.blob()
      console.log('前端: Blob 大小:', blob.size, 'bytes')

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.style.display = 'none'

      // 添加到 DOM，触发下载
      document.body.appendChild(a)
      a.click()

      // 清理
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }, 100)

      console.log('前端: 导出成功')
      alert('导出成功！')
    } catch (error) {
      console.error('前端: 导出失败:', error)
      alert('导出失败，请稍后重试')
    }
  };

  // 导入产品数据
  const handleImportProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || '导入成功！');
        await loadProducts(); // 重新加载产品列表
      } else {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          alert(`导入失败：${errorData.error}`);
        } else {
          const errorText = await response.text();
          alert(`导入失败：${errorText}`);
        }
      }
    } catch (error) {
      console.error('导入失败:', error);
      alert('导入失败，请稍后重试');
    }

    // 清空文件选择
    event.target.value = '';
  };

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          if (result.success && result.data) {
            setProducts(result.data);
          }
        } else {
          const errorText = await response.text();
          console.error('加载产品失败 - 非 JSON 响应:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        }
      } else {
        console.error('加载产品失败:', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      console.error('加载产品失败:', {
        error,
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== id));
        if (selectedProductId === id) {
          setSelectedProductId('');
        }
        setSearchQuery(''); // 清空搜索框
        alert('产品删除成功');
      } else {
        let errorMessage = '未知错误';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || '服务器错误';
          } else {
            const errorText = await response.text();
            console.error('删除产品失败 - 非 JSON 响应:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            errorMessage = `服务器错误 (${response.status})`;
          }
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorMessage = `服务器错误 (${response.status})`;
        }
        console.error('删除产品失败:', errorMessage);
        alert(`删除产品失败：${errorMessage}`);
      }
    } catch (error) {
      console.error('删除产品失败 - 详细信息:', {
        error,
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(`删除产品失败：${error instanceof Error ? error.message : '网络错误或服务器异常'}`);
    }
  };

  const editProduct = (product: Product) => {
    setEditingProductId(product.id);
    setEditProductName(product.name);
    setEditProductPrice(product.supplierPrice);
    setEditProductShopPrice(product.shopPrice || '');
    setIsEditProductDialogOpen(true);
  };

  const updateProduct = async () => {
    if (!editProductName.trim() || !editProductPrice.trim()) {
      alert('请填写产品名称和供货价');
      return;
    }

    setIsUpdatingProduct(true);

    try {
      // 构建请求数据，只在有值时包含 shopPrice
      const requestData: {
        name: string;
        supplyPrice: string;
        shopPrice?: string;
      } = {
        name: editProductName.trim(),
        supplyPrice: editProductPrice.trim(),
      };

      // 只在有值时添加 shopPrice
      if (editProductShopPrice.trim()) {
        requestData.shopPrice = editProductShopPrice.trim();
      }

      const response = await fetch(`/api/products/${editingProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        setProducts(products.map(p => p.id === editingProductId ? updatedProduct : p));
        setEditProductName('');
        setEditProductPrice('');
        setEditProductShopPrice('');
        setEditingProductId('');
        setIsEditProductDialogOpen(false);
        alert('产品更新成功！');
      } else {
        let errorMessage = '未知错误';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || '服务器错误';
          } else {
            const errorText = await response.text();
            console.error('更新产品失败 - 非 JSON 响应:', {
              status: response.status,
              statusText: response.statusText,
              body: errorText
            });
            errorMessage = `服务器错误 (${response.status})`;
          }
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
          errorMessage = `服务器错误 (${response.status})`;
        }
        console.error('更新产品失败:', errorMessage);
        alert(`更新产品失败：${errorMessage}`);
      }
    } catch (error) {
      console.error('更新产品失败 - 详细信息:', {
        error,
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(`更新产品失败：${error instanceof Error ? error.message : '网络错误或服务器异常'}`);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const selectProduct = (id: string) => {
    setSelectedProductId(id);
    const product = products.find(p => p.id === id);
    if (product) {
      setFormData({
        ...formData,
        supplierPrice: product.supplierPrice,
        shopPrice: product.shopPrice || '',
      });
    }
  };

  const getSingleCustomerPayment = (): string => {
    const shopPrice = parseFloat(formData.shopPrice) || 0;
    const singleFreight = parseFloat(formData.singleFreight) || 0;
    const total = shopPrice + singleFreight;
    return `¥${total.toFixed(2)}`;
  };

  const calculateSupplierFreight = (quantity: number): number => {
    if (quantity === 1) return 3;
    if (quantity === 2) return 5;
    return 0;
  };

  const calculateCustomerFreight = (quantity: number, single: number, multiple: number): number => {
    if (quantity === 1) return single;
    return quantity * multiple;
  };

  const calculate = () => {
    const supplierPrice = parseFloat(formData.supplierPrice) || 0;
    const quantity = parseInt(formData.quantity) || 1;
    const singleFreight = parseFloat(formData.singleFreight) || 0;
    const multipleFreight = parseFloat(formData.multipleFreight) || 0;
    const shopPrice = parseFloat(formData.shopPrice) || 0;

    const totalCost = supplierPrice * quantity;
    const supplierFreight = calculateSupplierFreight(quantity);
    const customerFreight = calculateCustomerFreight(quantity, singleFreight, multipleFreight);
    const customerPayment = shopPrice * quantity + customerFreight;
    const fee = customerPayment * 0.006;
    const supplierExpense = totalCost + supplierFreight;
    const totalExpense = supplierExpense + fee;
    const profit = customerPayment - totalExpense;

    // 最大可优惠：使优惠后利润为0
    // 优惠后客户实付款 = 原客户付款 - 优惠金额
    // 优惠后手续费 = (原客户付款 - 优惠金额) × 0.006
    // 优惠后利润 = (原客户付款 - 优惠金额) × 0.994 - 给供货商费用
    // 设优惠后利润 = 0，则：
    // (原客户付款 - 优惠金额) × 0.994 = 给供货商费用
    // 原客户付款 - 优惠金额 = 给供货商费用 / 0.994
    // 优惠金额 = 原客户付款 - 给供货商费用 / 0.994
    const maxDiscount = customerPayment - supplierExpense / 0.994;

    setResult({
      totalCost,
      supplierFreight,
      customerFreight,
      customerPayment,
      fee,
      totalExpense,
      profit,
      maxDiscount,
    });
  };

  const formatMoney = (value: number): string => {
    return `¥${value.toFixed(2)}`;
  };

  const getDiscountedProfit = (): number | null => {
    if (!result) return null;
    const discount = parseFloat(discountAmount) || 0;
    // 优惠后客户实付款 = 原客户付款 - 优惠金额
    // 优惠后手续费 = 优惠后客户实付款 × 0.006 = (原客户付款 - 优惠金额) × 0.006
    // 优惠后利润 = 优惠后客户实付款 - 优惠后手续费 - 给供货商费用
    //             = (原客户付款 - 优惠金额) × 0.994 - 给供货商费用
    const discountedCustomerPayment = result.customerPayment - discount;
    const discountedFee = discountedCustomerPayment * 0.006;
    const supplierExpense = result.totalCost + result.supplierFreight;
    const discountedProfit = discountedCustomerPayment - discountedFee - supplierExpense;
    return discountedProfit;
  };

  const applyDiscountPercentage = (percentage: number) => {
    if (!result) return;
    // 期望利润减少 = 利润 × 百分比
    const expectedProfitDecrease = result.profit * (percentage / 100);
    // 期望优惠后利润 = 原利润 - 利润减少
    const expectedDiscountedProfit = result.profit - expectedProfitDecrease;

    // 反推需要的折扣金额：
    // 期望优惠后利润 = (原客户付款 - 折扣金额) × 0.994 - 给供货商费用
    // 原客户付款 - 折扣金额 = (给供货商费用 + 期望优惠后利润) / 0.994
    // 折扣金额 = 原客户付款 - (给供货商费用 + 期望优惠后利润) / 0.994
    const supplierExpense = result.totalCost + result.supplierFreight;
    const neededDiscount = result.customerPayment - (supplierExpense + expectedDiscountedProfit) / 0.994;

    setDiscountAmount(neededDiscount.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 p-6 md:p-10">
      <div className="max-w-[1280px] mx-auto space-y-8">
        {/* 标题 */}
        <div className="text-center space-y-3 py-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
            礼盒报价计算器
          </h1>
          <div className="flex items-center justify-center gap-3 pt-4">
            <Dialog open={isProductLibraryDialogOpen} onOpenChange={setIsProductLibraryDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-sm"
                >
                  产品库管理
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto border-2">
                <DialogHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">产品库管理</DialogTitle>
                      <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                        管理已录入的产品信息
                      </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleExportProducts}
                        variant="outline"
                        size="sm"
                        className="border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 h-9 px-4 text-sm"
                      >
                        导出
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 h-9 px-4 text-sm"
                        asChild
                      >
                        <label htmlFor="import-file" className="cursor-pointer">
                          导入
                        </label>
                      </Button>
                      <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleImportProducts}
                        className="hidden"
                      />
                      <Button
                        onClick={() => setIsAddProductOpen(true)}
                        className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-medium h-9 px-4 text-sm"
                      >
                        + 添加产品
                      </Button>
                    </div>
                  </div>
                </DialogHeader>
                <div className="pt-6">
                  {products.length > 0 ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 text-sm font-bold text-gray-700 dark:text-gray-300 pb-3 border-b-2 border-gray-200 dark:border-gray-700">
                        <div className="pl-2">产品名称</div>
                        <div>供货价</div>
                        <div>店铺售价</div>
                        <div className="text-right pr-2">操作</div>
                      </div>
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="grid grid-cols-4 gap-4 items-center text-sm py-4 px-4 bg-white dark:bg-gray-900/50 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all"
                        >
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {product.name}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 font-mono font-medium">
                            ¥{product.supplierPrice}
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 font-mono font-medium">
                            {product.shopPrice ? `¥${product.shopPrice}` : <span className="text-gray-400 dark:text-gray-600">—</span>}
                          </div>
                          <div className="text-right pr-2 flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editProduct(product)}
                              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors font-medium"
                            >
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium"
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-900/30 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
                      <p className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">产品库为空</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={isCalculationRulesDialogOpen} onOpenChange={setIsCalculationRulesDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shadow-sm"
                >
                  计算规则
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto border-2">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">计算规则说明</DialogTitle>
                </DialogHeader>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300 pt-6">
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">客户实际付款：</strong>店铺售价 × 数量 + 客户运费</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">给供货商的费用：</strong>商品成本 + 供货商运费</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">手续费：</strong>客户实际付款 × 0.6%</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">供货商运费规则：</strong>第一件3元，第二件2元，3件及以上免运费</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">客户运费规则：</strong>一件运费为设定值，多件运费为每件设定的单价</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">利润：</strong>客户实际付款 - 手续费 - 给供货商的费用</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">最大可优惠：</strong>客户付款 - 给供货商费用 ÷ 0.994，优惠后利润为0（盈亏平衡点）</span>
                  </li>
                  <li className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <span><strong className="text-gray-900 dark:text-white">优惠计算：</strong>选择利润百分比时，反推折扣金额使利润减少恰好等于原利润的指定百分比</span>
                  </li>
                </ul>
              </DialogContent>
            </Dialog>

            {/* 支出明细弹窗 */}
            <Dialog open={isExpenseDetailOpen} onOpenChange={setIsExpenseDetailOpen}>
              <DialogContent className="sm:max-w-[480px] border-2">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">支出明细</DialogTitle>
                </DialogHeader>
                {result && (
                  <div className="space-y-4 pt-4">
                    <div className="p-5 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 rounded-2xl border-2 border-gray-200 dark:border-gray-800 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">给供货商的费用</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatMoney(result.totalCost + result.supplierFreight)}</span>
                      </div>
                      <div className="pl-3 text-sm text-gray-600 dark:text-gray-400 space-y-2 bg-white dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between">
                          <span className="font-semibold">• 商品成本</span>
                          <span className="font-bold">{formatMoney(result.totalCost)}</span>
                        </div>
                        <div className="text-gray-500 pl-2 text-xs">
                          (供货价 {parseFloat(formData.supplierPrice).toFixed(2)} × {formData.quantity})
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold">• 供货商运费</span>
                          <span className="font-bold">{formatMoney(result.supplierFreight)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">手续费 (0.6%)</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatMoney(result.fee)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* 单价分析弹窗 */}
            <Dialog open={isPriceAnalysisOpen} onOpenChange={setIsPriceAnalysisOpen}>
              <DialogContent className="sm:max-w-[480px] border-2">
                <DialogHeader className="space-y-3">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">单价分析</DialogTitle>
                </DialogHeader>
                {result && (
                  <div className="space-y-4 pt-4">
                    <div className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 rounded-2xl border-2 border-gray-200 dark:border-gray-800 space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">单件成本</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100 text-base">
                            ¥{parseFloat(formData.supplierPrice).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">单件售价</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            ¥{parseFloat(formData.shopPrice).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                          <span className="text-gray-600 dark:text-gray-400 font-medium">单件客户付款</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            ¥{(parseFloat(formData.shopPrice) + parseFloat(formData.singleFreight)).toFixed(2)}
                          </span>
                        </div>
                        <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent my-2" />
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 rounded-xl border-2 border-gray-200 dark:border-gray-800">
                          <span className="font-bold text-gray-900 dark:text-gray-100">单件利润</span>
                          <span className={`font-bold text-xl text-gray-900 dark:text-gray-100`}>
                            ¥{(result.profit / parseInt(formData.quantity)).toFixed(2)}
                          </span>
                        </div>
                        {result.maxDiscount > 0 && (
                          <div className="flex justify-between items-center p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                            <span className="text-gray-600 dark:text-gray-400 font-medium">单件最大优惠</span>
                            <span className="font-bold text-gray-900 dark:text-gray-100">
                              ¥{(result.maxDiscount / parseInt(formData.quantity)).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-[400px_1fr] gap-6">
          {/* 左栏：输入表单 */}
          <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="space-y-3 pb-5">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">输入信息</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">填写商品和运输相关信息</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {/* 产品选择 */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 rounded-2xl border-2 border-gray-200 dark:border-gray-800 space-y-3 shadow-sm mb-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="productSelect" className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    选择产品
                  </Label>
                  <Button
                    onClick={() => setIsAddProductOpen(true)}
                    className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-medium h-8 px-3 text-xs"
                  >
                    + 添加产品
                  </Button>
                </div>

                {/* 编辑产品对话框 */}
                <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
                  <DialogContent className="sm:max-w-[440px] border-2">
                    <DialogHeader className="space-y-3">
                      <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">编辑产品</DialogTitle>
                      <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                        修改产品信息
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="editProductName" className="text-sm font-semibold text-gray-700 dark:text-gray-300">产品名称</Label>
                        <Input
                          id="editProductName"
                          placeholder="例如：红色礼盒A款"
                          value={editProductName}
                          onChange={(e) => setEditProductName(e.target.value)}
                          className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editProductPrice" className="text-sm font-semibold text-gray-700 dark:text-gray-300">供货价（元）</Label>
                        <Input
                          id="editProductPrice"
                          type="number"
                          step="0.01"
                          placeholder="例如：47.3"
                          value={editProductPrice}
                          onChange={(e) => setEditProductPrice(e.target.value)}
                          className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editProductShopPrice" className="text-sm font-semibold text-gray-700 dark:text-gray-300">店铺售价（元，可选）</Label>
                        <Input
                          id="editProductShopPrice"
                          type="number"
                          step="0.01"
                          placeholder="例如：68"
                          value={editProductShopPrice}
                          onChange={(e) => setEditProductShopPrice(e.target.value)}
                          className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          填写后，选择该产品时会自动填充到店铺售价
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditProductDialogOpen(false)}
                          className="flex-1 h-11 border-2 border-gray-200 dark:border-gray-700"
                        >
                          取消
                        </Button>
                        <Button
                          onClick={updateProduct}
                          disabled={isUpdatingProduct}
                          className="flex-1 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 hover:from-gray-700 hover:to-gray-600 dark:hover:from-gray-100 dark:hover:to-gray-200 text-white dark:text-gray-900 shadow-lg font-semibold h-11 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingProduct ? '保存中...' : '保存'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {products.length > 0 ? (
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="搜索产品..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-10 text-xs"
                    />
                    <div className="max-h-[240px] overflow-y-auto space-y-1.5 pr-1">
                      {products
                        .filter(product =>
                          product.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((product) => (
                          <div
                            key={product.id}
                            onClick={() => selectProduct(product.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedProductId === product.id
                                ? 'bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 border-gray-800 dark:border-gray-300 shadow-md'
                                : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-semibold text-sm ${
                                  selectedProductId === product.id
                                    ? 'text-white dark:text-gray-900'
                                    : 'text-gray-900 dark:text-gray-100'
                                }`}>
                                  {product.name}
                                </span>
                                <span className={`text-sm font-mono font-semibold ${
                                  selectedProductId === product.id
                                    ? 'text-gray-200 dark:text-gray-800'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  ¥{product.supplierPrice}
                                </span>
                              </div>
                              {product.shopPrice && (
                                <div className={`text-xs font-medium ${
                                  selectedProductId === product.id
                                    ? 'text-gray-200 dark:text-gray-800'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  售价: ¥{product.shopPrice}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      {products.filter(product =>
                        product.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                          未找到匹配的产品
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 bg-white dark:bg-gray-950 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                    暂无产品，点击上方按钮添加
                  </div>
                )}
              </div>

              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="supplierPrice" className="text-sm font-semibold text-gray-700 dark:text-gray-300">供货价（单件）</Label>
                  <Input
                    id="supplierPrice"
                    type="number"
                    step="0.01"
                    placeholder="请输入供货价"
                    value={formData.supplierPrice}
                    onChange={(e) => setFormData({ ...formData, supplierPrice: e.target.value })}
                    className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 dark:text-gray-300">购买数量（件）</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="请输入数量"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11 text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="singleFreight" className="text-sm font-semibold text-gray-700 dark:text-gray-300">一件运费</Label>
                    <Input
                      id="singleFreight"
                      type="number"
                      step="0.01"
                      placeholder="默认5元"
                      value={formData.singleFreight}
                      onChange={(e) => setFormData({ ...formData, singleFreight: e.target.value })}
                      className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11 text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="multipleFreight" className="text-sm font-semibold text-gray-700 dark:text-gray-300">多件运费（每件）</Label>
                    <Input
                      id="multipleFreight"
                      type="number"
                      step="0.01"
                      placeholder="默认5元"
                      value={formData.multipleFreight}
                      onChange={(e) => setFormData({ ...formData, multipleFreight: e.target.value })}
                      className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11 text-base"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shopPrice" className="text-sm font-semibold text-gray-700 dark:text-gray-300">店铺售价</Label>
                  <Input
                    id="shopPrice"
                    type="number"
                    step="0.01"
                    placeholder="请输入售价"
                    value={formData.shopPrice}
                    onChange={(e) => setFormData({ ...formData, shopPrice: e.target.value })}
                    className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-11 text-base"
                  />
                  {formData.shopPrice && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                      <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">单件客户实际付款</div>
                      <div className="text-base text-gray-700 dark:text-gray-300">
                        {getSingleCustomerPayment()}
                        <span className="text-gray-500 dark:text-gray-500 ml-2">
                          (店铺售价 {parseFloat(formData.shopPrice).toFixed(2)} + 运费 {parseFloat(formData.singleFreight).toFixed(2)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={calculate}
                  className="w-full bg-gradient-to-r from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 hover:from-gray-700 hover:to-gray-600 dark:hover:from-gray-100 dark:hover:to-gray-200 text-white dark:text-gray-900 shadow-xl font-bold h-12 transition-all text-base"
                  size="lg"
                >
                  开始计算
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右栏：核心结果 + 优惠计算 */}
          <Card className="shadow-xl border-2 border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm">
            <div className="p-6">
                <div className="space-y-3 pb-5">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">计算结果与优惠</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">核心收益、优惠模拟与详细分析</p>
                </div>
              {result ? (
                <div className="space-y-6">
                  {/* 核心数据展示 */}
                  <div className="max-w-3xl mx-auto grid grid-cols-3 gap-5">
                    {/* 客户付款 */}
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-gray-900/30 rounded-2xl border-2 border-blue-200 dark:border-blue-900 shadow-sm space-y-2">
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        客户付款
                      </div>
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 leading-tight">
                        {formatMoney(result.customerPayment)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>店铺售价 ¥{parseFloat(formData.shopPrice).toFixed(2)} × {formData.quantity}</div>
                        <div>+ 客户运费 ¥{result.customerFreight.toFixed(2)}</div>
                        <div>= {formatMoney(result.customerPayment)}</div>
                      </div>
                    </div>

                    {/* 总支出 */}
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 rounded-2xl border-2 border-gray-200 dark:border-gray-800 shadow-sm space-y-2 relative">
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        总支出
                      </div>
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                        {formatMoney(result.totalExpense)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>供货商费用 ¥{formatMoney(result.totalCost + result.supplierFreight)}</div>
                        <div>+ 手续费 ¥{formatMoney(result.fee)}</div>
                        <div>= {formatMoney(result.totalExpense)}</div>
                      </div>
                      <button
                        onClick={() => setIsExpenseDetailOpen(true)}
                        className="absolute top-3 right-3 px-3 py-1.5 bg-white dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 transition-all"
                      >
                        查看明细
                      </button>
                    </div>

                    {/* 利润 */}
                    <div className={`p-4 bg-gradient-to-br ${result.profit > 0 ? 'from-green-50 to-white dark:from-green-950/30 dark:to-gray-900/30 border-green-200 dark:border-green-900' : 'from-red-50 to-white dark:from-red-950/30 dark:to-gray-900/30 border-red-200 dark:border-red-900'} rounded-2xl border-2 shadow-sm space-y-2 relative`}>
                      <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {result.profit > 0 ? '盈利' : '亏损'}
                      </div>
                      <div className={`text-3xl font-bold ${result.profit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} leading-tight`}>
                        {formatMoney(result.profit)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                        <div>客户付款 ¥{formatMoney(result.customerPayment)}</div>
                        <div>- 总支出 ¥{formatMoney(result.totalExpense)}</div>
                        <div>= {formatMoney(result.profit)}</div>
                      </div>
                      <button
                        onClick={() => setIsPriceAnalysisOpen(true)}
                        className="absolute top-3 right-3 px-3 py-1.5 bg-white dark:bg-gray-950 border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 transition-all"
                      >
                        单价分析
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent" />

                  {/* 优惠计算区域 */}
                  <div className="max-w-3xl mx-auto p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/30 rounded-2xl border-2 border-gray-200 dark:border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-gray-700 dark:text-gray-300">
                        快速选择折扣（利润百分比）
                      </div>
                      {result.maxDiscount > 0 && (
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                          最大可优惠：{formatMoney(result.maxDiscount)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {[5, 10, 15, 20, 25, 30].map((percentage) => {
                        // 期望利润减少 = 利润 × 百分比
                        const expectedProfitDecrease = result.profit * (percentage / 100);
                        // 期望优惠后利润 = 原利润 - 利润减少
                        const expectedDiscountedProfit = result.profit - expectedProfitDecrease;
                        // 反推需要的折扣金额
                        const supplierExpense = result.totalCost + result.supplierFreight;
                        const discountAmt = result.customerPayment - (supplierExpense + expectedDiscountedProfit) / 0.994;
                        const isOverLimit = discountAmt > result.maxDiscount;
                        return (
                          <button
                            key={percentage}
                            onClick={() => applyDiscountPercentage(percentage)}
                            disabled={isOverLimit}
                            className={`p-2.5 rounded-lg border-2 transition-all text-center ${
                              isOverLimit
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800'
                                : 'bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md'
                            }`}
                          >
                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100 leading-none">
                              {percentage}%
                            </div>
                            <div className={`text-xs font-semibold mt-1 ${isOverLimit ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                              ¥{discountAmt.toFixed(2)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <div className="p-4 bg-white dark:bg-gray-950 rounded-xl border-2 border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <Label htmlFor="discountAmount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">优惠金额</Label>
                          <span className="text-xs text-gray-400 dark:text-gray-500">元</span>
                        </div>
                        <Input
                          id="discountAmount"
                          type="number"
                          step="0.01"
                          placeholder="输入优惠金额"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className="border-2 border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-600 h-10 text-base font-medium"
                        />
                      </div>

                      <div className="p-4 bg-white dark:bg-gray-950 rounded-xl border-2 border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">优惠后利润</span>
                        </div>
                        <div className={`text-2xl font-bold ${getDiscountedProfit()! > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} leading-none`}>
                          {discountAmount ? formatMoney(getDiscountedProfit()!) : '-'}
                        </div>
                        {discountAmount && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            基于优惠后客户实付款 {formatMoney(result.customerPayment - parseFloat(discountAmount))}
                          </div>
                        )}
                      </div>
                    </div>

                    {discountAmount && (
                      <>
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 p-5 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">原客户付款</span>
                            <span className="font-bold text-base">{formatMoney(result.customerPayment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">优惠金额</span>
                            <span className="font-bold text-base text-red-600 dark:text-red-400">- {formatMoney(parseFloat(discountAmount) || 0)}</span>
                          </div>
                          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">优惠后客户实付款</span>
                            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">{formatMoney(result.customerPayment - (parseFloat(discountAmount) || 0))}</span>
                          </div>
                          <div className="flex justify-between mt-3">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">原手续费</span>
                            <span className="font-bold text-base">{formatMoney(result.fee)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">优惠后手续费</span>
                            <span className="font-bold text-base text-green-600 dark:text-green-400">- {formatMoney((result.customerPayment - parseFloat(discountAmount)) * 0.006)}</span>
                          </div>
                          <div className="text-gray-500 text-xs mt-2 pl-1">
                            手续费减少：{formatMoney(result.fee - (result.customerPayment - parseFloat(discountAmount)) * 0.006)}
                          </div>
                          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">原利润</span>
                            <span className="font-bold text-base">{formatMoney(result.profit)}</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mt-3">
                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">利润减少明细：</div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">• 客户少付</span>
                              <span className="font-bold text-red-600 dark:text-red-400">- {formatMoney(parseFloat(discountAmount) || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">• 手续费减少</span>
                              <span className="font-bold text-green-600 dark:text-green-400">+ {formatMoney(result.fee - (result.customerPayment - parseFloat(discountAmount)) * 0.006)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="font-bold text-gray-900 dark:text-gray-100">利润减少</span>
                              <span className="font-bold text-lg text-orange-600 dark:text-orange-400">{formatMoney(result.profit - getDiscountedProfit()!)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-bold text-gray-900 dark:text-gray-100">优惠后利润</span>
                            <span className={`font-bold text-xl ${getDiscountedProfit()! > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatMoney(getDiscountedProfit()!)}
                            </span>
                          </div>
                        </div>

                        {getDiscountedProfit()! < 0 && (
                          <div className="p-5 bg-red-50 dark:bg-red-950/20 rounded-xl border-2 border-red-200 dark:border-red-900">
                            <p className="text-base font-bold text-red-600 dark:text-red-400">
                              警告：优惠金额过大，将导致亏损 {formatMoney(Math.abs(getDiscountedProfit()!))}！
                            </p>
                          </div>
                        )}

                        {result.maxDiscount > 0 && getDiscountedProfit()! >= 0 && (
                          <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-900 space-y-2">
                            <p className="text-base font-bold text-blue-600 dark:text-blue-400">
                              剩余可优惠空间：{formatMoney(result.maxDiscount - (parseFloat(discountAmount) || 0))}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400 opacity-80">
                              达到盈亏平衡点还可优惠的金额
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">请填写左侧信息并点击计算</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">核心结果、优惠计算和详细信息将在此处显示</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 添加产品对话框 */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[500px] border-2 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">添加新产品</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              填写产品信息或粘贴文字自动识别
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* 文字识别区域 */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                智能识别（可选）
              </Label>
              
              {/* 文字输入区域 */}
              <div className="relative">
                <textarea
                  placeholder="粘贴产品文字信息，例如：&#10;百草味坚果有礼（臻选礼）1075g坚果零食礼盒&#10;规格：坚果有礼-臻选礼1075g*1盒&#10;供货价：¥39.00"
                  value={recognitionText}
                  onChange={(e) => setRecognitionText(e.target.value)}
                  className="w-full h-32 p-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              <Button
                onClick={handleRecognizeText}
                disabled={isRecognizing || !recognitionText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10"
              >
                {isRecognizing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    识别中...
                  </span>
                ) : (
                  '🔍 识别文字信息'
                )}
              </Button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800"></div>

            {/* 表单区域 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-product-name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  产品名称 *
                </Label>
                <Input
                  id="add-product-name"
                  placeholder="例如：红色礼盒A款"
                  value={addProductForm.name}
                  onChange={(e) => setAddProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-product-supplier-price" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  供货价（元）*
                </Label>
                <Input
                  id="add-product-supplier-price"
                  type="number"
                  step="0.01"
                  placeholder="例如：47.3"
                  value={addProductForm.supplierPrice}
                  onChange={(e) => setAddProductForm(prev => ({ ...prev, supplierPrice: e.target.value }))}
                  className="border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-product-shop-price" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  店铺售价（元，可选）
                </Label>
                <Input
                  id="add-product-shop-price"
                  type="number"
                  step="0.01"
                  placeholder="例如：68"
                  value={addProductForm.shopPrice}
                  onChange={(e) => setAddProductForm(prev => ({ ...prev, shopPrice: e.target.value }))}
                  className="border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddProductOpen(false);
                  setAddProductForm({ name: '', supplierPrice: '', shopPrice: '' });
                  setRecognitionText('');
                }}
                className="flex-1 h-10 border border-gray-300 dark:border-gray-700"
              >
                取消
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={isAdding}
                className="flex-1 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 font-medium h-10"
              >
                {isAdding ? '添加中...' : '添加产品'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
