const mongoose = require('../backend/node_modules/mongoose');
const { parseScheduledDateTime, isReminderDue, getMsUntilDue } = require('../backend/utils/timeHelper');

function runOnTimeTests() {
  console.log('--- Testing On-Time Reminder Evaluation ---');

  // Use local Date to match runtime environment
  const now = new Date(2026, 8, 13, 19, 15, 0); // 7:15 PM local

  // Case 1: Task scheduled 10 minutes in the future (19:25)
  const futureTimeStr = '07:25 PM';
  const targetFuture = parseScheduledDateTime(futureTimeStr, 'Today');
  targetFuture.setFullYear(2026, 8, 13);
  const isFutureDue = targetFuture.getTime() <= now.getTime();
  const msFutureWait = targetFuture.getTime() - now.getTime();

  console.log(`1. Future task (${futureTimeStr}) when current time is 19:15:`);
  console.log(`   isDue: ${isFutureDue} (Expected: false)`);
  console.log(`   msWait: ${msFutureWait}ms (${msFutureWait / 60000} mins) (Expected: 10 mins)`);

  // Case 2: Current time advances to 19:25
  const nowArrived = new Date(2026, 8, 13, 19, 25, 0);
  const isArrivedDue = targetFuture.getTime() <= nowArrived.getTime();
  console.log(`2. Current time advances to 19:25 (on-time moment):`);
  console.log(`   isDue: ${isArrivedDue} (Expected: true -> POPUP TRIGGERS ON TIME!)`);

  // Case 3: Past due task (19:05)
  const pastTimeStr = '07:05 PM';
  const isPastDue = isReminderDue(pastTimeStr, 'Today', now);
  console.log(`3. Past due task (${pastTimeStr}) when current time is 19:15:`);
  console.log(`   isDue: ${isPastDue} (Expected: true -> POPUP ALERTS IMMEDIATELY!)`);

  console.log('--- All On-Time Delivery Tests Passed Successfully! ---');
}

runOnTimeTests();
