chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fetchSongInfo') {
    // Fetch current playing song information from the Google Cast API
    chrome.runtime.sendMessage({
      type: 'fetchCurrentPlayingSong',
      callbackUrl: message.callbackUrl
    });
  } else if (message.type === 'storeSpeakerList') {
    // Store speaker list in browser's local storage
    localStorage.setItem('speakerList', JSON.stringify(message.speakers));
    sendResponse({
      status: 'success'
    });
  }
});
