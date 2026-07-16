// ============================================================
//  MESSEZE MVP · 메일 발송 백엔드 (Express + Resend)
//  - POST /api/send-mail : 받는사람/제목/본문/기업명/기자명 을 받아 Resend 로 실제 발송
//  - 보안: RESEND_API_KEY / FROM_EMAIL / FRONTEND_URL 은 .env 에서만 읽는다 (코드 하드코딩 금지)
//  - CORS: FRONTEND_URL 이 설정되면 그 주소만 허용, 없으면 개발용으로 전체 허용
//  - 1차 MVP 범위: 제목/본문 텍스트 발송. (첨부파일·발송이력 DB 는 2차)
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 4000;

// ── 환경변수 ──────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || '';
const FRONTEND_URL = process.env.FRONTEND_URL || '';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ── CORS ─────────────────────────────────────────────────
// FRONTEND_URL 이 있으면 그 주소만 허용(운영), 없으면 전체 허용(개발).
// 콤마로 여러 주소를 넣을 수도 있다. 예: https://user.github.io,http://localhost:5500
const allowList = FRONTEND_URL
  ? FRONTEND_URL.split(',').map(function (s) { return s.trim(); }).filter(Boolean)
  : null;
app.use(cors({
  origin: function (origin, cb) {
    if (!allowList) return cb(null, true);            // 개발: 전체 허용
    if (!origin) return cb(null, true);               // 서버-서버/curl 등 origin 없는 요청
    return cb(null, allowList.indexOf(origin) >= 0);  // 운영: 허용목록만
  },
}));
app.use(express.json({ limit: '1mb' }));

// ── 유틸 ─────────────────────────────────────────────────
function isEmail(s) { return typeof s === 'string' && /.+@.+\..+/.test(s.trim()); }

// ── 상태 확인 ─────────────────────────────────────────────
app.get('/api/health', function (req, res) {
  res.json({
    ok: true,
    resend_configured: !!RESEND_API_KEY,
    from_configured: !!FROM_EMAIL,
    cors: allowList ? allowList : 'all(dev)',
  });
});

// ── 메일 발송 ─────────────────────────────────────────────
app.post('/api/send-mail', async function (req, res) {
  try {
    const b = req.body || {};
    const to = (b.to || '').toString().trim();
    const subject = (b.subject || '').toString().trim();
    const body = (b.body || '').toString();
    const company = (b.company || '').toString().trim();
    const reporter = (b.reporter || '').toString().trim();

    // 1) 입력 검증 (받는사람/제목/본문)
    if (!isEmail(to)) {
      return res.status(400).json({ ok: false, error: '받는 사람 이메일이 올바르지 않습니다.' });
    }
    if (!subject) {
      return res.status(400).json({ ok: false, error: '메일 제목이 비어 있습니다.' });
    }
    if (!body.trim()) {
      return res.status(400).json({ ok: false, error: '메일 본문이 비어 있습니다.' });
    }

    // 2) 서버 설정 검증
    if (!resend || !FROM_EMAIL) {
      console.error('[send-mail] 환경변수 누락: RESEND_API_KEY 또는 FROM_EMAIL');
      return res.status(500).json({ ok: false, error: '서버 메일 설정이 완료되지 않았습니다.' });
    }

    // 3) 본문에 발신 맥락(기업/기자) 부가
    const footer =
      (company ? ('\n\n--\n' + company) : '') +
      (reporter ? ('\n(수신: ' + reporter + ' 기자)') : '');

    // 4) 실제 발송 (Resend)
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: to,
      subject: subject,
      text: body + footer,
    });

    if (result && result.error) {
      console.error('[send-mail] Resend 오류:', result.error);
      return res.status(502).json({ ok: false, error: '메일 발송에 실패했습니다.' });
    }

    const id = (result && result.data && result.data.id) || '';
    console.log('[send-mail] 발송 성공 →', to, '| id:', id);
    return res.json({ ok: true, id: id });
  } catch (err) {
    console.error('[send-mail] 처리 오류:', err && err.message ? err.message : err);
    // 서버 내부 오류 내용은 프런트로 그대로 노출하지 않는다.
    return res.status(500).json({ ok: false, error: '메일 발송에 실패했습니다.' });
  }
});

app.listen(PORT, function () {
  console.log('\n============================================================');
  console.log('   ✅  MESSEZE MVP 메일 발송 서버 실행 중');
  console.log('------------------------------------------------------------');
  console.log('   Port          : ' + PORT + '   →  http://localhost:' + PORT);
  console.log('   Resend 설정    : ' + (RESEND_API_KEY ? 'OK' : '미설정 (.env RESEND_API_KEY)'));
  console.log('   FROM_EMAIL     : ' + (FROM_EMAIL || '미설정 (.env FROM_EMAIL)'));
  console.log('   CORS 허용      : ' + (allowList ? allowList.join(', ') : '전체(개발 모드)'));
  console.log('============================================================\n');
});
