const { PageVisit, Order } = require('./models/index');
const sequelize = require('./config/database');

async function sync() {
  try {
    await sequelize.authenticate();
    console.log('✅ 資料庫連線成功。');
    
    // 同步 PageVisit 表 (新增 UserAgent, SessionID, Metadata)
    await PageVisit.sync({ alter: true });
    console.log('✅ PageVisit 表同步成功。');

    // 由於 Order 表同步 alter: true 會因為日期格式問題報錯，
    // 且 SessionID 欄位已確認存在，此處僅執行模型同步
    await Order.sync();
    console.log('✅ Order 表模型同步完成。');
    
  } catch (error) {
    console.error('❌ 同步失敗:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

sync();
