/* ============================================================
   범용 기사 생성 엔진 (article-generator.js)
   -----------------------------------------------------------
   원칙:
   1) 특정 기업명·업종·행사명·날짜·인물·수치를 코드에 고정하지 않는다.
   2) 사용자가 입력한 값(input)만으로 기사를 구성한다.
   3) 입력되지 않은 정보(날짜/수치/인용문 등)는 만들어내지 않는다.
   4) 기사 유형에 따라 제목·본문 구성이 달라진다.
   5) 같은 문장만 반복하지 않도록 연결 표현을 입력에 따라 변화시킨다.
   - 메일 생성은 mail-generator.js 로 분리되어 있다.
   - 브라우저(<script src>)와 Node(require) 양쪽에서 동작한다.
   ============================================================ */
(function (root) {
  'use strict';

  /* ---- 입력 필드 라벨 ---- */
  var FIELD_LABELS = {
    company: '기업명 또는 기관명', industry: '업종', product: '주요 제품·서비스',
    topic: '기사 주제', facts: '핵심 사실', type: '기사 유형', date: '날짜', place: '장소',
    metrics: '주요 성과 및 수치', partners: '참여 대상 또는 협력 기관',
    repName: '대표자·담당자 이름', repTitle: '대표자·담당자 직책', quote: '대표자·담당자 발언',
    plan: '향후 계획', intro: '기업 소개', email: '담당자 이메일', phone: '담당자 연락처'
  };

  /* ---- 한글 조사 처리 (최소) ---- */
  function _hasJong(s) { if (!s) return false; var c = s.charCodeAt(s.length - 1); if (c < 0xAC00 || c > 0xD7A3) return false; return (c - 0xAC00) % 28 !== 0; }
  /* ⚠️ 조사 헬퍼는 "조사만" 반환한다. 사용법: word + _eun(word) */
  function _josa(s, a, b) { return _hasJong(String(s || '')) ? a : b; }
  function _eun(s) { return _josa(s, '은', '는'); }
  function _eul(s) { return _josa(s, '을', '를'); }
  function _iga(s) { return _josa(s, '이', '가'); }
  function _wa(s) { return _josa(s, '과', '와'); }
  function _euro(s) { s = String(s || ''); if (!s) return '로'; var c = s.charCodeAt(s.length - 1); if (c < 0xAC00 || c > 0xD7A3) return '로'; var j = (c - 0xAC00) % 28; return (j === 0 || j === 8) ? '로' : '으로'; }
  function _trim(s) { return String(s == null ? '' : s).trim(); }
  function _has(s) { return _trim(s).length > 0; }
  /* 입력에 따라 표현을 바꾸기 위한 결정적 인덱스(같은 입력=같은 결과, 다른 기업=다른 표현) */
  function _pick(arr, seedStr) { var n = 0, s = String(seedStr || ''); for (var k = 0; k < s.length; k++) n = (n + s.charCodeAt(k)) % 100000; return arr[n % arr.length]; }

  /* ============================================================
     기사 유형 정의 — 유형별 제목/강조/추가 필수정보/동사
     ============================================================ */
  var ARTICLE_TYPES = [
    { key: 'launch',    label: '신제품·서비스 출시', verb: '선보였다', actNoun: '출시',
      requires: [{ field: 'product', q: '출시한 제품 또는 서비스의 이름과 특징을 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (i.product || i.topic) + ' 출시'; } },
    { key: 'export',    label: '수출·해외 진출', verb: '나섰다', actNoun: '해외 진출',
      requires: [{ field: 'place', q: '진출(수출) 대상 국가 또는 지역을 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.place) ? i.place + ' ' : '') + '수출·해외 진출 본격화'; } },
    { key: 'contract',  label: '계약·수주', verb: '체결했다', actNoun: '계약',
      requires: [{ field: 'partners', q: '계약·수주 상대(발주처/고객사)를 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.partners) ? i.partners + _wa(i.partners) + ' ' : '') + (_has(i.metrics) ? i.metrics + ' 규모 ' : '') + '계약 체결'; } },
    { key: 'mou',       label: '협약·파트너십', verb: '체결했다', actNoun: '협약',
      requires: [{ field: 'partners', q: '협약을 맺은 상대 기관을 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.partners) ? i.partners + _wa(i.partners) + ' ' : '') + '업무협약 체결'; } },
    { key: 'investment',label: '투자 유치', verb: '유치했다', actNoun: '투자 유치',
      requires: [{ field: 'metrics', q: '유치한 투자 규모(금액)를 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.metrics) ? i.metrics + ' ' : '') + '투자 유치'; } },
    { key: 'event',     label: '행사·전시회 참가', verb: '참가했다', actNoun: '참가',
      requires: [{ field: 'date', q: '행사 일정(기간)을 입력해 주세요.' }, { field: 'place', q: '행사명 또는 장소를 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.topic) ? i.topic : (i.place || '주요 행사')) + ' 참가'; } },
    { key: 'award',     label: '인증·수상', verb: '획득했다', actNoun: '인증·수상',
      requires: [{ field: 'facts', q: '취득한 인증명 또는 수상 내역을 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.facts) ? i.facts : (i.topic || '인증·수상')) + ' 획득'; } },
    { key: 'rnd',       label: '기술 개발', verb: '개발했다', actNoun: '기술 개발',
      requires: [{ field: 'product', q: '개발한 기술 또는 제품의 핵심 내용을 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (i.product || i.topic) + ' 개발'; } },
    { key: 'csr',       label: '사회공헌', verb: '실시했다', actNoun: '사회공헌 활동',
      requires: [{ field: 'facts', q: '사회공헌 활동의 구체적 내용을 입력해 주세요.' }],
      title: function (i) { return i.company + ', ' + (_has(i.topic) ? i.topic : '사회공헌 활동') + ' 실시'; } },
    { key: 'intro',     label: '기업 일반 소개', verb: '소개했다', actNoun: '소개',
      requires: [],
      title: function (i) { return i.company + ', ' + (_has(i.product) ? i.product + ' ' : '') + (i.topic || '사업 현황') + ' 소개'; } },
    { key: 'etc',       label: '기타', verb: '밝혔다', actNoun: '발표',
      requires: [],
      title: function (i) { return i.company + ', ' + (i.topic || '주요 소식') + ' 발표'; } }
  ];
  function typeDef(key) { for (var i = 0; i < ARTICLE_TYPES.length; i++) if (ARTICLE_TYPES[i].key === key) return ARTICLE_TYPES[i]; return ARTICLE_TYPES[ARTICLE_TYPES.length - 1]; }

  /* ============================================================
     정보 부족 검증 — 부족하면 [{field,label,question}] 반환
     ============================================================ */
  function checkMissingInfo(input) {
    input = input || {};
    var out = [];
    function need(field, question) { if (!_has(input[field])) out.push({ field: field, label: FIELD_LABELS[field] || field, question: question }); }

    // 공통 필수: 기업명 · 유형 · (주제 또는 핵심사실)
    need('company', '기업명 또는 기관명을 입력해 주세요.');
    if (!_has(input.type)) out.push({ field: 'type', label: FIELD_LABELS.type, question: '기사 유형을 선택해 주세요.' });
    if (!_has(input.topic) && !_has(input.facts)) out.push({ field: 'facts', label: FIELD_LABELS.facts, question: '기사 주제 또는 핵심 사실을 입력해 주세요.' });

    // 유형별 추가 필수
    var td = typeDef(input.type);
    (td.requires || []).forEach(function (r) { need(r.field, r.q); });

    // 스펙상 공통 정보부족 검증
    need('date', '보도자료 기준 날짜(발표일·행사일 등)를 입력해 주세요.');
    need('place', '관련 장소(개최지·진출지역·소재지 등)를 입력해 주세요.');
    // 수치가 중요한 유형은 성과 수치 요구
    if (['export', 'contract', 'investment', 'event', 'award'].indexOf(td.key) >= 0) need('metrics', '주요 성과·규모 수치를 입력해 주세요. (예: 금액, 참여 수, 물량 등)');
    need('quote', '대표자 또는 담당자의 실제 발언(코멘트)을 입력해 주세요. (지어내지 않습니다)');
    need('intro', '기업 소개 문구를 입력해 주세요.');
    if (!_has(input.email) && !_has(input.phone)) out.push({ field: 'email', label: '문의처', question: '담당자 이메일 또는 연락처를 입력해 주세요.' });

    return out;
  }

  /* ============================================================
     기사 생성 — 입력만으로 제목/부제/본문(5문단)/문의 구성
     length: 'short' | 'normal' | 'detailed'
     ============================================================ */
  function _joinSentences(arr) { return arr.filter(_has).join(' '); }

  function generateArticle(input, opts) {
    input = input || {}; opts = opts || {};
    var length = opts.length || 'normal';
    var td = typeDef(input.type);
    var i = {};
    // 입력 정규화(트림)
    Object.keys(FIELD_LABELS).forEach(function (k) { i[k] = _trim(input[k]); });
    if (!_has(i.company)) i.company = '(기업명 미입력)';

    var repFull = _has(i.repName) ? (i.repName + (_has(i.repTitle) ? ' ' + i.repTitle : '')) : '';
    var when = _has(i.date) ? i.date : '';
    var where = _has(i.place) ? i.place : '';

    /* --- 제목 --- */
    var title = td.title(i);

    /* --- 부제: 의미/성과 한 문장 (입력된 것만) --- */
    var subParts = [];
    if (_has(i.metrics)) subParts.push(i.metrics);
    if (_has(i.partners)) subParts.push(i.partners + _wa(i.partners) + ' 협력');
    if (_has(i.plan)) subParts.push(i.plan);
    var subtitle = subParts.length
      ? (subParts.slice(0, 2).join(', ') + '…' + td.actNoun + _euro(td.actNoun) + ' 성과 기대')
      : (i.company + _iga(i.company) + ' ' + (_has(i.topic) ? i.topic : td.label) + _eul(_has(i.topic) ? i.topic : td.label) + ' 추진한다');

    /* --- 본문 5문단 --- */
    var P = [];

    // 1문단: 리드 (누가/무엇을/언제/어디서/왜)
    var subject = i.company + (repFull ? '(' + repFull + ')' : '');
    var what = _has(i.topic) ? i.topic : (_has(i.facts) ? i.facts : td.label);
    var whenClause = when ? (_pick(['', '지난 '], i.company) + when + ' ') : '';
    var whereClause = where ? (where + '에서 ') : '';
    var lead = subject + _eun(i.company) + ' ' + whenClause + whereClause + what + _eul(what) + ' ' + td.verb + '.';
    P.push(lead);

    // 2문단: 추진 배경 + 사업/제품 주요 내용
    var p2 = [];
    if (_has(i.product)) p2.push('이번 ' + td.actNoun + _eun(td.actNoun) + ' ' + i.product + _wa(i.product) + ' 관련해 추진됐다.');
    if (_has(i.facts)) p2.push(i.facts + (/[.。]$/.test(i.facts) ? '' : '.'));
    if (_has(i.industry)) p2.push(_pick(['특히 ', '무엇보다 ', ''], i.company) + i.industry + ' 분야에서 의미 있는 행보로 평가된다.');
    var para2 = _joinSentences(p2);

    // 3문단: 대표자/담당자의 실제 발언 (입력된 것만, 지어내지 않음)
    var para3 = '';
    if (_has(i.quote)) {
      var q = i.quote.replace(/^["'"']|["'"']$/g, '');
      var speaker = repFull || (i.company + ' 관계자');
      para3 = speaker + _eun(speaker) + ' "' + q + '"' + _pick(['라고 말했다.', '라고 밝혔다.', '고 전했다.'], i.company);
    }

    // 4문단: 참여 규모/성과/수치/기대효과
    var p4 = [];
    if (_has(i.metrics)) p4.push('주요 성과로는 ' + i.metrics + ' 등이 있다.');
    if (_has(i.partners)) p4.push(i.partners + _iga(i.partners) + ' 참여·협력하며 실질적인 성과가 기대된다.');
    var para4 = _joinSentences(p4);

    // 5문단: 기업 소개 + 향후 계획
    var p5 = [];
    if (_has(i.intro)) p5.push(i.intro + (/[.。]$/.test(i.intro) ? '' : '.'));
    if (_has(i.plan)) p5.push(i.company + _eun(i.company) + ' 향후 ' + i.plan + (/[.。]$/.test(i.plan) ? '' : '.'));
    var para5 = _joinSentences(p5);

    // 분량 조절: short=핵심 문단만, detailed=연결 문장 보강
    var paragraphs = [];
    paragraphs.push(lead);
    if (length !== 'short' && _has(para2)) paragraphs.push(para2);
    if (_has(para3)) paragraphs.push(para3);
    if (_has(para4)) paragraphs.push(para4);
    if (_has(para5)) paragraphs.push(para5);
    if (length === 'detailed') {
      var extra = [];
      if (_has(i.industry) && _has(i.topic)) extra.push(i.industry + ' 업계에서는 이번 ' + i.topic + _eul(i.topic) + ' 계기로 관련 논의가 이어질 것으로 보인다.');
      if (extra.length) paragraphs.push(extra.join(' '));
    }

    /* --- 문의 --- */
    var contactLines = [i.company];
    if (repFull) contactLines.push(repFull);
    if (_has(i.email)) contactLines.push(i.email);
    if (_has(i.phone)) contactLines.push(i.phone);

    /* --- 전체 텍스트 조립 --- */
    var text = '[제목] ' + title + '\n[부제] ' + subtitle + '\n\n' +
      paragraphs.join('\n\n') + '\n\n[문의]\n' + contactLines.join('\n');

    return {
      type: td.key, typeLabel: td.label, length: length,
      title: title, subtitle: subtitle, paragraphs: paragraphs,
      contact: contactLines, text: text
    };
  }

  var API = { FIELD_LABELS: FIELD_LABELS, ARTICLE_TYPES: ARTICLE_TYPES, checkMissingInfo: checkMissingInfo, generateArticle: generateArticle, typeDef: typeDef };
  root.ArticleGen = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
