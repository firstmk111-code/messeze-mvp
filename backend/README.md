# MESSEZE MVP — 백엔드 (메일 발송 API)

Express + Resend 기반의 메일 발송 서버입니다. GitHub Pages(정적)에서는 서버를 돌릴 수 없어 별도로 분리했습니다.

## 실행
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# .env 에 RESEND_API_KEY, FROM_EMAIL 입력
npm start                 # http://localhost:4000
```

## 환경변수 (.env)
| 변수 | 설명 |
|---|---|
| `RESEND_API_KEY` | Resend API 키 (`re_`로 시작). **코드에 쓰지 말 것** |
| `FROM_EMAIL` | 보내는 주소. 테스트는 `onboarding@resend.dev`, 운영은 인증 도메인 주소 |
| `FRONTEND_URL` | CORS 허용 주소(GitHub Pages). 비우면 개발용 전체 허용. 콤마로 여러 개 가능 |
| `PORT` | 포트 (기본 4000, Render/Vercel은 자동 주입) |

## API

### `GET /api/health`
서버/설정 상태 확인.
```json
{ "ok": true, "resend_configured": true, "from_configured": true, "cors": "..." }
```

### `POST /api/send-mail`
요청 (JSON):
```json
{
  "to": "받는사람@example.com",
  "subject": "메일 제목",
  "body": "메일 본문",
  "company": "기업명",
  "reporter": "기자명"
}
```
- 성공: `200 { "ok": true, "id": "..." }`
- 검증 실패: `400 { "ok": false, "error": "..." }` (받는사람/제목/본문 누락)
- 설정/서버 오류: `500 { "ok": false, "error": "..." }`

> 서버 내부 오류 상세는 프런트로 그대로 노출하지 않습니다(로그로만). 프런트는 실패 시
> "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요" 로 표시합니다.

## 배포 (Render)
- Root Directory: `backend`
- Build: `npm install` / Start: `npm start`
- Environment: `RESEND_API_KEY`, `FROM_EMAIL`, `FRONTEND_URL`

## 범위
- 1차: 제목/본문 텍스트 발송
- 2차(예정): 첨부파일(PDF·이미지), 발송 이력 DB 저장
