import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% of requests must be faster than 100ms (virtualization target)
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const EMAIL = __ENV.EMAIL || 'admin@example.com';
const PASSWORD = __ENV.PASSWORD || 'password';
const MODULE_ID = __ENV.MODULE_ID || 'test-module-id';

export default function () {
  // 1. Login
  const loginPayload = JSON.stringify({
    email: EMAIL,
    password: PASSWORD,
  });

  const loginHeaders = { 'Content-Type': 'application/json' };
  const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, { headers: loginHeaders });

  check(loginRes, {
    'logged in successfully': (r) => r.status === 201 || r.status === 200,
  });

  const token = loginRes.json('accessToken');
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Simulate Grid Scroll (Fetching pages of rows)
  // Fetch page 1 (rows 0-100)
  const res1 = http.get(`${BASE_URL}/modules/${MODULE_ID}/rows?limit=100&offset=0`, { headers: authHeaders });
  
  check(res1, {
    'page 1 status 200': (r) => r.status === 200,
    'page 1 duration < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(0.5); // User scrolls

  // Fetch page 2 (rows 100-200)
  const res2 = http.get(`${BASE_URL}/modules/${MODULE_ID}/rows?limit=100&offset=100`, { headers: authHeaders });
  
  check(res2, {
    'page 2 status 200': (r) => r.status === 200,
  });

  sleep(1);
}
