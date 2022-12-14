/**
 * 计算图片宽高，可以指定最大宽度或高度，返回等比例的宽高
 * @param {{ width: number; height: number }} originalSize
 */
export function getWidthAndHeight(
  originalSize: { width: number; height: number },
  limit: { maxWidth?: number; maxHeight?: number } = {}
) {
  const { width, height } = originalSize;
  const { maxWidth, maxHeight } = limit;

  if (maxWidth !== undefined) {
    return {
      width: maxWidth,
      height: (height / width) * maxWidth,
    };
  }
  if (maxHeight !== undefined) {
    return {
      width: (width / height) * maxHeight,
      height: maxHeight,
    };
  }
  return {
    width,
    height,
  };
}
