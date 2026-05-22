/**
 * E2E: 로그인 → 비행편 등록 → refresh 토스트
 *
 * 사전 조건: 백엔드(API)가 PLAYWRIGHT_API_URL(기본 http://127.0.0.1:8000)에서 실행 중.
 * 테스트 계정: PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD (미설정 시 스킵).
 */
import { test, expect } from '@playwright/test';

const email = process.env.PLAYWRIGHT_TEST_EMAIL;
const password = process.env.PLAYWRIGHT_TEST_PASSWORD;
const flightId = process.env.PLAYWRIGHT_TEST_FLIGHT_ID ?? 'KE901';

test.describe('flight alert happy path', () => {
  test.skip(
    !email || !password,
    'PLAYWRIGHT_TEST_EMAIL 및 PLAYWRIGHT_TEST_PASSWORD 환경 변수가 필요합니다.',
  );

  test('login, register flight, refresh shows toast', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/이메일|email/i).fill(email);
    await page.getByLabel(/비밀번호|password/i).fill(password);
    await page.getByRole('button', { name: /로그인|log in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('button', { name: /비행편 등록|Add flight/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/편명|flight/i).fill(flightId);
    await dialog.getByRole('button', { name: /등록|register|save/i }).click();

    await expect(page.getByText(new RegExp(flightId, 'i'))).toBeVisible({ timeout: 15_000 });

    const refreshBtn = page.getByRole('button', { name: /정보 갱신|Refresh info/i }).first();
    await refreshBtn.click();

    const toast = page.locator('[role="status"], [data-sonner-toast], .toast').first();
    await expect(toast).toBeVisible({ timeout: 15_000 });
  });
});
