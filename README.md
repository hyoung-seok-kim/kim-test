# blog-agent

어사이드가 수집해 구글 시트에 쌓은 네이버 블로거(올리브영 협업 후보)를 보여주는 대시보드.

- 프론트: React + Vite + TypeScript + Tailwind, TanStack Query/Table, Recharts
- 서버: Cloudflare Pages Functions (`functions/api/bloggers.ts`) 가 Google Sheets API 를 읽어 JSON 으로 제공
- 배포: Cloudflare Pages

## 시작하기

```bash
npm install
cp .dev.vars.example .dev.vars   # 값 채우기 (커밋 금지)
npm run build
npx wrangler pages dev dist --port 8788   # 터미널 1: API
npm run dev                                # 터미널 2: 화면 (http://localhost:5173)
```

키 없이 화면만 볼 때: `http://localhost:5173/?mock=1`

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | Vite 개발 서버 (`/api` 는 8788 로 프록시) |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm test` | 단위 테스트 |
| `npm run pages:deploy` | Cloudflare Pages 배포 |

설정·배포·문제 해결은 [운영가이드.md](운영가이드.md), 설계는 [개발계획서.md](개발계획서.md) 참고.

## 보안

서비스 계정 키는 `.dev.vars`(로컬) 또는 Cloudflare 환경변수(배포)에만 둔다. 저장소에 올리지 않는다.
