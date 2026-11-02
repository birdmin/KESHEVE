# KESHEV — 21단계 학생 실행 설명서와 시스템 구성도

## 확인 범위와 문서 목적

이 문서는 현재 저장소의 README, 앱 실행 도구, 설정 계약과 코드 경계를 읽어 작성한 학생 안내입니다. **문서 작성 중 PowerShell, 서버, 브라우저, SDP/XDR 원천 또는 AI 게이트웨이를 실행·호출하지 않았습니다.** 코드에서 읽어 확인한 사항과 실제 PC에서 확인해야 할 결과를 구분합니다. 21단계 서버 검토도 제출 커밋의 문서·코드·설정을 읽어 대조하며, 문서에 쓴 명령을 실행하지 않습니다.

KESHEV는 로컬 Node.js 서버에 브라우저로 접속해 현재 구현이 제공하는 본인 정보, 업무 앱 접근 판정, 보안 기록 및 선택적 AI 기능을 확인하는 보안 Agent 프로젝트입니다. 서버가 켜졌다는 것만으로 외부 보안 시스템이나 AI 서비스에 연결됐다고 판단하지 않습니다.

## 지원 환경·버전·설치 정보

| 항목 | 현재 파일에서 확인한 내용 | 실제 PC 확인 |
|---|---|---|
| 프로젝트 | `package.json`의 이름 `alekov-client-starter`, 버전 `0.2.21` | 미확인 |
| Node.js 기준 | `package.json`의 `engines.node`는 `24.19.0` | 설치 버전 미확인. PowerShell에서 `node --version`으로 확인 |
| 시작 도구의 허용 범위 | `tools/start-alekov.ps1`은 Node.js 메이저 22~24를 허용하고 `v24.19.0`을 수업 기준으로 안내 | 실행 결과 미확인 |
| 셸·운영체제 | 시작 도구는 Windows PowerShell 명령, Windows 경로 및 프로세스 API를 사용 | Windows·PowerShell 실제 버전 미확인. 다른 운영체제 절차는 확인하지 않음 |
| 브라우저 | 기본 주소는 loopback 주소 `http://127.0.0.1:5189/` | 제품·버전 및 화면 표시 미확인 |
| 패키지 설치 | `package.json`에는 `start`, `demo`, `check`, `package-app` 스크립트가 있고 `dependencies`/`devDependencies` 선언은 없음. 프로젝트 파일 목록에서 `package-lock.json`을 확인하지 못함 | 명령 실행·설치 미실시 |

여기서 명시한 Node.js 버전은 저장소의 기준 계약이지, 이 PC에서 측정한 버전이 아닙니다. 저장소는 별도 설치 명령을 요구하지 않습니다. `npm install`이나 잠금 파일을 추정해 추가하지 않았습니다.

## 실제 폴더와 PowerShell 작업 위치

아래는 현재 파일 경로에 맞춘 구조입니다. 이 워크벤치에서 PC의 절대 경로, 프로젝트 최상위 폴더 이름 또는 Git 최상위 경로는 확인할 수 없습니다.

```text
on-client/                         앱 폴더 — 아래 명령의 작업 위치
├── package.json                   버전·Node 기준·npm 스크립트
├── README.md                      기존 안내; 이번 변경에서 수정하지 않음
├── public/
│   ├── index.html                 제공 브라우저 문서
│   └── app.js                     제공 브라우저 UI·API 요청·학생 모듈 로드
├── student/
│   ├── extension.mjs              학생 화면 확장
│   └── engine-adapter.mjs         학생 엔진 어댑터 경계
├── src/
│   ├── server.mjs                 로컬 HTTP 서버·API·서버 측 구성
│   ├── engine.mjs                 기본·demo 엔진 로딩
│   ├── engine/sdp-host.mjs        서버 측 SDP 연결 경계
│   ├── engine/sdp-host-config.mjs SDP 설정·자격 파일 경계
│   └── ai/                        서버 측 AI 서비스·연결 코드
├── tools/
│   ├── start-alekov.ps1           실행 전 확인·로컬 서버 시작
│   └── prepare-native-host.ps1    기본 실행의 계정 연결용 로컬 설정 준비에 사용
└── docs/                          기존 안내와 이 문서
```

