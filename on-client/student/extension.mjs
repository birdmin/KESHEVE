// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView({ refresh, onChange } = {}) {
  const eventFilters = { kind: 'all', appId: 'all', access: 'all' };
  let selectedEventId = null;
  let refreshing = false;
  let refreshMessage = '';

  const requestRefresh = async () => {
    if (refreshing || typeof refresh !== 'function') return;

    refreshing = true;
    refreshMessage = '사용자·기기·세션·업무 앱·보안 기록을 다시 조회하고 있습니다.';
    onChange?.();

    try {
      await refresh();
      refreshMessage = '조회 요청이 끝났습니다. 각 항목의 결과를 확인하세요.';
    } catch {
      refreshMessage = '다시 조회하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도하세요.';
    } finally {
      refreshing = false;
      onChange?.();
    }
  };
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
            : code === 'ENGINE_NOT_CONNECTED' ? '서버 연결 어댑터 미연결' : '연결 실패';
          appendText(section, 'p', `${label}: ${message}`);
          if (code === 'ENGINE_NOT_CONNECTED') {
            appendText(section, 'p', '서버 연결 어댑터가 준비되지 않아 실제 사용자·기기·세션 자료를 조회하지 못했습니다. 이는 접근 거부나 자료 없음 판정이 아닙니다. 담당자에게 서버 연결 어댑터 경로와 실행 설정을 확인해 달라고 요청하세요.');
          }
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
            appendText(ruleList, 'li', `${rule.id} — ${rule.text}`);
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
      const refreshButton = document.createElement('button');
      refreshButton.type = 'button';
      refreshButton.className = 'btn';
      refreshButton.textContent = refreshing ? '조회 중…' : '다시 조회';
      refreshButton.disabled = refreshing || typeof refresh !== 'function';
      refreshButton.setAttribute('aria-label', '사용자, 기기, 세션, 업무 앱, 보안 기록 다시 조회');
      refreshButton.addEventListener('click', requestRefresh);

      const refreshStatus = document.createElement('p');
      refreshStatus.setAttribute('role', 'status');
      refreshStatus.setAttribute('aria-live', 'polite');
      refreshStatus.textContent = refreshMessage;

      root.append(refreshButton, refreshStatus);
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
          const label = code === 'CONTRACT_MISMATCH' || code === 'ENGINE_RESULT_UNVERIFIED'
            ? '확인 불가'
            : code === 'ENGINE_NOT_CONNECTED' ? '서버 연결 어댑터 미연결' : '조회 실패';
          appendText(section, 'p', `${title} ${label}.`);
          const codeLabel = typeof code === 'string' && code ? ` (${code})` : '';
          appendText(section, 'p', `오류${codeLabel}: ${errorMessage(resource)}`);
          if (code === 'ENGINE_NOT_CONNECTED') {
            appendText(section, 'p', '실제 서버 자료를 조회하지 못한 상태입니다. 기기·세션이 없거나 접근이 거부됐다는 뜻이 아닙니다. 담당자에게 서버 연결 어댑터 경로와 실행 설정을 확인해 달라고 요청하세요. 다시 불러오기만으로 연결이 복구된다고 보장할 수 없습니다.');
          } else {
            retryGuidance(resource, title);
          }
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
        if (diagnostics.error?.code === 'ENGINE_NOT_CONNECTED') {
          appendText(diagnosticsSection, 'p', '서버 연결 어댑터 미연결 (ENGINE_NOT_CONNECTED)');
          appendText(diagnosticsSection, 'p', '진단 정보를 실제 서버에서 가져오지 못했습니다. 담당자에게 서버 연결 어댑터 경로와 실행 설정을 확인해 달라고 요청하세요.');
        } else {
          appendText(diagnosticsSection, 'p', `진단 정보를 불러오지 못했습니다. ${errorMessage(diagnostics)}`);
          appendText(diagnosticsSection, 'p', '다시 시도하려면 「도움정보 불러오기」 버튼을 직접 누르세요.');
        }
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
    renderVulnerabilities({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };
      const hasValue = (value) => value !== undefined && value !== null && value !== '';
      const displayValue = (value) => hasValue(value) ? String(value) : '확인 불가';
      const scanStatusLabels = {
        complete: '모두 조회',
        partial: '일부 조회 실패',
        not_checked: '아직 조회 안 함',
        not_configured: '조회 준비 미완료',
        unverifiable: '잠금 파일 확인 불가',
      };
      const packageStatusLabels = {
        known_vulnerabilities: '알려진 항목 있음',
        none_found: '조회 범위에서 알려진 취약점 항목 없음',
        unverifiable: '조회 확인 불가',
      };

      if (status === 'idle') {
        appendText(root, 'p', '조회 전');
        return root;
      }
      if (status === 'loading') {
        appendText(root, 'p', '조회 중');
        return root;
      }
      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message
          ? error.message
          : '오류 메시지가 제공되지 않았습니다.';
        appendText(root, 'p', `조회 실패: ${message}`);
        return root;
      }
      if (status !== 'ok') {
        appendText(root, 'p', `조회 상태 확인 불가 (${displayValue(status)})`);
        return root;
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        appendText(root, 'p', '조회 결과 형식을 확인할 수 없습니다.');
        return root;
      }

      const rawScanStatus = data.status;
      const scanLabel = hasValue(rawScanStatus) && Object.hasOwn(scanStatusLabels, rawScanStatus)
        ? scanStatusLabels[rawScanStatus]
        : '조회 상태 확인 불가';
      appendText(root, 'p', `전체 조회 상태: ${scanLabel} (${displayValue(rawScanStatus)})`);
      appendText(root, 'p', '설치 목록은 package-lock.json과 node_modules의 설치 메타데이터를 대조해 확인합니다.');

      if (rawScanStatus === 'not_configured') {
        appendText(root, 'p', '조회 대상 프로젝트 설정이 필요합니다. 학생이 대상 경로나 허용 패키지를 임의로 변경하지 않습니다.');
      } else if (rawScanStatus === 'not_checked') {
        appendText(root, 'p', '승인된 공개 패키지 조회 대상이 없어 조회하지 않은 상태일 수 있습니다.');
      } else if (rawScanStatus === 'unverifiable') {
        appendText(root, 'p', '잠금 파일을 확인할 수 없어 설치 목록과 취약점 정보를 대조하지 못했습니다.');
      } else if (rawScanStatus === 'partial') {
        appendText(root, 'p', '일부 패키지 조회에 실패했습니다. 이미 확인된 취약점 식별자는 유지해 표시합니다.');
      }

      for (const [key, label] of [
        ['lockfileVersion', '잠금 파일 버전 (lockfileVersion)'],
        ['lockfileHash', '잠금 파일 해시 (lockfileHash)'],
        ['checkedAt', '전체 확인 시각 (checkedAt)'],
      ]) {
        if (hasValue(data[key])) appendText(root, 'p', `${label}: ${String(data[key])}`);
      }

      const packages = Array.isArray(data.packages) ? data.packages : [];
      if (packages.length === 0) {
        if (rawScanStatus === 'not_configured') {
          appendText(root, 'p', '프로젝트 설정이 없어 패키지 조회 결과가 없습니다.');
        } else if (rawScanStatus === 'not_checked') {
          appendText(root, 'p', '아직 조회한 패키지가 없습니다.');
        } else if (rawScanStatus === 'unverifiable') {
          appendText(root, 'p', '확인 가능한 패키지 결과가 없습니다.');
        } else {
          appendText(root, 'p', '표시할 패키지 조회 결과가 없습니다.');
        }
      } else {
        const table = document.createElement('table');
        const head = document.createElement('thead');
        const headingRow = document.createElement('tr');
        for (const label of ['패키지 이름', '정확한 설치 버전', '패키지 조회 상태', '출처', '패키지 확인 시각', '취약점 ID', '수정 시각']) {
          appendText(headingRow, 'th', label);
        }
        head.append(headingRow);
        table.append(head);
        const body = document.createElement('tbody');
        for (const pkg of packages) {
          const findings = Array.isArray(pkg?.vulnerabilities) ? pkg.vulnerabilities : [];
          const rows = findings.length > 0 ? findings : [null];
          for (const finding of rows) {
            const row = document.createElement('tr');
            row.setAttribute('data-student-package-name', hasValue(pkg?.name) ? String(pkg.name) : '');
            row.setAttribute('data-student-package-version', hasValue(pkg?.version) ? String(pkg.version) : '');
            appendText(row, 'td', displayValue(pkg?.name));
            appendText(row, 'td', displayValue(pkg?.version));
            const rawPackageStatus = pkg?.status;
            const packageLabel = rawPackageStatus === 'unverifiable' && findings.length > 0
              ? '일부 확인·전체 조회 확인 불가'
              : hasValue(rawPackageStatus) && Object.hasOwn(packageStatusLabels, rawPackageStatus)
                ? packageStatusLabels[rawPackageStatus]
                : '조회 상태 확인 불가';
            appendText(row, 'td', `${packageLabel} (${displayValue(rawPackageStatus)})`);
            appendText(row, 'td', displayValue(pkg?.source));
            appendText(row, 'td', displayValue(pkg?.checkedAt));
            if (finding) {
              appendText(row, 'td', displayValue(finding.id));
              appendText(row, 'td', displayValue(finding.modified));
            } else {
              const noFindingMessage = rawPackageStatus === 'none_found'
                ? '이 조회 범위에서 알려진 취약점 항목이 없습니다.'
                : rawPackageStatus === 'unverifiable'
                  ? '취약점 조회 결과를 확인할 수 없습니다.'
                  : rawPackageStatus === 'known_vulnerabilities'
                    ? '취약점 상태와 항목 목록이 일치하지 않습니다.'
                    : '표시할 취약점 항목이 없습니다.';
              appendText(row, 'td', noFindingMessage);
              appendText(row, 'td', '—');
            }
            body.append(row);
          }
        }
        table.append(body);
        root.append(table);
      }

      appendText(root, 'p', 'OSV는 알려진 취약점 데이터베이스입니다. 조회 결과가 없더라도 해당 패키지나 앱 전체의 안전성을 보장하지 않습니다.');
      return root;
    },
    renderAiConnection({ status, data, error, checkedAt, explanationAccepted } = {}) {
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
        if (code === 'ON_AI_PROVISIONING_PENDING') {
          appendText(root, 'p', '보호 현황에서 「현재 로그인 확인」으로 ALEPH 계정을 확인하고, AI 연결의 앱 승인 상태를 확인하세요.');
          appendText(root, 'p', '계정과 앱 승인이 확인되면 「현재 API 연결 점검」을 다시 누르세요. 같은 오류가 반복되면 담당자에게 오류 코드와 발생 시각을 전달하세요.');
        } else {
          appendText(root, 'p', guidance);
        }
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
      appendText(root, 'p', data.audienceAuthorization === 'test' ? '시험 연결 점검(test)' : 'AI 연결 점검 성공 (verified)');
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
        ? value : null;
      const safeMessage = (value) => typeof value === 'string' && value.trim() && value.length <= 500
        && !secretPattern.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
        ? value : 'AI 설명 결과를 안전하게 확인할 수 없습니다.';
      const appendSafeCode = (code) => {
        const safe = safeCode(code);
        if (safe) appendText(root, 'p', `오류 코드: ${safe}`);
      };
      const appendReason = (code) => {
        if (code === 'ON_AI_INVALID_INPUT') {
          appendText(root, 'p', '설명에 필요한 사건 근거 또는 규칙이 부족하거나 유효하지 않습니다.');
        } else if (code === 'ON_AI_INVALID_OUTPUT') {
          appendText(root, 'p', 'AI 응답의 근거 ID 또는 형식이 기록과 일치하지 않아 설명을 표시할 수 없습니다.');
        }
      };
      const failExplanation = (message, code) => {
        appendText(root, 'h3', 'AI 설명을 표시할 수 없습니다.');
        appendText(root, 'p', message);
        appendSafeCode(code);
      };

      // 오류 상태는 event가 없어도 먼저 보여 줍니다. 실패·자료 불일치 화면에는 성공 속성을 붙이지 않습니다.
      if (explanation?.status === 'error') {
        const code = safeCode(explanation.error?.code);
        appendText(root, 'h3', 'AI 설명 실패');
        appendText(root, 'p', `실패 사유: ${safeMessage(explanation.error?.message)}`);
        if (code) appendText(root, 'p', `오류 코드: ${code}`);
        appendReason(code);
        appendText(root, 'p', '보안 기록은 그대로입니다.');
        return root;
      }
      if (!event) {
        appendText(root, 'p', '보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }
      if (explanation?.status === 'loading') {
        appendText(root, 'p', `사건 ID: ${String(event.id)}`);
        appendText(root, 'p', 'AI 설명 요청 중입니다.');
        return root;
      }
      if (explanation?.status !== 'ok') {
        appendText(root, 'p', 'AI 설명은 아직 요청되지 않았습니다. 연결 점검만으로 사건 설명은 실행되지 않습니다.');
        if (typeof checkedAt === 'string' && checkedAt) appendText(root, 'p', `확인 시각: ${checkedAt}`);
        return root;
      }

      const data = explanation.data;
      const evidence = Array.isArray(event.evidence) ? event.evidence : [];
      const evidenceIds = data?.evidenceIds;
      const evidenceRows = Array.isArray(evidenceIds)
        ? evidenceIds.map((id) => evidence.find((row) => row?.id === id))
        : [];
      const evidenceIdsValid = Array.isArray(evidenceIds)
        && evidenceIds.length === evidence.length
        && new Set(evidenceIds).size === evidenceIds.length
        && evidenceRows.length > 0
        && evidenceRows.every((row) => row && typeof row.text === 'string');

      if (data?.executed === true) {
        failExplanation('AI가 조치를 이미 실행했다고 응답했으므로 이 설명은 사용할 수 없습니다.', explanation.error?.code);
        return root;
      }
      if (typeof event.id !== 'string' || !event.id || typeof data?.summary !== 'string'
          || !evidenceIdsValid || !Array.isArray(event.rules)
          || !Array.isArray(data?.proposals)
          || data.requiresHumanConfirmation !== true || data.executed !== false) {
        const code = safeCode(explanation.error?.code);
        const reason = !evidenceIdsValid
          ? '선택한 기록과 설명의 근거 ID가 일치하지 않거나 근거가 부족합니다. 내용을 지어내지 않았습니다.'
          : 'AI 설명 응답의 필수 자료 또는 실행 상태를 확인할 수 없습니다.';
        failExplanation(reason, code);
        appendReason(code);
        return root;
      }

      const supportedActions = Array.isArray(event.supportedActions) ? event.supportedActions : null;
      const proposalsValid = data.proposals.every((proposal) => proposal
        && typeof proposal.action === 'string'
        && typeof proposal.reason === 'string'
        && Array.isArray(proposal.evidenceIds)
        && proposal.evidenceIds.length > 0
        && new Set(proposal.evidenceIds).size === proposal.evidenceIds.length
        && proposal.evidenceIds.every((id) => evidence.some((row) => row?.id === id))
        && supportedActions?.includes(proposal.action));
      if (!proposalsValid) {
        failExplanation('제안의 조치 또는 근거가 이 기록의 지원 범위와 일치하지 않아 설명을 표시할 수 없습니다.', explanation.error?.code);
        return root;
      }

      appendText(root, 'h3', 'AI 설명(참고용)');
      appendText(root, 'p', `사건 ID: ${event.id}`);
      appendText(root, 'p', data.summary);

      appendText(root, 'h4', '인용한 근거');
      const evidenceList = document.createElement('ul');
      for (let index = 0; index < evidenceIds.length; index += 1) {
        const row = evidenceRows[index];
        appendText(evidenceList, 'li', `${row.id} — ${row.text}`);
      }
      root.append(evidenceList);

      appendText(root, 'h4', '규칙');
      if (event.rules.length === 0) appendText(root, 'p', '적용 규칙이 없습니다.');
      else {
        const rulesList = document.createElement('ul');
        for (const rule of event.rules) {
          if (typeof rule?.id === 'string' && typeof rule.text === 'string') {
            appendText(rulesList, 'li', `${rule.id} — ${rule.text}`);
          }
        }
        if (rulesList.childNodes.length === 0) appendText(root, 'p', '규칙 자료를 확인할 수 없습니다.');
        else root.append(rulesList);
      }

      appendText(root, 'h4', '확인 불가 상태');
      const unknownNames = { access: '접속', session: '세션', device: '기기' };
      const unknownStates = ['access', 'session', 'device']
        .filter((key) => event.state?.[key] === 'unknown')
        .map((key) => `${unknownNames[key]}: 확인 불가 (unknown)`);
      if (unknownStates.length === 0) appendText(root, 'p', '없음');
      else {
        const unknownList = document.createElement('ul');
        for (const value of unknownStates) appendText(unknownList, 'li', value);
        root.append(unknownList);
      }

      appendText(root, 'h4', 'AI 제안');
      if (data.proposals.length === 0) {
        if (supportedActions?.length === 0) {
          appendText(root, 'p', '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).');
        } else if (supportedActions && supportedActions.length > 0) {
          appendText(root, 'p', 'AI가 제안한 조치가 없습니다.');
        } else {
          appendText(root, 'p', '연동 시스템의 지원 조치 목록을 확인할 수 없어 제안이 없는 이유를 확인할 수 없습니다.');
        }
      } else {
        const proposalList = document.createElement('ul');
        for (const proposal of data.proposals) {
          const item = document.createElement('li');
          appendText(item, 'p', `조치: ${proposal.action}`);
          appendText(item, 'p', `이유: ${proposal.reason}`);
          appendText(item, 'p', `근거 ID: ${proposal.evidenceIds.join(', ')}`);
          appendText(item, 'p', '사람의 확인이 필요하며 아직 실행되지 않았습니다.');
          proposalList.append(item);
        }
        root.append(proposalList);
      }

      // 모든 계약·현재 이벤트 근거 대조가 끝난 성공 설명에만 성공 표식을 지정합니다.
      root.setAttribute('data-student-explanation-event', event.id);
      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const root = document.createElement('section');
      const appendText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.append(node);
        return node;
      };
      const secretPattern = /(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i;
      const safeValue = (value) => {
        if (typeof value !== 'string' || !value || value.length > 500 || secretPattern.test(value)
            || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) return null;
        return value;
      };
      const safeMessage = (value) => typeof value === 'string' && value.trim() && value.length <= 500
        && !secretPattern.test(value) && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
        ? value : '오류 메시지를 안전하게 표시할 수 없습니다.';
      const displayField = (label, value) => {
        const safe = safeValue(typeof value === 'number' && Number.isFinite(value) ? String(value) : value);
        if (safe !== null) appendText(root, 'p', `${label}: ${safe}`);
      };
      const displayRequiredField = (label, value) => {
        const safe = safeValue(typeof value === 'number' && Number.isFinite(value) ? String(value) : value);
        appendText(root, 'p', `${label}: ${safe ?? '확인 불가'}`);
      };
      const statusMessages = {
        idle: '아직 미실행 (idle).',
        loading: '조치 준비 또는 처리 결과 조회 중입니다 (loading). 결과는 아직 확인되지 않았습니다.',
        prepared: '준비됨·미실행 (prepared). 아직 서버에 조치가 전달되지 않았습니다.',
        executing: '서버에 전달 중 (executing). 결과가 아직 확인되지 않았습니다.',
        pending: '서버 접수·처리 중 (pending). ACK는 효과 확인이 아니며, 처리 결과가 아직 확인되지 않았습니다.',
        denied: '연동 시스템 거절 (denied).',
        failed: '연동 시스템 처리 실패 (failed).',
        unknown: '결과 불명 (unknown). 효과 없음으로도 성공으로도 판단하지 않습니다. 제공 화면의 「원천 결과만 재조회」를 사용해 결과만 다시 조회하세요.',
        expired: '확인 기한 지남 (expired). 제공 화면에서 조치를 다시 준비하세요.',
        error: '요청 처리 안 됨 (error).',
      };
      const rawStatus = typeof status === 'string' ? status : 'unknown';
      const knownStatus = Object.hasOwn(statusMessages, rawStatus);
      const effectConfirmed = rawStatus === 'succeeded' && observation?.effectApplied === true;
      const title = rawStatus === 'succeeded'
        ? effectConfirmed
          ? '효과 확인 (succeeded).'
          : '결과 불명 (unknown). succeeded 상태 응답만으로 실제 효과를 확인할 수 없습니다. 효과 없음으로 판단하지 말고 제공 화면의 「원천 결과만 재조회」를 사용하세요.'
        : knownStatus ? statusMessages[rawStatus]
          : `결과 불명 (unknown). 전달된 상태값을 확인할 수 없습니다 (${safeValue(rawStatus) ?? '확인 불가'}). 성공이나 효과 없음으로 단정하지 말고 제공 화면의 「원천 결과만 재조회」를 사용하세요.`;
      appendText(root, 'p', title);

      if (effectConfirmed) {
        displayRequiredField('관측 시각 (observedAt)', observation.observedAt);
        appendText(root, 'p', 'effectApplied: true');
        displayRequiredField('영수증 ID (receiptId)', receipt?.receiptId);
      }

      if (rawStatus === 'prepared' && confirmationExpiresAt !== undefined && confirmationExpiresAt !== null) {
        displayField('확인 기한 (confirmationExpiresAt)', confirmationExpiresAt);
      }
      if (rawStatus === 'denied' || rawStatus === 'failed') {
        if (typeof message === 'string' && message) appendText(root, 'p', `처리 메시지: ${safeMessage(message)}`);
      }
      if (rawStatus === 'error') {
        const code = safeValue(error?.code);
        if (code && /^[A-Z][A-Z0-9_]{1,63}$/.test(code)) appendText(root, 'p', `오류 코드 (error.code): ${code}`);
        appendText(root, 'p', `오류 메시지 (error.message): ${safeMessage(error?.message)}`);
      }

      displayField('사건 ID (event.id)', event?.id);
      if (Array.isArray(event?.evidence)) {
        const evidenceIds = event.evidence.map((evidence) => safeValue(evidence?.id)).filter((id) => id !== null);
        if (evidenceIds.length > 0) appendText(root, 'p', `근거 ID: ${evidenceIds.join(', ')}`);
      }
      displayField('조치 ID (actionId)', actionId);
      displayField('실제 대상 ID (target.id)', target?.id);
      displayField('대상 generation', target?.generation);
      displayField('요청 ID (requestId)', receipt?.requestId);
      if (!effectConfirmed) displayField('영수증 ID (receiptId)', receipt?.receiptId);
      displayField('영수증 version', receipt?.version);

      const eventId = safeValue(event?.id);
      const requestId = safeValue(receipt?.requestId);
      if (eventId !== null) root.setAttribute('data-student-action-event', eventId);
      if (requestId !== null) root.setAttribute('data-student-action-request', requestId);
      return root;
    },
  };
}

export default { createStudentView };