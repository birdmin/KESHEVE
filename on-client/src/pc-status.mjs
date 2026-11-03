// 본인 PC의 비식별 상태만 읽는다. 원격 호출·OS 설정 변경·권한 상승은 하지 않는다.
import os from 'node:os';
import {statfs} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {setTimeout as wait} from 'node:timers/promises';

const execute = promisify(execFile);
const diskRoot = fileURLToPath(new URL('../', import.meta.url));

// 명령과 조회 범위는 고정이다.
// 이벤트 본문·사용자·호스트·MAC 주소 등은 출력하지 않는다.
// 네트워크 정보는 인터페이스 이름, IPv4 주소, 기본 게이트웨이만 읽는다.
const WINDOWS_READ = String.raw`
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$result = @{}

function Read-FailureReason($failure) {
  if ($failure.Exception -is [System.UnauthorizedAccessException] -or
      $failure.FullyQualifiedErrorId -match 'AccessDenied|Unauthorized' -or
      $failure.CategoryInfo.Category -eq 'PermissionDenied') {
    return 'permission_denied'
  }
  return 'query_failed'
}

try {
  $network = @(
    Get-NetIPConfiguration -ErrorAction Stop |
      Where-Object { $_.NetAdapter -and $_.NetAdapter.Status -eq 'Up' } |
      ForEach-Object {
        $addresses = @(
          $_.IPv4Address |
            Where-Object { $_.IPAddress } |
            ForEach-Object { [string]$_.IPAddress }
        )
        $gateways = @(
          $_.IPv4DefaultGateway |
            Where-Object { $_.NextHop } |
            ForEach-Object { [string]$_.NextHop }
        )
        @{
          name = [string]$_.InterfaceAlias
          ipv4Addresses = $addresses
          defaultGateway = if ($gateways.Count -gt 0) { $gateways[0] } else { $null }
        }
      }
  )
  $result.network = @{ state = 'ok'; interfaces = $network }
} catch {
  $result.network = @{ state = 'unavailable'; reason = (Read-FailureReason $_) }
}

try {
  $profiles = @(
    Get-NetFirewallProfile -ErrorAction Stop |
      ForEach-Object {
        $enabled = switch ([string]$_.Enabled) {
          'True' { $true }
          'False' { $false }
          default { $null }
        }
        @{ name = [string]$_.Name; enabled = $enabled }
      }
  )
  $result.firewall = @{ state = 'ok'; profiles = $profiles }
} catch {
  $result.firewall = @{ state = 'unavailable'; reason = (Read-FailureReason $_) }
}

$since = (Get-Date).AddHours(-24)
try {
  $events = @()
  foreach ($log in @('System', 'Application')) {
    try {
      $events += @(
        Get-WinEvent -FilterHashtable @{
          LogName = $log
          StartTime = $since
          Level = @(2, 3)
        } -MaxEvents 5001 -ErrorAction Stop
      )
    } catch {
      if ($_.FullyQualifiedErrorId -notlike 'NoMatchingEventsFound*') {
        throw
      }
    }
  }

  $truncated = $events.Count -gt 5000
  $sample = @(
    $events |
      Sort-Object -Property TimeCreated -Descending |
      Select-Object -First 5000
  )

  $result.events = @{
    state = 'ok'
    warningCount = @($sample | Where-Object { $_.Level -eq 3 }).Count
    errorCount = @($sample | Where-Object { $_.Level -eq 2 }).Count
    truncated = $truncated
    sampleLimit = 5000
    since = $since.ToUniversalTime().ToString('o')
  }
} catch {
  $result.events = @{ state = 'unavailable'; reason = (Read-FailureReason $_) }
}

$result | ConvertTo-Json -Depth 6 -Compress
`;

const missing = reason => ({state: 'unavailable', reason});
const finite = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const count = n => Number.isSafeInteger(n) && n >= 0;

const validText = (value, max = 128) =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= max &&
  value === value.trim() &&
  !/[\u0000-\u001f\u007f]/.test(value);

const validIpv4 = value => {
  if (typeof value !== 'string' || value.length > 15) return false;
  const parts = value.split('.');
  return parts.length === 4 && parts.every(part =>
    /^\d{1,3}$/.test(part) &&
    Number(part) >= 0 &&
    Number(part) <= 255
  );
};

const cpuTimes = cpus => {
  if (!Array.isArray(cpus) || !cpus.length) return null;

  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    const times = cpu?.times;

    if (!times || !['user', 'nice', 'sys', 'idle', 'irq'].every(k => finite(times[k]))) {
      return null;
    }

    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }

  return {idle, total};
};

export function cpuUsage(before, after) {
  const a = cpuTimes(before);
  const b = cpuTimes(after);

  if (!a || !b || b.total <= a.total || b.idle < a.idle ||
      b.idle - a.idle > b.total - a.total) {
    return missing('invalid_sample');
  }

  return {
    state: 'ok',
    usagePercent: Math.round(
      1000 * (1 - (b.idle - a.idle) / (b.total - a.total))
    ) / 10
  };
}