**PowerShell은 실제 `on-client` 폴더**, 즉 `package.json`과 `tools\start-alekov.ps1`이 있는 폴더에서 엽니다. 절대 경로는 본인 PC에서 확인합니다. 다음 `<실제 on-client 폴더 경로>`는 자리표시자이므로 그대로 입력하지 말고 본인 경로로 바꿉니다.

## 실행·정상 시작 신호·종료·재실행

### 일반 실행

1. 기존 작업과 파일을 보존하고 새 PowerShell 창을 엽니다.
2. 실제 앱 폴더로 이동해 위치와 필수 파일을 확인합니다.

   ```powershell
   Set-Location -LiteralPath '<실제 on-client 폴더 경로>'
   Get-Location
   node --version
   Test-Path .\package.json
   Test-Path .\tools\start-alekov.ps1
   Test-Path .\src\server.mjs
   ```

   세 `Test-Path` 결과가 모두 `True`인지 확인합니다. `node --version` 출력은 설치된 버전의 직접 확인값입니다. 이 문서의 작성자는 실행하지 않았습니다.

3. 기본 실행 명령:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
   ```

   `-ExecutionPolicy Bypass`는 이 호출에만 전달되는 옵션입니다. 시작 도구는 프로젝트 파일·Node.js 버전·기본 포트 `5189`를 점검하고, `src/server.mjs`를 실행해 로컬 서버 응답을 기다립니다. 기본 대기 시간은 20초입니다. 기존 작업 파일을 지우거나 덮어쓰는 명령은 아닙니다.

   **기본 실행의 추가 동작:** `-Demo`, `-NoNativeHost`, 명시적 `-NativeHostConfig`가 없는 경우 시작 도구는 계정 연결용 로컬 설정을 사용자 프로필 아래 프로젝트별 `.aleph-keshev-<프로젝트 경로 해시>` 경로에 준비·재사용합니다. 이는 앱 실행 파일을 바꾸는 절차가 아니며 로그인·포털 승인·SDP 연결·AI 요청의 성공을 확인하지 않습니다. 이 사용자 프로필 동작 역시 이 문서 작성 중 실행하지 않았습니다.

4. 코드상 기본 포트는 `5189`입니다. 서버가 응답하면 시작 도구에서 아래 형식의 메시지를 기대할 수 있습니다.

   ```text
   케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요.
   서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.
   ```

   서버 코드 자체는 시작 시 `케셰브 연결 확인: http://127.0.0.1:5189` 형식의 로그를 출력합니다. 이 문자열들은 **코드에서 읽어 확인한 예상 신호**이지 이 PC에서 얻은 실행 결과가 아닙니다. 시작 도구의 HTTP 200 확인은 로컬 서버 응답만 뜻합니다.

5. 브라우저에서 다음 주소를 엽니다.

   ```text
   http://127.0.0.1:5189/
   ```

   브라우저는 시작 도구가 자동으로 열지 않습니다. 실제 화면과 상태 문구는 학생이 직접 확인합니다. 브라우저에서 확인하지 않은 상태를 성공으로 기록하지 않습니다.

6. 포트 `5189`가 사용 중이라는 오류가 나오면 기존 프로그램을 종료하지 않습니다. 다른 포트를 선택한 경우 실행과 브라우저 주소를 같은 포트로 맞춥니다. 예를 들어 `5190`을 선택하면:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5190
   ```

   브라우저 주소는 `http://127.0.0.1:5190/`입니다.

### package.json의 다른 실행 스크립트

아래 스크립트 이름과 대상은 `package.json`에서 확인했습니다. 여기서는 실행하지 않았습니다.

| 명령 | 코드에서 확인한 동작 |
|---|---|
| `npm start` | `node src/server.mjs`; 기본 실행이며 실제 원천 연결을 보장하지 않음 |
| `npm run demo` | `node src/server.mjs --demo`; 합성 예제 자료이며 실제 연결 아님 |
| `npm run check` | `node --check student/extension.mjs`; 해당 파일의 문법 검사이며 앱·브라우저 동작 검사가 아님 |
| `npm run package-app` | 패키징 도구; 일반 학생 로컬 실행 절차가 아님 |

