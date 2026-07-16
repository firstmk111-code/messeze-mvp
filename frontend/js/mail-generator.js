/* ============================================================
   범용 기자 제안 메일 생성 (mail-generator.js)
   -----------------------------------------------------------
   기사 생성(article-generator.js)과 분리된 함수.
   메일 = 상단(기자명·제안이유·핵심 3줄·취재 포인트) + 하단(완성 기사 전체·기업 소개·문의)
   입력되지 않은 정보는 만들어내지 않는다.
   ============================================================ */
(function (root) {
  'use strict';

  function _trim(s) { return String(s == null ? '' : s).trim(); }
  function _has(s) { return _trim(s).length > 0; }

  /* 기자에게 제안하는 이유 (기자 분야/톤 + 입력 업종·주제 기반, 일반 표현) */
  function _reason(reporter, input) {
    reporter = reporter || {}; input = input || {};
    var field = _trim(reporter.field);
    var media = _trim(reporter.media);
    var industry = _trim(input.industry);
    var base = _has(field)
      ? (field + ' 분야를 다뤄오신 ' + (_has(media) ? media + ' ' : '') + '기자님께 적합한 소재로 판단되어 제안드립니다.')
      : ((_has(media) ? media + ' ' : '') + '기자님께 도움이 될 소재로 판단되어 제안드립니다.');
    if (_has(industry)) base += ' ' + industry + ' 관련 동향과도 연결됩니다.';
    return base;
  }

  /* 핵심 내용 3줄 (입력된 것만, 최대 3개) */
  function _keyLines(input, article) {
    var lines = [];
    if (article && _has(article.title)) lines.push(article.title);
    if (_has(input.metrics)) lines.push('주요 성과·규모: ' + _trim(input.metrics));
    if (_has(input.partners)) lines.push('참여·협력: ' + _trim(input.partners));
    if (_has(input.facts) && lines.length < 3) lines.push(_trim(input.facts));
    if (_has(input.plan) && lines.length < 3) lines.push('향후 계획: ' + _trim(input.plan));
    return lines.slice(0, 3);
  }

  /* 취재 포인트 (유형/입력 기반, 최대 2개, 입력된 것만) */
  function _coveragePoints(input) {
    var pts = [];
    if (_has(input.place)) pts.push('현장(' + _trim(input.place) + ') 취재 및 사진 확보 가능');
    if (_has(input.repName)) pts.push(_trim(input.repName) + (_has(input.repTitle) ? ' ' + _trim(input.repTitle) : '') + ' 인터뷰 요청 가능');
    if (pts.length < 2 && _has(input.metrics)) pts.push('성과 수치·근거 자료 제공 가능');
    if (pts.length < 2 && _has(input.product)) pts.push(_trim(input.product) + ' 상세 자료·이미지 제공 가능');
    return pts.slice(0, 2);
  }

  /* 메일 제목 */
  function _subject(input, article) {
    var company = _trim(input.company) || '기업';
    var core = (article && _has(article.title)) ? article.title.replace(company + ', ', '') : (_trim(input.topic) || '보도자료');
    var s = '[보도자료] ' + company + ', ' + core;
    return s.length > 60 ? s.slice(0, 59) + '…' : s;
  }

  /* 메일 본문 조립 */
  function generateMail(reporter, input, article) {
    reporter = reporter || {}; input = input || {}; article = article || {};
    var repName = _trim(reporter.name) || '담당';
    var lines = _keyLines(input, article);
    var points = _coveragePoints(input);

    var out = [];
    out.push(repName + ' 기자님, 안녕하세요.');
    out.push('');
    out.push(_reason(reporter, input));
    out.push('');
    if (lines.length) { out.push('[핵심 내용]'); lines.forEach(function (l) { out.push('· ' + l); }); out.push(''); }
    if (points.length) { out.push('[취재 포인트]'); points.forEach(function (p) { out.push('· ' + p); }); out.push(''); }

    out.push('아래 완성 기사 초안을 함께 전달드립니다. 그대로 활용하시거나 편집하셔도 좋습니다.');
    out.push('────────────────────────────────');
    out.push(_has(article.text) ? article.text : '(기사 초안 미생성)');
    out.push('────────────────────────────────');
    if (_has(input.intro)) { out.push(''); out.push('[기업 소개]'); out.push(_trim(input.intro)); }

    out.push('');
    out.push('[문의]');
    out.push(_trim(input.company) || '');
    if (_has(input.repName)) out.push(_trim(input.repName) + (_has(input.repTitle) ? ' ' + _trim(input.repTitle) : ''));
    if (_has(input.email)) out.push(_trim(input.email));
    if (_has(input.phone)) out.push(_trim(input.phone));

    return { subject: _subject(input, article), body: out.join('\n') };
  }

  var API = { generateMail: generateMail };
  root.MailGen = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
