import TrackPlayer, { Event } from 'react-native-track-player';

module.exports = async function() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));

  // Use seekBy() for jump controls - this is the recommended approach per react-native-track-player docs
  // The interval parameter comes from forwardJumpInterval/backwardJumpInterval set in updateOptions
  TrackPlayer.addEventListener(Event.RemoteJumpForward, async (event) => {
    await TrackPlayer.seekBy(event.interval || 15);
  });

  TrackPlayer.addEventListener(Event.RemoteJumpBackward, async (event) => {
    await TrackPlayer.seekBy(-(event.interval || 15));
  });
};