### 종료·재실행

포그라운드 실행은 시작한 PowerShell 창에서 `Ctrl+C`를 누르고 서버 프로세스가 끝나 프롬프트로 돌아오는지 확인합니다. 실제 종료 동작은 이 문서 작성 중 시험하지 않았으므로, 서버가 끝났는지 확인하기 전에는 재실행했다고 기록하지 않습니다. 종료 후 같은 `on-client` 폴더에서 같은 명령을 다시 실행하고, 선택한 포트와 브라우저 주소가 일치하는지 확인합니다. 포트가 여전히 사용 중이면 프로세스의 정체를 확인하지 않고 종료하지 않습니다.

## 글로 쓴 시스템 구성도와 데이터 흐름

```text
[브라우저]
  public/index.html + public/app.js
  학생 화면 모듈: /student/extension.mjs
  주소: http://127.0.0.1:5189/  (기본 포트)
       │ same-origin HTTP 요청
       ▼
[KESHEV 로컬 Node.js 앱 서버: src/server.mjs]
  │
  ├─ 기본 실행 ──► src/engine.mjs ──► disconnected
  │                 연결 엔진이 없으면 조회·판정은 연결 오류
  │
  ├─ --demo ─────► src/engine.mjs의 demoEngine()
  │                 합성 예제 데이터; 실제 연결 아님
  │
  ├─ 서버 실행자가 SDP 설정을 제공한 경우
  │                └─ student/engine-adapter.mjs
  │                    └─ src/engine/sdp-host.mjs
  │                        └─ 설정된 접근 제어·XDR 원천
  │                            (주소는 비공개 설정에서 결정)
  │
  └─ 사용자가 별도 AI 기능을 요청한 경우
                   └─ src/ai/ 서버 측 AI 서비스·연결 경계
                       └─ 권한·설정이 충족된 경우 AI 게이트웨이
                           공개 코드 상수:
                           https://ai-classroom-gateway-production.up.railway.app
```

브라우저는 로컬 앱 서버에 요청합니다. SDP 접근 제어·XDR 조회는 서버 측 엔진 어댑터와 SDP 호스트 경계를 통하며, AI 기능은 별도의 서버 측 경로입니다. 현재 실제 SDP 주소·자격·연결 여부는 이 저장소만으로 특정하지 않습니다. AI 주소는 `src/ai/connection.mjs`의 `CLCO_GATEWAY_ORIGIN`에 선언된 공개 주소이며, 코드에 있다는 사실만으로 실제 도달·권한 승인·응답 성공을 뜻하지 않습니다. 이 문서에는 키·토큰·비밀번호·인증서 내용을 싣지 않습니다.

## 유지할 함수·제공 코드 경계·입력 계약

