# Photo Print Layout Library - 요구사항 명세서

## 1. 프로젝트 개요

### 1.1 목적
Windows Photo Printing Wizard와 유사한 기능을 제공하는 JavaScript 라이브러리를 개발한다. 웹 브라우저에서 여러 이미지를 다양한 레이아웃으로 배열하고, 인쇄하거나 PDF로 저장할 수 있는 기능을 제공한다.

### 1.2 라이브러리 이름 (후보)
- `photo-print-js`
- `print-layout-js`
- `grid-print`
- (최종 이름은 개발 시 결정)

### 1.3 핵심 가치
- **프레임워크 독립적**: Vanilla JS로 작성, 어떤 환경에서도 사용 가능
- **가벼움**: 최소 번들 사이즈, 선택적 의존성
- **직관적 API**: 간단한 설정으로 즉시 사용 가능
- **확장성**: 커스텀 레이아웃, 플러그인 지원

---

## 2. 기술 스택

### 2.1 핵심
- **언어**: TypeScript (ES2020+)
- **빌드**: Vite (라이브러리 모드)
- **번들러 출력**: ESM, CJS, UMD, IIFE
- **CSS**: CSS-in-JS 또는 별도 CSS 파일 (선택적 import)

### 2.2 의존성
```json
{
  "dependencies": {},
  "peerDependencies": {
    "jspdf": "^2.5.0"  // PDF 출력 시에만 필요 (선택적)
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 2.3 브라우저 지원
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

---

## 3. 프로젝트 구조

```
photo-print-js/
├── src/
│   ├── index.ts                 # 메인 진입점
│   ├── core/
│   │   ├── PhotoPrintLayout.ts  # 메인 클래스
│   │   ├── LayoutEngine.ts      # 레이아웃 계산 엔진
│   │   ├── ImageProcessor.ts    # 이미지 로드/처리
│   │   └── types.ts             # TypeScript 타입 정의
│   ├── layouts/
│   │   ├── index.ts             # 레이아웃 내보내기
│   │   ├── presets.ts           # 사전 정의 레이아웃
│   │   └── LayoutTemplate.ts    # 레이아웃 템플릿 클래스
│   ├── renderers/
│   │   ├── CanvasRenderer.ts    # Canvas 기반 렌더링
│   │   ├── DOMRenderer.ts       # DOM 기반 렌더링
│   │   └── PDFRenderer.ts       # PDF 출력 (jsPDF 연동)
│   ├── ui/
│   │   ├── PreviewPanel.ts      # 미리보기 UI 컴포넌트
│   │   ├── ControlPanel.ts      # 설정 UI 컴포넌트
│   │   └── styles.css           # 기본 스타일
│   └── utils/
│       ├── imageUtils.ts        # 이미지 유틸리티
│       ├── printUtils.ts        # 인쇄 유틸리티
│       └── helpers.ts           # 공통 헬퍼
├── examples/
│   ├── basic/                   # 기본 사용 예제
│   ├── with-react/              # React 연동 예제
│   ├── with-vue/                # Vue 연동 예제
│   └── advanced/                # 고급 기능 예제
├── docs/
│   ├── getting-started.md
│   ├── api-reference.md
│   ├── layouts.md
│   └── examples.md
├── tests/
│   ├── core/
│   ├── layouts/
│   └── renderers/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 4. 핵심 기능 요구사항

### 4.1 이미지 입력 (Image Input)

#### 4.1.1 지원 입력 형식
- **URL**: 웹 이미지 URL (CORS 고려)
- **File**: File 객체 (input[type=file]에서)
- **Blob**: Blob 객체
- **Base64**: Data URL 문자열
- **HTMLImageElement**: 이미 로드된 이미지 요소

#### 4.1.2 지원 이미지 포맷
- JPEG
- PNG
- WebP
- GIF (첫 프레임만)
- BMP

#### 4.1.3 이미지 로드 API
```typescript
interface ImageSource {
  type: 'url' | 'file' | 'blob' | 'base64' | 'element';
  data: string | File | Blob | HTMLImageElement;
  id?: string;           // 고유 식별자 (선택)
  caption?: string;      // 캡션 텍스트 (선택)
}

// 단일 이미지 추가
addImage(source: ImageSource | string): Promise<void>

// 다중 이미지 추가
addImages(sources: (ImageSource | string)[]): Promise<void>

// 이미지 제거
removeImage(id: string): void

// 이미지 순서 변경
reorderImages(fromIndex: number, toIndex: number): void

// 전체 이미지 초기화
clearImages(): void
```

