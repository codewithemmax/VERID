chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'CAPTURE_SCREENSHOT') return false;

  chrome.tabs.captureVisibleTab(
    { format: 'jpeg', quality: 60 },
    (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ dataUrl: null });
      } else {
        sendResponse({ dataUrl });
      }
    }
  );

  return true; // keep message channel open for async response
});
