/**
 * SDK 58 Phase 1 stub for the react-native-track-player API surface this app uses.
 * RNTP doesn't build on RN 0.87+; every call is a no-op so Phase 1 builds without audio.
 * Phase 2 (expo-audio store, docs/EXPO_SDK_58_UPGRADE.md) deletes this file. Never merge it alone.
 */

export enum State {
  None = 'none',
  Ready = 'ready',
  Playing = 'playing',
  Paused = 'paused',
  Stopped = 'stopped',
  Loading = 'loading',
  Buffering = 'buffering',
  Error = 'error',
  Ended = 'ended',
}

export enum Event {
  PlaybackState = 'playback-state',
  PlaybackActiveTrackChanged = 'playback-active-track-changed',
  RemotePlay = 'remote-play',
  RemotePause = 'remote-pause',
  RemoteStop = 'remote-stop',
  RemoteSeek = 'remote-seek',
  RemoteJumpForward = 'remote-jump-forward',
  RemoteJumpBackward = 'remote-jump-backward',
}

export enum Capability {
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  SeekTo = 'seek-to',
  JumpForward = 'jump-forward',
  JumpBackward = 'jump-backward',
}

export enum RepeatMode {
  Off = 0,
  Track = 1,
  Queue = 2,
}

export enum AppKilledPlaybackBehavior {
  ContinuePlayback = 'continue-playback',
  PausePlayback = 'pause-playback',
  StopPlaybackAndRemoveNotification = 'stop-playback-and-remove-notification',
}

export enum AndroidAudioContentType {
  Music = 'music',
  Speech = 'speech',
}

export interface Track {
  url: string;
  id?: string;
  title?: string;
  artist?: string;
  artwork?: string;
  duration?: number;
  [key: string]: unknown;
}

export interface Progress {
  position: number;
  duration: number;
  buffered: number;
}

type Handler = (event: any) => void | Promise<void>;

const noop = async (..._args: unknown[]): Promise<void> => {};

const TrackPlayer = {
  setupPlayer: noop,
  updateOptions: noop,
  registerPlaybackService: (_factory: () => unknown): void => {},
  addEventListener: (_event: Event, _handler: Handler) => ({ remove: () => {} }),
  add: noop,
  reset: noop,
  play: noop,
  pause: noop,
  stop: noop,
  seekTo: noop,
  seekBy: noop,
  setRate: noop,
  setRepeatMode: noop,
  getActiveTrack: async (): Promise<Track | undefined> => undefined,
  getPlaybackState: async (): Promise<{ state: State }> => ({ state: State.None }),
  getProgress: async (): Promise<Progress> => ({ position: 0, duration: 0, buffered: 0 }),
  getQueue: async (): Promise<Track[]> => [],
};

export default TrackPlayer;

export const useProgress = (_updateInterval?: number): Progress => ({ position: 0, duration: 0, buffered: 0 });

export const useTrackPlayerEvents = (_events: Event[], _handler: Handler): void => {};
