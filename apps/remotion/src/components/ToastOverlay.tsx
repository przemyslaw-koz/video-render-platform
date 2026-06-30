import {interpolate, useCurrentFrame} from 'remotion';
import type {ResolvedRaceFonts, ResolvedToast} from '../types/race-config';
import {getActiveToast} from '../lib/resolve-toasts';

const FADE_FRAMES = 18;
const TOAST_FONT_SIZE = 28;

type ToastOverlayProps = {
  toasts: ResolvedToast[];
  fonts: ResolvedRaceFonts;
};

export const ToastOverlay = ({toasts, fonts}: ToastOverlayProps) => {
  const frame = useCurrentFrame();
  const activeToast = getActiveToast(frame, toasts);

  if (!activeToast) {
    return null;
  }

  const localFrame = frame - activeToast.startFrame;
  const remainingFrames = activeToast.endFrame - frame;
  const fadeIn = interpolate(localFrame, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(remainingFrames, [0, FADE_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const opacity = Math.min(fadeIn, fadeOut);
  const translateY = interpolate(fadeIn, [0, 1], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        bottom: 64,
        opacity,
        transform: `translateY(${translateY}px)`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          margin: '0 auto',
          maxWidth: 1200,
          padding: '20px 28px',
          borderRadius: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.78)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          color: '#FFFFFF',
          fontFamily: fonts.label,
          fontSize: TOAST_FONT_SIZE,
          lineHeight: 1.4,
          textAlign: 'center',
        }}
      >
        {activeToast.message}
      </div>
    </div>
  );
};
