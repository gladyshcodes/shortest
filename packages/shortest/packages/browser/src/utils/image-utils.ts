/**
 * @fileoverview This module handles image resizing,
 * content dimension extraction, and coordinate adjustment,
 * needed to adjust images sent to Claude to recommended image dimensions based on Claude's guidelines.
 * @see https://docs.anthropic.com/en/docs/build-with-claude/vision#evaluate-image-size
 */

import sharp from "sharp";

const PADDING_BACKGROUND = "#000";

interface ImageDimention {
  width: number;
  height: number;
}

const images: Buffer[] = [];

function getLatestScreenshot() {
  return images[images.length - 1];
}

export const aspectRatioToDimensionsMap: Record<string, ImageDimention> = {
  "1:1": { width: 1092, height: 1092 },
  "3:4": { width: 951, height: 1268 },
  "2:3": { width: 896, height: 1344 },
  "9:16": { width: 819, height: 1456 },
  "1:2": { width: 784, height: 1568 },
};

/**
 * Resizes an image to fit within specified dimensions while preserving the aspect ratio.
 * If necessary, padding is added to prevent distortion.
 *
 * @param imageBuffer - The image buffer to resize.
 * @param targetDimention - The target dimensions (width and height) for the resized image.
 * @returns A promise that resolves with the resized image buffer.
 */
export async function resizeToDimention(
  imageBuffer: Buffer,
  targetDimention: ImageDimention
) {
  const image = await sharp(imageBuffer)
    .resize(targetDimention.width, targetDimention.height, {
      fit: "contain",
      background: PADDING_BACKGROUND,
    })
    .toBuffer();

  images.push(image);
  return image;
}

/**
 * Extracts the content dimensions (width and height) of an image, ignoring padding.
 *
 * @param image - The image buffer from which to extract the content dimensions.
 * @returns A promise that resolves with the content dimensions of the image.
 */
export async function getImageContentDimentions(
  image: Buffer
): Promise<ImageDimention> {
  const trimmedImage = await sharp(image)
    .trim({
      background: PADDING_BACKGROUND,
    })
    .toBuffer();
  const { width, height } = await sharp(trimmedImage).metadata();
  return {
    width: width || 0,
    height: height || 0,
  };
}

/**
 * Provides the recommended aspect ratio for an image based on the input dimensions.
 * This function currently always returns "9:16", which is the default.
 *
 * @param _dimention - The dimensions of the image (unused in the current implementation).
 * @returns The recommended aspect ratio (key of aspectRatioToDimensionsMap).
 */
export function getClaudeImageRecommendedAspectRatio(
  _dimention: ImageDimention
): keyof typeof aspectRatioToDimensionsMap {
  return "9:16";
}

/**
 * Adjusts the coordinates of a point (xIn, yIn) to fit within the content of an image,
 * accounting for padding and aspect ratio.
 *
 * @param xIn - The x-coordinate within the original image.
 * @param yIn - The y-coordinate within the original image.
 * @returns A promise that resolves with the adjusted x and y coordinates relative to the content area.
 */
export async function getAdjustedImageCoords(xIn: number, yIn: number) {
  const deviceViewport = __shortest__.driver!.getDeviceInfo().viewport;
  const originalWidth = deviceViewport.width;
  const originalHeight = deviceViewport.height;

  const contentDimentions = await getImageContentDimentions(
    getLatestScreenshot()
  );

  const containerDimensions =
    getClaudeImageRecommendedAspectRatio(deviceViewport);

  const padX =
    (aspectRatioToDimensionsMap[containerDimensions].width -
      contentDimentions.width) /
    2;
  const padY =
    (aspectRatioToDimensionsMap[containerDimensions].height -
      contentDimentions.height) /
    2;

  const contentX = xIn - padX;
  const contentY = yIn - padY;

  const x = Math.round(contentX / (contentDimentions.width / originalWidth));
  const y = Math.round(contentY / (contentDimentions.height / originalHeight));
  return { x, y };
}
