# KESHEV 학생 실행 설명서와 시스템 구성도

> 이 문서는 현재 저장소의 코드와 설정 파일을 읽어 작성한 실행 안내입니다. 작성자가 이 문서의 명령을 실행하거나 실제 PC·SDP 서버·XDR 시스템·AI 게이트웨이에 연결해 확인한 것은 아닙니다. 실제 환경에서 확인하지 않은 항목은 아래에서 미확인으로 표시합니다.

## 1. 목적과 기능

KESHEV는 브라우저에서 사용하는 로컬 학생용 보안 Agent 프로젝트입니다. 제공 서버와 화면은 로그인·기기·세션 정보, 업무 앱, 접근 판정, 본인 범위의 접속/XDR 기록 및 상태 조회를 위한 API 경계를 제공합니다. 학생 화면 구현은 `student/extension.mjs`의 `createStudentView()`에 있습니다. 서버가 제공하지 않은 연결이나 데이터를 화면에서 성공으로 추정하지 않습니다.

현재 코드에는 다음 실행 모드가 있습니다.

| API 모드 | 의미 |
|---|---|
| `disconnected` | 기존 서버/에이전트 연결을 확인할 수 없음. 기본 실행 모드입니다. |
| `demo` | 연습용 합성 데이터. 실제 계정이나 서버 연결의 증거가 아닙니다. `--demo`로 실행합니다. |
| `connected` | 서버 측 엔진 어댑터가 설정된 상태입니다. 설정됨만으로 원격 서버 응답이나 실제 접속 성공이 입증되는 것은 아닙니다. |

접근 판정 API 상태값은 `allow`, `deny`, `challenge`, `unknown`입니다. `allow`는 서버 정책 판정이지 실제 업무 앱 접속 성공 보장이 아니며, `challenge`는 추가 확인이 필요하다는 뜻입니다. 오류·연결 실패·`unknown`을 허용으로 해석하지 마세요.

## 2. 지원 환경과 버전

- 실행 안내는 **Windows PowerShell**과 `tools/start-alekov.ps1`을 기준으로 합니다. 이 PowerShell 도구는 Windows 경로, 프로세스 및 포트 확인을 사용합니다. 다른 운영체제에서 같은 실행 절차가 동작하는지는 확인하지 않았습니다.
- `package.json`의 `engines.node` 값은 정확히 `24.19.0`입니다. 반면 PowerShell 시작 도구는 Node.js 메이저 버전 22~24를 허용하고 `24.19.0`을 권장합니다. 이 두 계약의 차이를 알리고, 수업 기준 버전인 Node.js `24.19.0` 사용을 권장합니다.
- 실제 설치된 Node.js·PowerShell·브라우저 버전은 이 문서 작성 중 실행해 확인하지 않았습니다. 시작 도구는 실행 시 Node.js 버전과 포트를 확인하지만, 그 결과는 실행자가 직접 확인해야 합니다.
- `package.json`에는 `start`, `demo`, `check`, `package-app` 스크립트가 정의되어 있고 런타임 의존성 목록은 선언되어 있지 않습니다. 프로젝트 파일 검색에서 잠금 파일을 찾지 못했습니다. 이 실행 안내는 패키지 설치를 전제로 하지 않으며 `npm install`을 실행하라고 안내하지 않습니다.
- Node.js 공식 배포처: <https://nodejs.org>. 설치 여부와 버전은 새 PowerShell 창에서 `node --version`으로 직접 확인할 수 있습니다. 이 명령은 여기서 실행하지 않았습니다.

## 3. 실제 폴더 구조와 작업 위치

아래 경로는 프로젝트의 `on-client` 폴더를 기준으로 적었습니다. 저장소 최상위 폴더의 이름이나 사용자의 PC상 절대 경로는 이 문서에서 특정하지 않습니다.

```text
on-client/
├─ package.json                  # Node 버전 계약과 npm 스크립트
├─ public/
│  ├─ index.html                 # 제공 브라우저 문서
│  └─ app.js                     # 제공 UI의 API 호출·상태 처리·학생 모듈 로드
├─ src/
│  ├─ server.mjs                 # 로컬 HTTP 서버, API 라우트와 서버 측 구성
│  ├─ engine.mjs                 # 엔진 로드·기본 disconnected·demo 엔진
│  ├─ engine/sdp-host.mjs        # 서버 전용 SDP 조회 경계
│  └─ ai/service.mjs             # 서버 측 AI 서비스
├─ student/
│  ├─ extension.mjs              # 학생 화면의 createStudentView()
│  └─ engine-adapter.mjs         # 제공 host 기능의 학생 어댑터 경계
├─ tools/
│  └─ start-alekov.ps1           # Windows 실행 전 검사와 로컬 서버 시작
└─ docs/
   └─ STUDENT_RUNBOOK.md         # 이 학생 실행 설명서
```

