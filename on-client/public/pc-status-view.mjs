
// 이 PC의 조회 결과만 표시한다. SDP 연결 표시·AI 입력·원격 전송과 독립적이다.
const REASONS = {
  permission_denied: '읽기 권한이 없습니다. 관리자 권한으로 바꾸기 전에 담당자에게 확인하세요.',
  unsupported: '이 운영체제에서는 이 항목을 조회하지 않습니다.',
  timeout: '조회 시간이 초과됐습니다. 잠시 후 다시 확인하세요.',
  query_failed: '조회에 실패했습니다. 잠시 후 다시 확인해 주세요.',
  invalid_response: '응답 형식을 확인할 수 없습니다. 정상으로 판단하지 마세요.',
  cancelled: '조회가 취소되었습니다.',
};

const HISTORY_PAGE_SIZE = 5;
const HISTORY_MAX_ENTRIES = 40;

const bytes = n => `${(n / 1024 ** 3).toFixed(1)} GB`;
const number = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const percent = n => number(n) && n <= 100;
const counter = n => Number.isSafeInteger(n) && n >= 0;

const TITLES = {
  cpu: 'CPU',
  memory: '메모리',
  disk: '디스크',
  network: '네트워크',
  firewall: 'Windows 방화벽',
  events: 'Windows 기록',
};

const HISTORY_KEYS = Object.keys(TITLES);

function validIpv4(value) {
  if (typeof value !== 'string' || value.length > 15) return false;

  const parts = value.split('.');
  return parts.length === 4 && parts.every(part =>
    /^\d{1,3}$/.test(part) &&
    Number(part) >= 0 &&
    Number(part) <= 255
  );
}

function validText(value, max = 128) {
  return typeof value === 'string' &&
    value.length > 0 &&
    value.length <= max &&
    value === value.trim() &&
    !/[\u0000-\u001f\u007f]/.test(value);
}

