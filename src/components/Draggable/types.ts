export type ControlPosition = { x: number; y: number };
export type CustomPosition = { x: string; y: string };

export type PositionOffsetControlPosition = {
  x: number | string;
  y: number | string;
};

export type DraggableData = {
  node: HTMLElement;
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
};

export type DraggableEventHandler = (
  e: MouseEvent | TouchEvent,
  data: DraggableData,
) => void | false;

export type Bounds = {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
};