**PowerShell 작업 위치:** 프로젝트 안의 `on-client` 폴더입니다. 파일 탐색기에서 실제 프로젝트 경로의 `on-client` 폴더를 열어 주소 표시줄의 실제 위치를 확인한 다음, 그 폴더에서 PowerShell을 엽니다. 예상 작업 경로는 `…\on-client`이고 시작 스크립트의 실제 상대 경로는 `tools\start-alekov.ps1`입니다. `…`는 설명용 표기이며 실행 가능한 절대 경로가 아닙니다.

## 4. 실행·확인·종료·재실행

### 일반 실행

1. 현재 편집 중인 프로젝트 파일을 저장합니다. 이 절차는 파일을 지우거나 갱신하지 않습니다.
2. **새 PowerShell 창**을 `on-client` 폴더에서 엽니다. 현재 프로젝트의 실제 폴더 경로가 맞는지 확인합니다.
3. 아래 명령을 실행합니다.

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1
   ```

   `-ExecutionPolicy Bypass`는 시작 도구가 안내하는 이 한 번의 실행 옵션입니다. 시작 스크립트는 폴더 구성, Node.js, 기본 포트 `5189`를 점검하고 Node 서버를 시작합니다. 프로그램 설치, 기존 포트를 사용하는 프로세스 종료, AI 연결 성공 확인을 하지는 않습니다. 기본 포트를 다른 프로그램이 사용하면 그 프로세스를 종료하지 말고 스크립트의 안내를 확인하세요. 필요하면 포트를 바꾸어 실행할 수 있습니다.

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Port 5190
   ```

4. 브라우저에서 다음 주소를 직접 엽니다. 시작 도구가 브라우저를 자동으로 여는 것은 아닙니다.

   ```text
   http://127.0.0.1:5189/
   ```

   `-Port 5190`으로 시작했다면 주소도 `http://127.0.0.1:5190/`입니다. 서버는 loopback 주소 `127.0.0.1`에서 수신합니다.

5. 시작 도구가 `케셰브가 켜졌습니다. 브라우저에서 http://127.0.0.1:5189 을 여세요.`와 서버 응답 확인 안내를 표시하면 로컬 서버가 HTTP 응답을 한 것입니다. 이는 브라우저 화면의 기능 전체, SDP/XDR 연결, AI 권한 또는 실제 AI 응답을 확인했다는 뜻이 아닙니다. 페이지의 실행 모드와 각 API 상태를 따로 확인하세요.

### 예제 데이터 실행

학생 자료 흐름을 합성 예제로 살펴볼 때만 `-Demo`를 지정합니다.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\start-alekov.ps1 -Demo
```

기본 주소는 `http://127.0.0.1:5189/`입니다. `demo` 상태와 예제 자료를 실제 연결로 취급하지 마세요. `-Demo`와 `-SdpHostConfig`는 함께 사용할 수 없습니다.

### 종료 및 재실행

시작 도구는 포그라운드 실행 시 이 창에서 `Ctrl+C`를 누르라고 안내합니다. 이 안내와 달리, 스크립트에는 중단 시 자식 Node 프로세스를 명시적으로 정리하는 종료 처리 코드가 보이지 않습니다. **`Ctrl+C` 후 PowerShell 프롬프트로 돌아왔는지, 브라우저가 더 이상 해당 서버 응답을 받지 않는지 직접 확인하세요.** 포트가 계속 사용 중이면 작업 관리자에서 실행 경로를 확인하지 않은 채 프로세스를 종료하지 마세요. 자신이 시작한 해당 프로젝트의 Node 프로세스임을 확인한 경우에만 담당 지침에 따라 정리합니다.

