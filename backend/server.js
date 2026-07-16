// ============================================================
//  MESSEZE MVP · 메일 발송 백엔드 (Express + Resend)
//  - POST /api/send-mail : 받는사람/제목/본문/기업명/기자명 을 받아 Resend 로 실제 발송
//  - 보안: RESEND_API_KEY / FROM_EMAIL / FRONTEND_URL 은 .env 에서만 읽는다 (코드 하드코딩 금지)
//  - CORS: FRONTEND_URL 이 설정되면 그 주소만 허용, 없으면 개발용으로 전체 허용
//  - 1차 MVP 범위: 제목/본문 텍스트 발송. (첨부파일·발송이력 DB 는 2차)
// ============================================================
require('dotenv').config();

const fs = require('fs');
const path = require('path');
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

// ── 기자 DB (서버에만 보관 · 이메일은 공개 노출 금지) ──────────
//  · 로컬 개발: data/reporters.json (평문, .gitignore 로 제외)
//  · 운영: data/reporters.enc (AES-256-GCM 암호문, 공개 저장소에 커밋)
//          + 환경변수 REPORTERS_KEY 로 시작 시 복호화. 키 없으면 미로드.
const crypto = require('crypto');
function loadReporters() {
  const dataDir = path.join(__dirname, 'data');
  try {
    const p = path.join(dataDir, 'reporters.json');
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { console.warn('[reporters] json 로드 실패:', e.message); }
  try {
    const p = path.join(dataDir, 'reporters.enc');
    if (fs.existsSync(p) && process.env.REPORTERS_KEY) {
      const raw = Buffer.from(fs.readFileSync(p, 'utf8'), 'base64');
      const iv = raw.slice(0, 12), tag = raw.slice(12, 28), enc = raw.slice(28);
      const key = Buffer.from(process.env.REPORTERS_KEY, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
      return JSON.parse(dec.toString('utf8'));
    }
    if (fs.existsSync(p) && !process.env.REPORTERS_KEY) console.warn('[reporters] REPORTERS_KEY 미설정 → 기자DB 미로드 (Render 환경변수 필요)');
  } catch (e) { console.warn('[reporters] enc 복호화 실패:', e.message); }
  return [];
}
const REPORTERS = (function () { const a = loadReporters(); return Array.isArray(a) ? a : []; })();
// 이메일 마스킹 (프런트로는 원문 대신 마스킹만 노출)
function maskEmail(e) {
  e = String(e || ''); const at = e.indexOf('@');
  if (at < 1) return '***';
  const local = e.slice(0, at), dom = e.slice(at);
  return local.slice(0, Math.min(2, local.length)) + '***' + dom;
}
function getReporterById(id) {
  const n = Number(id);
  if (!isFinite(n)) return null;
  const r = REPORTERS[n];
  if (r && Number(r.id) === n) return r;
  for (let i = 0; i < REPORTERS.length; i++) if (Number(REPORTERS[i].id) === n) return REPORTERS[i];
  return null;
}

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

// ── 기자 검색 (이메일은 마스킹만 반환 · 원문 미노출) ──────────
app.get('/api/reporters/search', function (req, res) {
  const q = String(req.query.q || '').toLowerCase();
  const limit = Math.min(Number(req.query.limit) || 60, 100);
  const tokens = q.split(/[\s,·]+/).map(function (t) { return t.trim(); }).filter(function (t) { return t.length >= 2; });
  const scored = REPORTERS.map(function (r) {
    const hay = ((r.field || '') + ' ' + (r.media || '') + ' ' + (r.name || '')).toLowerCase();
    let score = 0;
    tokens.forEach(function (t) { if (hay.indexOf(t) >= 0) score += 10; });
    return { r: r, score: score };
  });
  scored.sort(function (a, b) { return b.score - a.score; });
  let top = scored.filter(function (x) { return x.score > 0; }).slice(0, limit);
  if (top.length < 5) top = scored.slice(0, limit); // 매칭이 거의 없으면 목록 일부라도 제공
  const out = top.map(function (x) {
    return { id: x.r.id, name: x.r.name || '', media: x.r.media || '', field: x.r.field || '', emailMasked: maskEmail(x.r.email), score: Math.min(99, 45 + x.score) };
  });
  res.json({ ok: true, total: REPORTERS.length, count: out.length, reporters: out });
});

// ── 상태 확인 ─────────────────────────────────────────────
app.get('/api/health', function (req, res) {
  res.json({
    ok: true,
    resend_configured: !!RESEND_API_KEY,
    from_configured: !!FROM_EMAIL,
    reporters_loaded: REPORTERS.length,
    cors: allowList ? allowList : 'all(dev)',
  });
});

// ── 메일 발송 ─────────────────────────────────────────────
app.post('/api/send-mail', async function (req, res) {
  try {
    const b = req.body || {};
    const subject = (b.subject || '').toString().trim();
    const body = (b.body || '').toString();
    const company = (b.company || '').toString().trim();
    let reporter = (b.reporter || '').toString().trim();

    // 수신자 결정: reporterId 가 있으면 서버 DB 에서 실제 이메일 조회(권장, 공개 노출 방지)
    let to = (b.to || '').toString().trim();
    if (b.reporterId !== undefined && b.reporterId !== null && b.reporterId !== '') {
      const rep = getReporterById(b.reporterId);
      if (!rep) {
        return res.status(400).json({ ok: false, error: '유효하지 않은 기자입니다. (reporterId)' });
      }
      to = String(rep.email || '').trim();
      if (!reporter) reporter = rep.name || rep.media || '';
    }

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
