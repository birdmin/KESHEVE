# KESHEV — 21단계 학생 실행 설명서와 시스템 구성도

## 문서의 확인 범위

이 문서는 저장소의 현재 코드·설정·문서를 읽어 정리했습니다. 작성 중 PowerShell 명령, 서버, 브라우저, SDP/XDR 시스템 또는 AI 게이트웨이를 실행·호출하지 않았습니다. 코드에서 읽어 확인한 내용과 실제 실행 결과를 구분합니다. 문서에 적힌 명령은 실행을 권하는 절차이지, 여기서 실행해 확인한 결과가 아닙니다.

## 1. 목적·기능·지원 범위

KESHEV는 사용자가 본인 로그인·기기·세션, 업무 앱 접근 판정, 보안 기록, 그리고 별도로 제공되는 AI 기능을 확인하는 로컬 보안 Agent 프로젝트입니다. 브라우저 화면은 제공 UI와 `student/extension.mjs`의 학생 표시 영역으로 구분되어 있습니다. 이 문서는 실행 방법과 현재 코드의 경계를 설명하며 UI나 기능을 추가하지 않습니다.

| 항목 | 저장소에서 확인한 계약 | 실제 확인 상태 |
|---|---|---|
| Node.js | `package.json`의 `engines.node`는 `24.19.0`; 시작 스크립트는 22~24 메이저를 허용하고 `24.19.0`을 권장 | 선언을 읽어 확인. 이 PC에 설치된 버전은 미확인 |
| 시작 환경 | `tools/start-alekov.ps1`은 Windows PowerShell과 Windows 경로·프로세스 API를 사용 | 코드 확인. 실행은 미확인 |
| 브라우저 | 주소는 로컬 `127.0.0.1`에 고정. 코드에서 브라우저 제품·버전 요구사항은 확인되지 않음 | 실제 브라우저·화면은 미확인 |
| 패키지 설치 | `package.json`에는 외부 npm 의존성이 선언되지 않음. 파일 목록에서 `package-lock.json`을 찾지 못함 | 파일 선언·목록 확인. 설치 명령은 실행하지 않음 |
| 다른 OS | 이 PowerShell 실행 도구가 아닌 환경의 실행 절차는 이 프로젝트에서 확인되지 않음 | 지원 여부 미확인 |
| 연결·권한 | SDP 연결은 명시적 설정이 있어야 구성됨. AI 연결은 별도 서버 측 경로와 현재 권한에 의존 | 실제 원격 연결·권한은 미확인 |

Node.js 버전이 실제로 설치되어 있는지는 `on-client` 폴더에서 새 PowerShell을 열고 `node --version`으로 확인합니다. 기대하는 수업 기준 출력은 `v24.19.0`입니다. 여기서는 그 명령을 실행하지 않았습니다. 시작 스크립트의 허용 범위가 `package.json`의 단일 버전 선언보다 넓다는 차이를 그대로 기록했으며, 버전 계약을 임의로 바꾸지 않았습니다.

## 2. 폴더와 PowerShell 작업 위치

경로는 저장소에서 확인한 `on-client` 디렉터리를 기준으로 합니다. 저장소의 최상위 절대 경로는 이 문서에서 알 수 없으므로 만들어 쓰지 않습니다.

```text
on-client/                         앱 폴더; 시작 도구의 작업 대상
├─ package.json                    Node.js 선언과 start/demo/check/package-app 스크립트
├─ public/
│  ├─ index.html                   제공 페이지와 학생 표시 슬롯
│  └─ app.js                       제공 브라우저 앱과 로컬 API 호출
├─ student/
│  ├─ extension.mjs                학생 화면 확장
│  └─ engine-adapter.mjs           제공 엔진 기능을 학생 엔진에 연결하는 경계
├─ src/
│  ├─ server.mjs                   로컬 HTTP 서버, API, 실행 시 엔진 구성
│  ├─ engine.mjs                   기본·demo 엔진 로드
│  ├─ engine/sdp-host.mjs          서버 전용 SDP 조회·판정 경계
│  ├─ ai/service.mjs               서버 측 AI 서비스 경계
│  └─ connection/manager.mjs       서버 측 AI 앱 연결 관리자
├─ tools/
│  ├─ start-alekov.ps1             실행 전 검사와 로컬 서버 시작
│  └─ prepare-native-host.ps1       기본 실행에서 계정 연결용 로컬 설정 준비에 사용
└─ docs/
   ├─ STUDENT_LAUNCH_GUIDE.md       기존 실행 안내(덮어쓰지 않음)
   └─ STUDENT_RUNBOOK_21.md         이 21단계 보충 문서
```

