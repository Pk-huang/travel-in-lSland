# 實際工程應用：AI 行程生成 + 3D 錨點

> 文件角色：工程實作示例（參考用，不是權威規格）
>
> 維護規則：僅在架構或實作策略調整時更新

## 核心流程

```
user input → BFF AI API → frontend parse → 3D camera fly
```

---

## 1. 後端：BFF AI 行程生成 API

### 檔案：`app/api/generate-itinerary/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 系統 Prompt（硬碼版本，功能穩定後可升級到 JSON）
const SYSTEM_PROMPT = `你是冰島旅遊安全專家。
根據使用者的旅遊偏好與當天天氣風險，生成一份可執行的一日行程。

重要規則：
1. 行程不超過 12 小時（考慮冰島冬季日照短）
2. 必須包含休息點（每 3 小時一次）
3. 優先標示高風險路段（閉合道路、低能見度）
4. 所有景點必須來自冰島南岸（63°N - 65°N, -22°W - -13°W）
5. 確保景點名稱與「冰島官方名稱」一致

回傳 JSON 格式：
{
  "title": "建議行程標題",
  "riskScore": 45,
  "items": [
    {
      "time": "08:00",
      "title": "景點或活動名",
      "lat": 64.0,
      "lon": -21.5,
      "duration": "1h",
      "risk": "low|medium|high",
      "reason": "為什麼去這裡？"
    }
  ],
  "warnings": ["高天氣風險", "路況提示"]
}`;

// 主 API 路由
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput, weather, roads, promptVersion = 'v1' } = body;

    // 記錄使用的 prompt 版本（用於後續 A/B 測試）
    console.log(`[AI] Generating itinerary with prompt version: ${promptVersion}`);

    // 呼叫 LLM（Vercel AI SDK）
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `今天的天氣：${JSON.stringify(weather)}
道路狀況：${JSON.stringify(roads)}
使用者需求：${userInput}

請根據上述資訊生成行程。`,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    });

    // 串流回傳，讓前端即時監聽
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('[AI] Error:', error);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}
```

### 進階版：多版本 Prompt（未來升級）

```typescript
// 如果要支持多個 prompt 版本，可以這樣做：

const PROMPTS = {
  v1: `你是冰島旅遊安全專家...`, // 簡單版
  v2: `你是冰島旅遊安全與地質專家...`, // 加入地質背景
};

export async function POST(request: NextRequest) {
  const { promptVersion = 'v1' } = await request.json();
  const systemPrompt = PROMPTS[promptVersion] || PROMPTS.v1;

  // ... 用 systemPrompt 呼叫 LLM
}
```

---

## 2. 前端：解析 AI 結果 + 生成 3D 錨點

### 檔案：`src/hooks/useItineraryGeneration.ts`

```typescript
import { useState, useCallback } from 'react';
import { useItineraryStore } from '@/store/itinerary';
import { useCameraStore } from '@/store/camera';

export function useItineraryGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setItinerary = useItineraryStore(s => s.setItinerary);
  const flyToPoint = useCameraStore(s => s.flyToPoint);

  const generate = useCallback(
    async (userInput: string, weatherData: any, roadData: any) => {
      setLoading(true);
      setError(null);

      try {
        // 1. 呼叫 BFF API（串流）
        const response = await fetch('/api/generate-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput,
            weather: weatherData,
            roads: roadData,
            promptVersion: 'v1',
          }),
        });

        if (!response.ok) throw new Error('API failed');

        // 2. 消費 stream 並解析 JSON
        const reader = response.body?.getReader();
        let fullText = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          fullText += chunk;

          // 嘗試解析 JSON（LLM 可能分批返回）
          try {
            const itinerary = JSON.parse(fullText);

            // 3. 儲存行程到 Zustand
            setItinerary(itinerary);

            // 4. 抽出景點名並生成 3D 錨點
            itinerary.items.forEach((item: any) => {
              createAnchorButton(item);
            });
          } catch {
            // JSON 尚未完整，繼續等待
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    },
    [setItinerary, flyToPoint]
  );

  return { generate, loading, error };
}