서버가 종료된 것을 확인한 뒤 같은 `on-client` 작업 위치에서 같은 시작 명령을 다시 실행하고, 시작 도구가 안내한 포트의 브라우저 주소를 엽니다. 포트가 점유된 경우 시작 도구의 오류 안내에 따라 다른 포트를 지정하고 브라우저 주소도 일치시킵니다. 실제 종료·재실행은 문서 작성자가 시험하지 않았습니다.

### 설정과 비밀 정보

기본 실행은 실제 SDP 연결을 보장하지 않습니다. `src/server.mjs`는 SDP 호스트 설정이 제공되면 서버 전용 `sdpHostEngine`과 학생 어댑터를 구성할 수 있고, AI 서비스는 별도 서버 측 설정·권한에 의존합니다. 설정 파일 경로나 값을 이 문서에 추측해 쓰지 않았습니다. 토큰·비밀번호·API 키·인증서는 저장소 문서나 제출 파일에 적지 말고 제출에서 제외되는 비밀 설정 파일에만 보관하세요. 현재 PC의 실제 설정 여부와 연결 성공은 미확인입니다.

## 5. 글로 쓴 시스템 구성도

```text
[브라우저]
  public/index.html
       │
       ├─ public/app.js: 제공 UI, 로컬 HTTP API 요청, 응답 계약 확인
       └─ /student/extension.mjs: createStudentView() 학생 화면
       │  HTTP: same-origin, 로컬 loopback
       ▼
[on-client/src/server.mjs — 로컬 Node.js 앱 서버, 127.0.0.1:<포트>]
       ├─ 기본 엔진(disconnected): 연결 확인 불가 상태 반환
       ├─ --demo: src/engine.mjs의 합성 연습 자료 반환 (실제 원천과 연결 안 됨)
       ├─ 설정된 경우: student/engine-adapter.mjs
       │       → 서버가 제공한 본인 범위 기능만 호출
       │       → src/engine/sdp-host.mjs
       │       → 설정된 SDP 접근 제어/XDR 시스템 endpoint
       └─ 별도 사용자 요청이 있을 때만 AI 관련 API
               → src/ai/service.mjs 등 서버 측 AI 서비스 경계
               → 설정·권한이 충족된 경우에만 AI 게이트웨이
```

브라우저는 SDP·AI 비밀 자격 증명을 직접 받는 구성으로 문서화하지 않았습니다. 접근 제어/XDR 조회와 AI 게이트웨이는 서로 다른 서버 측 경로입니다. AI 연결 점검은 모델 응답 점검 경로이며 사건 설명과 같지 않고, AI 설정이 있다는 것만으로 이용 권한이나 원천 시스템 연결 성공이 확인되지 않습니다. `connected` 표시는 어댑터 모드이며, 각 호출의 검증된 결과를 대신하지 않습니다. 외부 endpoint의 공개 주소·현재 운영 연결 상태는 저장소 코드만으로 확인되지 않아 적지 않았습니다.

## 6. 제공 코드·학생 코드·입력 계약·확인 상태

| 범위 | 실제 파일/함수 | 입력 또는 계약 | 코드에서 확인한 동작과 한계 |
|---|---|---|---|
| 제공 브라우저 앱 | `public/app.js`의 `request()`, `loadResource()`, `loadStudentModule()` | same-origin API. API 응답의 모드와 자료 형식을 검사하고 `/student/extension.mjs`를 로드 | 상태 오류·형식 불일치를 성공으로 보정하지 않음. 실제 브라우저 화면 검증은 미실시 |
| 학생 화면 | `student/extension.mjs`의 `createStudentView()` 및 `renderIdentity()`, `renderDecision()`, `renderEvents()`, `renderStatus()`, `renderAiConnection()`, `renderExplanation()` | 제공 화면이 전달한 상태·데이터 객체 | DOM `createElement`/`textContent`, label·button 등을 사용. 화면 코드 읽기만 확인했고 실제 키보드·브라우저 조작은 미실시 |
| 엔진 로드 | `src/engine.mjs`의 `loadEngine()`, `engineMethod()`, `demoEngine()` | 서버 실행 설정; 기본 `disconnected`, 명시 `--demo` | demo 자료는 합성. 실제 SDP 연결 성공은 확인하지 않음 |
| 학생 어댑터 | `student/engine-adapter.mjs`의 `createEngine(host)` | `projectId`, `readIdentity`, `readApps`, `decideAccess`; 선택적 본인 범위 `readEvents`, `readDevices`, `readSessions` | 전달된 host 기능을 감싸며 그 자체가 인증·원천 연결을 만들지 않음 |
| 접근 제어/XDR 경계 | `src/server.mjs`, `src/engine/sdp-host.mjs`의 `createSdpHostEngine()` | API 입력: 접근 판정 `{appId}`; 기록·기기·세션 조회는 현재 사용자 범위 | 서버 전용 호스트 설정과 원천 응답 검증이 필요. 원격 서버 실행·연결은 미확인 |
| AI 경계 | `src/server.mjs`, `src/ai/service.mjs`; 화면 입력 `POST /api/ai/check`의 `{}`, `POST /api/ai/explain`의 `{eventId}` | 서버가 요청을 받아 AI 서비스에 전달. 점검과 사건 설명은 분리 | 점검 성공은 사건 설명 실행을 뜻하지 않음. 유료 AI 요청·실제 게이트웨이 접속은 실행하지 않았고 미확인 |
| 시작 도구 | `tools/start-alekov.ps1` | `-Port`(기본 `5189`), `-Demo`, 선택적 서버 설정 경로 | 폴더·Node 메이저 버전·포트를 확인하고 서버가 응답할 때까지 기다리는 코드 확인. 실제 PowerShell 실행은 미실시 |