**PowerShell은 `on-client` 폴더에서 엽니다.** 즉 `tools\start-alekov.ps1`, `package.json`, `src\server.mjs`가 그 작업 위치에서 보여야 합니다. 이 폴더의 실제 PC 경로는 학생이 파일 탐색기에서 확인해야 합니다. Git 최상위가 `on-client`와 같다는 뜻은 아닙니다. 저장소 최상위 위치를 이 문서에서 추정하지 않습니다.

## 3. 실행·정상 시작 신호·종료·재실행

### 일반 로컬 실행

1. 현재 편집 중인 파일을 저장하고, 새 PowerShell 창을 `on-client` 폴더에서 엽니다.
2. 다음 명령을 실행합니다.

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
   ```

3. 스크립트는 앱 폴더와 파일, Node.js 버전, 기본 포트 `5189`를 확인한 뒤 로컬 서버를 시작하고 서버 응답을 기다립니다. 기본 일반 실행은 `-Demo`가 아닙니다. 스크립트는 브라우저를 자동으로 열지 않습니다.
4. 서버 응답까지 확인되면 스크립트가 다음 형식의 안내를 출력합니다.

   ```text
   케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189/ 을 여세요.
   서버가 응답한 것만 확인했습니다. AI 연결 상태는 화면에서 따로 확인해 주세요.
   ```

   이는 로컬 URL의 HTTP 응답을 확인했다는 뜻입니다. 브라우저 기능 전체, SDP/XDR 연결, AI 승인·응답을 확인했다는 뜻은 아닙니다.
5. 브라우저에서 `http://127.0.0.1:5189/`을 엽니다. 화면이 뜨는지와 상단 상태 문구를 직접 확인합니다. 화면에서 연결 상태를 확인하지 않았다면 연결 성공으로 기록하지 않습니다.

포트 `5189`를 사용할 수 없다면 스크립트 안내에 따라 다른 포트로 실행합니다. 예를 들어 `5190`을 선택했다면 명령은 다음과 같고 브라우저 주소도 같은 포트여야 합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5190
```

포트 사용 중인 다른 프로그램을 강제 종료하지 않습니다.

### 예제 모드와 package.json 스크립트

화면의 예제 자료만 확인할 때는 다음 명령을 사용합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Demo
```

`npm run demo`도 `src/server.mjs --demo`를 시작합니다. 예제는 합성 자료이며 실제 로그인·SDP/XDR 연결 또는 성취 증거가 아닙니다. `npm start`는 `src/server.mjs`를 기본 인자로 시작합니다. `npm run check`는 `student/extension.mjs`의 Node 문법 검사만 수행하며, 앱 동작·화면 테스트가 아닙니다. 이 명령들은 코드에서 확인했으며 여기서는 실행하지 않았습니다. `npm run package-app`은 패키징 스크립트이고 일반 로컬 실행 명령이 아닙니다.

일반 실행 도구는 `-Demo`나 `-NoNativeHost`가 없고 설정 경로도 직접 지정하지 않은 경우, 사용자 프로필 안의 프로젝트별 경로에서 계정 연결용 로컬 설정을 준비·재사용하도록 되어 있습니다. 그 준비가 로그인·계정 승인·AI 요청을 실행하거나 원격 연결 성공을 입증하지는 않습니다. 이 스크립트 동작도 코드만 확인했으며 실제 사용자 프로필 변경은 수행하지 않았습니다.

### 종료와 재실행

시작 도구는 포그라운드 실행에서 `Ctrl+C`로 끄라고 안내하고, Node 프로세스가 끝날 때까지 기다립니다. 소스에서 Ctrl+C 발생 시 자식 프로세스를 명시적으로 종료하는 처리는 확인하지 못했습니다. 따라서 실제 종료 동작은 미확인입니다. 실행자가 직접 `Ctrl+C` 뒤 PowerShell 프롬프트로 돌아왔는지 확인하고, 서버가 더 이상 응답하는지도 확인해야 합니다. 포트가 계속 사용 중이면 다른 프로세스를 확인 없이 종료하지 않습니다.

