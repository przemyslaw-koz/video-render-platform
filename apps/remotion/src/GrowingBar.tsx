import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const GrowingBar = () => {
  const frame = useCurrentFrame();
  const width = interpolate(frame, [0, 60], [0, 800], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#111',
        justifyContent: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          height: 48,
          width,
          backgroundColor: '#fff',
          borderRadius: 8,
        }}
      />
    </AbsoluteFill>
  );
};
