# tools/imagegen

Gemini 이미지 배치 생성 → 크로마 키잉 → WebP 저장.  
루트 `package.json`을 만들지 않는다. **이 폴더에서만** `npm install`.

## 문서·모델

확인한 공식/SDK 문서:

- Google Gen AI JS SDK codegen 지침: https://github.com/googleapis/js-genai/blob/main/codegen_instructions.md
- Gemini API 이미지 생성 가이드: https://ai.google.dev/gemini-api/docs/image-generation
- 모델 카드 (Nano Banana): https://aistudio.google.com/models/gemini-2-5-flash-image

기본 모델 ID: **`gemini-2.5-flash-image`**  
변경: 환경변수 `GEMINI_IMAGE_MODEL`  
고품질 대안 예: `gemini-3-pro-image-preview` (문서 기준)

SDK 호출 요약:

```js
import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const response = await ai.models.generateContent({
  model: process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image',
  contents, // text + optional inlineData refs
});
// response.candidates[0].content.parts[*].inlineData.data → base64 image
```

## 환경변수

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY` | 실제 생성 시 | API 키. 파일에 쓰지 말 것 |
| `GEMINI_IMAGE_MODEL` | 아니오 | 기본 `gemini-2.5-flash-image` |

`.env`는 gitignore. 키를 레포에 커밋하지 말 것.

## 사용

```bash
cd tools/imagegen
npm install
node gen.mjs --dry-run --manifest manifest.example.json
node gen.mjs --manifest manifest.json
node gen.mjs --manifest manifest.json --only cloud
node gen.mjs --manifest manifest.json --force
```

## 배경 제거

생성 프롬프트에 **평평한 `#00FF00` 크로마 배경**을 강제하고, `sharp`로 색 거리 기반 키잉 후 알파 WebP로 저장한다.  
초록 피사체가 있으면 `CHROMA_KEY` 환경변수로 `#FF00FF` 등으로 바꾼다.

## 흐름 문서

사람 앵커 → refs → 매니페스트 → 실행 → 검수: [`docs/art/image-pipeline.md`](../../docs/art/image-pipeline.md)
