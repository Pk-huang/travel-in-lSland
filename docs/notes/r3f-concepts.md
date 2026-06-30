# 3D / R3F 觀念筆記

> 開發 Phase 2（3D 地形）過程中，針對 three.js / React Three Fiber 累積的疑問與解答。
> 依提問順序記錄，方便日後回顧。

---

## 1. 我們有用到 WebGL 嗎？

有，而且是核心。整條渲染鏈都靠 WebGL：

```
three.js          ← WebGL 的封裝，把 mesh/light/camera 翻成 WebGL 指令送 GPU
@react-three/fiber ← three.js 的 React 介面（JSX）
@react-three/drei  ← 現成元件（OrbitControls、載模型…）
```

- `<Canvas>` 內部建一個 `<canvas>` DOM，three.js 在其上取得 **WebGL2 context** 繪圖。
- WebGL 是 client-only → MapCanvas 必須 `"use client"`，不能 SSR。
- 無 GPU / 老舊環境可能失敗 → 之後用 `dynamic import` + fallback 防整頁炸掉。

---

## 2. Three.js 的 XYZ 座標系指向哪裡？

右手座標系（相機看向 -Z 時）：

- **X**：向右為正（+X →）
- **Y**：向上為正（↑ +Y）= 我們地圖的「高度」
- **Z**：朝螢幕外為正（+Z），往螢幕裡為負（-Z）

對應地圖（平面繞 X 轉 -90° 躺平後，地面鋪在 XZ 平面）：

- 地面 = XZ 平面，**Y = 高度**（山頂 Y 大、海平面 Y=0、海底 Y<0）
- X = 東西、Z = 南北

> 從正上方俯瞰 `[0,18,0]` 時，Y 軸會縮成一個點「消失」，因為正對視線方向 → 證明俯瞰會壓掉高度感。

DebugAxes 顏色約定：**紅=X、綠=Y、藍=Z**。

---

## 3. 之後的模型也是用「一個個點算位置和顏色」嗎？

是。任何 3D 模型 = 一堆**頂點(vertices)** + 連成的**三角形(faces)**。

- **形狀**：移動每個頂點位置（我們用 `setZ` 改高度）
- **顏色**：依頂點資料給色（我們依高度查色帶）

差別只在「來源」：

| | 地形（我們） | 真實模型(.glb) |
|---|---|---|
| 頂點哪來 | 程式 `sin` 算 | 美術在 Blender 拉好 |
| 顏色哪來 | 按高度算 | 貼圖 texture |
| 載入 | 程式生成 | `useGLTF()` 載現成檔 |

> 43 測站（2-2）會用 **InstancedMesh**：同一顆球複製 43 份，只算一次幾何，效能極佳。

---

## 4. `<mesh>`、`<meshStandardMaterial>` 是 three 的東西嗎？要 import 嗎？

是 three 的類別，但 **不用 import** —— 這是 R3F 的魔法。

> 規則：JSX 裡任何小寫標籤 → R3F 自動去 `THREE` 命名空間找對應類別（首字母大寫）。

| JSX 標籤 | R3F 實際 new 的類別 |
|---|---|
| `<mesh>` | `new THREE.Mesh()` |
| `<meshStandardMaterial>` | `new THREE.MeshStandardMaterial()` |
| `<planeGeometry>` | `new THREE.PlaneGeometry()` |
| `<ambientLight>` | `new THREE.AmbientLight()` |

props 對應：
- `args={[...]}` → 傳給 constructor
- 其他屬性 → set 到實例（`color`、`rotation`…）

**何時才要 import？** 在 JS 邏輯裡手動 `new` 時（例如我們在 `useMemo` 裡 `new PlaneGeometry()` 逐點改高度），或用 drei 的大寫元件（`OrbitControls`、`Canvas`）。

口訣：**小寫標籤 = three 類別自動對應免引入；邏輯裡 new、或用 drei 元件才 import。**

---

## 5. `geo.attributes.position` 是怎麼來的？

`new PlaneGeometry(...)` 建構時，three **自動算好所有頂點座標**存進 `attributes`。

```
geo (BufferGeometry)
└─ attributes
   ├─ position  ← 頂點 xyz（three 自動建）
   ├─ normal    ← 法線
   ├─ uv        ← 貼圖座標
   └─ color     ← 我們 setAttribute 加的
```

- `position` 真面目是一條扁平 `Float32Array`：`[x0,y0,z0, x1,y1,z1, ...]`
- 129×129 = 16641 頂點 → 49923 個數字
- 用 `getX(i)/getY(i)/getZ(i)/setZ(i,v)` 存取，內部自動算 `i*3` 偏移
- `positions.count` = 頂點數

---

## 6. 「R3F 是 React 介面」是什麼意思？

意思是：讓你用「寫 React 的方式」操作 three.js。

- **沒 R3F**：純 three 是命令式 —— 手動 `new`、`scene.add`、自己寫 render loop、手動清理。
- **有 R3F**：宣告式 —— 只描述畫面長怎樣（JSX），R3F 背後幫你做 new / add / loop / 清理。

「介面 interface」= 中間的轉接/翻譯層：

```
React JSX  →  R3F（翻譯）  →  three.js 指令
```

如同 **react-dom 是 React 與 DOM 之間的介面**（你寫 `<div>`，它 `document.createElement`）；R3F 角色相同，對象換成 three.js。

好處：能用 React 全套（`useState` 連動、component 拆分、`useMemo` 快取、條件渲染）操作 3D。

---

## 7. 這種模式在其他套件常見嗎？

非常常見，正式名稱：**React Renderer（自訂渲染器）**，更廣義是「**宣告式包裝命令式**」。

同一套 React 心智模型，渲染目標不同：

| 套件 | 接到… | 標籤變成 |
|---|---|---|
| react-dom | 瀏覽器 DOM | `<div>` → DOM |
| react-native | 手機原生 | `<View>` → iOS/Android |
| @react-three/fiber | three.js | `<mesh>` → THREE.Mesh |
| react-pdf | PDF | `<Page>` → PDF 頁 |
| ink | 終端機 | `<Text>` → CLI 輸出 |
| react-konva | 2D Canvas | `<Rect>` → canvas 圖形 |

更廣義（非 React 也有）：Prisma（包 SQL）、Terraform（包雲端 API）、SwiftUI / Jetpack Compose（包原生繪圖）。

共同動機：只說 **要什麼(what)** 不說 **怎麼做(how)**；可組合、可預測、好維護。

> 學會 R3F 這套（標籤對應、args/props、useMemo、component 拆分），幾乎可原封不動遷移到其他 React renderer。