---

### 4.2 레이아웃 시스템 (Layout System)

#### 4.2.1 사전 정의 레이아웃

| 레이아웃 ID | 이름 | 열 | 행 | 이미지/페이지 | 용도 |
|------------|------|----|----|--------------|------|
| `full` | 전체 페이지 | 1 | 1 | 1 | 대형 인쇄 |
| `2x1` | 2분할 가로 | 2 | 1 | 2 | 가로 사진 |
| `1x2` | 2분할 세로 | 1 | 2 | 2 | 세로 사진 |
| `2x2` | 4분할 | 2 | 2 | 4 | 일반용 |
| `3x3` | 9분할 | 3 | 3 | 9 | 인덱스 |
| `4x4` | 16분할 | 4 | 4 | 16 | 썸네일 |
| `4x5` | 20분할 | 4 | 5 | 20 | 연락처 시트 |
| `wallet` | 지갑 크기 | 4 | 2 | 8 | 지갑 사진 |
| `3.5x5` | 3.5×5 | 2 | 2 | 4 | 표준 사진 |
| `4x6` | 4×6 | 2 | 2 | 4 | 표준 사진 |
| `5x7` | 5×7 | 1 | 2 | 2 | 중형 사진 |

#### 4.2.2 레이아웃 템플릿 구조
```typescript
interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  
  // 그리드 설정
  grid: {
    cols: number;
    rows: number;
  };
  
  // 또는 커스텀 셀 정의 (고급)
  cells?: LayoutCell[];
  
  // 기본 셀 비율 (가로:세로)
  aspectRatio?: number;  // 예: 1 (정사각형), 1.5 (3:2), 0.667 (2:3)
  
  // 셀 간격 (mm)
  gap?: number;
  
  // 권장 용지 방향
  orientation?: 'portrait' | 'landscape' | 'auto';
}

interface LayoutCell {
  x: number;      // 시작 열 (0-based)
  y: number;      // 시작 행 (0-based)
  colSpan?: number;  // 열 병합 (기본: 1)
  rowSpan?: number;  // 행 병합 (기본: 1)
  aspectRatio?: number;  // 개별 셀 비율
}
```

#### 4.2.3 레이아웃 API
```typescript
// 레이아웃 설정
setLayout(layoutId: string): void
setLayout(template: LayoutTemplate): void

// 커스텀 레이아웃 등록
registerLayout(template: LayoutTemplate): void

// 사용 가능한 레이아웃 목록
getAvailableLayouts(): LayoutTemplate[]

// 현재 레이아웃 정보
getCurrentLayout(): LayoutTemplate
```

---

### 4.3 용지 설정 (Paper Settings)

#### 4.3.1 사전 정의 용지 크기

| ID | 이름 | 너비(mm) | 높이(mm) |
|----|------|---------|---------|
| `a4` | A4 | 210 | 297 |
| `a5` | A5 | 148 | 210 |
| `a3` | A3 | 297 | 420 |
| `letter` | Letter | 216 | 279 |
| `legal` | Legal | 216 | 356 |
| `4x6` | 4×6 inch | 102 | 152 |
| `5x7` | 5×7 inch | 127 | 178 |

#### 4.3.2 용지 설정 API
```typescript
interface PaperSettings {
  size: string | { width: number; height: number };  // 크기 (mm)
  orientation: 'portrait' | 'landscape' | 'auto';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };  // mm 단위
  unit?: 'mm' | 'inch' | 'px';  // 단위 (기본: mm)
}

// 용지 설정
setPaper(settings: Partial<PaperSettings>): void

// 용지 크기만 변경
setPaperSize(size: string | { width: number; height: number }): void

// 여백 설정
setMargins(margins: number | Partial<PaperSettings['margins']>): void
```

---

### 4.4 이미지 맞춤 옵션 (Image Fit Options)

