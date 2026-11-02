# KESHEV 학생 실행 설명서와 시스템 구성도 — 21단계

이 문서는 현재 저장소의 실행 파일·설정 계약을 바탕으로 KESHEV 학생 앱을 로컬에서 시작하고 코드 경계를 확인하는 방법을 안내합니다. 서버는 문서의 명령을 실행하지 않았습니다. 실제 화면·연결·명령 결과는 확인했다고 적지 않습니다.

## 목적과 기능

KESHEV는 브라우저에서 로컬 앱 서버에 접속해 로그인·기기·세션, 업무 앱 접근 판정, 보안 기록 및 선택적 AI 기능을 표시하는 학생용 보안 Agent입니다. 기본 실행이 SDP나 AI 서비스 연결을 뜻하지 않습니다. `--demo`는 예제 자료 모드이며 실제 연결이 아닙니다.

현재 학생 확장 `student/extension.mjs`에는 다음 표시 함수가 있습니다.

- `renderIdentity`: 사용자·기기·세션 표시
- `renderDecision`: 접근 판정 표시
- `renderEvents`: 기록 목록·필터·상세 표시
- `renderStatus`: 기기·세션·알림·진단 표시
- `renderVulnerabilities`: 패키지 조회 결과 표시
- `renderAiConnection`: AI 연결 점검 상태 표시
- `renderExplanation`: AI 사건 설명 표시
- `renderAction`: 조치 결과 상태 표시

제공 UI와 학생 구현은 별도 경계입니다. 제공 코드를 읽거나 실행하는 것만으로 학생 구현을 확인한 것으로 간주하지 않습니다.

## 지원 환경과 버전

| 항목 | 코드에서 확인한 계약 | 실제 PC에서 확인 |
|---|---|---|
| 앱 버전 | `package.json`의 프로젝트 버전은 `0.2.21`입니다. | 미확인 |
| Node.js | `tools/start-alekov.ps1`은 22~24 계열을 허용하고 `package.json`의 `engines.node` 기준은 `24.19.0`입니다. 기준 버전이 아니어도 허용 범위이면 경고 후 계속합니다. | 미확인 |
| 의존성 설치 | `package.json`에 외부 패키지 설치 스크립트가 없습니다. `package-lock.json`은 확인되지 않았습니다. | 미확인 |
| 운영체제·셸 | 실행 도구는 Windows PowerShell 스크립트이며 Windows PowerShell을 직접 호출합니다. | Windows·PowerShell 버전 미확인 |
| 브라우저 | 기본 로컬 주소는 `http://127.0.0.1:5189/`입니다. 지원 브라우저 및 버전은 저장소에서 확인되지 않았습니다. | 미확인 |

실제 설치 버전은 확인하지 않았으므로 기준 버전을 설치된 버전처럼 기록하지 않습니다.

## 폴더와 PowerShell 위치

저장소의 관련 실제 경로:

```text
on-client/                 앱 프로젝트 루트
├── package.json           앱 버전·스크립트·Node 기준 버전
├── README.md              기존 프로젝트 안내(수정하지 않음)
├── src/server.mjs         로컬 HTTP 앱 서버
├── src/engine.mjs         엔진 로딩 경계 및 demo 엔진
├── src/engine/            SDP 호스트·학생 엔진 IPC·호스트 구성
├── src/ai/                서버 측 AI 연결·설명 서비스
├── public/index.html      브라우저 화면 구조
├── public/app.js          제공 브라우저 앱
├── student/extension.mjs  학생 화면 확장 함수
├── student/engine-adapter.mjs  학생 엔진 어댑터 경계
├── tools/start-alekov.ps1 PowerShell 실행 도구
└── docs/                  문서
```

PowerShell은 **실제 `on-client` 폴더**, 즉 `package.json`과 `tools/start-alekov.ps1`이 있는 디렉터리에서 엽니다. PC마다 다른 절대 경로는 이 문서에서 가정하지 않습니다.

## 설치·실행·종료·재실행

1. 기존 프로젝트를 보존한 채 새 PowerShell 창을 엽니다.
2. 실제 `on-client` 폴더로 이동합니다. 다음 예시의 경로는 본인 PC에서 확인한 값으로 바꿉니다.

   ```powershell
   Set-Location -LiteralPath '<실제 on-client 폴더 경로>'
   ```

