// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  const eventFilters = { kind: 'all', appId: 'all', access: 'all' };
  let selectedEventId = null;
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };
      const modeLabel = (mode) => {
        if (mode === 'demo') return '예제 자료';
        if (mode === 'disconnected') return '연결 없음';
        if (mode === 'unknown') return '확인 불가';
        if (mode === 'connected') return '연결됨';
        return '확인 불가';
      };
      const deviceStatus = (status) => {
        if (status === 'compliant') return '보안 기준 충족 (compliant)';
        if (status === 'noncompliant') return '보안 기준 미충족 (noncompliant)';
        if (status === 'unknown') return '확인 불가 (unknown)';
        return `확인 불가 (${String(status)})`;
      };
      const sessionStatus = (status) => {
        if (status === 'active') return '활성 (active)';
        if (status === 'expired') return '만료 (expired)';
        if (status === 'revoked') return '철회됨 (revoked)';
        if (status === 'unknown') return '확인 불가 (unknown)';
        return `확인 불가 (${String(status)})`;
      };
      const renderResource = (title, resource, renderData) => {
        const section = document.createElement('section');
        appendText(section, 'h3', title);
        appendText(section, 'p', `연결 상태: ${modeLabel(resource?.mode)}`);

        if (!resource || resource.status === 'loading') {
          appendText(section, 'p', '불러오는 중');
        } else if (resource.status === 'error') {
          const code = resource.error?.code;
          const message = typeof resource.error?.message === 'string' && resource.error.message
            ? resource.error.message
            : '오류 메시지가 제공되지 않았습니다.';
          const label = code === 'CONTRACT_MISMATCH' || code === 'ENGINE_RESULT_UNVERIFIED'
            ? '확인 불가'
            : '연결 실패';
          appendText(section, 'p', `${label}: ${message}`);
        } else if (resource.status === 'ok') {
          renderData(section, resource.data);
        } else {
          appendText(section, 'p', '확인 불가: 상태를 확인할 수 없습니다.');
        }
        root.append(section);
      };

      renderResource('현재 로그인 사용자·기기·세션', me, (section, data) => {
        if (!data?.user || !data?.device || !data?.session) {
          appendText(section, 'p', '확인 불가: 사용자·기기·세션 정보를 확인할 수 없습니다.');
          return;
        }
        appendText(section, 'p', `사용자: ${data.user.label} (ID: ${data.user.id})`);
        appendText(section, 'p', `현재 기기: ${data.device.label} (ID: ${data.device.id}) — ${deviceStatus(data.device.status)}`);
        appendText(section, 'p', `현재 세션 ID: ${data.session.id} — ${sessionStatus(data.session.status)}`);
      });

      renderResource('기기 목록', devices, (section, data) => {
        if (!Array.isArray(data)) {
          appendText(section, 'p', '확인 불가: 기기 목록을 확인할 수 없습니다.');
          return;
        }
        if (data.length === 0) {
          appendText(section, 'p', '목록에 기기가 없습니다.');
          return;
        }
        const list = document.createElement('ul');
        for (const device of data) {
          appendText(list, 'li', `${device.label} (ID: ${device.id}) — ${deviceStatus(device.status)}`);
        }
        section.append(list);
      });

      renderResource('세션 목록', sessions, (section, data) => {
        if (!Array.isArray(data)) {
          appendText(section, 'p', '확인 불가: 세션 목록을 확인할 수 없습니다.');
          return;
        }
        if (data.length === 0) {
          appendText(section, 'p', '목록에 세션이 없습니다.');
          return;
        }
        const list = document.createElement('ul');
        for (const session of data) {
          appendText(list, 'li', `세션 ID: ${session.id} — ${sessionStatus(session.status)}`);
        }
        section.append(list);
      });

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = value;
        parent.append(node);
        return node;
      };
      const selectedAppId = typeof data?.appId === 'string' && data.appId
        ? data.appId
        : typeof appId === 'string' && appId ? appId : null;
      const appendAppId = () => {
        if (selectedAppId) appendText(root, 'p', `업무 앱 ID: ${selectedAppId}`);
      };

      if (status === 'idle') {
        appendText(root, 'p', '업무 앱을 선택한 뒤 접속을 요청하세요.');
        return root;
      }
      if (status === 'loading') {
        appendAppId();
        appendText(root, 'p', '판정 확인 중입니다.');
        return root;
      }
      if (status === 'error') {
        appendAppId();
        const message = typeof error?.message === 'string' && error.message
          ? error.message
          : '오류 메시지가 제공되지 않았습니다.';
        appendText(root, 'p', `요청 실패: ${message} 접근 거부 판정이 아닙니다.`);
        return root;
      }
      if (status !== 'ok') {
        appendText(root, 'p', '확인 불가: 판정 상태를 확인할 수 없습니다.');
        return root;
      }

      appendAppId();
      const decisionLabels = {
        allow: '정책상 접근 허용(allow). 실제 앱 접속 성공을 보장하지 않습니다.',
        deny: '접근 거부(deny)',
        challenge: '추가 인증 또는 확인 필요(challenge). 이 앱은 추가 확인 절차를 대신 수행하지 않습니다.',
        unknown: '확인 불가(unknown)',
      };
      const decision = Object.hasOwn(decisionLabels, data?.decision)
        ? decisionLabels[data.decision]
        : decisionLabels.unknown;
      appendText(root, 'p', decision);
      appendText(root, 'p', `판정 이유: ${typeof data?.reason === 'string' ? data.reason : '제공되지 않았습니다.'}`);
      appendText(root, 'p', `판정 시각: ${typeof data?.checkedAt === 'string' && data.checkedAt ? data.checkedAt : '확인 불가'}`);
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };

      if (status === 'loading') {
        selectedEventId = null;
        appendText(root, 'p', '기록을 불러오는 중입니다.');
        return root;
      }
      if (status === 'error') {
        selectedEventId = null;
        const message = typeof error?.message === 'string' && error.message
          ? error.message
          : '오류 메시지가 제공되지 않았습니다.';
        const label = error?.code === 'CONTRACT_MISMATCH' || error?.code === 'ENGINE_RESULT_UNVERIFIED'
          ? '확인 불가'
          : '기록을 불러오지 못했습니다';
        appendText(root, 'p', `${label}: ${message}`);
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        selectedEventId = null;
        appendText(root, 'p', '확인 불가: 기록 상태 또는 응답 형식을 확인할 수 없습니다.');
        return root;
      }
      if (data.length === 0) {
        selectedEventId = null;
        appendText(root, 'p', '표시할 기록이 없습니다');
        return root;
      }

      const sortedEvents = [...data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      if (selectedEventId !== null && !sortedEvents.some((event) => event.id === selectedEventId)) {
        selectedEventId = null;
      }
      const filterDefinitions = [
        {
          key: 'kind', label: '기록 종류', values: [...new Set(sortedEvents.map((event) => event.kind))],
          describe: (value) => value === 'access' ? '접속 기록 (access)' : value === 'xdr' ? 'XDR 경보 (xdr)' : String(value),
        },
        {
          key: 'appId', label: '업무 앱', values: [...new Set(sortedEvents.map((event) => event.appId).filter((value) => typeof value === 'string' && value))],
          describe: (value) => value,
        },
        {
          key: 'access', label: '접속 상태', values: [...new Set(sortedEvents.map((event) => event.state.access))],
          describe: (value) => {
            const labels = { allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' };
            return `${labels[value] || '확인 불가'} (${value})`;
          },
        },
      ];

      for (const definition of filterDefinitions) {
        if (eventFilters[definition.key] !== 'all' && !definition.values.includes(eventFilters[definition.key])) {
          eventFilters[definition.key] = 'all';
        }
        const label = document.createElement('label');
        label.setAttribute('for', `student-event-filter-${definition.key}`);
        label.textContent = definition.label;
        const select = document.createElement('select');
        select.id = `student-event-filter-${definition.key}`;
        select.setAttribute('aria-label', definition.label);
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '전체';
        select.append(allOption);
        for (const value of definition.values) {
          const option = document.createElement('option');
          option.value = String(value);
          option.textContent = definition.describe(value);
          select.append(option);
        }
        select.value = eventFilters[definition.key];
        select.addEventListener('change', () => {
          eventFilters[definition.key] = select.value;
          const updated = this.renderEvents({ status, mode, data, error });
          root.replaceWith(updated);
        });
        root.append(label, select);
      }

      const filteredEvents = sortedEvents.filter((event) =>
        (eventFilters.kind === 'all' || event.kind === eventFilters.kind)
        && (eventFilters.appId === 'all' || event.appId === eventFilters.appId)
        && (eventFilters.access === 'all' || event.state.access === eventFilters.access));
      if (selectedEventId !== null && !filteredEvents.some((event) => event.id === selectedEventId)) {
        selectedEventId = null;
      }
      appendText(root, 'p', `표시 건수: ${filteredEvents.length} / ${sortedEvents.length}`);
      if (filteredEvents.length === 0) {
        appendText(root, 'p', '선택한 조건에 해당하는 기록이 없습니다.');
        return root;
      }

      const stateDescriptions = {
        access: { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가(unknown)' },
        session: { active: '활성', expired: '만료', revoked: '회수됨', unknown: '확인 불가(unknown)' },
        device: { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가(unknown)' },
      };
      const renderDetail = (event, detail) => {
        appendText(detail, 'h4', `${event.id} 상세`);
        appendText(detail, 'p', `사건 ID: ${event.id}`);
        appendText(detail, 'p', `업무 앱 ID: ${typeof event.appId === 'string' && event.appId ? event.appId : '앱 ID를 확인할 수 없습니다.'}`);

        appendText(detail, 'h5', '근거 (evidence)');
        if (event.evidence.length === 0) appendText(detail, 'p', '제공된 근거가 없습니다.');
        else {
          const evidenceList = document.createElement('ul');
          for (const evidence of event.evidence) {
            appendText(evidenceList, 'li', `ID: ${evidence.id} — ${evidence.text}`);
          }
          detail.append(evidenceList);
        }

        appendText(detail, 'h5', '규칙 (rules)');
        if (event.rules.length === 0) appendText(detail, 'p', '적용 규칙이 없습니다.');
        else {
          const ruleList = document.createElement('ul');
          for (const rule of event.rules) {
            appendText(ruleList, 'li', `ID: ${rule.id} — ${rule.text}`);
          }
          detail.append(ruleList);
        }

        appendText(detail, 'h5', '상태');
        for (const key of ['access', 'session', 'device']) {
          const value = event.state[key];
          const description = stateDescriptions[key][value] || '확인 불가';
          appendText(detail, 'p', `${key}: ${description} (${value})`);
        }

        if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
          appendText(detail, 'h5', '미지원 조치');
          appendText(detail, 'p', '아직 지원하지 않는 조치입니다. 조치 실행 연결은 준비 중입니다.');
          for (const action of event.supportedActions) {
            const unsupported = document.createElement('button');
            unsupported.type = 'button';
            unsupported.textContent = `${action} 미지원`;
            unsupported.disabled = true;
            detail.append(unsupported);
          }
        }
      };

      const list = document.createElement('ul');
      for (const event of filteredEvents) {
        const row = document.createElement('li');
        row.setAttribute('data-student-event-id', String(event.id));
        appendText(row, 'p', `사건 ID: ${event.id}`);
        appendText(row, 'p', `시각: ${event.at}`);
        const kindLabel = event.kind === 'access' ? '접속 기록' : event.kind === 'xdr' ? 'XDR 경보' : `확인 불가 (${event.kind})`;
        appendText(row, 'p', `종류: ${kindLabel} (${event.kind})`);
        const appLabel = typeof event.appId === 'string' && event.appId
          ? event.appId
          : '앱 ID를 확인할 수 없습니다.';
        appendText(row, 'p', `업무 앱: ${appLabel}`);
        appendText(row, 'p', `요약: ${event.summary}`);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${event.id} 상세`;
        button.setAttribute('aria-expanded', String(selectedEventId === event.id));
        button.addEventListener('click', () => {
          selectedEventId = selectedEventId === event.id ? null : event.id;
          root.replaceWith(this.renderEvents({ status, mode, data, error }));
        });
        row.append(button);
        if (selectedEventId === event.id) {
          const detail = document.createElement('section');
          detail.setAttribute('data-student-event-detail', String(event.id));
          renderDetail(event, detail);
          row.append(detail);
        }
        list.append(row);
      }
      root.append(list);
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };
      const modeLabel = (value) => ({
        connected: '연결됨 (connected)',
        demo: '예제 자료 (demo)',
        disconnected: '연결 없음 (disconnected)',
        unknown: '확인 불가 (unknown)',
      })[value] || `확인 불가 (${String(value)})`;
      const deviceStatus = (value) => ({
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족, 점검 필요',
        unknown: '확인 불가',
      })[value] || '확인 불가';
      const sessionStatus = (value) => ({
        active: '활성',
        expired: '만료, 확인 필요',
        revoked: '철회됨, 확인 필요',
        unknown: '확인 불가',
      })[value] || '확인 불가';
      const timeoutCodes = new Set(['TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'ETIMEDOUT']);
      const errorMessage = (resource) => typeof resource?.error?.message === 'string' && resource.error.message
        ? resource.error.message
        : '오류 메시지가 제공되지 않았습니다.';
      const retryGuidance = (resource, title) => {
        const code = resource?.error?.code;
        const timedOut = timeoutCodes.has(code) || /시간 초과/.test(errorMessage(resource));
        appendText(root, 'p', timedOut
          ? `${title} 요청 시간이 초과됐습니다. ${errorMessage(resource)} 다시 시도하려면 위쪽 「다시 불러오기」 버튼을 직접 누르세요.`
          : `${title}을(를) 불러오지 못했습니다. ${errorMessage(resource)} 다시 시도하려면 위쪽 「다시 불러오기」 버튼을 직접 누르세요.`);
      };

      appendText(root, 'p', `연결 상태: ${modeLabel(mode)}`);
      const renderCollection = (title, resource, type) => {
        const section = document.createElement('section');
        appendText(section, 'h3', title);
        appendText(section, 'p', `자료 연결 상태: ${modeLabel(resource?.mode)}`);
        if (!resource || resource.status === 'loading') {
          appendText(section, 'p', `${title}을(를) 불러오는 중입니다.`);
        } else if (resource.status === 'error') {
          const code = resource.error?.code;
          const label = code === 'CONTRACT_MISMATCH' || code === 'ENGINE_RESULT_UNVERIFIED' ? '확인 불가' : '조회 실패';
          appendText(section, 'p', `${title} ${label}.`);
          const codeLabel = typeof code === 'string' && code ? ` (${code})` : '';
          appendText(section, 'p', `오류${codeLabel}: ${errorMessage(resource)}`);
          retryGuidance(resource, title);
        } else if (resource.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) {
            appendText(section, 'p', type === 'devices' ? '등록된 기기가 없음' : '현재 연결 없음');
          } else {
            const list = document.createElement('ul');
            for (const item of resource.data) {
              if (type === 'devices') {
                appendText(list, 'li', `기기: ${String(item?.label ?? '이름 확인 불가')} — 상태: ${String(item?.status ?? 'unknown')} (${deviceStatus(item?.status)})`);
              } else {
                appendText(list, 'li', `세션 ID: ${String(item?.id ?? '확인 불가')} — 상태: ${String(item?.status ?? 'unknown')} (${sessionStatus(item?.status)})`);
              }
            }
            section.append(list);
          }
        } else if (resource.status === 'ok') {
          appendText(section, 'p', '확인 불가: 목록 응답 형식을 확인할 수 없습니다.');
        } else {
          appendText(section, 'p', '확인 불가: 조회 상태를 확인할 수 없습니다.');
        }
        if (type === 'sessions') {
          appendText(section, 'p', '세션 조회 범위는 현재 검증된 연결 하나이며, 과거 세션 전체 목록이 아닙니다.');
        }
        root.append(section);
      };

      renderCollection('기기', devices, 'devices');
      renderCollection('세션', sessions, 'sessions');

      const notificationSection = document.createElement('section');
      appendText(notificationSection, 'h3', '알림');
      if (!Array.isArray(notifications) || notifications.length === 0) {
        appendText(notificationSection, 'p', '주의할 알림이 없습니다.');
      } else {
        const list = document.createElement('ul');
        for (const notification of notifications) {
          const item = document.createElement('li');
          appendText(item, 'p', `자료(resource): ${String(notification?.resource ?? '확인 불가')}`);
          const code = typeof notification?.code === 'string' && /^[A-Za-z0-9._:-]{1,80}$/.test(notification.code)
            ? notification.code
            : '확인 불가';
          appendText(item, 'p', `코드(code): ${code}`);
          appendText(item, 'p', `메시지(message): ${String(notification?.message ?? '메시지가 제공되지 않았습니다.')}`);
          list.append(item);
        }
        notificationSection.append(list);
      }
      root.append(notificationSection);

      const diagnosticsSection = document.createElement('section');
      appendText(diagnosticsSection, 'h3', '진단 정보');
      appendText(diagnosticsSection, 'p', `진단 자료 연결 상태: ${modeLabel(diagnostics?.mode)}`);
      const safeValue = (value) => {
        if (typeof value !== 'string' || !value || value.length > 200) return null;
        if (/(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i.test(value)) return null;
        return value;
      };
      const diagnosticsFields = (data) => {
        const engine = data?.engine;
        const values = [
          ['requestId', data?.requestId],
          ['component', data?.component],
          ['version', data?.version],
          ['checkedAt', data?.checkedAt],
          ['engine.mode', engine?.mode],
          ['engine.code', engine?.code],
        ];
        const list = document.createElement('ul');
        const safeInfo = {};
        for (const [key, rawValue] of values) {
          const value = safeValue(rawValue);
          if (value === null) continue;
          appendText(list, 'li', `${key}: ${value}`);
          if (key === 'engine.mode' || key === 'engine.code') {
            safeInfo.engine ||= {};
            safeInfo.engine[key.slice('engine.'.length)] = value;
          } else safeInfo[key] = value;
        }
        return { list, safeInfo };
      };

      if (!diagnostics || diagnostics.status === 'loading') {
        appendText(diagnosticsSection, 'p', '진단 정보를 불러오는 중입니다.');
      } else if (diagnostics.status === 'error') {
        appendText(diagnosticsSection, 'p', `진단 정보를 불러오지 못했습니다. ${errorMessage(diagnostics)}`);
        appendText(diagnosticsSection, 'p', '다시 시도하려면 「도움정보 불러오기」 버튼을 직접 누르세요.');
      } else if (diagnostics.status === 'ok') {
        const { list, safeInfo } = diagnosticsFields(diagnostics.data);
        if (list.childNodes.length === 0) appendText(diagnosticsSection, 'p', '표시할 수 있는 안전한 진단 정보가 없습니다.');
        else diagnosticsSection.append(list);
        appendText(diagnosticsSection, 'p', '도움 요청에 사용할 진단 정보만 복사합니다. 복사한 뒤 비밀 정보가 없는지 확인하세요.');
        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.textContent = '도움정보 복사';
        const copyStatus = document.createElement('p');
        copyStatus.setAttribute('role', 'status');
        copyButton.addEventListener('click', async () => {
          if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            copyStatus.textContent = '이 브라우저에서 클립보드 복사를 사용할 수 없습니다.';
            return;
          }
          try {
            await navigator.clipboard.writeText(JSON.stringify(safeInfo, null, 2));
            copyStatus.textContent = '도움 요청용 진단 정보를 클립보드에 복사했습니다. 비밀번호·토큰·API 키가 없는지 확인하세요.';
          } catch {
            copyStatus.textContent = '클립보드에 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.';
          }
        });
        diagnosticsSection.append(copyButton, copyStatus);
      } else {
        appendText(diagnosticsSection, 'p', '확인 불가: 진단 정보 조회 상태를 확인할 수 없습니다.');
      }
      root.append(diagnosticsSection);
      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };
      const secretPattern = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const errorGroups = {
        provisioning: new Set(['ON_AI_PROVISIONING_PENDING', 'SUBJECT_SCOPE_UNVERIFIED']),
        authentication: new Set(['WB_CLCO_AUTH_REQUIRED', 'WB_CLCO_ACCESS_BLOCKED', 'ON_AI_AUTHORIZATION_CHANGED']),
        limits: new Set(['WB_CLCO_COHORT_BUDGET_EXHAUSTED', 'WB_CLCO_LIMIT_REACHED']),
        time: new Set(['WB_CLCO_SESSION_CLOSED']),
        retry: new Set(['WB_CLCO_RATE_LIMITED', 'WB_CLCO_TIMEOUT', 'REQUEST_TIMEOUT', 'ENGINE_TIMEOUT', 'TIMEOUT', 'WB_CLCO_NETWORK_ERROR', 'NETWORK_ERROR', 'AI_NETWORK_ERROR', 'WB_CLCO_SERVER_UNAVAILABLE']),
        cancelled: new Set(['WB_CLCO_CANCELLED', 'CANCELLED', 'REQUEST_CANCELLED']),
        model: new Set(['ON_AI_MODEL_LIST_EMPTY', 'MODEL_NOT_CONFIGURED']),
      };
      const knownCodes = new Set([...Object.values(errorGroups).flatMap((group) => [...group]), 'ON_AI_INVALID_INPUT', 'ON_AI_INVALID_OUTPUT', 'AI_REQUEST_UNVERIFIED']);
      const safeMessage = (value, fallback) => typeof value === 'string' && value.trim() && value.length <= 500
        && !secretPattern.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
        ? value : fallback;
      const modeLabel = ({ connected: '연결됨 (connected)', demo: '예제 응답 (demo) · 실제 연결 아님', disconnected: '연결 없음 (disconnected)', unknown: '확인 불가 (unknown)' })[mode]
        || '확인 불가 (unknown)';

      appendText(root, 'p', `AI 연결 점검 상태: ${modeLabel}`);
      if (status === 'idle') {
        appendText(root, 'p', 'AI 연결 점검 전입니다.');
        appendText(root, 'p', '자동으로 다시 점검하지 않습니다. 점검은 사용자가 「AI 연결 점검」 또는 「현재 API 연결 점검」을 직접 눌러 요청합니다.');
        return root;
      }
      if (status === 'loading') {
        appendText(root, 'p', 'AI 연결 점검 중입니다.');
        appendText(root, 'p', '점검을 취소하면 취소 결과가 현재 결과가 되며, 이전 점검 결과는 표시되지 않습니다.');
        return root;
      }
      if (status === 'error') {
        const suppliedCode = typeof error?.code === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(error.code) && !secretPattern.test(error.code)
          ? error.code : 'AI_REQUEST_UNVERIFIED';
        const code = knownCodes.has(suppliedCode) ? suppliedCode : 'AI_REQUEST_UNVERIFIED';
        const genericMessage = code === 'AI_REQUEST_UNVERIFIED'
          ? 'AI 연결 또는 응답을 확인할 수 없습니다. 담당자에게 확인을 요청하세요.'
          : '오류 메시지를 안전하게 표시할 수 없습니다.';
        const message = safeMessage(error?.message, genericMessage);
        const category = Object.entries(errorGroups).find(([, codes]) => codes.has(code))?.[0];
        const guidance = {
          provisioning: '권한 준비 중 또는 확인 불가입니다. 담당자에게 계정 연결과 앱 이용 권한 확인을 요청하세요. 학생 코드만으로 권한을 발급할 수 없습니다.',
          authentication: '인증 실패 또는 접근 제한입니다. 계정 연결을 다시 확인하고 담당자에게 앱 권한 확인을 요청하세요.',
          limits: '사용량 또는 이용 한도에 도달했습니다. 담당자에게 확인을 요청하세요.',
          time: '현재 AI 이용 시간이 아닙니다. 이용 시간을 확인하세요.',
          retry: '요청 제한·시간 초과·네트워크 문제일 수 있습니다. 잠시 뒤 사용자가 직접 다시 점검하세요.',
          cancelled: '점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
          model: '사용할 수 있는 모델이 없습니다. 담당자에게 모델 허용 설정을 확인해 달라고 요청하세요.',
        }[category] || '점검 결과를 확인할 수 없습니다. 이전 결과를 성공으로 간주하지 말고, 필요하면 사용자가 직접 다시 점검하세요.';
        appendText(root, 'p', `AI 연결 점검 실패 (${code})`);
        appendText(root, 'p', `오류 안내: ${message}`);
        appendText(root, 'p', guidance);
        appendText(root, 'p', '자동 재점검은 하지 않습니다. 다시 확인하려면 제공 화면의 점검 버튼을 직접 누르세요.');
        return root;
      }
      if (status !== 'ok') {
        appendText(root, 'p', 'AI 연결 점검 상태를 확인할 수 없습니다.');
        return root;
      }

      if (data?.transportChecked !== true || !['test', 'verified'].includes(data?.audienceAuthorization)) {
        appendText(root, 'p', 'AI 연결 점검 응답 형식을 확인할 수 없습니다. 연결 성공으로 간주하지 않습니다.');
        return root;
      }
      appendText(root, 'p', data.audienceAuthorization === 'test' ? '시험 연결 점검(test)' : '앱 권한 확인 후 점검(verified)');
      if (mode === 'demo') appendText(root, 'p', '예제 응답(demo)이며 실제 서비스 연결 결과가 아닙니다.');
      appendText(root, 'p', `모델 수: ${Number.isInteger(data.modelCount) && data.modelCount >= 0 ? data.modelCount : '확인 불가'}`);
      appendText(root, 'p', `점검 시각: ${safeMessage(checkedAt, '확인 불가')}`);
      appendText(root, 'p', '이 점검에서는 AI 연결과 모델 응답만 확인했습니다. 사건 설명은 아직 실행하지 않았습니다.');
      if (explanationAccepted !== false) appendText(root, 'p', '사건 설명 실행 여부는 이 연결 점검 결과로 확인할 수 없습니다.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };
      const secretPattern = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const safeCode = (value) => typeof value === 'string' && /^[A-Z][A-Z0-9_]{1,63}$/.test(value) && !secretPattern.test(value)
        ? value : 'AI_REQUEST_UNVERIFIED';
      const safeMessage = (value) => typeof value === 'string' && value.trim() && value.length <= 500
        && !secretPattern.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
        ? value : 'AI 설명 결과를 안전하게 확인할 수 없습니다.';

      if (!event) {
        appendText(root, 'p', '보안 기록에서 사건을 먼저 선택하세요.');
        return root;
      }
      if (explanation?.status === 'loading') {
        appendText(root, 'p', `사건 ${String(event.id)}의 AI 설명을 확인하는 중입니다.`);
        return root;
      }
      if (explanation?.status === 'ok') {
        if (typeof event.id !== 'string' || typeof explanation.data?.summary !== 'string') {
          appendText(root, 'p', 'AI 설명 응답 형식을 확인할 수 없습니다.');
          return root;
        }
        root.setAttribute('data-student-explanation-event', event.id);
        appendText(root, 'h3', 'AI 설명 (참고용)');
        appendText(root, 'p', `사건 ID: ${event.id}`);
        appendText(root, 'p', explanation.data.summary);
        return root;
      }
      if (explanation?.status === 'error') {
        appendText(root, 'p', `AI 설명 실패 (${safeCode(explanation.error?.code)})`);
        appendText(root, 'p', `오류 안내: ${safeMessage(explanation.error?.message)}`);
        appendText(root, 'p', '설명 요청은 실패했으며 보안 기록은 그대로입니다.');
        return root;
      }
      appendText(root, 'p', 'AI 사건 설명은 아직 실행되지 않았습니다. 연결 점검만으로 사건 설명은 실행되지 않습니다.');
      if (typeof checkedAt === 'string' && checkedAt) appendText(root, 'p', `확인 시각: ${checkedAt}`);
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
