# MESSEZE MVP — AI PR Agent (메일 발송)

기업 정보를 입력하면 기사거리·보도자료·기자 추천을 거쳐 **실제 이메일을 발송**하는 MVP입니다.
프런트엔드(화면)는 **GitHub Pages**에, 메일 발송 백엔드는 **Render/Vercel**에 배포하는 구조로 분리되어 있습니다.

```
messeze-mvp/
├─ frontend/            # 화면 (GitHub Pages 에 배포)
│  ├─ index.html
│  ├─ config.js         # 백엔드 API 주소 (여기만 바꾸면 됨)
│  ├─ css/  js/  assets/
├─ backend/             # 메일 발송 서버 (Render/Vercel 에 배포)
│  ├─ server.js
│  ├─ package.json
│  ├─ .env.example
│  └─ README.md
├─ .gitignore
└─ README.md            # (이 파일)
```

## 이 MVP의 범위
- ✅ 1차: 받는 사람·제목·본문으로 **실제 메일 발송** + 발송 성공/실패 표시 + 발송 이력(화면 표시)
- 🔜 2차: PDF·이미지 **첨부파일**, 발송 이력 **DB 저장**
- 메일 발송은 **Resend API** 사용 (Gmail SMTP 아님)

---

## 1. 로컬에서 실행하기