| 영역 | 파일·함수 | 입력·역할 | 확인 상태 |
|---|---|---|---|
| 시작 | `tools/start-alekov.ps1` | `-Port`(1024~65535, 기본 5189), `-Demo`, `-Background`, `-NativeHostConfig`, `-NoNativeHost`, `-SdpHostConfig`, `-WaitSeconds` 등 실행 옵션을 검사 | 스크립트 읽기만 확인; 실행 미확인 |
| 서버 | `src/server.mjs`: `createOnServer(serverOptions)` 및 실행부 | 서버 측에서 엔진·선택 설정을 구성하고 `127.0.0.1`에 수신; 브라우저 요청으로 모듈 경로나 자격 파일을 선택하지 않음 | 코드 읽기만 확인 |
| 엔진 로딩 | `src/engine.mjs`: `loadEngine(path, {hostCapability})`, `engineMethod(engine, name)`, `demoEngine()` | 엔진 경로는 서버 실행 설정. 경로가 없으면 기본 `disconnected`; `--demo`는 합성 엔진; 없는 엔진 메서드는 연결 오류 경계 | 코드 읽기만 확인 |
| 학생 엔진 어댑터 | `student/engine-adapter.mjs`: `createEngine(host)` | 필수 host 계약은 `projectId`, `readIdentity`, `readApps`, `decideAccess`; `readEvents`, `readDevices`, `readSessions`는 선택 기능 | 코드 읽기만 확인; 실제 SDP 연결 미확인 |
| 학생 화면 | `student/extension.mjs`: `createStudentView()` | 제공 UI가 `{api, onChange}`를 전달. `public/app.js`의 학생 API는 허용된 GET만 지원: `/api/me`, `/api/apps`, `/api/events`, `/api/devices`, `/api/sessions`, `/api/vulnerabilities`, `/api/pc/status` | 확장 모듈이 존재하고 로드 경계가 있음을 확인; 실제 렌더링 미확인 |
| 제공 브라우저 UI | `public/index.html`, `public/app.js` | 기본 조회 GET `/api/me`, `/api/apps`, `/api/events`, `/api/devices`, `/api/sessions`; 접근 판정 `POST /api/access`의 `{appId}`; AI 점검 `POST /api/ai/check`의 `{}`; 사건 설명 `POST /api/ai/explain`의 `{eventId}` | 제공 코드 경계 읽기만 확인; 실제 요청 미실시 |
| SDP 설정 | `src/engine/sdp-host-config.mjs`: `readSdpHostConfiguration()` | 서버에 명시한 설정 파일의 `alekov.sdp.host.v1` 계약과 외부 자격 파일 경계를 검증; 설정 내용은 공개 문서에 포함하지 않음 | 코드만 확인; 설정·접속 미실시 |
| AI | `src/ai/connection.mjs`, `src/ai/service.mjs` 및 서버 경계 | 서버 측 연결·권한·요청 경계. AI 연결 점검과 사건 설명은 별도 동작 | 코드만 확인; 게이트웨이·모델 호출 미실시 |

접근 판정값은 `allow`, `deny`, `challenge`, `unknown`이고, 엔진 모드는 `connected`, `demo`, `disconnected`입니다. `connected` 모드는 어댑터 모드이며 개별 원천 요청 성공을 보증하지 않습니다. `unknown`이나 오류를 허용으로 바꾸지 않습니다. UI 함수·상태 계약과 필수 버튼은 기존 `public/app.js`, `public/index.html`, `student/extension.mjs`가 정하는 그대로 둡니다. 이번 변경에는 UI 변경이 없습니다.

## 장애별 확인 순서·복구

1. **앱 폴더 오류:** `Get-Location`으로 위치를 확인하고 `package.json`, `tools\start-alekov.ps1`, `src\server.mjs`가 있는 실제 `on-client`에서 실행합니다. 저장소 파일을 이동하거나 삭제하지 않습니다.
2. **Node.js 없음·버전 오류:** 새 PowerShell 창에서 `node --version`을 확인합니다. 시작 도구는 메이저 22~24를 허용하고 `24.19.0`을 기준으로 안내합니다. 실행 도구가 표시한 메시지를 따릅니다. 실제 설치·복구 결과는 미확인입니다.
3. **포트 사용 중:** 시작 도구가 표시한 포트를 확인합니다. 다른 프로그램은 종료하지 말고 사용 가능한 포트로 `-Port`를 지정한 뒤 브라우저 주소도 같은 포트로 바꿉니다.
4. **서버가 제한 시간 안에 응답하지 않음:** 시작 PowerShell 창의 실제 메시지를 확인합니다. `-WaitSeconds`의 기본값은 20초(허용 범위 1~120초)입니다. 원인을 확인하지 않은 채 설정 파일이나 프로젝트를 삭제하지 않습니다.
5. **로컬 API 오류:** 서버는 `ENGINE_NOT_CONNECTED`, `ENGINE_ADAPTER_INVALID`, `ENGINE_RESULT_UNVERIFIED`, `ENGINE_TIMEOUT`, `SUBJECT_SCOPE_UNVERIFIED` 등 고정 코드로 연결·검증 오류를 구분합니다. 화면의 정확한 코드와 메시지를 확인하고 정상 데이터로 취급하지 않습니다. 실제 오류 재현은 미확인입니다.
6. **AI 오류:** 화면에 표시된 AI 오류 코드를 확인하고 앱 권한·서버 설정은 담당자에게 문의합니다. 열쇠를 브라우저에 입력하거나 자동 재시도·유료 AI 요청을 임의로 하지 않습니다.
7. **복구 후:** 서버 응답·브라우저 화면·외부 연결은 각각 별도로 확인합니다. 서버 시작 신호만으로 SDP/XDR 또는 AI 성공을 기록하지 않습니다.

