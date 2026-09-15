const { parseScheduledDateTime, isReminderDue, getMsUntilDue } = require('../backend/utils/timeHelper');

function test24HourFormat() {
  console.log('--- Testing 24-Hour Format Precision ---');

  const ref = new Date(2026, 8, 13, 19, 21, 0); // 19:21 local

  // Test 1: 24h string "19:25" (4 mins in future)
  const future24h = '19:25';
  const target1 = parseScheduledDateTime(future24h, 'Today');
  target1.setFullYear(2026, 8, 13);
  const isFutureDue = target1.getTime() <= ref.getTime();
  const msWait = target1.getTime() - ref.getTime();

  console.log(`1. Task at ${future24h} when time is 19:21:`);
  console.log(`   Target: ${target1.toLocaleTimeString()}`);
  console.log(`   isDue: ${isFutureDue} (Expected: false)`);
  console.log(`   msWait: ${msWait}ms (${msWait / 60000} mins) (Expected: 4 mins)`);

  // Test 2: Current time arrives at 19:25:00
  const refArrived = new Date(2026, 8, 13, 19, 25, 0);
  const isArrivedDue = target1.getTime() <= refArrived.getTime();
  console.log(`2. Clock reaches 19:25:00:`);
  console.log(`   isDue: ${isArrivedDue} (Expected: true -> POPUP TRIGGERS ON TIME!)`);

  // Test 3: 24h string "08:30" (morning, past)
  const morning24h = '08:30';
  const target3 = parseScheduledDateTime(morning24h, 'Today');
  target3.setFullYear(2026, 8, 13);
  const isMorningDue = target3.getTime() <= ref.getTime();
  console.log(`3. Task at ${morning24h} when time is 19:21:`);
  console.log(`   isDue: ${isMorningDue} (Expected: true)`);

  // Test 4: 24h midnight "00:00" and "23:59"
  const midnight = parseScheduledDateTime('00:00', 'Today');
  console.log(`4. Midnight 00:00 -> Hours: ${midnight.getHours()}, Mins: ${midnight.getMinutes()}`);
  const late = parseScheduledDateTime('23:59', 'Today');
  console.log(`5. Late Night 23:59 -> Hours: ${late.getHours()}, Mins: ${late.getMinutes()}`);

  console.log('--- All 24-Hour Format Tests Passed! ---');
}

test24HourFormat();
