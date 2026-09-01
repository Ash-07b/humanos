const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function testTaskManagement() {
  console.log('=== RUNNING COMPLETE TASK MANAGEMENT & SECURITY SUITE ===\n');

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@humanos.io`;
  const userBEmail = `user_b_${timestamp}@humanos.io`;
  const password = 'Password123!';

  // 1. Register and Login User A
  console.log('1. Registering User A...');
  const regARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Alice Developer',
      email: userAEmail,
      password: password,
    }),
  });
  const regAData = await regARes.json();
  assert.strictEqual(regARes.status, 201, 'User A registration should return 201');

  const loginARes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password }),
  });
  const loginAData = await loginARes.json();
  assert.strictEqual(loginARes.status, 200, 'User A login should return 200');
  const tokenA = loginAData.token;
  console.log('✔ User A registered and logged in successfully. Token acquired.');

  // 2. Register and Login User B
  console.log('\n2. Registering User B...');
  const regBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Bob Security',
      email: userBEmail,
      password: password,
    }),
  });
  const regBData = await regBRes.json();
  assert.strictEqual(regBRes.status, 201, 'User B registration should return 201');

  const loginBRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, password }),
  });
  const loginBData = await loginBRes.json();
  assert.strictEqual(loginBRes.status, 200, 'User B login should return 200');
  const tokenB = loginBData.token;
  console.log('✔ User B registered and logged in successfully. Token acquired.');

  // 3. User A creates a task
  console.log('\n3. User A creates a new Task...');
  const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Complete HumanOS Task Module Integration',
      description: 'Implement full CRUD backend and frontend state sync',
      priority: 'High',
      category: 'Work',
      dueDate: 'Today',
      dueTime: '11:00 AM',
      reminder: true,
    }),
  });
  const createTaskData = await createTaskRes.json();
  assert.strictEqual(createTaskRes.status, 201, 'Create task should return 201');
  assert.strictEqual(createTaskData.success, true);
  assert.strictEqual(createTaskData.task.title, 'Complete HumanOS Task Module Integration');
  assert.strictEqual(createTaskData.task.status, 'PENDING');
  const taskAId = createTaskData.task._id || createTaskData.task.id;
  console.log(`✔ Task created successfully with ID: ${taskAId}`);

  // 4. User A creates a second task
  console.log('\n4. User A creates second Task...');
  const createSecondRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Review Biometric Telemetry',
      category: 'Health',
      priority: 'Medium',
    }),
  });
  const createSecondData = await createSecondRes.json();
  assert.strictEqual(createSecondRes.status, 201);
  const secondTaskId = createSecondData.task._id || createSecondData.task.id;
  console.log(`✔ Second task created with ID: ${secondTaskId}`);

  // 5. User A gets all tasks
  console.log('\n5. User A retrieves their tasks (GET /api/tasks)...');
  const getTasksRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const getTasksData = await getTasksRes.json();
  assert.strictEqual(getTasksRes.status, 200);
  assert.strictEqual(getTasksData.success, true);
  assert.strictEqual(getTasksData.count, 2, 'User A should have exactly 2 tasks');
  console.log(`✔ User A successfully fetched ${getTasksData.count} tasks.`);

  // 6. User A gets single task by ID
  console.log('\n6. User A gets single task by ID (GET /api/tasks/:id)...');
  const getSingleRes = await fetch(`${BASE_URL}/tasks/${taskAId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const getSingleData = await getSingleRes.json();
  assert.strictEqual(getSingleRes.status, 200);
  assert.strictEqual(getSingleData.task.title, 'Complete HumanOS Task Module Integration');
  console.log(`✔ User A fetched task details: "${getSingleData.task.title}"`);

  // 7. User A updates task
  console.log('\n7. User A updates task (PUT /api/tasks/:id)...');
  const updateRes = await fetch(`${BASE_URL}/tasks/${taskAId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      title: 'Complete HumanOS Task Module Integration (UPDATED)',
      priority: 'URGENT',
      dueDate: 'Tomorrow',
    }),
  });
  const updateData = await updateRes.json();
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateData.task.title, 'Complete HumanOS Task Module Integration (UPDATED)');
  assert.strictEqual(updateData.task.priority, 'URGENT');
  assert.strictEqual(updateData.task.dueDate, 'Tomorrow');
  console.log(`✔ User A updated task title, priority to URGENT, dueDate to Tomorrow.`);

  // 8. User A toggles task complete
  console.log('\n8. User A marks task as completed (PATCH /api/tasks/:id/toggle)...');
  const toggleRes = await fetch(`${BASE_URL}/tasks/${taskAId}/toggle`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const toggleData = await toggleRes.json();
  assert.strictEqual(toggleRes.status, 200);
  assert.strictEqual(toggleData.task.status, 'COMPLETED');
  assert.ok(toggleData.task.completedAt, 'completedAt timestamp should be set');
  console.log(`✔ User A completed task: status=${toggleData.task.status}, completedAt=${toggleData.task.completedAt}`);

  // 9. Strict User Isolation & Security Verification
  console.log('\n9. SECURITY: Verifying User B cannot access, modify, or delete User A\'s task...');

  // User B tries to view User A's task
  const userBTryGet = await fetch(`${BASE_URL}/tasks/${taskAId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(userBTryGet.status, 404, 'User B must get 404 Not Found when accessing User A task');
  console.log('✔ User B cannot view User A task (HTTP 404 returned).');

  // User B tries to update User A's task
  const userBTryUpdate = await fetch(`${BASE_URL}/tasks/${taskAId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ title: 'Hacked by User B' }),
  });
  assert.strictEqual(userBTryUpdate.status, 404, 'User B must get 404 Not Found when updating User A task');
  console.log('✔ User B cannot update User A task (HTTP 404 returned).');

  // User B tries to delete User A's task
  const userBTryDelete = await fetch(`${BASE_URL}/tasks/${taskAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(userBTryDelete.status, 404, 'User B must get 404 Not Found when deleting User A task');
  console.log('✔ User B cannot delete User A task (HTTP 404 returned).');

  // User B checks their task list (must be 0)
  const userBTasksRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const userBTasksData = await userBTasksRes.json();
  assert.strictEqual(userBTasksData.count, 0, 'User B should have 0 tasks');
  console.log('✔ User B task list contains 0 tasks (no data leaks).');

  // 10. User A deletes their task
  console.log('\n10. User A deletes their task (DELETE /api/tasks/:id)...');
  const deleteRes = await fetch(`${BASE_URL}/tasks/${taskAId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const deleteData = await deleteRes.json();
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteData.success, true);
  console.log('✔ User A successfully deleted task.');

  // Verify User A now has 1 remaining task
  const finalTasksRes = await fetch(`${BASE_URL}/tasks`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const finalTasksData = await finalTasksRes.json();
  assert.strictEqual(finalTasksData.count, 1);
  console.log(`✔ User A has 1 remaining task as expected.`);

  console.log('\n=== ALL TASK CRUD & USER ISOLATION TESTS PASSED 100% ===');
}

testTaskManagement().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
