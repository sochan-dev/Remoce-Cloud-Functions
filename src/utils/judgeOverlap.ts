type OwnInfo = {
  ownStartX: number;
  ownStartY: number;
  ownEndX: number;
  ownEndY: number;
};
type TargetInfo = {
  xCoordinate: number;
  yCoordinate: number;
  size: number;
};

export const judgeLargerTarget = (
  ownInfo: OwnInfo,
  targetInfo: TargetInfo
): boolean => {
  const { ownStartX, ownStartY, ownEndX, ownEndY } = ownInfo;
  const { xCoordinate, yCoordinate, size } = targetInfo;
  const targetStartX = xCoordinate;
  const targetStartY = yCoordinate;
  const targetEndX = targetStartX + size;
  const targetEndY = targetStartY + size;
  if (
    ((ownStartX <= targetStartX && targetStartX <= ownEndX) ||
      (targetEndX <= ownEndX && ownStartX <= targetEndX) ||
      (targetStartX <= ownStartX && ownEndX <= targetEndX)) &&
    ((ownStartY <= targetStartY && targetStartY <= ownEndY) ||
      (targetEndY <= ownEndY && ownStartY <= targetEndY) ||
      (targetStartY <= ownStartY && ownEndY <= targetEndY))
  ) {
    return false;
  }
  return true;
};

export const judgeSmallerTarget = (
  ownInfo: OwnInfo,
  targetInfo: TargetInfo
): boolean => {
  const { ownStartX, ownStartY, ownEndX, ownEndY } = ownInfo;
  const { xCoordinate, yCoordinate, size } = targetInfo;
  const targetStartX = xCoordinate;
  const targetStartY = yCoordinate;
  const targetEndX = targetStartX + size;
  const targetEndY = targetStartY + size;
  if (
    ((targetStartX <= ownStartX && ownStartX <= targetEndX) ||
      (ownEndX <= targetEndX && targetStartX <= ownEndX) ||
      (ownStartX <= targetStartX && targetEndX <= ownEndX)) &&
    ((targetStartY <= ownStartY && ownStartY <= targetEndY) ||
      (ownEndY <= targetEndY && targetStartY <= ownEndY) ||
      (ownStartY <= targetStartY && targetEndY <= ownEndY))
  ) {
    return false;
  }
  return true;
};

export const judgeSameTarget = (
  ownInfo: OwnInfo,
  targetInfo: TargetInfo
): boolean => {
  const { ownStartX, ownStartY, ownEndX, ownEndY } = ownInfo;
  const { xCoordinate, yCoordinate, size } = targetInfo;
  const targetStartX = xCoordinate;
  const targetStartY = yCoordinate;
  const targetEndX = targetStartX + size;
  const targetEndY = targetStartY + size;

  if (
    ((ownStartX <= targetStartX && targetStartX <= ownEndX) ||
      (ownStartX <= targetEndX && targetEndX <= ownEndX)) &&
    ((ownStartY <= targetStartY && targetStartY <= ownEndY) ||
      (ownStartY <= targetEndY && targetEndY <= ownEndY))
  ) {
    return false;
  }
  return true;
};
