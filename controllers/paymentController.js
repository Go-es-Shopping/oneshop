const { Payment, Order, sequelize } = require('../models');
const { createAesDecrypt } = require('../utils/newebpay');

const paymentController = {
  // 處理藍新金流背景通知 (NotifyURL)
  notify: async (req, res) => {
    try {
      console.log('🔔 收到藍新背景通知 (NotifyURL)...');
      
      // 藍新 POST 過來的資料通常包含 TradeInfo (加密字串)
      const { TradeInfo } = req.body;

      if (!TradeInfo) {
        console.error('❌ 接收到的藍新通知缺少 TradeInfo');
        return res.status(400).send('0|Error: Missing TradeInfo');
      }

      // 1. 使用我們寫好的工具解密 TradeInfo
      const decryptedString = createAesDecrypt(TradeInfo);
      
      // 藍新解密後通常是 Query String 格式，我們把它轉成物件
      const tradeData = Object.fromEntries(new URLSearchParams(decryptedString));
      console.log('🔓 解密後的藍新付款資料:', tradeData);

      // 檢查交易是否成功 (Status 為 'SUCCESS')
      if (tradeData.Status === 'SUCCESS') {
        const resultData = JSON.parse(tradeData.Result);
        
        const merchantOrderNo = resultData.MerchantOrderNo; // 例如: GOEZ_14_1717...
        const tradeNo = resultData.TradeNo;               // 藍新交易序號 (對應你資料庫的 TradeNo)
        const payTime = resultData.PayTime;               // 付款時間 (例如 2026-06-06 12:00:00)

        // 從 MerchantOrderNo 解析出真正的 OrderID (例如從 'GOEZ_14_...' 抓出 14)
        // 假設你的格式是 GOEZ_${OrderID}_${Timestamp}
        const parts = merchantOrderNo.split('_');
        const orderID = parts[1];

        if (!orderID) {
          console.error('❌ 無法從 MerchantOrderNo 解析出 OrderID:', merchantOrderNo);
          return res.status(400).send('0|Error: Invalid OrderID');
        }

        // 2. 更新資料庫中的 Payment 紀錄
        const payment = await Payment.findOne({ where: { OrderID: orderID } });
        
        if (payment) {
          payment.PaymentStatus = 1;         // 1 = 已付款
          payment.PaidAt = payTime ? new Date(payTime) : new Date(); // 填入付款時間
          payment.TradeNo = tradeNo;         // 💡 填入我們剛剛討論的重要欄位：藍新交易序號！
          await payment.save();

          // 同時也可以把訂單狀態 (PaymentStatus) 改成已付款 (1)
          await Order.update({ PaymentStatus: 1 }, { where: { OrderID: orderID } });

          console.log(`✅ 訂單 #${orderID} 付款成功！TradeNo: ${tradeNo} 已成功寫入資料庫。`);
        } else {
          console.warn(`⚠️ 找不到對應 OrderID = ${orderID} 的 Payment 紀錄`);
        }
      } else {
        console.log('⚠️ 藍新回報交易未成功 Status:', tradeData.Status);
      }

      // 3. 按照藍新規定，必須回覆 "1|OK" 告訴藍新我們收到了，才不會一直被重覆通知
      return res.send('1|OK');

    } catch (error) {
      console.error('❌ 處理藍新 Notify 發生例外錯誤:', error);
      return res.status(500).send('0|Error: Server Exception');
    }
  }
};

module.exports = paymentController;