> 준비물: [Node.js 18 이상](https://nodejs.org) 설치

### 1) 백엔드 실행
```bash
cd messeze-mvp/backend
npm install
# .env 파일 만들기 (아래 2번 참고)
copy .env.example .env      # (Mac/Linux: cp .env.example .env)
# .env 에 RESEND_API_KEY, FROM_EMAIL 입력 후 저장
npm start
```
→ `http://localhost:4000` 에서 백엔드가 실행됩니다. (콘솔에 "MESSEZE MVP 메일 발송 서버 실행 중" 표시)

### 2) 프런트엔드 실행
`frontend/config.js` 가 기본적으로 `http://localhost:4000` 을 보도록 되어 있습니다.
`frontend/index.html` 을 브라우저에서 열면 됩니다. 다만 파일을 직접 열면(`file://`) 일부 브라우저에서 요청이 막힐 수 있으니, 간단한 로컬 서버로 여는 걸 권장합니다.

```bash
cd messeze-mvp/frontend
npx serve .        # 또는  python -m http.server 5500
```
→ 안내되는 주소(예: `http://localhost:3000` 또는 `http://localhost:5500`)로 접속합니다.

---

## 2. Resend 환경변수 설정 방법

1. [https://resend.com](https://resend.com) 가입 → **API Keys** 메뉴에서 키 발급 (`re_` 로 시작)
2. `backend/.env` 파일에 아래처럼 입력:
   ```
   RESEND_API_KEY=re_여기에_본인_키
   FROM_EMAIL=onboarding@resend.dev
   FRONTEND_URL=
   PORT=4000
   ```
3. **FROM_EMAIL** 안내
   - 테스트 단계: `onboarding@resend.dev` 를 그대로 사용할 수 있습니다.
     단, 이 주소는 **본인 Resend 계정 이메일로만** 수신됩니다 (테스트 전용).
   - 실제 서비스: Resend에서 **본인 도메인을 인증(Verify a Domain)** 한 뒤
     `MESSEZE <noreply@yourdomain.com>` 형태로 넣어야 아무에게나 보낼 수 있습니다.
4. `.env` 파일은 **절대 GitHub에 올리지 마세요.** (`.gitignore`로 이미 제외되어 있습니다)

---

## 3. GitHub 저장소에 업로드하는 방법

1. [GitHub](https://github.com) 로그인 → **New repository** → 이름 예: `messeze-mvp` → Create
2. 터미널에서:
   ```bash
   cd messeze-mvp
   git init
   git add .
   git commit -m "MESSEZE MVP 최초 커밋"
   git branch -M main
   git remote add origin https://github.com/본인아이디/messeze-mvp.git
   git push -u origin main
   ```
3. 업로드 후 GitHub 저장소에 **`.env` 파일이 없는지** 반드시 확인하세요. (있으면 안 됩니다)

---

## 4. frontend 폴더를 GitHub Pages로 배포하는 방법

GitHub Pages는 저장소의 특정 폴더를 정적 사이트로 공개합니다.

1. GitHub 저장소 → **Settings** → 왼쪽 **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: `main` 선택, 폴더: **`/frontend`** 선택 → **Save**
   > `/frontend` 옵션이 안 보이면, `frontend` 폴더 내용을 저장소 루트로 옮기거나
   > `main` 브랜치의 `/(root)`를 frontend로 맞춘 별도 배포 브랜치를 쓰세요.
4. 1~2분 후 상단에 배포 주소가 표시됩니다. 예: `https://본인아이디.github.io/messeze-mvp/`
5. 그 주소로 접속해 화면이 뜨는지 확인합니다. (아직 발송은 백엔드 배포 후 동작)

---

## 5. backend 폴더를 Render 또는 Vercel에 배포하는 방법

### 방법 A — Render (권장, Node 서버에 적합)
1. [https://render.com](https://render.com) 가입 → **New +** → **Web Service**
2. GitHub 저장소 연결 → `messeze-mvp` 선택
3. 설정:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment** 탭에서 환경변수 추가:
   - `RESEND_API_KEY` = 본인 키
   - `FROM_EMAIL` = 인증한 발신 주소(또는 테스트용 `onboarding@resend.dev`)
   - `FRONTEND_URL` = GitHub Pages 주소 (예: `https://본인아이디.github.io`)
5. **Create Web Service** → 배포 완료되면 주소가 나옵니다.
   예: `https://messeze-mvp-backend.onrender.com`

### 방법 B — Vercel
1. [https://vercel.com](https://vercel.com) 가입 → **Add New → Project** → 저장소 선택
2. **Root Directory**: `backend`
3. **Environment Variables** 에 `RESEND_API_KEY`, `FROM_EMAIL`, `FRONTEND_URL` 추가
4. Deploy → 나온 주소를 사용
   > Vercel은 서버리스 특성상 Express를 `api/` 함수로 감싸야 할 수 있습니다.
   > 가장 간단한 건 **Render** 방식입니다.

---

## 6. 배포된 백엔드 주소를 config.js에 연결하는 방법

`frontend/config.js` 파일을 열고 백엔드 주소로 바꿉니다. (**끝에 `/` 붙이지 마세요**)

```js
// 변경 전 (로컬)
window.API_BASE_URL = "http://localhost:4000";

// 변경 후 (배포된 백엔드 주소)
window.API_BASE_URL = "https://messeze-mvp-backend.onrender.com";
```

저장 후 다시 커밋·푸시하면 GitHub Pages에 반영됩니다.
```bash
git add frontend/config.js
git commit -m "config: 백엔드 주소 연결"
git push
```

---

## 7. CORS 오류 해결 방법

브라우저 콘솔에 `blocked by CORS policy` 또는 `Access-Control-Allow-Origin` 오류가 뜨면:

1. 백엔드의 환경변수 **`FRONTEND_URL`** 이 **GitHub Pages 주소와 정확히 일치**하는지 확인
   - 예: `https://본인아이디.github.io` (끝 슬래시·오타 주의, `http`/`https` 구분)
2. 여러 주소를 허용하려면 콤마로 구분:
   `https://본인아이디.github.io,http://localhost:5500`
3. 로컬 개발 중이라면 `FRONTEND_URL` 을 **비워두면** 전체 허용(개발 모드)됩니다.
4. Render에서 환경변수를 바꾼 뒤에는 **재배포(Manual Deploy)** 해야 반영됩니다.

---

## 8. 테스트 이메일을 발송하는 방법

1. 백엔드가 실행/배포되어 있고, `RESEND_API_KEY`·`FROM_EMAIL` 이 설정되어 있어야 합니다.
2. 화면에서 기업 정보 입력 → 분석 → 기자 선택 → 제목/본문 작성 단계로 이동
3. **받는 사람** 칸에 **본인 이메일**을 입력합니다.
   - `FROM_EMAIL` 이 `onboarding@resend.dev` 인 경우, **본인 Resend 가입 이메일로만** 수신됩니다.
4. **📨 메일 발송** 클릭 → "메일이 정상적으로 발송되었습니다" 표시 → 받은편지함(스팸함 포함) 확인
5. 실패 시 "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요" 가 표시됩니다.
   원인은 백엔드 로그(콘솔/Render Logs)에서 확인하세요.

---

## 9. 실제 서비스 전환 전 확인사항

- [ ] **발신 도메인 인증**: `FROM_EMAIL` 을 Resend에서 인증한 본인 도메인 주소로 교체 (SPF/DKIM)
- [ ] **CORS 고정**: `FRONTEND_URL` 을 실제 GitHub Pages 주소로 고정 (전체 허용 금지)
- [ ] **API Key 관리**: `RESEND_API_KEY` 는 환경변수로만, 코드/저장소에 노출 금지
- [ ] **기자 DB**: 현재 화면의 기자 목록은 **가상 샘플**입니다. 실제 기자 연락처를 쓸 때는
      개인정보 동의·수집근거를 갖추고 **프런트에 그대로 노출하지 말 것**(백엔드 조회 방식 권장)
- [ ] **스팸/법적 고지**: 광고성 정보라면 수신동의·수신거부·발신자 정보 표기(정보통신망법) 확인
- [ ] **첨부·이력**: 2차 개발(첨부파일·DB 저장) 반영 여부 확인
- [ ] **발송량**: Resend 요금제/발송 한도 확인

---

## 10. 운영 전환 (Resend 도메인 인증 후)

> Resend **테스트 계정**은 발신 주소 `onboarding@resend.dev` 로 **본인 가입 이메일에게만** 발송됩니다.
> 아무 주소로나 보내려면 **도메인 인증** 후 **`FROM_EMAIL` 값만** 바꾸면 됩니다. **코드 수정은 필요 없습니다.**
> (발신 주소는 `backend/server.js` 에서 오직 `process.env.FROM_EMAIL` 하나로만 결정되며, 하드코딩된 발신 주소가 없습니다.)

### 1) Resend 도메인 인증
1. [resend.com](https://resend.com) → **Domains** → **Add Domain** → 본인 도메인 입력
2. 안내되는 **DNS 레코드(SPF·DKIM 등)** 를 도메인 관리 콘솔에 등록
3. 상태가 **Verified** 가 될 때까지 대기

### 2) FROM_EMAIL 만 변경 (← 운영 전환의 전부)
- **Render(운영)**: 대시보드 → 해당 서비스 → **Environment** →
  `FROM_EMAIL` 값을 인증한 주소로 변경 → 저장 → (자동 또는 **Manual Deploy** 로) 재배포
  ```
  FROM_EMAIL = MESSEZE <noreply@yourdomain.com>
  ```
- **로컬(선택)**: `backend/.env` 의 `FROM_EMAIL` 을 동일하게 변경
- ⚠️ `RESEND_API_KEY`, `FRONTEND_URL`, `config.js` 등 **나머지는 그대로** 두면 됩니다.

### 3) (테스트용) 프런트 이메일 덮어쓰기 되돌리기
현재는 테스트를 위해 모든 추천 기자 수신 주소를 한 이메일로 덮어쓰고 있습니다.
실제 기자에게 보내려면 `frontend/index.html` 상단 데이터 아래의 블록을 원복하세요.
```js
// 되돌리기: 값을 비우면 원래 example.com 샘플 주소로 복구
var TEST_OVERRIDE_EMAIL = '';
```
변경 후 `commit` · `push` 하면 GitHub Pages 에 자동 반영됩니다.

### 4) 확인
- `https://<백엔드주소>/api/health` → `from_configured: true`
- 외부 이메일 주소로 실제 발송 테스트 → 정상 수신되면 운영 전환 완료

> 정리: **운영 전환 = ①도메인 인증 → ②`FROM_EMAIL` 값 변경(재배포).** 그 외 코드/설정 변경 불필요.

---

### 문제가 생기면 확인 순서
1. 백엔드 `http://<주소>/api/health` 접속 → `resend_configured: true` 인지
2. 브라우저 개발자도구(F12) → Console/Network 탭에서 오류 메시지 확인
3. `config.js` 의 `API_BASE_URL` 이 배포된 백엔드 주소와 일치하는지