API 입력·출력 구조의 기준은 `src/server.mjs`의 라우트와 `src/engine.mjs` 및 어댑터 계약입니다. 특히 HTTP 성공 응답은 엔진 연결, AI 승인 또는 실제 효과 확인과 같은 의미가 아닙니다. 현재 확인 가능한 코드 범위 밖의 서버 endpoint·계정 권한·운영 판정은 지원된다고 단정하지 않습니다.

## 7. 장애별 확인 순서와 복구

| 화면/오류 | 확인 순서 | 복구·주의 |
|---|---|---|
| 시작 도구가 앱 폴더가 아니라고 안내 | 현재 PowerShell 위치가 `on-client`인지, `package.json`과 `src/server.mjs`가 있는지 확인 | 프로젝트 파일을 옮기거나 지우지 말고 실제 프로젝트 `on-client`에서 명령을 다시 실행 |
| Node 버전 오류 | 새 PowerShell에서 `node --version`; 프로젝트의 `package.json`과 시작 도구의 허용 범위 비교 | 권장 기준 `24.19.0`. 도구가 허용하지 않는 버전이면 안내에 따라 Node 버전을 맞춘 뒤 새 창에서 재실행 |
| 포트 점유 안내 | 오류에 표시된 포트와 실제 실행 중인 서버를 확인 | 다른 프로그램을 종료하지 말고 `-Port 5190`처럼 사용 가능한 포트를 명시한 뒤 해당 포트 URL을 엶 |
| 브라우저에서 로컬 서버에 연결할 수 없음 또는 `TIMEOUT` | 시작 PowerShell의 오류·종료 여부, 포트, 주소의 `127.0.0.1` 및 포트 일치를 확인 | 서버 시작 여부를 확인하고 동일 명령으로 수동 재시도. 응답이 없으면 연결 성공으로 판단하지 않음 |
| `ENGINE_NOT_CONNECTED` | 화면 모드가 `disconnected`인지 확인하고 기존 서버/에이전트 연결 설정과 제공 어댑터 구성을 담당 안내에 따라 확인 | 기본 모드는 연결 없음입니다. 임의의 로그인·기기값을 만들거나 demo 결과를 실제 연결로 바꾸지 않음 |
| `ENGINE_ADAPTER_INVALID`, `ENGINE_RESULT_UNVERIFIED`, `SUBJECT_SCOPE_UNVERIFIED` | 어댑터 형식, 원천 응답 계약, 현재 사용자·프로젝트 범위가 일치하는지 확인 | 판정 또는 자료를 정상으로 간주하지 않음. 제공 코드·인증 설정을 임의 변경하지 말고 담당자에게 오류 코드 전달 |
| AI 설정·권한·모델 또는 시간 초과 오류 | AI 연결 점검 화면의 정확한 상태 코드와 안내를 확인하고 계정·앱 이용 권한은 담당자에게 확인 | 자동 재시도나 권한 발급을 가정하지 않음. 유료 AI 요청은 사용자가 승인된 화면에서만 직접 실행 |