#### 4.4.1 맞춤 모드
```typescript
type ImageFitMode = 
  | 'contain'  // 비율 유지, 셀 안에 맞춤 (여백 발생 가능)
  | 'cover'    // 비율 유지, 셀 채움 (잘림 발생 가능)
  | 'fill'     // 비율 무시, 셀에 꽉 채움
  | 'none';    // 원본 크기 유지

interface ImageSettings {
  fit: ImageFitMode;
  position: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  rotation?: number;  // 회전 각도 (도)
  filter?: string;    // CSS 필터 (선택)
}
```

#### 4.4.2 이미지 설정 API
```typescript
// 전역 이미지 설정
setImageSettings(settings: Partial<ImageSettings>): void

// 개별 이미지 설정
setImageSettings(imageId: string, settings: Partial<ImageSettings>): void
```

---

### 4.5 출력 (Output)

#### 4.5.1 출력 방식
```typescript
type OutputType = 'print' | 'pdf' | 'canvas' | 'blob' | 'dataurl';

interface OutputOptions {
  type: OutputType;
  quality?: number;      // 이미지 품질 (0-1, PDF/이미지 출력 시)
  filename?: string;     // 파일명 (PDF 저장 시)
  autoPrint?: boolean;   // PDF 열 때 자동 인쇄 다이얼로그 (PDF 출력 시)
  scale?: number;        // 출력 스케일 (기본: 1)
}
```

#### 4.5.2 출력 API
```typescript
// 브라우저 인쇄 다이얼로그 호출
print(): Promise<void>

// PDF 파일로 저장
savePDF(filename?: string): Promise<Blob>

// PDF Blob 반환
toPDFBlob(): Promise<Blob>

// Canvas 요소 반환 (단일 페이지)
toCanvas(pageIndex?: number): Promise<HTMLCanvasElement>

// 이미지 Data URL 반환
toDataURL(pageIndex?: number, format?: 'png' | 'jpeg'): Promise<string>

// 이미지 Blob 반환
toBlob(pageIndex?: number, format?: 'png' | 'jpeg'): Promise<Blob>
```

---

### 4.6 미리보기 (Preview)

#### 4.6.1 미리보기 컴포넌트
```typescript
interface PreviewOptions {
  container: HTMLElement | string;  // 컨테이너 요소 또는 선택자
  width?: number | string;          // 미리보기 너비
  height?: number | string;         // 미리보기 높이
  showPageNumber?: boolean;         // 페이지 번호 표시
  showNavigation?: boolean;         // 페이지 이동 버튼 표시
  interactive?: boolean;            // 드래그 앤 드롭 활성화
  theme?: 'light' | 'dark' | 'auto';
}

// 미리보기 렌더링
renderPreview(options: PreviewOptions): void

// 미리보기 업데이트
updatePreview(): void

// 미리보기 제거
destroyPreview(): void
```

#### 4.6.2 미리보기 기능
- 실시간 레이아웃 미리보기
- 다중 페이지 네비게이션
- 확대/축소
- 드래그 앤 드롭 이미지 순서 변경 (선택적)

---

### 4.7 이벤트 (Events)

```typescript
type EventType = 
  | 'imageAdded'
  | 'imageRemoved'
  | 'imagesReordered'
  | 'layoutChanged'
  | 'paperChanged'
  | 'settingsChanged'
  | 'beforePrint'
  | 'afterPrint'
  | 'error';

interface PhotoPrintEvent {
  type: EventType;
  data?: any;
  timestamp: number;
}

// 이벤트 리스너 등록
on(event: EventType, callback: (e: PhotoPrintEvent) => void): void

// 이벤트 리스너 제거
off(event: EventType, callback?: Function): void

// 일회성 이벤트 리스너
once(event: EventType, callback: (e: PhotoPrintEvent) => void): void
```

---

## 5. API 설계

### 5.1 메인 클래스

