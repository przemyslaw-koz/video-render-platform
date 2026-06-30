import {staticFile} from 'remotion';
import type {AssetRef} from '../types/race-config';

export const getAssetSrc = (
  name: string,
  assets: Record<string, AssetRef>,
): string | null => {
  const asset = assets[name];
  if (!asset) {
    return null;
  }

  return staticFile(asset.src);
};