원문 오류 처리에는 `ENGINE_NOT_CONNECTED`, `ENGINE_ADAPTER_INVALID`, `ENGINE_RESULT_UNVERIFIED`, `ENGINE_TIMEOUT`, `SUBJECT_SCOPE_UNVERIFIED`, `APP_NOT_FOUND`, `REQUEST_CANCELLED` 등이 있습니다. 서버는 외부 입력을 정해진 안전 메시지·오류 코드로 투영할 수 있습니다. 위 표는 코드에 있는 경계를 바탕으로 한 수동 확인 안내이며, 실제 장애 재현·복구 성공을 뜻하지 않습니다.

## 8. 21·22단계 제출 경계

이 단계의 서버 검토는 같은 커밋의 README·학생 문서·글로 쓴 구성도·실행 파일·설정 견본을 읽어 설명이 코드와 맞는지 판정합니다. 서버가 문서의 명령을 실행해 확인하는 것은 아닙니다. 문서에 실행 성공·AI 연결 성공·검토 통과를 사실처럼 적지 마세요.

- 학생 문서와 해당 단계 코드를 같은 커밋에 저장합니다. 이미 준비 중인 Git 변경이 있으면 먼저 변경 내용을 확인하고 보존합니다. 이 문서 작성자는 Git 상태를 읽거나 커밋하지 않았으며 커밋 해시는 없습니다.
- 21·22단계는 과제 화면에서 저장소 주소와 해당 커밋의 40자리 해시를 직접 입력합니다. 비공개 저장소를 공개로 바꾸지 않습니다.
- 비공개 저장소라면 과제 화면의 해당 단계 **‘비공개 저장소 원문 준비 방법’**을 열고 **‘원문 전달 도구 받기’**를 사용합니다. ZIP과 JSON 출력 폴더는 제출 프로젝트 밖에 둡니다.
- `student-source-cli.mjs`의 구체적인 호출 구문은 과제 화면의 안내를 그대로 따릅니다. 이 저장소에서는 해당 도구를 찾지 못했고, 사용자의 절대 프로젝트 경로와 제출 커밋도 알 수 없어 여기서 실행 명령을 만들어내지 않습니다. 과제 화면 명령에 실제 프로젝트 Git 최상위 경로·도구/JSON 경로·제출할 40자리 커밋을 확인해 넣고, **프로젝트 Git 최상위 폴더**에서 PowerShell로 실행합니다. 도구는 커밋된 원문을 묶는 것이며 학생 코드를 실행하거나 업로드하지 않습니다.
- 생성 JSON을 같은 단계의 **‘비공개 저장소 원문 묶음’**에서 고르고 저장소·커밋·단계를 대조한 뒤 제출합니다. 원문 전달 완료는 AI 검토 통과가 아닙니다. 서버 상태와 판정 설명을 확인합니다. 원문 전달만 실패한 경우 과제 화면의 **‘원문만 다시 보내기’** 절차를 따릅니다.

## 9. 확인 상태와 지원 범위

| 구분 | 현재 상태 |
|---|---|
| 코드 읽기로 확인 | 파일 경로, 주요 함수, API 입력 계약, 모드·판정 상태값, 서버의 loopback 주소, PowerShell 시작 스크립트의 검사 순서 |
| 문서에 적힌 버전 계약 | `package.json`의 Node `24.19.0`; 시작 도구의 Node 22~24 허용 및 `24.19.0` 권장 |
| 실행하지 않아 미확인 | Node·PowerShell·브라우저 실제 버전, 새 PowerShell 창에서의 시작·종료·재실행, 브라우저 화면·키보드 조작, 실제 HTTP API 응답, 포트 충돌 복구 |
| 연결·운영을 하지 않아 미확인 | 실제 접근 제어/XDR 서버, 실제 로그인과 권한, AI 게이트웨이·모델 응답, 유료 요청, 보안 조치, 단계 제출 및 AI 판정 결과 |
| 이 프로젝트에서 확인하지 못한 것 | `student-source-cli.mjs`, 잠금 파일, 사용자의 PC 절대 경로, 저장소 주소, 현재 Git 상태와 40자리 커밋 |

지원하지 않거나 검증하지 않은 환경에서의 동작을 보장하지 않습니다. 구현 코드·합성 자료를 읽은 것과 실제 화면·원격 시스템에서 동작한 것은 별개입니다.
