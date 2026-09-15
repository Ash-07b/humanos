const { parseScheduledDateTime, isReminderDue, getMsUntilDue } = require('../backend/utils/timeHelper');

function testTimeHelper() {
  console.log('Testing timeHelper utility:');

  const refTime = new Date('2026-09-13T19:10:00'); // 7:10 PM

  // Test 1: Past time today
  const past = parseScheduledDateTime('07:00 PM', 'Today');
  const pastDue = isReminderDue('07:00 PM', 'Today', refTime);
  console.log('1. Past time 07:00 PM vs 07:10 PM:');
  console.log(`   Target: ${past.toISOString()}, isDue: ${pastDue} (Expected: true)`);

  // Test 2: Future time today
  const future = parseScheduledDateTime('07:30 PM', 'Today');
  const futureDue = isReminderDue('07:30 PM', 'Today', refTime);
  const msWait = getMsUntilDue('07:30 PM', 'Today', refTime);
  console.log('2. Future time 07:30 PM vs 07:10 PM:');
  console.log(`   Target: ${future.toISOString()}, isDue: ${futureDue} (Expected: false), Wait minutes: ${msWait / 60000} (Expected: 20)`);

  // Test 3: Exactly now
  const nowDue = isReminderDue('07:10 PM', 'Today', refTime);
  console.log('3. Exact time 07:10 PM vs 07:10 PM:');
  console.log(`   isDue: ${nowDue} (Expected: true)`);

  // Test 4: 12-hour AM/PM edge cases
  const noon = parseScheduledDateTime('12:00 PM', 'Today');
  console.log(`4. Noon: ${noon.getHours()}:${noon.getMinutes()} (Expected: 12:0)`);
  const midnight = parseScheduledDateTime('12:00 AM', 'Today');
  console.log(`5. Midnight: ${midnight.getHours()}:${midnight.getMinutes()} (Expected: 0:0)`);
  const afternoon = parseScheduledDateTime('2:30 PM', 'Today');
  console.log(`6. 2:30 PM: ${afternoon.getHours()}:${afternoon.getMinutes()} (Expected: 14:30)`);
  const morning = parseScheduledDateTime('9:15 AM', 'Today');
  console.log(`7. 9:15 AM: ${morning.getHours()}:${morning.getMinutes()} (Expected: 9:15)`);

  // Test 5: Tomorrow
  const tomorrowDue = isReminderDue('07:00 PM', 'Tomorrow', refTime);
  console.log(`8. Tomorrow 7:00 PM isDue: ${tomorrowDue} (Expected: false)`);

  console.log('All timeHelper tests executed!');
}

testTimeHelper();
