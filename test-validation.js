const http = require('http');

/**
 * 簡易的 HTTP POST 請求工具
 */
function post(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: responseData ? JSON.parse(responseData) : {}
        });
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(body);
    req.end();
  });
}

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🧪 開始執行 Lead 級別驗證測試...');
  console.log('⚠️ 請確保伺服器已在背景啟動 (node app.js)');

  try {
    // 1. 測試：數量為 0 的攔截 (Checkout)
    console.log('\n[測試 1] 數量為 0 的攔截 (Checkout)...');
    const res1 = await post(`${baseUrl}/api/checkout/calculate`, {
      cartItems: [{ productId: 1, quantity: 0 }]
    });
    if (res1.status === 400 && res1.data.message === '商品數量必須大於 0') {
      console.log('✅ 成功攔截：數量為 0');
    } else {
      console.log('❌ 攔截失敗：', res1.status, res1.data);
    }

    // 2. 測試：無效 ProductID 的攔截 (Checkout)
    console.log('\n[測試 2] 無效 ProductID 的攔截 (Checkout)...');
    const res2 = await post(`${baseUrl}/api/checkout/calculate`, {
      cartItems: [{ productId: 999999, quantity: 1 }]
    });
    if (res2.status === 400 && res2.data.message.includes('找不到 ID 為 999999')) {
      console.log('✅ 成功攔截：無效 ProductID');
    } else {
      console.log('❌ 攔截失敗：', res2.status, res2.data);
    }

    // 3. 測試：追蹤功能的參數驗證 (與 test.http 一致)
    console.log('\n[測試 3] 追蹤功能的參數驗證 (與 test.http 一致)...');
    const res3 = await post(`${baseUrl}/api/track/view`, {
      productId: 1,
      pageType: 'Product',
      referrer: 'http://test.com'
    });
    if (res3.status === 201 && res3.data.status === 'success') {
      console.log('✅ 成功傳送追蹤資料 (camelCase)');
    } else {
      console.log('❌ 傳送失敗：', res3.status, res3.data);
    }

  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error.message);
    console.log('💡 提醒：請先啟動 node app.js 再執行此測試。');
  }
}

runTests();
