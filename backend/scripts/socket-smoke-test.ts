import { io } from 'socket.io-client';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api';
const SOCKET_BASE_URL = process.env.SOCKET_BASE_URL ?? 'http://localhost:3001/quiz';

const demo = {
  password: 'TestPass123',
  buyerPhone: '09120000004',
  paidCourseUuid: '00000000-0000-4000-8000-000000000102',
  tenQuestionQuizUuid: '00000000-0000-4000-8000-000000000603',
};

async function api(path: string, options: { method?: string; token?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  const login = (await api('/auth/login', {
    method: 'POST',
    body: {
      phone: demo.buyerPhone,
      password: demo.password,
    },
  })) as { accessToken: string };

  await api(`/courses/${demo.paidCourseUuid}/purchase`, {
    method: 'POST',
    token: login.accessToken,
  });

  const attempt = (await api(`/quizzes/${demo.tenQuestionQuizUuid}/attempts/start`, {
    method: 'POST',
    token: login.accessToken,
  })) as { uuid: string };

  const socket = io(SOCKET_BASE_URL, {
    transports: ['websocket'],
  });

  await waitFor(socket, 'connect', 5000);
  socket.emit('socket:join', {
    channel: 'quiz:attempt',
    attemptUuid: attempt.uuid,
  });

  const joined = await waitFor<{ channel: string; attemptUuid: string }>(socket, 'socket:joined', 5000);
  const state = await waitFor<{ remainingSeconds: number; attemptUuid: string; channel: string }>(socket, 'quiz:state', 5000);
  const timer = await waitFor<{ remainingSeconds: number; attemptUuid: string; channel: string }>(socket, 'quiz:timer', 5000);

  if (joined.channel !== 'quiz:attempt' || joined.attemptUuid !== attempt.uuid) {
    throw new Error(`Unexpected joined payload: ${JSON.stringify(joined)}`);
  }
  if (state.channel !== 'quiz:attempt' || state.attemptUuid !== attempt.uuid || typeof state.remainingSeconds !== 'number') {
    throw new Error(`Unexpected state payload: ${JSON.stringify(state)}`);
  }
  if (timer.channel !== 'quiz:attempt' || timer.attemptUuid !== attempt.uuid || typeof timer.remainingSeconds !== 'number') {
    throw new Error(`Unexpected timer payload: ${JSON.stringify(timer)}`);
  }

  socket.emit('socket:leave', {
    channel: 'quiz:attempt',
    attemptUuid: attempt.uuid,
  });
  socket.close();

  console.log('LearnNova socket smoke test completed successfully.');
  console.log(JSON.stringify({ joined, state, timer }, null, 2));
}

function waitFor<T = unknown>(socket: ReturnType<typeof io>, event: string, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for socket event: ${event}`));
    }, timeoutMs);

    const onEvent = (payload: T) => {
      cleanup();
      resolve(payload);
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onSocketError = (payload: unknown) => {
      cleanup();
      reject(new Error(`Socket error event: ${JSON.stringify(payload)}`));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      socket.off(event, onEvent);
      socket.off('connect_error', onError);
      socket.off('socket:error', onSocketError);
    };

    socket.once(event, onEvent);
    socket.once('connect_error', onError);
    socket.once('socket:error', onSocketError);
  });
}

main().catch((error) => {
  console.error('LearnNova socket smoke test failed.');
  console.error(error);
  process.exit(1);
});
