const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001/api';

const demo = {
  password: 'TestPass123',
  admin: { phone: '09120000001' },
  student: { phone: '09120000003' },
  buyer: { phone: '09120000004' },
  paidCourseUuid: '00000000-0000-4000-8000-000000000102',
  paidQuizUuid: '00000000-0000-4000-8000-000000000601',
  tenQuestionQuizUuid: '00000000-0000-4000-8000-000000000603',
  multipleChoiceQuestionUuid: '00000000-0000-4000-8000-000000000701',
  correctOptionUuid: '00000000-0000-4000-8000-000000000801',
  descriptiveAnswerUuid: '00000000-0000-4000-8000-000000001002',
  paymentRequestUuid: '00000000-0000-4000-8000-000000000401',
};

type RequestOptions = {
  method?: string;
  token?: string;
  body?: unknown;
};

async function api(path: string, options: RequestOptions = {}) {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  const data = text ? parseJson(text) : null;

  printExchange(method, path, options.body, response.status, data);

  if (!response.ok) {
    throw new Error(`${method} ${path} failed with HTTP ${response.status}`);
  }

  return data;
}

function parseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function printExchange(method: string, path: string, body: unknown, status: number, data: unknown) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${method} ${API_BASE_URL}${path}`);
  if (body !== undefined) {
    console.log('Request body:');
    console.log(JSON.stringify(body, null, 2));
  }
  console.log(`Status: ${status}`);
  console.log('Response:');
  console.log(JSON.stringify(data, null, 2));
}

async function login(phone: string) {
  const response = (await api('/auth/login', {
    method: 'POST',
    body: {
      phone,
      password: demo.password,
    },
  })) as { accessToken: string };

  return response.accessToken;
}

async function main() {
  console.log(`Running LearnNova API smoke test against ${API_BASE_URL}`);

  const adminToken = await login(demo.admin.phone);
  const studentToken = await login(demo.student.phone);
  const buyerToken = await login(demo.buyer.phone);

  await api('/auth/me', { token: buyerToken });
  await api('/courses');
  await api(`/courses/${demo.paidCourseUuid}`);
  await api(`/courses/${demo.paidCourseUuid}/videos`, { token: buyerToken });
  await api(`/courses/${demo.paidCourseUuid}/purchase`, { method: 'POST', token: buyerToken });
  await api(`/courses/${demo.paidCourseUuid}/quizzes`, { token: buyerToken });
  await api(`/quizzes/${demo.paidQuizUuid}`, { token: buyerToken });
  const tenQuestionQuiz = (await api(`/quizzes/${demo.tenQuestionQuizUuid}`, { token: buyerToken })) as { questions?: unknown[] };
  if (tenQuestionQuiz.questions?.length !== 10) {
    throw new Error(`Expected ten-question quiz to have 10 questions, got ${tenQuestionQuiz.questions?.length ?? 0}`);
  }
  const buyerAttempt = (await api(`/quizzes/${demo.paidQuizUuid}/attempts/start`, {
    method: 'POST',
    token: buyerToken,
  })) as { uuid: string };
  await api(`/quiz-attempts/${buyerAttempt.uuid}/answers`, {
    method: 'POST',
    token: buyerToken,
    body: {
      questionId: demo.multipleChoiceQuestionUuid,
      selectedOptionId: demo.correctOptionUuid,
    },
  });
  await api(`/quiz-attempts/${buyerAttempt.uuid}/submit`, { method: 'POST', token: buyerToken });
  await api('/payments/me', { token: buyerToken });
  await api(`/payments/${demo.paymentRequestUuid}`, { token: adminToken });
  await api(`/quizzes/${demo.paidQuizUuid}/attempts`, { token: adminToken });
  await api(`/question-answers/${demo.descriptiveAnswerUuid}/grade`, {
    method: 'PATCH',
    token: adminToken,
    body: {
      score: '4.00',
      isCorrect: true,
    },
  });
  await api('/enrollments/me', { token: studentToken });
  await api('/users', { token: adminToken });

  console.log('\nLearnNova API smoke test completed successfully.');
}

main().catch((error) => {
  console.error('\nLearnNova API smoke test failed.');
  console.error(error);
  process.exit(1);
});
