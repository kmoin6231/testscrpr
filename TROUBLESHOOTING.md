# Troubleshooting Guide: Scraping Operation Already in Progress

## Issue
Sometimes when using the Waqf Scraper application, you may encounter the error message:

```
A scraping operation is already in progress.
```

This can happen due to several reasons:
1. A previous scraping operation is still running
2. A previous operation was terminated unexpectedly without proper cleanup
3. The server was restarted during an active scraping operation

## How to Fix

### 1. Using the Reset Button
When you see the "A scraping operation is already in progress" error, a "Reset Stuck Scraping Operation" button will appear directly below the error message. 

1. Click this button to reset the scraping state on the server
2. Wait for the confirmation message "Previous scraping operation reset successfully"
3. Try your scraping operation again

### 2. Manual Reset with Force Parameter
If the UI reset button doesn't work, you can manually reset the scraping operation:

#### Using the API Directly
```javascript
await fetch('http://localhost:5001/reset-scraping?clearLogs=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### Using the Force Parameter in Scrape Request
You can also force a new scrape operation to start by adding `?force=true` to your scrape request:

```javascript
await fetch('http://localhost:5001/scrape?force=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // Your scrape parameters
  })
});
```

### 3. Server Restart
As a last resort, you can restart the server:

1. Stop the server process
2. Start the server again
3. The scraping state will be reset on server restart

## Prevention

To prevent this issue from occurring:
1. Avoid closing the browser tab during an active scraping operation
2. Wait for operations to complete before starting new ones
3. Use the "Abort Operation" button if you need to stop a scrape in progress

## Technical Details

The server maintains an `isScrapingActive` flag that tracks the state of scraping operations. When a scrape starts, this flag is set to `true`. When a scrape completes or is aborted, the flag is set to `false`.

If the server crashes or is forcibly terminated during a scrape, this flag remains `true` in memory until the server is restarted or the flag is manually reset.

The `/scraping-status` and `/reset-scraping` endpoints are provided to check and reset this flag.