## 제출 절차의 경계

학생 문서와 이번 단계 코드는 같은 커밋에 저장해야 합니다. 이미 준비 중인 변경이 있으면 Git 상태와 내용을 먼저 확인해 보존합니다. 이 도구로 실제 Git 상태·최상위 경로·저장소 주소·40자리 커밋을 확인할 수 없으며, 커밋·제출을 수행하지 않았습니다.

21·22단계는 과제 화면에서 저장소 주소와 제출할 40자리 커밋을 입력합니다. 비공개 저장소를 공개로 바꿀 필요는 없습니다. 비공개 원문은 해당 과제 화면의 **「비공개 저장소 원문 준비 방법」**과 **「원문 전달 도구 받기」**를 따릅니다. ZIP과 JSON 출력 폴더는 프로젝트 밖에 준비합니다. 프로젝트 Git 최상위 폴더에서 PowerShell을 열고 과제 화면이 제공하는 `student-source-cli.mjs` 명령을 사용하되, 도구·출력 파일 경로와 `--commit` 값은 PC에서 확인한 실제 값으로 지정합니다. 현재 과제 화면, 다운로드한 도구 경로, 실제 커밋 값을 확인할 수 없어 구체적인 명령을 임의로 적지 않습니다. 도구는 커밋된 원문만 묶으며 학생 코드를 실행하거나 업로드하지 않습니다. JSON 제출 뒤 원문 전달 완료와 AI 검토 통과를 구분하고, 원문만 실패한 경우 기존 접수를 유지해 화면의 **「원문만 다시 보내기」**를 사용합니다.

## 확인 상태와 학생 직접 확인

| 항목 | 상태 |
|---|---|
| 파일·함수·Node 기준·PowerShell 명령·기본 URL·주요 입력 계약 | 코드와 설정 파일을 읽어 확인 |
| 명령 실행·서버 시작·HTTP 200 | 미실행·미확인 |
| 실제 브라우저 화면·버튼 이름·키보드 조작 | 미확인 |
| 설치된 Node·Windows·PowerShell·브라우저 버전 | 미확인 |
| 실제 SDP/XDR·계정 연결·AI 권한·게이트웨이·모델 응답 | 미실시·미확인 |
| 현재 Git 상태·기존 staged 변경·저장소 주소·제출 커밋·원문 도구 경로 | 이 환경에서 확인 불가 |

### 확인 1 — 새 PowerShell에서 실행

기존 작업을 보존하고 새 PowerShell 창에서 위의 실행 절차를 **한 단계씩** 따라 하십시오. 실제 `on-client` 경로와 PC의 Node 버전을 사용합니다. 실행했다면 PowerShell의 실제 출력, 브라우저 주소와 화면, 종료 여부를 기록합니다. 실행하지 못했거나 결과를 확인하지 못한 항목은 미확인으로 둡니다.

**예상 결과(코드 기준):** 올바른 앱 폴더와 허용 Node 버전, 사용 가능한 포트에서 기본 서버가 시작되면 로컬 주소와 “서버가 응답한 것만 확인했습니다”라는 안내가 출력됩니다. 이는 AI·SDP 연결 성공이 아닙니다. 실제 화면은 직접 확인해야 합니다.

### 확인 2 — 경로·명령·화면 문구 대조

확인 1을 마친 뒤에만 진행합니다. 실제 `on-client` 위치, 실행한 명령, 선택 포트와 브라우저 주소를 저장소 파일과 대조합니다. 화면의 버튼·상태 문구는 현재 실제 화면과 `public/index.html`, `public/app.js`, `student/extension.mjs`의 계약을 대조합니다. 과제 제출 화면에서만 제공되는 버튼·원문 도구 명령은 실제 과제 화면과 대조하며, 여기서 확인되지 않은 문구나 명령을 만들어내지 않습니다. 확인하지 못한 것은 미확인으로 기록합니다.
