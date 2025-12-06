# Centralized Logging Service

This logging service provides a centralized way to log errors and success messages throughout the application. Logs are persisted to AsyncStorage and can be exported for support purposes.

## Features

- **Persistent Logging**: Logs are stored in AsyncStorage and persist across app restarts
- **FIFO Management**: Automatically maintains a maximum of 1000 log lines (configurable)
- **Thread-Safe**: Uses a queue system to ensure async-safe operations
- **Multiple Log Levels**: ERROR, SUCCESS, WARNING, INFO
- **Export Functionality**: Export logs to a file with device and app information
- **Easy Integration**: Simple API for logging throughout the app

## Usage

### Basic Logging

```typescript
import { logError, logSuccess, logWarning, logInfo } from '../../services/logging/logger';

// Log an error
try {
  await someOperation();
} catch (error) {
  await logError(`Failed to perform operation: ${error.message}`);
}

// Log a success (only when explicitly needed)
await logSuccess('User successfully logged in');

// Log a warning
await logWarning('API response took longer than expected');

// Log info
await logInfo('User navigated to Settings screen');
```

### Retrieving Logs

```typescript
import { getLogs, getLogsAsString, getLogStats } from '../../services/logging/logger';

// Get all logs as array
const logs = await getLogs();
console.log(logs);

// Get logs as formatted string
const logsString = await getLogsAsString();
console.log(logsString);

// Get log statistics
const stats = await getLogStats();
console.log(`Total logs: ${stats.total}, Errors: ${stats.errors}`);
```

### Exporting Logs

```typescript
import { exportLogsToFile } from '../../services/logging/logger';
import DeviceInfo from 'react-native-device-info';

// Export logs to file
const deviceInfo = {
  model: DeviceInfo.getModel(),
  systemName: DeviceInfo.getSystemName(),
  systemVersion: DeviceInfo.getSystemVersion(),
  deviceName: await DeviceInfo.getDeviceName(),
};

const appInfo = {
  version: DeviceInfo.getVersion(),
  buildNumber: DeviceInfo.getBuildNumber(),
};

const logFilePath = await exportLogsToFile(deviceInfo, appInfo);
console.log('Logs exported to:', logFilePath);
```

### Clearing Logs

```typescript
import { clearLogs } from '../../services/logging/logger';

// Clear all logs
await clearLogs();
```

## Integration Examples

### Example 1: Download Manager

```typescript
// In downloadManager.ts
import { logError, logSuccess } from '../logging/logger';

export const downloadSermon = async (message: SermonMessage) => {
  try {
    // ... download logic ...
    await logSuccess(`Successfully downloaded sermon: ${message.Title}`);
    return downloadPath;
  } catch (error) {
    await logError(`Failed to download sermon ${message.Title}: ${error.message}`);
    throw error;
  }
};
```

### Example 2: API Calls

```typescript
// In api.ts
import { logError, logWarning } from '../logging/logger';

export const fetchSermons = async () => {
  try {
    const response = await axios.get('/api/sermons');
    
    if (response.status !== 200) {
      await logWarning(`API returned non-200 status: ${response.status}`);
    }
    
    return response.data;
  } catch (error) {
    await logError(`Failed to fetch sermons: ${error.message}`);
    throw error;
  }
};
```

### Example 3: User Actions

```typescript
// In LoginScreen.tsx
import { logError, logSuccess } from '../../services/logging/logger';

const handleLogin = async () => {
  try {
    await loginUser(email, password);
    await logSuccess('User logged in successfully');
    navigation.navigate('Home');
  } catch (error) {
    await logError(`Login failed for user ${email}: ${error.message}`);
    Alert.alert('Error', 'Login failed. Please try again.');
  }
};
```

## Configuration

The logging service can be configured by modifying the constants in `logger.ts`:

- `MAX_LOG_LINES`: Maximum number of log lines to keep (default: 1000)
- `LOG_STORAGE_KEY`: AsyncStorage key for logs (default: '@thrive_app_logs')

## Log Format

Each log entry includes:
- **Timestamp**: ISO 8601 format (e.g., "2024-01-15T10:30:45.123Z")
- **Level**: ERROR, SUCCESS, WARNING, or INFO
- **Message**: The log message

Example log entry:
```
[2024-01-15T10:30:45.123Z] [ERROR] Failed to download sermon: Network error
```

## Best Practices

1. **Log Errors**: Always log errors with context about what operation failed
2. **Log Success Sparingly**: Only log success for important operations (e.g., login, download completion)
3. **Include Context**: Include relevant information in log messages (e.g., user ID, resource ID)
4. **Don't Log Sensitive Data**: Never log passwords, tokens, or other sensitive information
5. **Use Appropriate Levels**: Use ERROR for failures, SUCCESS for important completions, WARNING for potential issues, INFO for general information

## Sending Logs to Support

Users can send logs to support via the "Send Logs" option in the More screen. This will:
1. Export logs to a file with device and app information
2. Open the share dialog with email pre-configured
3. Attach the log file to the email

The log file includes:
- Device information (model, OS version, etc.)
- App information (version, build number)
- All logged messages with timestamps and levels
- A unique feedback ID for tracking

## Notes

- Logs are stored in AsyncStorage and will persist across app restarts
- The FIFO system ensures the log file doesn't grow indefinitely
- All logging operations are async and queued to prevent race conditions
- Console logs are still output for development purposes