```typescript
class PhotoPrintLayout {
  constructor(options?: PhotoPrintOptions);
  
  // === 이미지 관리 ===
  addImage(source: ImageSource | string): Promise<string>;  // 추가된 이미지 ID 반환
  addImages(sources: (ImageSource | string)[]): Promise<string[]>;
  removeImage(id: string): void;
  reorderImages(fromIndex: number, toIndex: number): void;
  clearImages(): void;
  getImages(): ImageInfo[];
  
  // === 레이아웃 ===
  setLayout(layout: string | LayoutTemplate): void;
  getLayout(): LayoutTemplate;
  getAvailableLayouts(): LayoutTemplate[];
  registerLayout(template: LayoutTemplate): void;
  
  // === 용지 설정 ===
  setPaper(settings: Partial<PaperSettings>): void;
  getPaper(): PaperSettings;
  
  // === 이미지 설정 ===
  setImageSettings(settings: Partial<ImageSettings>): void;
  setImageSettings(imageId: string, settings: Partial<ImageSettings>): void;
  getImageSettings(imageId?: string): ImageSettings;
  
  // === 미리보기 ===
  renderPreview(options: PreviewOptions): void;
  updatePreview(): void;
  destroyPreview(): void;
  
  // === 출력 ===
  print(): Promise<void>;
  savePDF(filename?: string): Promise<void>;
  toPDFBlob(): Promise<Blob>;
  toCanvas(pageIndex?: number): Promise<HTMLCanvasElement>;
  toDataURL(pageIndex?: number, format?: string): Promise<string>;
  toBlob(pageIndex?: number, format?: string): Promise<Blob>;
  
  // === 페이지 정보 ===
  getPageCount(): number;
  getPageInfo(pageIndex: number): PageInfo;
  
  // === 이벤트 ===
  on(event: EventType, callback: Function): void;
  off(event: EventType, callback?: Function): void;
  once(event: EventType, callback: Function): void;
  
  // === 유틸리티 ===
  reset(): void;
  destroy(): void;
  
  // === 정적 메서드 ===
  static fromImages(images: string[], layout?: string): PhotoPrintLayout;
  static getPresetLayouts(): LayoutTemplate[];
  static getPaperSizes(): PaperSize[];
}
```

### 5.2 초기화 옵션

```typescript
interface PhotoPrintOptions {
  // 초기 이미지
  images?: (ImageSource | string)[];
  
  // 레이아웃 설정
  layout?: string | LayoutTemplate;
  
  // 용지 설정
  paper?: Partial<PaperSettings>;
  
  // 이미지 설정
  imageSettings?: Partial<ImageSettings>;
  
  // 미리보기 자동 렌더링
  preview?: PreviewOptions | false;
  
  // PDF 렌더러 (jsPDF 인스턴스 또는 lazy import)
  pdfRenderer?: any | (() => Promise<any>);
  
  // 로케일 (다국어 지원)
  locale?: string;
  
  // 디버그 모드
  debug?: boolean;
}
```

### 5.3 사용 예시

```typescript
// 기본 사용
import { PhotoPrintLayout } from 'photo-print-js';

const printer = new PhotoPrintLayout({
  layout: '2x2',
  paper: { size: 'a4', margins: 10 }
});

await printer.addImages([
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg',
  'https://example.com/photo3.jpg',
  'https://example.com/photo4.jpg'
]);

// 미리보기 렌더링
printer.renderPreview({
  container: '#preview',
  showNavigation: true
});

// PDF로 저장
await printer.savePDF('my-photos.pdf');

// 또는 바로 인쇄
await printer.print();
```

```typescript
// 고급 사용
import { PhotoPrintLayout } from 'photo-print-js';

const printer = new PhotoPrintLayout();

// 커스텀 레이아웃 등록
printer.registerLayout({
  id: 'custom-collage',
  name: '커스텀 콜라주',
  cells: [
    { x: 0, y: 0, colSpan: 2, rowSpan: 2 },  // 큰 이미지
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
    { x: 2, y: 2 }
  ]
});

printer.setLayout('custom-collage');
```

---

## 6. UI 컴포넌트 요구사항

### 6.1 내장 UI (선택적)

라이브러리는 코어 기능과 별도로 선택적 UI 컴포넌트를 제공한다.

```typescript
import { PhotoPrintLayout, PhotoPrintUI } from 'photo-print-js';
import 'photo-print-js/ui.css';  // UI 스타일

const printer = new PhotoPrintLayout();
const ui = new PhotoPrintUI(printer, {
  container: '#app',
  components: {
    imageList: true,      // 이미지 목록/추가 패널
    layoutSelector: true, // 레이아웃 선택 패널
    paperSettings: true,  // 용지 설정 패널
    preview: true,        // 미리보기 패널
    toolbar: true         // 상단 툴바 (인쇄/저장 버튼)
  },
  theme: 'light'
});
```