export function pcMetricText(key, metric) {
  if (metric?.state !== 'ok') {
    return {
      text: '확인 불가',
      note: REASONS[metric?.reason] ?? '이번 조회에서 값을 확인하지 못했습니다. 다시 확인해 주세요.',
      state: 'unavailable',
    };
  }

  let text;
  let note;

  if (key === 'cpu' && percent(metric.usagePercent)) {
    text = `${metric.usagePercent.toFixed(1)}% 사용`;
    note = '짧은 구간의 실측값입니다. 계속 높으면 사용 중인 앱을 확인하세요.';
  } else if (
    key === 'memory' &&
    number(metric.usedBytes) &&
    number(metric.totalBytes) &&
    metric.totalBytes > 0 &&
    metric.usedBytes <= metric.totalBytes
  ) {
    text = `${bytes(metric.usedBytes)} / ${bytes(metric.totalBytes)}`;
    note = metric.usedBytes / metric.totalBytes >= .85
      ? '메모리 사용량이 높습니다. 필요한 작업을 저장하고 사용 중인 앱을 확인하세요.'
      : '사용 중인 메모리와 전체 메모리입니다.';
  } else if (
    key === 'disk' &&
    number(metric.freeBytes) &&
    number(metric.totalBytes) &&
    metric.totalBytes > 0 &&
    metric.freeBytes <= metric.totalBytes
  ) {
    text = `${bytes(metric.freeBytes)} 여유 / ${bytes(metric.totalBytes)}`;
    note = metric.freeBytes / metric.totalBytes < .1
      ? '남은 공간이 적습니다. 삭제하기 전에 파일을 확인하고 백업하세요.'
      : '현재 앱이 있는 디스크의 여유 공간입니다.';
  } else if (
    key === 'network' &&
    counter(metric.interfaceCount) &&
    counter(metric.ipv4Count) &&
    Array.isArray(metric.interfaces) &&
    metric.interfaces.length === metric.interfaceCount &&
    metric.interfaces.length <= 64
  ) {
    const validInterfaces = metric.interfaces.every(item =>
      item &&
      validText(item.name) &&
      Array.isArray(item.ipv4Addresses) &&
      item.ipv4Addresses.length <= 32 &&
      item.ipv4Addresses.every(validIpv4) &&
      (item.defaultGateway === null || validIpv4(item.defaultGateway))
    );

    const actualIpv4Count = metric.interfaces.reduce(
      (total, item) => total + item.ipv4Addresses.length,
      0
    );

    if (!validInterfaces || actualIpv4Count !== metric.ipv4Count) {
      return {
        text: '확인 불가',
        note: REASONS.invalid_response,
        state: 'unavailable',
      };
    }

    text = `인터페이스 ${metric.interfaceCount}개 · IPv4 ${metric.ipv4Count}개`;

    const details = metric.interfaces.map(item => {
      const addresses = item.ipv4Addresses.length
        ? item.ipv4Addresses.join(', ')
        : 'IPv4 주소 없음';

      const gateway = item.defaultGateway ?? '기본 게이트웨이 확인 불가';

      return `${item.name}: ${addresses} · 게이트웨이 ${gateway}`;
    });

    note = details.length
      ? `${details.join(' / ')}. 로컬 네트워크 구성 정보이며 인터넷 또는 SDP 연결 성공을 의미하지 않습니다.`
      : '활성 네트워크 인터페이스가 조회되지 않았습니다. 인터넷 또는 SDP 연결 상태와는 별개입니다.';
  } else if (
    key === 'firewall' &&
    Array.isArray(metric.profiles) &&
    metric.profiles.length === 3 &&
    ['Domain', 'Private', 'Public'].every(name =>
      metric.profiles.some(p => p.name === name && typeof p.enabled === 'boolean')
    )
  ) {
    text = ['Domain', 'Private', 'Public']
      .map(name => {
        const profile = metric.profiles.find(p => p.name === name);
        return `${name} ${profile.enabled ? '켜짐' : '꺼짐'}`;
      })
      .join(' · ');

    note = 'Windows 방화벽 설정을 읽었습니다. 앱이 설정을 바꾸지 않습니다. 보호 전체의 안전 판정은 아닙니다.';
  } else if (
    key === 'events' &&
    counter(metric.warningCount) &&
    counter(metric.errorCount) &&
    metric.warningCount + metric.errorCount <= 5000 &&
    metric.sampleLimit === 5000 &&
    typeof metric.truncated === 'boolean'
  ) {
    text = `최근 24시간 경고 ${metric.warningCount}건 · 오류 ${metric.errorCount}건${metric.truncated ? ' (일부 집계)' : ''}`;
    note = 'System·Application 기록을 최대 5,000건까지 읽습니다. 오류 건수는 침해 사고나 공격 탐지 결과가 아닙니다.';
  }

  return text
    ? {text, note, state: 'measured'}
    : {
        text: '확인 불가',
        note: '응답의 값이나 단위를 확인할 수 없습니다. 정상으로 판단하지 마세요.',
        state: 'unavailable',
      };
}