function normalizeNetwork(raw) {
  if (raw?.state === 'unavailable') {
    return missing(
      raw.reason === 'permission_denied' ? 'permission_denied' : 'query_failed'
    );
  }

  const rows = raw?.interfaces;

  if (raw?.state !== 'ok' || !Array.isArray(rows) || rows.length > 64) {
    return missing('invalid_response');
  }

  const interfaces = [];

  for (const row of rows) {
    if (!row || !validText(row.name) ||
        !Array.isArray(row.ipv4Addresses) ||
        row.ipv4Addresses.length > 32) {
      return missing('invalid_response');
    }

    if (!row.ipv4Addresses.every(validIpv4)) {
      return missing('invalid_response');
    }

    if (row.defaultGateway !== null && !validIpv4(row.defaultGateway)) {
      return missing('invalid_response');
    }

    interfaces.push({
      name: row.name,
      ipv4Addresses: [...new Set(row.ipv4Addresses)],
      defaultGateway: row.defaultGateway
    });
  }

  return {
    state: 'ok',
    interfaceCount: interfaces.length,
    ipv4Count: interfaces.reduce(
      (total, item) => total + item.ipv4Addresses.length, 0
    ),
    interfaces
  };
}

export function normalizeWindowsStatus(raw) {
  const result = {
    network: missing('invalid_response'),
    firewall: missing('invalid_response'),
    events: missing('invalid_response')
  };

  result.network = normalizeNetwork(raw?.network);

  if (raw?.firewall?.state === 'unavailable') {
    result.firewall = missing(
      raw.firewall.reason === 'permission_denied'
        ? 'permission_denied'
        : 'query_failed'
    );
  }

  const profiles = raw?.firewall?.profiles;

  if (
    raw?.firewall?.state === 'ok' &&
    Array.isArray(profiles) &&
    profiles.length === 3 &&
    ['Domain', 'Private', 'Public'].every(name =>
      profiles.some(p => p.name === name && typeof p.enabled === 'boolean')
    )
  ) {
    result.firewall = {
      state: 'ok',
      profiles: ['Domain', 'Private', 'Public'].map(name => {
        const profile = profiles.find(value => value.name === name);
        return {name, enabled: profile.enabled};
      })
    };
  }

  const events = raw?.events;

  if (events?.state === 'unavailable') {
    result.events = missing(
      events.reason === 'permission_denied'
        ? 'permission_denied'
        : 'query_failed'
    );
  }

  if (
    events?.state === 'ok' &&
    count(events.warningCount) &&
    count(events.errorCount) &&
    events.warningCount + events.errorCount <= 5000 &&
    events.sampleLimit === 5000 &&
    typeof events.truncated === 'boolean' &&
    typeof events.since === 'string' &&
    Number.isFinite(Date.parse(events.since))
  ) {
    result.events = {
      state: 'ok',
      warningCount: events.warningCount,
      errorCount: events.errorCount,
      truncated: events.truncated,
      sampleLimit: 5000,
      since: events.since
    };
  }

  return result;
}

export function createPcStatusReader({
  system = os,
  disk = statfs,
  run = execute,
  platform = os.platform(),
  clock = () => new Date(),
  pause = wait
} = {}) {
  return async function read({signal, directory = diskRoot} = {}) {
    signal?.throwIfAborted();

    const metrics = {};

    const cpu = (async () => {
      try {
        const before = system.cpus();
        await pause(200, undefined, {signal});
        metrics.cpu = {
          ...cpuUsage(before, system.cpus()),
          sampleMs: 200
        };
      } catch {
        metrics.cpu = missing(signal?.aborted ? 'cancelled' : 'query_failed');
      }
    })();

    try {
      const totalBytes = system.totalmem();
      const freeBytes = system.freemem();

      metrics.memory =
        finite(totalBytes) &&
        totalBytes > 0 &&
        finite(freeBytes) &&
        freeBytes <= totalBytes
          ? {state: 'ok', usedBytes: totalBytes - freeBytes, totalBytes}
          : missing('invalid_response');
    } catch {
      metrics.memory = missing('query_failed');
    }

    const drive = (async () => {
      try {
        const result = await disk(directory);
        const totalBytes = Number(result.blocks) * Number(result.bsize);
        const freeBytes = Number(result.bavail) * Number(result.bsize);

        metrics.disk =
          finite(totalBytes) &&
          totalBytes > 0 &&
          finite(freeBytes) &&
          freeBytes <= totalBytes
            ? {state: 'ok', totalBytes, freeBytes}
            : missing('invalid_response');
      } catch {
        metrics.disk = missing('query_failed');
      }
    })();

    const windows = (async () => {
      if (platform !== 'win32') {
        metrics.network = missing('unsupported');
        metrics.firewall = missing('unsupported');
        metrics.events = missing('unsupported');
        return;
      }

      try {
        const exe = join(
          process.env.SystemRoot || 'C:\\Windows',
          'System32',
          'WindowsPowerShell',
          'v1.0',
          'powershell.exe'
        );

        const {stdout} = await run(
          exe,
          [
            '-NoLogo',
            '-NoProfile',
            '-NonInteractive',
            '-Command',
            WINDOWS_READ
          ],
          {
            windowsHide: true,
            encoding: 'utf8',
            timeout: 8000,
            maxBuffer: 128 * 1024,
            signal
          }
        );

        Object.assign(metrics, normalizeWindowsStatus(JSON.parse(stdout.trim())));
      } catch (error) {
        const reason = signal?.aborted
          ? 'cancelled'
          : error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
            ? 'query_failed'
            : error?.killed || error?.code === 'ETIMEDOUT'
              ? 'timeout'
              : 'query_failed';

        metrics.network = missing(reason);
        metrics.firewall = missing(reason);
        metrics.events = missing(reason);
      }
    })();

    await Promise.all([cpu, drive, windows]);
    signal?.throwIfAborted();

    return {
      schema: 'aleph.on.pc-status.v1',
      measuredAt: clock().toISOString(),
      source: 'local-pc',
      metrics
    };
  };
}

export const readPcStatus = createPcStatusReader();