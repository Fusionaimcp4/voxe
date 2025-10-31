import { notifications } from '../lib/notifications';

// Test the notification system
console.log('Testing notification system...');

// Test success notification
notifications.success('Test success message', 'Success Test');

// Test error notification
notifications.error('Test error message', 'Error Test');

// Test warning notification
notifications.warning('Test warning message', 'Warning Test');

// Test info notification
notifications.info('Test info message', 'Info Test');

console.log('All notification tests completed!');