서버 종료를 직접 확인한 뒤 같은 `on-client` 폴더와 같은 실행 명령으로 다시 시작합니다. 재실행 때도 스크립트가 안내한 포트와 브라우저 주소가 일치해야 합니다. 종료·재실행 결과는 실제로 확인하기 전까지 미확인입니다.

## 4. 시스템 구성도와 데이터 흐름

```text
[브라우저]
  public/index.html + public/app.js
  학생 표시: /student/extension.mjs
       │ same-origin HTTP (로컬 앱 API)
       ▼
[로컬 Node.js 앱 서버: src/server.mjs]
  ├─ 기본 엔진: disconnected
  ├─ --demo: 합성 예제 엔진(src/engine.mjs)
  ├─ 서버 실행자가 SDP 설정을 지정한 경우
  │    student/engine-adapter.mjs
  │       → 서버 전용 src/engine/sdp-host.mjs
  │       → 설정된 SDP HTTPS admission endpoint
  │          (접근 제어·XDR 원천; 현재 실제 endpoint는 문서화하지 않음)
  └─ AI 기능을 요청한 경우: 별도 서버 측 AI 경로
       src/ai/service.mjs / src/connection/manager.mjs
       → 설정·권한 확인 후 AI gateway
          코드의 공통 gateway origin: https://ai-classroom-gateway-production.up.railway.app
```

브라우저는 같은 로컬 앱 서버의 API를 호출합니다. SDP 자격 파일과 비밀을 브라우저로 보내는 구조로 설명하지 않습니다. SDP 원천 주소는 서버 전용 설정에서 결정되므로 프로젝트에서 현재 사용 중인 공개 주소를 확인할 수 없습니다. 문서에는 예시 주소를 실제 서버처럼 적지 않습니다.

AI gateway 주소는 `src/ai/connection.mjs`의 `CLCO_GATEWAY_ORIGIN` 상수에서 확인한 공개 origin입니다. 이는 코드에 선언된 주소일 뿐 현재 실행 환경에서 도달 가능하거나 계정·앱 권한이 승인됐거나 AI 요청이 성공했다는 결과가 아닙니다. 접속·비용이 발생할 수 있는 AI 요청은 여기서 하지 않았습니다.

## 5. 함수·제공 코드·입력 계약

| 영역 | 파일·함수 또는 경계 | 입력 계약과 역할 |
|---|---|---|
| 시작 | `tools/start-alekov.ps1` | `-Port`(1024~65535, 기본 5189), `-Demo`, `-Background`, `-NativeHostConfig`, `-NoNativeHost`, `-SdpHostConfig`, `-WaitSeconds`를 선언. 경로·버전·포트를 검사하고 서버 프로세스를 시작 |
| 로컬 서버 | `src/server.mjs`: `createOnServer()` 및 실행부 | 서버 실행 옵션은 서버 측에서 선택. CLI가 `--demo`, `--native-host-config`, `--sdp-host-config` 등을 처리. 브라우저 입력으로 엔진·설정 파일을 선택하지 않음. 서버는 `127.0.0.1`에 바인딩 |
| 엔진 | `src/engine.mjs`: `loadEngine(path, {hostCapability})`, `demoEngine()` | `loadEngine`은 서버가 선택한 어댑터 경로와 host capability를 받음. demo는 코드에 있는 합성 사용자·앱·기록을 돌려줌 |
| 학생 엔진 연결 | `student/engine-adapter.mjs`: `createEngine(host)` | 제공 host의 `projectId`, `readIdentity`, `readApps`, `decideAccess` 및 선택적 본인 범위 조회 메서드를 연결하는 어댑터 경계. 자체적으로 로그인이나 서버 자격을 만들지 않음 |
| SDP 조회·판정 | `src/engine/sdp-host.mjs`: `createSdpHostEngine()` | 내부 호출은 `readIdentity(call)`, `readApps(scope, call)`, `decideAccess({appId, requestId}, scope, call)`, 본인 범위의 `readEvents/readDevices/readSessions(scope, call)`. `scope`는 `subjectId`, `projectId`, `appId`, `audience`로 제한됨 |
| 브라우저 API | `src/server.mjs`, `public/app.js` | 제공 계약의 조회는 `GET /api/me`, `/api/apps`, `/api/events`, `/api/devices`, `/api/sessions`; 접근 판정은 `POST /api/access`의 `{appId}`. AI 점검은 `POST /api/ai/check`의 `{}`, 사건 설명은 `POST /api/ai/explain`의 `{eventId}`. API 실패를 성공 데이터로 취급하지 않음 |
| AI 연결 | `src/ai/connection.mjs`: `createAlekovAppConnector()`; `src/connection/manager.mjs`: `createConnectionManager()` | 서버 측 현재 계정 문맥과 앱 연결 흐름을 사용. 브라우저는 비밀 자격을 직접 입력하지 않음. 연결 승인·모델 점검·사건 설명은 서로 다른 단계이며, 한 단계의 결과가 다른 단계의 성공을 뜻하지 않음 |
| 학생 화면 | `student/extension.mjs`: `createStudentView()` 및 UI의 학생 표시 hook | `public/index.html`이 표시 영역으로 `renderIdentity`, `renderDecision`, `renderEvents`, `renderStatus`, `renderAiConnection`, `renderExplanation`, `renderVulnerabilities`, `renderAction`을 구분함. 제공 데이터 계약은 제공 브라우저 앱이 전달하며 이 단계에서는 수정하지 않음 |