### 6.2 UI 컴포넌트 구조

```
┌─────────────────────────────────────────────────────────┐
│ [툴바]  이미지 추가 | 레이아웃 ▼ | 용지 ▼ | 인쇄 | PDF 저장 │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│   [이미지 목록]      │         [미리보기]                 │
│                     │                                   │
│   ┌───┐ ┌───┐      │      ┌─────────────────┐          │
│   │ 1 │ │ 2 │      │      │  ┌───┬───┐      │          │
│   └───┘ └───┘      │      │  │   │   │      │          │
│   ┌───┐ ┌───┐      │      │  ├───┼───┤      │          │
│   │ 3 │ │ 4 │      │      │  │   │   │      │          │
│   └───┘ └───┘      │      │  └───┴───┘      │          │
│                     │      │    < 1/2 >      │          │
│   [+ 이미지 추가]    │      └─────────────────┘          │
│                     │                                   │
├─────────────────────┴───────────────────────────────────┤
│ [설정 패널]  맞춤: Cover ▼ | 간격: 5mm | 여백: 10mm      │
└─────────────────────────────────────────────────────────┘
```

### 6.3 반응형 디자인
- 모바일: 세로 스택 레이아웃
- 태블릿: 2열 레이아웃
- 데스크톱: 3열 레이아웃 (이미지 목록 | 미리보기 | 설정)

---

## 7. 구현 우선순위

### Phase 1: 코어 기능 (MVP)
1. [ ] 프로젝트 셋업 (TypeScript, Vite, 테스트 환경)
2. [ ] 타입 정의 (`types.ts`)
3. [ ] 이미지 로더 (`ImageProcessor.ts`)
4. [ ] 레이아웃 프리셋 (`presets.ts`)
5. [ ] 레이아웃 엔진 (`LayoutEngine.ts`)
6. [ ] DOM 렌더러 (`DOMRenderer.ts`)
7. [ ] 기본 인쇄 기능 (`window.print()` 활용)
8. [ ] 메인 클래스 (`PhotoPrintLayout.ts`)
9. [ ] 기본 사용 예제

### Phase 2: PDF 출력
1. [ ] Canvas 렌더러 (`CanvasRenderer.ts`)
2. [ ] PDF 렌더러 (`PDFRenderer.ts`) - jsPDF 연동
3. [ ] 다중 페이지 PDF 생성
4. [ ] PDF 저장/다운로드

### Phase 3: 미리보기 UI
1. [ ] 미리보기 패널 (`PreviewPanel.ts`)
2. [ ] 페이지 네비게이션
3. [ ] 확대/축소 기능
4. [ ] 기본 스타일 (`styles.css`)

### Phase 4: 고급 기능
1. [ ] 드래그 앤 드롭 이미지 순서 변경
2. [ ] 커스텀 레이아웃 지원
3. [ ] 개별 이미지 설정 (회전, 맞춤 등)
4. [ ] 이벤트 시스템

### Phase 5: 완성도
1. [ ] 전체 UI 컴포넌트 (`PhotoPrintUI`)
2. [ ] 다국어 지원 (i18n)
3. [ ] 접근성 (a11y)
4. [ ] 문서화 완성
5. [ ] 데모 사이트

### Phase 6: 배포 준비
1. [ ] 테스트 커버리지 80% 이상
2. [ ] 번들 사이즈 최적화
3. [ ] npm 패키지 설정
4. [ ] CDN 배포 설정
5. [ ] GitHub Actions CI/CD
6. [ ] README 완성

---

## 8. 테스트 요구사항

### 8.1 단위 테스트
```typescript
// 예시: LayoutEngine 테스트
describe('LayoutEngine', () => {
  it('should calculate correct cell positions for 2x2 layout', () => {
    const engine = new LayoutEngine();
    const cells = engine.calculateCells({
      layout: { grid: { cols: 2, rows: 2 } },
      paper: { width: 210, height: 297, margins: { top: 10, right: 10, bottom: 10, left: 10 } }
    });
    
    expect(cells).toHaveLength(4);
    expect(cells[0]).toEqual({ x: 10, y: 10, width: 95, height: 138.5 });
  });
  
  it('should handle custom aspect ratio', () => { /* ... */ });
  it('should respect gap settings', () => { /* ... */ });
});
```

