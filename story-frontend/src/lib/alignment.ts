import type { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel";

/**
 * Build synthetic character-level alignment data by distributing timestamps
 * proportionally across the audio duration. This approximates word timing
 * when real alignment data (e.g. from ElevenLabs TTS) is not available.
 */
export function buildSyntheticAlignment(
  text: string,
  durationSec: number
): CharacterAlignmentResponseModel {
  const characters: string[] = [];
  const characterStartTimesSeconds: number[] = [];
  const characterEndTimesSeconds: number[] = [];

  if (!text.length || durationSec <= 0) {
    return { characters, characterStartTimesSeconds, characterEndTimesSeconds };
  }

  const charDuration = durationSec / text.length;

  for (let i = 0; i < text.length; i++) {
    characters.push(text[i]);
    characterStartTimesSeconds.push(i * charDuration);
    characterEndTimesSeconds.push((i + 1) * charDuration);
  }

  return { characters, characterStartTimesSeconds, characterEndTimesSeconds };
}