3. 현재 위치, Node 버전 및 실행 파일을 확인합니다.

   ```powershell
   Get-Location
   node --version
   Test-Path .\package.json
   Test-Path .\tools\start-alekov.ps1
   ```

   두 `Test-Path` 결과가 모두 `True`여야 합니다. 실제 버전은 `node --version` 출력으로 확인합니다. 기준은 `v24.19.0`, 실행 도구 허용 범위는 Node.js 22~24입니다.

4. 기본 실행:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
   ```

   실행 도구는 `on-client`의 `src/server.mjs`를 시작합니다. 기본 포트는 `5189`입니다. 일반 실행(예제·`-NoNativeHost`가 아닌 경우)은 먼저 `tools/prepare-native-host.ps1`로 계정 연결용 로컬 설정을 자동 준비합니다. 설정 폴더는 실행 도구가 사용자 프로필 아래 `.aleph-keshev-<프로젝트 경로 해시>` 이름으로 지정하며 프로젝트 밖에 둡니다. 설정 준비는 로그인·포털 승인이나 AI 요청을 하지 않습니다. 이는 SDP 설정과도 별개입니다.

   로컬 시작 신호는 스크립트가 `http://127.0.0.1:5189/`에서 HTTP 200 응답을 확인하고 `케셰브가 켜졌습니다`와 주소를 출력하는 것입니다. 스크립트는 이어서 서버 응답만 확인했으며 AI 연결 상태는 별도라는 안내를 출력합니다. 이 신호는 SDP·AI 연결 성공이 아닙니다. 실행 실패 시 스크립트가 제시하는 오류를 확인하고, 자동 계정 설정 준비가 실패했다면 기존 설정과 학생 작업을 덮어쓰지 마십시오. 이 절차는 실제 실행 전입니다.

5. 브라우저에서 다음 주소를 엽니다.

   ```text
   http://127.0.0.1:5189/
   ```

   주소는 실행 코드의 기본값입니다. 실제 브라우저 화면은 확인하지 않았습니다.

6. 포그라운드 실행은 시작한 PowerShell 창에서 `Ctrl+C`로 종료합니다. `-Background` 실행은 도구가 출력한 프로세스 번호를 확인하고 그 번호의 Node 프로세스를 작업 관리자에서 종료하도록 안내합니다. 백그라운드 동작은 실행 확인하지 않았습니다.
7. 재실행은 종료 여부를 확인한 뒤 같은 프로젝트 루트에서 기본 명령을 다시 실행합니다. 프로젝트를 삭제하거나 새로 만들지 않습니다. 포트가 점유 중이면 실행 도구는 기존 프로그램을 종료하지 않고 오류를 표시합니다. 다른 포트를 쓰면 `-Port`에 지정한 번호와 브라우저 주소의 포트를 동일하게 맞춥니다.

실행 도구에는 `-Demo`, `-Port`, `-Background`, `-WaitSeconds`, `-NativeHostConfig`, `-NoNativeHost`, `-SdpHostConfig` 옵션이 정의되어 있습니다. 기본 절차는 사용자가 SDP 설정을 지정하지 않으며, 계정 연결 설정 준비도 로그인·승인과 다릅니다. 연결 기능이 필요하면 `docs/STUDENT_LAUNCH_GUIDE.md`와 `docs/CONNECTION_TROUBLESHOOT.md`, 운영자 지침을 확인하십시오. 설정 파일 원문·비밀값을 문서나 커밋에 넣지 않습니다.

## 글로 쓴 구성도와 데이터 흐름

