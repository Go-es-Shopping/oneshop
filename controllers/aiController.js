// controllers/aiController.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
console.log("【偵探檢查】目前的金鑰狀態:", process.env.GEMINI_API_KEY ? "有讀到！開頭是 " + process.env.GEMINI_API_KEY.substring(0, 6) : "空空如也 (undefined)");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
// ✅ 加上空字串防呆，即使沒設定也不會噴 TypeError 崩潰
const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

exports.generateCopywriting = async (req, res) => {
  try {
    // 從前端接收關鍵字與語氣
    const { keywords, tone, wordCount } = req.body;
  
    if (!keywords) {
      return res.status(400).json({ success: false, message: "請提供關鍵字" });
    }

    // 根據前端傳來的語氣，設定給 AI 的提示詞指令
    let toneInstruction = "專業且具說服力";
    if (tone === "playful") toneInstruction = "活潑、有趣、吸引年輕人";
    if (tone === "formal") toneInstruction = "正式、嚴謹、具備商務感";

    const prompt = `
    你現在是一位擁有 10 年經驗的頂級電商行銷文案大師。
    請根據以下資訊，為商品寫出一段極具吸引力、能帶來高轉換率的社群行銷文案：

    - 產品關鍵字：【 ${keywords} 】
    - 指定語氣：【 ${tone} 】

    【嚴格文案要求】
    1. 字數限制：請務必嚴格控制在 ${wordCount} 字之間。（字數非常重要，請絕對遵守）
    2. 視覺排版：請適當使用 1~3 個 Emoji 增加吸睛度，並適度換行。
    3. 內容結構：
       - 開頭：用一句話痛點或驚呼破冰。
       - 內文：精準帶出產品最大的 1 到 2 個賣點。
       - 結尾：加入強而有力的行動呼籲 (CTA，例如「立即搶購」、「手刀下單」)。
    4. 禁忌：絕對不要出現「好的，這是一段文案」、「為您生成」等 AI 廢話，請直接給出純文案內容。
    `;

    // 呼叫 Gemini 3.5 Flash 模型
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    // 將 AI 產生的文字回傳給前端
    res.json({ success: true, text: responseText });

  } catch (error) {
    console.error("Gemini API 錯誤:", error);
    res.status(500).json({ success: false, message: "AI 生成失敗，請稍後再試。" });
  }
};
exports.editImage = async (req, res) => {
  try {
    const { image, prompt } = req.body; 
    if (!image) return res.status(400).json({ success: false, message: "沒有收到圖片資料" });

    // 啟動 Gemini 擔任決策大腦
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    
    const aiPrompt = `
    你是一個網頁系統的「修圖意圖判斷大腦」。
    使用者的修圖指令是：「${prompt || "自動優化"}」。
    請判斷他的意圖，並嚴格回傳以下 JSON 格式（不要有任何其他廢話或 Markdown 標記）：
    
    規則：
    1. 若包含「提亮、變亮」：回傳 {"action": "filter", "css": "brightness(1.3)", "msg": "已為您提亮畫質"}
    2. 若包含「對比、鮮豔」：回傳 {"action": "filter", "css": "contrast(1.2) saturate(1.2)", "msg": "已提升色彩鮮豔度"}
    3. 若包含「模糊」：回傳 {"action": "blur_bg", "css": "", "msg": "已為您套用單眼相機景深效果"} 
    4. 若包含「去背、去背景」：回傳 {"action": "remove_bg", "css": "", "msg": "正在進行 AI 去背..."}
    5. 若是其他複雜場景：回傳 {"action": "none", "css": "", "msg": "已為您套用 AI 優化"}
    `;

    const result = await model.generateContent(aiPrompt);
    let decision;
    
    try {
      let textResponse = result.response.text();
      textResponse = textResponse.replace("```json", "").replace("```", "").trim();
      decision = JSON.parse(textResponse);
    } catch (e) {
      console.log("JSON 解析失敗，啟用預設值。");
      decision = { action: "none", css: "", msg: "已為您套用預設優化" };
    }

    let finalImageUrl = image; // 這是要去背後的圖
    let originalImageUrl = image; // 新增：保留原圖給模糊背景使用

    if (decision.action === "remove_bg" || decision.action === "blur_bg") {
      try {
        console.log("✨ 正在呼叫 Remove.bg API...");
        const base64Data = image.split(',')[1];
        
        const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
          method: 'POST',
          headers: {
            'X-Api-Key': process.env.REMOVE_BG_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            image_file_b64: base64Data,
            size: 'auto',
            format: 'png'
          })
        });

        if (removeBgResponse.ok) {
          const resultData = await removeBgResponse.json();
          finalImageUrl = `data:image/png;base64,${resultData.data.result_b64}`;
          decision.msg = decision.action === "blur_bg" ? "已為您套用 AI 智慧景深！" : "已為您完美去除背景！";
          console.log("✅ API 處理完成！");
        }
      } catch (err) {
        console.error("呼叫 API 發生嚴重錯誤:", err);
      }
    }

    res.json({
      success: true,
      imageUrl: finalImageUrl,       // 去背後的透明圖
      originalUrl: originalImageUrl, // 原始圖片
      action: decision.action,
      cssFilter: decision.css,
      text: decision.msg
    });

  } catch (error) {
    console.error("AI 修圖錯誤:", error);
    res.status(500).json({ success: false, message: "AI 處理失敗，請稍後再試" });
  }
};