import useSoundLibrary from 'use-sound';

const noop = () => {};

export function useSound(
  url,
  { soundEnabled, ...config } = { soundEnabled: true }
) {
  const [playSound, ...other] = useSoundLibrary(url, config);
  return [soundEnabled ? playSound : noop, ...other];
}

export default useSound;