```text
[브라우저]
  실제 코드: public/index.html, public/app.js
  주소: http://127.0.0.1:5189/
  │ 같은 출처의 HTTP 요청
  ▼
[KESHEV 로컬 앱 서버]
  실제 코드: src/server.mjs
  │
  ├─ 로컬 API 요청 ─────────► [엔진 경계: src/engine.mjs]
  │                              ├─ 기본 실행: 연결 엔진 미설정이면 연결 없음
  │                              ├─ --demo: 예제 엔진(실제 연결 아님)
  │                              └─ 서버 측 어댑터/호스트 경로
  │                                   └─ SDP 설정이 주어진 경우
  │                                      접근 제어·XDR 조회
  │                                      src/engine/sdp-host.mjs
  │                                      src/engine/sdp-host-config.mjs
  │
  └─ AI 기능 요청 ─────────► [서버 측 AI 서비스/연결 경계]
                                 src/ai/service.mjs
                                 src/ai/connection.mjs 등
                                 │
                                 └─ 구성·권한이 제공된 경우 AI 게이트웨이
                                    공개 게이트 주소(코드 상수):
                                    https://ai-classroom-gateway-production.up.railway.app
```

브라우저는 로컬 앱 서버와 통신합니다. 접근 제어·XDR은 엔진 어댑터 및 서버 측 SDP 경로, AI 기능은 서버 측 서비스 경계를 통과합니다. 구성도는 코드 구조이지 현재 외부 서비스 연결 성공의 증거가 아닙니다. 게이트 주소의 가용성은 확인하지 않았습니다. 토큰·인증서·API 키·비밀 설정값은 문서에 포함하지 않습니다.

## 제공 코드·학생 코드 경계와 입력·상태 계약

| 구분 | 실제 파일·함수 | 입력 또는 경계 | 코드에서 확인한 점·미확인 |
|---|---|---|---|
| 제공 브라우저 화면 | `public/index.html`, `public/app.js` | 로컬 API 응답 및 `student/extension.mjs` 로드 | 제공 UI 경계입니다. 브라우저 렌더링은 미확인입니다. |
| 학생 화면 확장 | `student/extension.mjs`, `createStudentView()` 및 위 목적 절의 `render*` 함수 | 함수별 자원 객체의 `status`, `mode`, `data`, `error` 등 | 학생 구현 코드가 있습니다. 실제 브라우저 표시는 미확인입니다. |
| 학생 엔진 어댑터 | `student/engine-adapter.mjs`, `createEngine(host)` | 호스트의 `projectId`, `readIdentity`, `readApps`, `decideAccess` 및 선택적 본인 조회 함수 | 미지원 조회를 빈 성공으로 꾸미지 않는 경계입니다. 실제 SDP 연결은 미확인입니다. |
| 서버·엔진 로딩 | `src/server.mjs`, `src/engine.mjs`, `loadEngine()`, `engineMethod()`, `demoEngine()` | 서버 측 설정 및 선택적 어댑터; 브라우저 요청이 모듈 경로를 선택하지 않음 | `disconnected`, `demo`, `connected` 경로가 구분됩니다. 실행 여부는 미확인입니다. |
| SDP 호스트 엔진 | `src/engine/sdp-host.mjs`, `createSdpHostEngine()` | 서버 호스트 설정, 본인 범위 입력, 취소 가능한 요청 | 입력·응답·범위를 검증하는 코드가 있습니다. 실제 endpoint 응답은 미확인입니다. |
| AI 연결·설명 | `src/ai/connection.mjs`, `createAlekovAppConnector()`; `src/ai/service.mjs`, `createOnAiService()` | 서버 측 연결 문맥·권한·사건 자료·취소 신호 | 권한·응답 검증 코드가 있습니다. 실제 게이트 연결·유료 요청은 하지 않았습니다. |

API 상태값, 함수명 및 `data-*` 계약은 코드 원문을 따릅니다. `demo`, `disconnected`, `unknown`, `allow`, `deny`, `challenge`는 서로 대체 가능한 성공 표현이 아닙니다. 특히 `allow`는 대상 앱의 실제 접속 성공을 보장하지 않습니다.

## 장애 발생 시 확인 순서와 복구

