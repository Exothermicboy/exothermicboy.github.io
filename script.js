const cast = chrome.cast;

// Initialize the cast service
const service = cast.getReceiver('com.google.cast.receiver');

// Fetch speaker list when ready
service.on('connected', () => {
  fetchSpeakerList().then((speakers) => {
    const speakerList = document.getElementById('speaker-list');

    for (const speaker of speakers) {
      const option = document.createElement('option');
      option.value = speaker.id;
      option.textContent = speaker.name;
      speakerList.appendChild(option);
    }

    fetchCurrentPlayingSong();
  });
});

async function fetchSpeakerList() {
  const mediaSession = await service.getMediaSession();
  const speakerList = await mediaSession.getSpeakerList();
  return speakerList;
}

async function fetchCurrentPlayingSong() {
  // Fetch speaker list from service worker's cache
  const cachedSpeakers = await chrome.runtime.sendMessage({
    type: 'fetchSpeakerList'
  });

  if (cachedSpeakers) {
    console.log('Using cached speaker list:', cachedSpeakers);
    setSpeakerList(cachedSpeakers);
  } else {
    // Fetch speaker list from Google Cast API
    const speakerList = await fetchSpeakerList();

    // Cache speaker list in service worker
    chrome.runtime.sendMessage({
      type: 'storeSpeakerList',
      speakers: speakerList
    });

    setSpeakerList(speakerList);
  }

  // Calculate the progress of the current playing song
  const mediaSession = await service.getMediaSession();
  const mediaInformation = mediaSession.getMediaInformation();
  const playbackState = mediaSession.getPlaybackState();

  const progress = playbackState.currentTime / mediaInformation.duration;

  // Update the width of the progress bar
  document.getElementById('progress').style.width = `${progress * 100}%`;

  // Fetch current playing song information from Google Cast API
  mediaSession.on('playerStateChange', (playerState) => {
    const progress = playerState.currentTime / mediaInformation.duration;
    document.getElementById('progress').style.width = `${progress * 100}%`;

    if (playerState.isPlaying) {
      document.getElementById('play-pause').textContent = 'Pause';
    } else {
      document.getElementById('play-pause').textContent = 'Play';
    }

    // Update volume
    document.getElementById('volume-slider').value = mediaSession.getVolume();
  });
}

// Set the speaker using the selected speaker ID
async function setSpeaker(speakerId) {
  const mediaSession = await service.getMediaSession();
  await mediaSession.setSpeakerId(speakerId);

  fetchCurrentPlayingSong();
}

// Toggle playback
async function togglePlayback() {
  const mediaSession = await service.getMediaSession();
  const newPlaybackState = !mediaSession.getPlaybackState().isPlaying;
  await mediaSession.setPlaybackState(newPlaybackState);

  fetchCurrentPlayingSong();
}

// Seek to a specified position
async function seekTo(position) {
  const mediaSession = await service.getMediaSession();
  await mediaSession.seek(position);
}
