import { findInArray, int } from "./shims";

import type {
  ControlPosition,
  CustomPosition,
  PositionOffsetControlPosition,
} from "../types";
import { JSX } from "solid-js";

// Works up the tree to the draggable itself attempting to match selector.
export function matchesSelectorAndParentsTo(
  el: Element,
  selector: string,
  baseNode: Element,
): boolean {
  let node = el;
  do {
    if (node.matches(selector)) return true;
    if (node === baseNode) return false;
    node = node.parentNode as Element;
  } while (node);

  return false;
}

export function outerHeight(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetTop which is including margin. See getBoundPosition
  let height = node.clientHeight;
  const computedStyle = node.ownerDocument.defaultView!.getComputedStyle(node);
  height += int(computedStyle.borderTopWidth);
  height += int(computedStyle.borderBottomWidth);
  return height;
}

export function outerWidth(node: HTMLElement): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetLeft which is including margin. See getBoundPosition
  let width = node.clientWidth;
  const computedStyle = node.ownerDocument.defaultView!.getComputedStyle(node);
  width += int(computedStyle.borderLeftWidth);
  width += int(computedStyle.borderRightWidth);
  return width;
}
export function innerHeight(node: HTMLElement): number {
  let height = node.clientHeight;
  const computedStyle = node.ownerDocument.defaultView!.getComputedStyle(node);
  height -= int(computedStyle.paddingTop);
  height -= int(computedStyle.paddingBottom);
  return height;
}

export function innerWidth(node: HTMLElement): number {
  let width = node.clientWidth;
  const computedStyle = node.ownerDocument.defaultView!.getComputedStyle(node);
  width -= int(computedStyle.paddingLeft);
  width -= int(computedStyle.paddingRight);
  return width;
}

interface EventWithOffset {
  clientX: number;
  clientY: number;
}

// Get from offsetParent
export function offsetXYFromParent(
  evt: EventWithOffset,
  offsetParent: HTMLElement,
  scale: number,
): ControlPosition {
  const isBody = offsetParent === offsetParent.ownerDocument.body;
  const offsetParentRect = isBody
    ? { left: 0, top: 0 }
    : offsetParent.getBoundingClientRect();

  const x =
    (evt.clientX + offsetParent.scrollLeft - offsetParentRect.left) / scale;
  const y =
    (evt.clientY + offsetParent.scrollTop - offsetParentRect.top) / scale;

  return { x, y };
}

export function createCSSTransform(
  controlPos: ControlPosition | CustomPosition,
  positionOffset: PositionOffsetControlPosition | undefined,
  customUnit: boolean,
): JSX.CSSProperties {
  const translation = getTranslation(
    controlPos,
    positionOffset,
    "px",
    customUnit,
  );
  return { transform: translation };
}

export function getTranslation(
  { x, y }: ControlPosition | CustomPosition,
  positionOffset: PositionOffsetControlPosition | undefined,
  unitSuffix: string,
  customUnit: boolean,
): string {
  const unit = customUnit ? "" : unitSuffix;
  let translation = `translate(${x}${unit},${y}${unit})`;
  if (positionOffset) {
    const defaultX = `${typeof positionOffset.x === "string" ? positionOffset.x : positionOffset.x + unitSuffix}`;
    const defaultY = `${typeof positionOffset.y === "string" ? positionOffset.y : positionOffset.y + unitSuffix}`;
    translation = `translate(${defaultX}, ${defaultY})` + translation;
  }
  return translation;
}

export function getTouch(
  e: MouseEvent | TouchEvent,
  identifier: number,
): { clientX: number; clientY: number } | false | undefined {
  return (
    ("targetTouches" in e &&
      findInArray<Touch>(
        e.targetTouches,
        (t) => identifier === t.identifier,
      )) ||
    ("changedTouches" in e &&
      findInArray<Touch>(e.changedTouches, (t) => identifier === t.identifier))
  );
}

export function getTouchIdentifier(
  e: MouseEvent | TouchEvent,
): number | undefined {
  if ("targetTouches" in e && e.targetTouches[0])
    return e.targetTouches[0].identifier;
  if ("changedTouches" in e && e.changedTouches[0])
    return e.changedTouches[0].identifier;
}

// User-select Hacks:
//
// Useful for preventing blue highlights all over everything when dragging.

// Note we're passing `document` b/c we could be iframed
export function addUserSelectStyles(doc: Document) {
  if (!doc) return;
  let styleEl = doc.getElementById(
    "solid-draggable-style-el",
  ) as HTMLStyleElement;
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.type = "text/css";
    styleEl.id = "solid-draggable-style-el";
    styleEl.innerHTML =
      ".solid-draggable-transparent-selection *::-moz-selection {all: inherit;}\n";
    styleEl.innerHTML +=
      ".solid-draggable-transparent-selection *::selection {all: inherit;}\n";
    doc.getElementsByTagName("head")[0].appendChild(styleEl);
  }
  if (doc.body) doc.body.classList.add("solid-draggable-transparent-selection");
}

export function removeUserSelectStyles(doc: Document) {
  if (!doc) return;
  try {
    if (doc.body)
      doc.body.classList.remove("solid-draggable-transparent-selection");

    // Remove selection caused by scroll, unless it's a focused input
    // (we use doc.defaultView in case we're in an iframe)
    const selection = (doc.defaultView || window).getSelection();
    if (selection && selection.type !== "Caret") {
      selection.removeAllRanges();
    }
  } catch (e) {
    // probably IE
  }
}
