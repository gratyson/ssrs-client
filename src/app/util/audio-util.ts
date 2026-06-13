export function getAudioMimeType(audioFileName: string): string {
    return "audio/" + audioFileName.substring(audioFileName.lastIndexOf(".") + 1);
}