// One save carries a note's text and all its new photos in a single server action,
// so it lands whole or not at all. These limits keep the largest possible save under
// the bodySizeLimit in next.config.ts, which in turn sits under Vercel's 4.5 MB per
// request. The server action checks them again.
export const MAX_NOTE_TITLE = 120;
export const MAX_NOTE_LENGTH = 5000;
export const MAX_NOTE_IMAGES = 8;
export const MAX_FULL_BYTES = 400_000;
export const MAX_THUMB_BYTES = 50_000;

// Longest edge and JPEG quality, best first: a photo takes the first step that fits
// its limit, so a busy street scene gives up a little sharpness and a plain ticket
// stays crisp. The thumbnail is its own file because the list would otherwise decode
// dozens of full photos at once, and iOS reloads a page that uses that much memory.
type Step = readonly [edge: number, quality: number];
const FULL_STEPS: readonly Step[] = [[1600, .8], [1600, .65], [1280, .65], [1024, .6], [800, .5]];
const THUMB_STEPS: readonly Step[] = [[480, .7], [480, .5], [320, .5]];

const UNREADABLE = "อ่านรูปนี้ไม่ได้";

// An <img> rather than createImageBitmap: it applies the photo's EXIF rotation on
// every browser, and a portrait from an iPhone camera depends on that.
function load(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const picture = new Image();
    picture.onload = () => resolve(picture);
    picture.onerror = () => reject(new Error(UNREADABLE));
    picture.src = url;
  });
}

function encode(picture: HTMLImageElement, edge: number, quality: number) {
  const scale = Math.min(1, edge / Math.max(picture.naturalWidth, picture.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(picture.naturalWidth * scale);
  canvas.height = Math.round(picture.naturalHeight * scale);
  const paint = canvas.getContext("2d");
  if (!paint) throw new Error(UNREADABLE);
  // JPEG has no transparency, so a see-through PNG would otherwise land on black.
  paint.fillStyle = "white";
  paint.fillRect(0, 0, canvas.width, canvas.height);
  paint.imageSmoothingQuality = "high";
  paint.drawImage(picture, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => {
    // iOS keeps a canvas's memory until the canvas is emptied.
    canvas.width = canvas.height = 0;
    if (blob) resolve(blob); else reject(new Error(UNREADABLE));
  }, "image/jpeg", quality));
}

async function fit(picture: HTMLImageElement, steps: readonly Step[], limit: number) {
  for (const [edge, quality] of steps) {
    const blob = await encode(picture, edge, quality);
    if (blob.size <= limit) return blob;
  }
  throw new Error(UNREADABLE);
}

// Re-encoding also drops the photo's EXIF, GPS position included, before the whole
// group can open it.
export async function shrinkPhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const picture = await load(url);
    return { full: await fit(picture, FULL_STEPS, MAX_FULL_BYTES), thumb: await fit(picture, THUMB_STEPS, MAX_THUMB_BYTES) };
  } finally { URL.revokeObjectURL(url); }
}
