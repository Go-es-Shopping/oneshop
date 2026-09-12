import http from 'k6/http';
import { sleep, check } from 'k6';

// 1. 設定測試規模（維持一樣的 50 -> 200 -> 500 階段性加壓）
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // 30秒內，人數從 0 慢慢爬升到 50 人
    { duration: '1m', target: 200 },  // 1分鐘內，衝到 200 人
    { duration: '1m', target: 500 },  // 1分鐘內，挑戰 500 人大關！
    { duration: '30s', target: 0 },   // 最後 30 秒，人數降回 0
  ],
};

// 2. 模擬消費者前台瀏覽行為
export default function () {
  // 這裡使用已發布的 retro 賣場 (PageID: 19)
  // 根據你們的路由：GET /api/store/template/:pageID 或 /api/store/store/:slug
  // 這裡我們直接用 PageID 測試最穩妥：
  const url = 'http://localhost:3000/api/store/template/19';
  
  const res = http.get(url);

  // 檢查狀態碼與回應時間
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1); // 模擬真實消費者停留 1 秒
}