### 8.2 통합 테스트
- 이미지 로드 → 레이아웃 적용 → 렌더링 파이프라인
- PDF 생성 및 내용 검증
- 이벤트 발생 순서 검증

### 8.3 E2E 테스트 (Playwright)
- 이미지 추가 → 레이아웃 변경 → 인쇄 다이얼로그 호출
- 드래그 앤 드롭 이미지 순서 변경
- 미리보기 네비게이션

### 8.4 커버리지 목표
- 코어 모듈: 90%+
- 렌더러: 80%+
- UI 컴포넌트: 70%+

---

## 9. 문서화 요구사항

### 9.1 README.md
- 프로젝트 소개
- 주요 기능
- 빠른 시작 가이드
- 설치 방법 (npm, CDN)
- 간단한 예제
- 라이선스

### 9.2 API 문서
- 모든 public 메서드/속성 문서화
- TypeScript 타입 정의 포함
- 각 메서드별 예제 코드
- 반환값 및 예외 설명

### 9.3 가이드 문서
- Getting Started (시작하기)
- Layouts (레이아웃 가이드)
- Customization (커스터마이징)
- PDF Output (PDF 출력)
- UI Components (UI 컴포넌트)
- Migration Guide (버전 마이그레이션)

### 9.4 예제
- 기본 사용
- React 연동
- Vue 연동
- 커스텀 레이아웃
- 이미지 편집 (회전, 크롭)
- 서버 사이드 렌더링

---

## 10. 배포 요구사항

### 10.1 npm 패키지
```json
{
  "name": "photo-print-js",
  "version": "1.0.0",
  "main": "dist/photo-print.cjs.js",
  "module": "dist/photo-print.es.js",
  "browser": "dist/photo-print.umd.js",
  "types": "dist/types/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/photo-print.es.js",
      "require": "./dist/photo-print.cjs.js",
      "types": "./dist/types/index.d.ts"
    },
    "./ui": {
      "import": "./dist/photo-print-ui.es.js",
      "require": "./dist/photo-print-ui.cjs.js"
    },
    "./ui.css": "./dist/ui.css"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "keywords": [
    "photo",
    "print",
    "layout",
    "image",
    "pdf",
    "grid",
    "collage"
  ]
}
```

### 10.2 CDN
```html
<!-- unpkg -->
<script src="https://unpkg.com/photo-print-js/dist/photo-print.umd.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/photo-print-js/dist/photo-print.umd.js"></script>
```

### 10.3 번들 사이즈 목표
- 코어 (gzip): < 15KB
- 코어 + UI (gzip): < 30KB
- PDF 기능 포함 (jsPDF 제외): < 20KB

### 10.4 라이선스
MIT License

---

## 11. 추가 고려사항

### 11.1 접근성 (Accessibility)
- 키보드 네비게이션 지원
- 스크린 리더 호환
- 고대비 모드 지원
- ARIA 속성 적용

### 11.2 국제화 (i18n)
- 한국어, 영어 기본 지원
- 날짜/숫자 포맷 로케일 적용
- 커스텀 번역 지원

### 11.3 성능 최적화
- 이미지 lazy loading
- 대용량 이미지 리사이징 (Web Worker 활용)
- 메모리 관리 (사용하지 않는 이미지 해제)
- 미리보기 가상화 (많은 이미지 처리 시)

### 11.4 보안
- XSS 방지 (사용자 입력 sanitize)
- CORS 이미지 처리
- Content Security Policy 호환

---

## 12. 마일스톤

| 마일스톤 | 목표 | 예상 기간 |
|---------|------|----------|
| v0.1.0 | MVP (코어 + 기본 인쇄) | 1-2주 |
| v0.2.0 | PDF 출력 | 1주 |
| v0.3.0 | 미리보기 UI | 1주 |
| v0.5.0 | 고급 기능 (D&D, 커스텀 레이아웃) | 1-2주 |
| v0.9.0 | 전체 UI + 문서화 | 1주 |
| v1.0.0 | 정식 릴리즈 | 1주 |

---

## 13. 참고 자료

- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [CSS Paged Media](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_paged_media)
- [Window.print()](https://developer.mozilla.org/en-US/docs/Web/API/Window/print)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