1. `Get-Location`으로 작업 위치를 확인하고, `package.json`과 `tools/start-alekov.ps1`이 있는 `on-client` 루트로 이동합니다.
2. `node --version`을 확인합니다. 실행 도구 허용 범위는 Node.js 22~24, 프로젝트 기준은 `24.19.0`입니다. 범위 밖이면 표시된 오류와 버전을 기록하고 승인된 설치 절차를 따릅니다.
3. 폴더·시작 틀 오류가 나오면 파일 경로와 실제 프로젝트 루트를 확인합니다. 포트 충돌이면 다른 프로그램을 종료하지 말고 점유 원인을 확인하거나 `-Port`로 다른 번호를 지정한 뒤 브라우저 주소도 맞춥니다.
4. 서버가 `-WaitSeconds` 안에 응답하지 않으면 PowerShell의 전체 메시지를 확인합니다. 기본 대기 시간은 20초이며 허용 범위는 1~120초입니다. 원인을 확인하기 전 폴더나 설정을 삭제하지 않습니다.
5. 서버 응답은 확인되지만 브라우저가 열리지 않으면 주소·포트와 서버 프로세스를 확인합니다. UI는 이 문서 작성 과정에서 확인하지 않았습니다.
6. `demo`, `disconnected`, `unknown`은 실제 연결 성공으로 해석하지 않습니다. 기본 미연결 경계는 `src/engine.mjs`의 `ENGINE_NOT_CONNECTED`, 잘못된 어댑터 경계는 `ENGINE_ADAPTER_INVALID`와 연결됩니다. AI 상태는 `student/extension.mjs`의 `renderAiConnection` 및 서버 AI 서비스의 오류 코드에 따라 확인합니다. 실제 오류 발생·복구는 미확인입니다.
7. 계속 실패하면 오류 코드와 비밀이 없는 도움정보만 담당자에게 전달합니다. 토큰·비밀번호·API 키·인증서·비공개 설정 파일 원문을 문서·채팅·로그·Git에 붙여 넣지 않습니다.

실행 도구 옵션의 원문과 상세 연결 장애 안내는 각각 `tools/start-alekov.ps1`, `docs/STUDENT_LAUNCH_GUIDE.md`, `docs/CONNECTION_TROUBLESHOOT.md`를 참조하십시오.

## 한계와 미확인 사항

- 이 도구로 앱·브라우저를 실행할 수 없어 실제 시작·UI·종료·재실행 결과는 미확인입니다.
- 실제 Node.js, Windows, PowerShell, 브라우저 버전 및 PC의 절대 프로젝트 경로는 미확인입니다.
- SDP/XDR 연결, AI 게이트웨이·모델 응답 및 유료 AI 요청은 실행하지 않았습니다.
- 명령은 코드 정의와 대조했지만 새 PowerShell에서 실행 검증하지 않았습니다.
- `package-lock.json`을 확인하지 못했습니다. 설치 명령을 추측해 추가하지 않았습니다.
- Git 최상위 경로, 기존 변경사항, 제출할 40자리 커밋을 확인할 수 없습니다. 커밋을 만들거나 기존 변경을 조작하지 않았습니다.
- 비공개 저장소 원문 전달 도구의 ZIP·도구·출력 경로와 정확한 명령은 과제 화면에서 확인해야 합니다. 이 문서에는 임의의 CLI 명령이나 커밋 해시를 만들지 않았습니다.

## 학생 직접 확인 — 한 번에 하나씩

### 확인 1: 새 PowerShell에서 실행 절차 따라 하기

기존 작업을 보존하고 새 PowerShell 창에서 위 실행 절차를 따르십시오. 본인 PC의 실제 프로젝트 위치를 사용합니다. 실행했다면 실제 `node --version`, 시작 출력, 브라우저 주소·화면 및 종료 결과를 기록하십시오. 실행하지 못한 항목이나 오류는 미확인으로 남기십시오.

**예상 결과(코드에서 확인한 기준):** 올바른 프로젝트 루트와 허용 Node 버전에서 기본 포트 5189의 로컬 HTTP 응답을 확인하면 `케셰브가 켜졌습니다`와 로컬 주소가 출력되어야 합니다. 일반 실행은 계정 연결용 로컬 설정을 별도로 자동 준비할 수 있으나, 이 출력은 로그인·승인 또는 외부 SDP·AI 연결 성공이 아닙니다. 실제 결과는 학생이 확인해야 합니다.

확인 1의 결과를 기록한 뒤 다음으로 진행하십시오. **확인 2는 아직 진행하지 않습니다.**