`src/engine/sdp-host.mjs`의 실제 판정 값은 `allow`, `deny`, `challenge`입니다. 상위 API 계약에서 추가 `unknown`은 확인 불가 상태이지 허용이 아닙니다. 관련 표시 상태에는 기기 `compliant`/`noncompliant`/`unknown`, 세션 `active`/`expired`/`revoked`/`unknown`이 있습니다. 모드 `connected`는 어댑터 구성 모드이고 원격 호출별 검증 결과와 다릅니다. `demo`는 합성 자료, `disconnected`는 기본 연결 확인 불가 모드입니다.

학생 hook의 상세 데이터 필드와 각 버튼 동작은 기존 `public/app.js` 및 학생 모듈 계약을 따릅니다. 이 문서 작성 중 이를 바꾸는 입력 필드·버튼·상태를 새로 만들지 않았습니다.

## 6. 장애별 확인 순서와 복구

| 증상·코드 | 확인 순서 | 복구 범위 |
|---|---|---|
| `앱 폴더가 아닙니다` 또는 잘못된 시작 틀 메시지 | 현재 작업 위치가 `on-client`인지, `package.json`과 `src/server.mjs`가 있는지 확인 | 올바른 기존 프로젝트 폴더에서 다시 실행. 파일을 이동·삭제하지 않음 |
| Node.js 없음/버전 메시지 | 새 PowerShell에서 `node --version`; 선언 버전 `24.19.0`과 시작 도구 허용 범위를 확인 | 담당 설치 안내에 따라 버전을 맞추고 새 PowerShell에서 재확인. 설치 결과는 이 문서에서 미확인 |
| 포트 사용 중 | 시작 스크립트가 표시한 포트와 주소 확인 | 다른 프로세스를 종료하지 말고 `-Port 5190` 등 사용 가능한 포트를 지정한 뒤 같은 포트 주소 사용 |
| 브라우저가 `127.0.0.1`에 연결하지 못함 | PowerShell의 서버 출력·프로세스 종료 여부·주소 포트 일치 확인 | 서버가 실행 중인지 확인한 뒤 명시된 명령으로 다시 실행. 연결이 안 되면 성공으로 처리하지 않음 |
| `ENGINE_NOT_CONNECTED` | 화면 모드와 기본 실행 여부를 확인. 기본 엔진은 연결을 확인하지 못하는 상태 | 담당자의 승인된 연결 설정 안내만 따름. 임의 신원·응답을 만들어 넣지 않음 |
| `ENGINE_ADAPTER_INVALID`, `ENGINE_RESULT_UNVERIFIED`, `SUBJECT_SCOPE_UNVERIFIED` | 어댑터 형식, 원천 응답 형식, 사용자·프로젝트 범위를 확인 | 정상 결과로 바꾸지 말고 오류 코드를 담당자에게 전달. 제공 코드·인증 설정을 임의 변경하지 않음 |
| `ENGINE_TIMEOUT`, `REQUEST_CANCELLED` | 해당 요청의 시간 초과 또는 취소 상태를 확인 | 결과가 확인되지 않으면 성공·효과 없음으로 단정하지 않음. 자동 재시도를 가정하지 않음 |
| AI 권한·게이트웨이 오류 | 화면의 정확한 상태 코드와 도움정보를 확인하고 담당자에게 앱 이용 권한 문의 | 브라우저에 키·토큰을 입력하지 않음. 유료 AI 요청이나 재시도는 승인된 화면에서 사용자가 직접 판단 |