export function mountPcStatus(
  host,
  {
    fetchImpl = globalThis.fetch?.bind(globalThis),
    historyHost = host,
    intervalMs = 10000,
    timeoutMs = 10000,
  } = {}
) {
  const doc = host.ownerDocument;
  const win = doc.defaultView;

  const make = (tag, text, cls) => {
    const node = doc.createElement(tag);
    if (text) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  };

  const heading = make('h2', '내 PC 상태');
  const intro = make(
    'p',
    '이 앱을 실행한 PC의 값을 읽습니다. 제공된 조회 기능이며 학생 구현 성취와 구분합니다. 이 결과는 AI나 외부 서버로 자동 전송하지 않습니다.',
    'muted'
  );

  const refresh = make('button', '내 PC 확인', 'btn');
  refresh.type = 'button';

  const label = make('label', '', 'pc-auto');
  const auto = doc.createElement('input');
  auto.type = 'checkbox';
  label.append(auto, doc.createTextNode(' 10초마다 확인 (앱 탭이 보이는 동안)'));

  const status = make('p', '아직 조회하지 않았습니다.', 'muted');
  status.setAttribute('role', 'status');

  const grid = make('div', '', 'pc-metrics');
  const rows = new Map();

  for (const [key, title] of Object.entries(TITLES)) {
    const article = make('article', '', 'pc-metric');
    const value = make('p', '아직 조회하지 않음', 'pc-value');
    const note = make('p', '', 'muted');

    article.append(make('h3', title), value, note);
    grid.append(article);
    rows.set(key, {article, value, note});
  }

  // PC 상태 측정 이력
  const historySection = make('section', '', 'pc-history');
  if (historyHost === host) historySection.style.marginTop = '28px';

  const historyHeading = make(historyHost === host ? 'h3' : 'h2', 'PC 상태 측정 기록');

  const historyIntro = make('p', '', 'muted');
  const historyGuide = make(
    'span',
    "위의 '내 PC 확인' 버튼을 눌러 현재 PC 상태를 측정하고 기록해 보세요."
  );

  const historyDescription = make(
    'span',
    `최근 측정 기록을 회차별로 표시합니다. 한 페이지 ${HISTORY_PAGE_SIZE}회, 최대 ${HISTORY_MAX_ENTRIES}회까지 보관합니다.`
  );

  historyIntro.append(
    historyGuide,
    doc.createElement('br'),
    historyDescription
  );

  // 기록 필터와 초기화 버튼
  const historyActions = make('div', '', 'pc-history-actions');
  historyActions.style.display = 'flex';
  historyActions.style.alignItems = 'center';
  historyActions.style.flexWrap = 'wrap';
  historyActions.style.gap = '12px';
  historyActions.style.marginBottom = '12px';

  const filterGroup = make('div', '', 'pc-history-filters');
  filterGroup.style.display = 'flex';
  filterGroup.style.alignItems = 'center';
  filterGroup.style.flexWrap = 'wrap';
  filterGroup.style.gap = '12px';

  const filters = {};

  for (const [key, title] of Object.entries(TITLES)) {
    const filterLabel = make('label', '', 'pc-history-filter');
    filterLabel.style.display = 'inline-flex';
    filterLabel.style.alignItems = 'center';
    filterLabel.style.gap = '4px';

    const checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.setAttribute('aria-label', `${title} 기록 표시`);

    filterLabel.append(checkbox, doc.createTextNode(title));
    filterGroup.append(filterLabel);
    filters[key] = checkbox;
  }

  const clearHistory = make('button', '기록 초기화', 'btn');
  clearHistory.type = 'button';

  const historyList = make('div', '', 'pc-history-list');
  const historyStatus = make('p', '아직 저장된 측정 기록이 없습니다.', 'muted');
  historyStatus.setAttribute('role', 'status');

  const pagination = make('div', '', 'pc-history-pagination');
  const previousPage = make('button', '이전', 'btn');
  previousPage.type = 'button';

  const pageLabel = make('span', '0 / 0');
  const nextPage = make('button', '다음', 'btn');
  nextPage.type = 'button';

  historyActions.append(filterGroup, clearHistory);
  pagination.append(previousPage, pageLabel, nextPage);

  historySection.append(
    historyHeading,
    historyIntro,
    historyActions,
    historyList,
    historyStatus,
    pagination
  );

  host.replaceChildren(
    heading,
    intro,
    refresh,
    label,
    status,
    grid
  );
  historyHost.append(historySection);

  const history = [];
  let currentPage = 0;

  function renderHistory() {
    const totalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE);

    if (totalPages === 0) currentPage = 0;
    else currentPage = Math.min(currentPage, totalPages - 1);

    historyList.replaceChildren();

    if (history.length === 0) {
      historyStatus.textContent = '아직 저장된 측정 기록이 없습니다.';
      historyStatus.hidden = false;
    } else {
      historyStatus.textContent = `총 ${history.length}회 측정 기록`;
      historyStatus.hidden = false;
    }

    const start = currentPage * HISTORY_PAGE_SIZE;
    const visibleEntries = history.slice(start, start + HISTORY_PAGE_SIZE);

    for (const entry of visibleEntries) {
      // 동일한 측정 시각의 여섯 항목을 한 회차 상자로 묶는다.
      const article = make('article', '', 'pc-history-entry');
      article.style.border = '1px solid #cbd5e1';
      article.style.borderRadius = '8px';
      article.style.padding = '12px 14px';
      article.style.marginBottom = '12px';
      article.style.background = 'rgba(148, 163, 184, 0.06)';

      const time = make('h4', entry.time, 'pc-history-time');
      time.style.margin = '0 0 10px';

      const metrics = make('div', '', 'pc-history-metrics');
      metrics.style.display = 'flex';
      metrics.style.flexDirection = 'column';
      metrics.style.gap = '8px';

      let visibleMetricCount = 0;

      for (const key of HISTORY_KEYS) {
        // 체크되지 않은 항목은 기록 목록에서 숨긴다.
        if (!filters[key].checked) continue;

        const info = entry.metrics[key];
        const item = make('p', '', 'pc-history-metric');
        item.style.margin = '0';

        const name = make('strong', `${TITLES[key]}: `);
        const value = make('span', info.text);

        item.append(name, value);
        item.dataset.state = info.state;

        if (info.note) {
          const note = make('span', ` — ${info.note}`, 'muted');
          item.append(note);
        }

        metrics.append(item);
        visibleMetricCount++;
      }

      if (visibleMetricCount === 0) {
        metrics.append(
          make('p', '표시할 항목을 선택해 주세요.', 'muted')
        );
      }

      article.append(time, metrics);
      historyList.append(article);
    }

    pageLabel.textContent = totalPages === 0
      ? '0 / 0'
      : `${currentPage + 1} / ${totalPages}`;

    previousPage.disabled = currentPage <= 0;
    nextPage.disabled = totalPages === 0 || currentPage >= totalPages - 1;
    clearHistory.disabled = history.length === 0;
  }

  function addHistory(data, measured) {
    const metrics = {};

    for (const key of HISTORY_KEYS) {
      metrics[key] = pcMetricText(key, data.metrics?.[key]);
    }

    history.unshift({
      time: new Date(measured).toLocaleString('ko-KR'),
      metrics,
    });

    // 최대 보관 개수를 넘으면 가장 오래된 기록부터 제거한다.
    if (history.length > HISTORY_MAX_ENTRIES) {
      history.length = HISTORY_MAX_ENTRIES;
    }

    currentPage = 0;
    renderHistory();
  }

  function stopTimer() {
    if (timer !== null) win.clearTimeout(timer);
    timer = null;
  }

  let disposed = false;
  let controller = null;
  let generation = 0;
  let timer = null;

  function next() {
    stopTimer();

    if (!disposed && auto.checked && !doc.hidden) {
      timer = win.setTimeout(
        () => { void read(); },
        Math.max(10000, intervalMs)
      );
    }
  }

  function unavailable() {
    for (const row of rows.values()) {
      row.article.dataset.state = 'unavailable';
      row.value.textContent = '이번 조회 확인 불가';
      row.note.textContent = '이전 값을 현재 상태로 표시하지 않습니다.';
    }
  }

  async function read() {
    if (disposed || doc.hidden) return;

    stopTimer();
    controller?.abort();

    const own = ++generation;
    const abort = new AbortController();
    controller = abort;

    refresh.disabled = true;
    status.textContent = '이 PC에서 읽는 중…';

    let timedOut = false;

    const deadline = win.setTimeout(() => {
      timedOut = true;
      abort.abort();
    }, timeoutMs);

    try {
      const stopped = new Promise((_, reject) => {
        abort.signal.addEventListener(
          'abort',
          () => reject(Error('cancelled')),
          {once: true}
        );
      });

      const result = await Promise.race([
        Promise.resolve().then(async () => {
          const response = await fetchImpl('/api/pc/status', {
            cache: 'no-store',
            signal: abort.signal,
          });

          if (!response.ok) throw Error('failed');
          return response.json();
        }),
        stopped,
      ]);

      if (disposed || own !== generation) return;

      const data = result?.ok === true ? result.data : null;

      const measured =
        typeof data?.measuredAt === 'string' &&
        /(?:Z|[+-]\d{2}:\d{2})$/.test(data.measuredAt)
          ? Date.parse(data.measuredAt)
          : NaN;

      if (
        data?.schema !== 'aleph.on.pc-status.v1' ||
        data.source !== 'local-pc' ||
        !Number.isFinite(measured) ||
        Math.abs(Date.now() - measured) > 60000
      ) {
        throw Error('stale');
      }

      for (const [key, row] of rows) {
        const info = pcMetricText(key, data.metrics?.[key]);
        row.article.dataset.state = info.state;
        row.value.textContent = info.text;
        row.note.textContent = info.note;
      }

      status.textContent =
        `이 PC 마지막 실측 · ${new Date(measured).toLocaleString('ko-KR')} · 보안 서버 연결 상태와 별도`;

      // 검증을 통과한 동일한 응답만 측정 이력에 추가한다.
      addHistory(data, measured);
    } catch {
      if (disposed || own !== generation) return;

      unavailable();

      status.textContent = timedOut
        ? REASONS.timeout
        : '이번 상태를 확인하지 못했습니다. 앱이 실행 중인지 확인하고 다시 조회하세요.';
    } finally {
      win.clearTimeout(deadline);

      if (!disposed && own === generation) {
        controller = null;
        refresh.disabled = false;
        next();
      }
    }
  }

  function clearHistoryRecords() {
    if (history.length === 0) return;

    const confirmed = win.confirm(
      '저장된 PC 상태 측정 기록을 모두 초기화할까요? 현재 PC 상태 조회 기능에는 영향을 주지 않습니다.'
    );

    if (!confirmed) return;

    history.length = 0;
    currentPage = 0;
    renderHistory();
  }

  function onPreviousPage() {
    if (currentPage > 0) {
      currentPage--;
      renderHistory();
    }
  }

  function onNextPage() {
    const totalPages = Math.ceil(history.length / HISTORY_PAGE_SIZE);

    if (currentPage < totalPages - 1) {
      currentPage++;
      renderHistory();
    }
  }

  const visibility = () => {
    if (doc.hidden) {
      stopTimer();
      generation++;
      controller?.abort();
      controller = null;
      refresh.disabled = false;
      unavailable();
      status.textContent = '화면을 보지 않는 동안 자동 확인을 멈췄습니다.';
    } else if (auto.checked) {
      void read();
    }
  };

  refresh.addEventListener('click', read);

  auto.addEventListener('change', () => {
    if (auto.checked) void read();
    else stopTimer();
  });

  // 체크박스를 변경하면 현재 페이지의 기록 표시만 다시 그린다.
  for (const checkbox of Object.values(filters)) {
    checkbox.addEventListener('change', renderHistory);
  }

  clearHistory.addEventListener('click', clearHistoryRecords);
  previousPage.addEventListener('click', onPreviousPage);
  nextPage.addEventListener('click', onNextPage);
  doc.addEventListener('visibilitychange', visibility);

  const dispose = () => {
    if (disposed) return;

    disposed = true;
    generation++;
    stopTimer();
    controller?.abort();

    refresh.removeEventListener('click', read);
    clearHistory.removeEventListener('click', clearHistoryRecords);
    previousPage.removeEventListener('click', onPreviousPage);
    nextPage.removeEventListener('click', onNextPage);

    for (const checkbox of Object.values(filters)) {
      checkbox.removeEventListener('change', renderHistory);
    }

    doc.removeEventListener('visibilitychange', visibility);
    win.removeEventListener('pagehide', dispose);
  };

  win.addEventListener('pagehide', dispose, {once: true});

  renderHistory();

  return {read, dispose};
}
