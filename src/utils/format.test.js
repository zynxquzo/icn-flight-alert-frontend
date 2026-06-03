import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flightTypeLabel,
  formatIncheonDateTime,
  formatIsoDateTime,
  normalizeFlightId,
  notificationTypeLabel,
  parseIncheonDateTimeToDate,
  shouldPollFlightSoon,
  summarizeRefreshResult,
  terminalForChatOption,
} from './format.js';

describe('formatIncheonDateTime', () => {
  it('formats 12-char Incheon datetime', () => {
    expect(formatIncheonDateTime('202605221030')).toBe('2026-05-22 10:30');
  });

  it('returns em dash for empty', () => {
    expect(formatIncheonDateTime(null)).toBe('—');
    expect(formatIncheonDateTime('')).toBe('—');
  });

  it('returns raw string when too short', () => {
    expect(formatIncheonDateTime('202605')).toBe('202605');
  });
});

describe('formatIsoDateTime', () => {
  it('returns em dash for falsy input', () => {
    expect(formatIsoDateTime(null)).toBe('—');
    expect(formatIsoDateTime('')).toBe('—');
  });

  it('formats ISO string with given locale', () => {
    const result = formatIsoDateTime('2026-06-02T10:30:00.000Z', 'en-US');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('normalizeFlightId', () => {
  it('trims, uppercases, removes spaces', () => {
    expect(normalizeFlightId(' ke 123 ')).toBe('KE123');
  });
});

describe('parseIncheonDateTimeToDate', () => {
  it('parses local calendar components', () => {
    const d = parseIncheonDateTimeToDate('202605221430');
    expect(d).not.toBeNull();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(22);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });

  it('returns null for invalid input', () => {
    expect(parseIncheonDateTimeToDate('')).toBeNull();
    expect(parseIncheonDateTimeToDate('2026')).toBeNull();
  });
});

describe('shouldPollFlightSoon', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 4, 22, 8, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when active and departure within 3 hours', () => {
    const flight = {
      is_active: true,
      schedule_date_time: '202605221030',
      estimated_date_time: null,
    };
    expect(shouldPollFlightSoon(flight)).toBe(true);
  });

  it('returns false when inactive', () => {
    expect(
      shouldPollFlightSoon({
        is_active: false,
        schedule_date_time: '202605221030',
      }),
    ).toBe(false);
  });

  it('returns false when more than 3 hours away', () => {
    expect(
      shouldPollFlightSoon({
        is_active: true,
        schedule_date_time: '202605221800',
      }),
    ).toBe(false);
  });

  it('returns false when schedule is in the past', () => {
    expect(
      shouldPollFlightSoon({
        is_active: true,
        schedule_date_time: '202605220700',
      }),
    ).toBe(false);
  });
});

describe('flightTypeLabel', () => {
  it('returns translated label when t resolves the key', () => {
    const t = (key) => (key === 'enums.flightType.departure' ? '출발' : key);
    expect(flightTypeLabel(t, 'departure')).toBe('출발');
  });

  it('falls back to built-in map when t is not provided', () => {
    expect(flightTypeLabel(null, 'arrival')).toBe('도착');
    expect(flightTypeLabel(null, 'departure')).toBe('출발');
  });

  it('returns em dash for unknown type', () => {
    expect(flightTypeLabel(null, undefined)).toBe('—');
  });
});

describe('notificationTypeLabel', () => {
  it('returns translated label when t resolves the key', () => {
    const t = (key) => (key === 'enums.notificationType.delay' ? '지연' : key);
    expect(notificationTypeLabel(t, 'delay')).toBe('지연');
  });

  it('falls back to built-in map when t is not provided', () => {
    expect(notificationTypeLabel(null, 'gate_change')).toBe('게이트 변경');
    expect(notificationTypeLabel(null, 'cancel')).toBe('취소');
  });

  it('returns unknown type as-is', () => {
    expect(notificationTypeLabel(null, 'unknown_type')).toBe('unknown_type');
  });
});

describe('terminalForChatOption', () => {
  it('maps terminal id to T1 or T2', () => {
    expect(terminalForChatOption('P03')).toBe('T1');
    expect(terminalForChatOption('T2')).toBe('T2');
    expect(terminalForChatOption('2')).toBe('T2');
  });
});

describe('summarizeRefreshResult', () => {
  it('reports no changes', () => {
    expect(summarizeRefreshResult({ changes_detected: false, changes: [] })).toContain(
      '변경',
    );
  });

  it('summarizes detected changes', () => {
    const msg = summarizeRefreshResult({
      changes_detected: true,
      changes: [
        { change_type: 'gate_change', old_value: '114', new_value: '115' },
      ],
    });
    expect(msg).toContain('게이트');
    expect(msg).toContain('114');
    expect(msg).toContain('115');
  });
});