시작 도구의 서버 응답 확인과 `ENGINE_NOT_CONNECTED`는 서로 다른 상태입니다. 서버가 켜져도 SDP·AI 시스템이 연결되지 않을 수 있습니다. 실행 오류의 실제 재현과 복구는 아직 확인하지 않았습니다.

## 7. 21·22단계 원문 제출 경계

서버 측 21단계 검토는 커밋에 포함된 README·학생 문서·글로 쓴 구성도·실행 파일·설정 견본을 읽어 문서가 코드와 맞는지 판정합니다. 서버가 문서의 명령을 실행하는 것은 아닙니다. 따라서 코드 읽기, 문서에 적은 예상 결과, 학생이 직접 실행해 본 결과를 구분해 기록합니다.

학생 문서와 해당 단계 코드는 같은 커밋에 저장합니다. Git에 이미 준비 중인 다른 변경이 있으면 먼저 내용을 확인하고 보존합니다. 21·22단계는 과제 화면에 저장소 주소와 해당 커밋의 40자리 해시를 직접 입력합니다. 비공개 저장소를 공개로 바꿀 필요는 없습니다.

비공개 저장소의 원문 준비는 과제 화면의 해당 단계 **「비공개 저장소 원문 준비 방법」**을 펼쳐 **「원문 전달 도구 받기」**를 사용합니다. ZIP을 프로젝트 밖에 풀고 JSON 출력용 새 폴더도 프로젝트 밖에 준비합니다. 제출할 프로젝트의 Git 최상위 폴더에서 PowerShell을 열어, 화면에 표시되는 `student-source-cli.mjs` 명령을 따릅니다. 도구·JSON 경로를 실제 PC 경로로 지정하고 `--commit`에 제출할 40자리 커밋을 넣습니다. 현재 PC의 저장소 경로·커밋 및 과제 화면의 도구 명령은 여기서 확인할 수 없으므로 명령을 만들어 적지 않았습니다. 도구는 커밋된 원문을 묶으며 학생 코드를 실행하거나 업로드하지 않습니다.

생성 JSON을 같은 단계의 **「비공개 저장소 원문 묶음」**에 선택하고 저장소·커밋·단계를 확인한 뒤 제출합니다. 원문 전달 완료는 AI 검토 통과가 아닙니다. 서버 상태와 판정 설명을 확인합니다. 원문 전달만 실패하면 기존 접수를 유지하고 해당 화면의 **「원문만 다시 보내기」**를 사용합니다. 이 문서 작성자는 Git 상태 확인·커밋·제출을 수행하지 않았습니다.

## 8. 확인 기록과 미확인 항목

| 구분 | 결과 |
|---|---|
| 코드 읽기로 확인 | 파일 경로, 함수·경계, 실행 파라미터, Node 버전 선언, API 주요 입력, 모드·상태값, loopback 주소, AI gateway 상수 |
| 실제 실행으로 확인 | 없음 |
| 브라우저 화면으로 확인 | 없음 |
| 외부 연결·AI 요청으로 확인 | 없음. 실제 SDP/XDR, 계정 승인, AI 권한·응답·비용 발생은 수행하지 않음 |
| 미확인 | 설치된 Node·PowerShell·브라우저 버전, 새 PowerShell 실행·종료·재실행, 브라우저 표시와 키보드 조작, 실제 HTTP 응답, 포트 충돌 복구, 현재 SDP endpoint·계정 권한·AI 연결 |
| PC/저장소별 입력이라 여기서 정할 수 없음 | 실제 프로젝트 절대 경로, Git 최상위 경로, 저장소 주소, 현재 Git 변경, 제출할 커밋 해시, 과제 화면에서 내려받는 원문 도구의 실제 경로 |

지원하지 않거나 실행해 보지 않은 환경의 동작을 확인된 사실처럼 보장하지 않습니다.
