/* ============================================================
   데모/샘플 입력 데이터 (demo-data.js)
   -----------------------------------------------------------
   · 특정 기업 정보는 여기(데모 데이터)에서만 관리한다.
   · 생성 엔진(article-generator.js)은 이 데이터에 의존하지 않는다.
   · 화면의 "샘플 불러오기"용. 다른 기업 정보로 교체해도 전체 기능은 동일하게 동작한다.
   ============================================================ */
(function (root) {
  'use strict';

  var DEMO_SAMPLES = [
    {
      id: 'mfg-launch', label: '제조기업 · 신제품 출시',
      input: {
        company: '한빛정밀', industry: '제조업, 자동차 부품', product: '초경량 전기차 배터리 케이스',
        topic: '초경량 전기차 배터리 케이스 신제품 출시', type: 'launch',
        facts: '기존 제품 대비 무게를 30% 줄인 알루미늄 합금 배터리 케이스를 개발·출시했다',
        date: '2026년 3월 12일', place: '경기 화성 본사',
        metrics: '무게 30% 경량화, 연간 생산능력 50만 개',
        partners: '국내 완성차 2개사', repName: '김철수', repTitle: '대표이사',
        quote: '경량화 기술로 전기차 주행거리 향상에 기여하겠다',
        plan: '유럽 완성차 업체로 공급을 확대할 계획이다',
        intro: '한빛정밀은 2005년 설립된 자동차 부품 전문 제조기업이다',
        email: 'pr@hanbit.example', phone: '031-000-0000'
      }
    },
    {
      id: 'cosmetic-export', label: '화장품 기업 · 해외 진출',
      input: {
        company: '루미에르코스메틱', industry: '화장품, 뷰티', product: '비건 앰플 스킨케어 라인',
        topic: '비건 스킨케어 라인 동남아 수출', type: 'export',
        facts: '비건 인증을 받은 앰플 스킨케어 라인으로 동남아 시장에 진출한다',
        date: '2026년 4월 2일', place: '베트남·태국',
        metrics: '초도 물량 20만 개, 3년 내 매출 100억 원 목표',
        partners: '현지 유통사 A사', repName: '박지영', repTitle: '해외사업본부장',
        quote: '비건 트렌드에 맞춰 동남아 소비자에게 다가가겠다',
        plan: '내년 중동 시장까지 진출 지역을 넓힐 예정이다',
        intro: '루미에르코스메틱은 자연주의 스킨케어를 지향하는 화장품 기업이다',
        email: 'global@lumiere.example', phone: '02-000-0000'
      }
    },
    {
      id: 'it-investment', label: 'IT 스타트업 · 투자 유치',
      input: {
        company: '데이터브릿지', industry: 'IT, 데이터 분석 소프트웨어', product: 'AI 데이터 분석 플랫폼',
        topic: '시리즈A 투자 유치', type: 'investment',
        facts: '기업용 AI 데이터 분석 플랫폼을 개발하는 스타트업으로 시리즈A 투자를 유치했다',
        date: '2026년 2월 20일', place: '서울 본사',
        metrics: '80억 원 규모 시리즈A 투자',
        partners: '벤처캐피탈 B사, C사', repName: '이민호', repTitle: '대표',
        quote: '이번 투자를 바탕으로 제품 고도화와 인재 채용에 집중하겠다',
        plan: '연내 개발 인력을 두 배로 늘리고 해외 진출을 준비할 계획이다',
        intro: '데이터브릿지는 2021년 설립된 기업용 데이터 분석 소프트웨어 스타트업이다',
        email: 'contact@databridge.example', phone: '02-000-0000'
      }
    }
  ];

  var API = { DEMO_SAMPLES: DEMO_SAMPLES };
  root.DemoData = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : this);
