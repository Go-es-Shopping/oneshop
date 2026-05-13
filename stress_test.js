import http from 'k6/http';
import { sleep, check } from 'k6';


// 1. 設定測試規模
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // 30秒內，人數從 0 慢慢爬升到 50 人
    { duration: '1m', target: 200 },  // 1分鐘內，衝到 200 人
    { duration: '1m', target: 500 },  // 1分鐘內，挑戰你說的 500 人大關！
    { duration: '30s', target: 0 },   // 最後 30 秒，人數降回 0
  ],
};

// 2. 模擬使用者的行為
export default function () {
  // 建議先用 health 測通，再換成 /api/store
 // 注意最後面多加了 /pages
const url = 'http://localhost:3000/api/store/pages';
  
  const res = http.get(url);

  // 檢查有沒有噴 500 錯誤或斷線
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 每個虛擬使用者動作後休息 1 秒，模擬真實人類
}