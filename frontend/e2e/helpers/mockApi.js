// Reusable Playwright API mocks for deterministic auth/onboarding e2e tests.

// Mock successful register + login. The app stores `access_token` and uses
// `user` (see api.register / api.login in src/api.js).
export async function mockAuthSuccess(page, { role = 'seeker', name = 'Test User', email = 'test@example.com' } = {}) {
  const body = JSON.stringify({
    access_token: 'e2e-test-token',
    user: { id: 'user_e2e', email, role, name },
  });
  await page.route('**/api/auth/register', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body }),
  );
}

// Mock rejected auth. api._fetch throws Error(detail) on a non-ok response;
// AuthScreen renders that message.
export async function mockAuthFailure(page, message = 'Invalid email or password') {
  const fulfill = (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: message }),
    });
  await page.route('**/api/auth/register', fulfill);
  await page.route('**/api/auth/login', fulfill);
}

// Mock a seeker with no completed profile -> handleAuth routes to seeker-choice.
export async function mockEmptySeekerProfile(page) {
  await page.route('**/api/seeker/profile', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ skills: [] }),
    }),
  );
}
