# 상지홈

가계 플랫폼의 공개 로그인 셸입니다. GitHub 로그인 후 가구 구성원에게만 Supabase의 비공개 앱과 데이터를 제공합니다(RLS).

- 주소: https://jihoonlee91.github.io/household-app/
- 비공개 앱·DB 스키마: `jihoonlee91/household`
- 공개 셸에는 PWA 설치·탐색·공유 기능과 주거 전략·버킷리스트·차량 관리 화면이 포함됩니다. 개인 기록은 DB에서 읽습니다.
- 오프라인 캐시는 공개 셸 파일만 저장합니다. 비공개 앱과 DB 데이터는 오프라인 제공 대상이 아닙니다.

검증: `node check-shell.js` 및 `node check-runtime.js`. main push 시 GitHub Pages로 배포됩니다.