// 輔助：建立 3D 錨點按鈕
function createAnchorButton(item: any) {
  // 在 3D 場景上放置可點擊的球體或標記
  return {
    id: `poi-${item.tilte}`,
    position: [item.lon, item.lat, 100], // [lon, lat, elevation]
    label: item.title,
    onClick: () => {
      // 點擊時讓相機飛到該點
      useCameraStore.getState().flyToPoint({
        lat: item.lat,
        lon: item.lon,
        distance: 2000,
      });
    },
  };
}
```

### 檔案：`src/components/ItineraryPanel.tsx`

```typescript
import React, { useState } from 'react';
import { useItineraryGeneration } from '@/hooks/useItineraryGeneration';

export function ItineraryPanel() {
  const [userPreference, setUserPreference] = useState('');
  const { generate, loading, error } = useItineraryGeneration();
  const itinerary = useItineraryStore(s => s.itinerary);
  const weather = useWeatherStore(s => s.weather);
  const roads = useRoadStore(s => s.roads);

  const handleGenerate = async () => {
    await generate(userPreference, weather, roads);
  };

  return (
    <div className="itinerary-panel">
      <h2>🎯 AI 行程建議</h2>

      {/* 輸入框 */}
      <input
        value={userPreference}
        onChange={e => setUserPreference(e.target.value)}
        placeholder="例如：我想要南岸一日遊，安全優先"
        disabled={loading}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? '生成中...' : '生成行程'}
      </button>

      {error && <div style={{ color: 'red' }}>{error}</div>}

      {/* 顯示生成的行程 */}
      {itinerary && (
        <div className="itinerary-list">
          <h3>{itinerary.title}</h3>
          <p>風險分數: {itinerary.riskScore}/100</p>

          {itinerary.items.map((item: any, idx: number) => (
            <ItineraryItem key={idx} item={item} />
          ))}

          {itinerary.warnings.length > 0 && (
            <div className="warnings">
              <h4>⚠️ 提示</h4>
              {itinerary.warnings.map((w: string, i: number) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 單項行程卡片
function ItineraryItem({ item }: { item: any }) {
  const flyToPoint = useCameraStore(s => s.flyToPoint);

  return (
    <div className="itinerary-item">
      <div className="left">
        <span className="time">{item.time}</span>
        <h4>{item.title}</h4>
        <p>{item.reason}</p>
      </div>

      <div className="right">
        {/* 點擊直接飛到 3D 場景 */}
        <button
          onClick={() => {
            flyToPoint({
              lat: item.lat,
              lon: item.lon,
              distance: 2000,
              duration: 2, // 2 秒動畫
            });
          }}
          className={`risk-${item.risk}`}
        >
          📍 飛到 {item.title}
        </button>
      </div>
    </div>
  );
}
```

---

## 3. 3D 場景集成

### 檔案：`src/components/Scene3D.tsx`

```typescript
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useItineraryStore } from '@/store/itinerary';
import { useCameraStore } from '@/store/camera';

export function Scene3D() {
  const itinerary = useItineraryStore(s => s.itinerary);
  const cameraTarget = useCameraStore(s => s.target);
  const cameraRef = useRef();

  useFrame(({ camera }) => {
    // 相機動畫：平滑飛向目標
    if (cameraTarget) {
      camera.position.lerp(cameraTarget.position, 0.05);
      camera.lookAt(cameraTarget.lookAt);
    }
  });

  return (
    <>
      {/* 3D 地形 */}
      <IslandTerrain />

      {/* 天氣與道路點位 */}
      <WeatherLayer />
      <RoadLayer />

      {/* AI 行程錨點 */}
      {itinerary?.items.map((item: any) => (
        <AnchorPoint key={item.title} item={item} />
      ))}
    </>
  );
}

function AnchorPoint({ item }: { item: any }) {
  const getRiskColor = (risk: string) => {
    return {
      low: 0x00ff00,
      medium: 0xffff00,
      high: 0xff0000,
    }[risk];
  };

  return (
    <mesh position={[item.lon, item.lat, 100]}>
      <sphereGeometry args={[50, 32, 32]} />
      <meshStandardMaterial color={getRiskColor(item.risk)} />
    </mesh>
  );
}
```

---

## 4. 資料流整合（Zustand Store）

### 檔案：`src/store/itinerary.ts`

```typescript
import { create } from 'zustand';

type Itinerary = {
  title: string;
  riskScore: number;
  items: Array<{
    time: string;
    title: string;
    lat: number;
    lon: number;
    risk: 'low' | 'medium' | 'high';
  }>;
  warnings: string[];
};

interface ItineraryStore {
  itinerary: Itinerary | null;
  setItinerary: (itinerary: Itinerary) => void;
  clearItinerary: () => void;
}

export const useItineraryStore = create<ItineraryStore>(set => ({
  itinerary: null,
  setItinerary: (itinerary: Itinerary) => set({ itinerary }),
  clearItinerary: () => set({ itinerary: null }),
}));
```

### 檔案：`src/store/camera.ts`

```typescript
import { create } from 'zustand';
import { Vector3 } from 'three';

interface CameraState {
  target: {
    position: Vector3;
    lookAt: Vector3;
  } | null;
  flyToPoint: (options: {
    lat: number;
    lon: number;
    distance?: number;
    duration?: number;
  }) => void;
}

export const useCameraStore = create<CameraState>(set => ({
  target: null,
  flyToPoint: ({ lat, lon, distance = 2000 }) => {
    // 計算相機位置（從斜上方看向目標點）
    const cameraPos = new Vector3(lon, lat + 0.5, distance);
    const lookAtPos = new Vector3(lon, lat, 0);

    set({
      target: {
        position: cameraPos,
        lookAt: lookAtPos,
      },
    });
  },
}));
```

---

## 5. 整體使用流程

### 使用者角度

1. **輸入** → "我想要一日南岸行程，冬季安全優先"
2. **等待** → 看到 AI 生成進度
3. **看結果** → 顯示行程卡片清單 + 3D 地圖上的紅黃綠點位
4. **互動** → 點擊「飛到黑沙灘」→ 相機 2 秒內平滑飛到該位置，同時更新天氣卡片
5. **調整** → 拖動時間軸 → 3D 景色模擬不同時間的光影

### 工程師角度

**何時版本切換？**
```typescript
// MVP 階段：硬碼 v1
const systemPrompt = PROMPTS.v1;

// 上線後想 A/B 測試
const systemPrompt = experimentConfig.useV2 ? PROMPTS.v2 : PROMPTS.v1;

// 後期升級：動態讀取
const systemPrompt = await getPromptFromJSON(promptVersion);
```

**何時記錄分析數據？**
- 每次調用 AI 時記錄 prompt 版本、user input、response latency
- 後期可分析「v1 vs v2 的行程接受度」

---

## 常見問題與最佳實踐

### Q1: 如何防止 AI Hallucination（編造景點）？
```typescript
// 後端校驗：景點是否在冰島南岸官方清單內
const VALID_POIS = [
  { name: '黑沙灘', lat: 63.88, lon: -19.03 },
  { name: '冰河湖', lat: 64.04, lon: -16.24 },
  // ...
];

function validateItinerary(itinerary: any) {
  return itinerary.items.every(item =>
    VALID_POIS.some(poi => levenshteinDistance(poi.name, item.title) < 0.3)
  );
}
```

### Q2: 如果 AI 響應太久怎麼辦？
```typescript
// 加 timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('AI timeout')), 10000)
);

const aiPromise = streamText({ ... });
return Promise.race([aiPromise, timeoutPromise]);
```

### Q3: 如何支援多語言 Prompt？
```typescript
const PROMPTS = {
  en: 'You are an Iceland tour expert...',
  zh: '你是冰島旅遊專家...',
};

const userLanguage = req.headers['accept-language'];
const systemPrompt = PROMPTS[userLanguage] || PROMPTS.en;
```

---

## 下一步

1. **實作本示例** → 確保 AI 行程能解析、3D 錨點能生成
2. **測試端到端流程** → 輸入 → AI → 前端 → 相機飛轉
3. **上線前檢查** → 官方景點名稱是否正確 + 座標精確度
4. **輪盤實驗** → A/B 測試不同 prompt 版本，記錄哪個版本用戶更滿意

