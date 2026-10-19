// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
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
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
