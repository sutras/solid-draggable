export function findInArray<
  T = any,
  U extends ArrayLike<T> | Array<T> = ArrayLike<T> | Array<T>,
>(
  array: U,
  callback: (item: T, i: number, array: U) => boolean,
): T | undefined {
  for (let i = 0, length = array.length; i < length; i++) {
    if (callback(array[i], i, array)) return array[i];
  }
}

export function isNum(num: unknown): num is number {
  return typeof num === "number" && !isNaN(num);
}

export function int(a: string): number {
  return parseInt(a, 10);
}

export function dontSetMe<P extends Record<PropertyKey, any>>(
  props: P,
  propName: PropertyKey,
  componentName: string,
): Error | undefined {
  if (props[propName]) {
    return new Error(
      `Invalid prop ${String(propName)} passed to ${componentName} - do not set this, set it on the child.`,
    );
  }
}
