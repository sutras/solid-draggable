import {
  Ref,
  JSX,
  mergeProps,
  onMount,
  onCleanup,
  splitProps,
  ValidComponent,
} from "solid-js";
import {
  matchesSelectorAndParentsTo,
  addUserSelectStyles,
  getTouchIdentifier,
  removeUserSelectStyles,
} from "./utils/domFns";
import {
  createCoreData,
  getControlPosition,
  snapToGrid,
} from "./utils/positionFns";
import type { DraggableEventHandler } from "./types";
import { Dynamic } from "solid-js/web";

// Simple abstraction for dragging events names.
const eventsFor = {
  touch: {
    start: "touchstart",
    move: "touchmove",
    stop: "touchend",
  },
  mouse: {
    start: "mousedown",
    move: "mousemove",
    stop: "mouseup",
  },
} as const;

// Default to mouse events.
let dragEventFor: typeof eventsFor.touch | typeof eventsFor.mouse =
  eventsFor.mouse;

export interface DraggableCoreProps
  extends Omit<JSX.HTMLAttributes<Element>, "ref" | "onDrag"> {
  allowAnyClick?: boolean;
  allowMobileScroll?: boolean;
  disabled?: boolean;
  enableUserSelectHack?: boolean;
  onStart?: DraggableEventHandler;
  onDrag?: DraggableEventHandler;
  onStop?: DraggableEventHandler;
  onMouseDown?: (e: MouseEvent | TouchEvent) => void;
  scale?: number;
  class?: string;
  style?: JSX.CSSProperties;
  ref?: Ref<HTMLElement>;
  cancel?: string;
  children?: JSX.Element;
  offsetParent?: HTMLElement;
  grid?: [number, number];
  handle?: string;
  component?: ValidComponent;
}

//
// Define <DraggableCore>.
//
// <DraggableCore> is for advanced usage of <Draggable>. It maintains minimal internal state so it can
// work well with libraries that require more control over the element.
//

export const defaultDraggableCoreProps = {
  allowAnyClick: false, // by default only accept left click
  allowMobileScroll: false,
  disabled: false,
  enableUserSelectHack: true,
  onStart: function () {},
  onDrag: function () {},
  onStop: function () {},
  onMouseDown: function () {},
  scale: 1,
  component: "div" as const,
};

function DraggableCore(props: DraggableCoreProps) {
  const [localProps, restProps] = splitProps(
    mergeProps(defaultDraggableCoreProps, props),
    [
      "ref",
      "enableUserSelectHack",
      "onMouseDown",
      "allowAnyClick",
      "disabled",
      "handle",
      "cancel",
      "allowMobileScroll",
      "offsetParent",
      "scale",
      "onStart",
      "grid",
      "onDrag",
      "onStop",
      "class",
      "style",
      "children",
      "component",
    ]
  );

  let nodeRef: HTMLElement | undefined;

  const setRef = (el: HTMLElement) => {
    nodeRef = el;
    if (typeof localProps.ref === "function") {
      localProps.ref(el);
    }
  };

  let dragging: boolean = false;

  // Used while dragging to determine deltas.
  let lastX: number = NaN;
  let lastY: number = NaN;

  let touchIdentifier: number | undefined;

  let mounted: boolean = false;

  onMount(() => {
    mounted = true;
  });

  onCleanup(() => {
    mounted = false;
    // Remove any leftover event handlers. Remove both touch and mouse handlers in case
    // some browser quirk caused a touch event to fire during a mouse move, or vice versa.
    if (nodeRef) {
      const { ownerDocument } = nodeRef;
      ownerDocument.removeEventListener(eventsFor.mouse.move, handleDrag);
      ownerDocument.removeEventListener(eventsFor.touch.move, handleDrag);
      ownerDocument.removeEventListener(eventsFor.mouse.stop, handleDragStop);
      ownerDocument.removeEventListener(eventsFor.touch.stop, handleDragStop);
      if (localProps.enableUserSelectHack) {
        // prevent a possible "forced reflow"
        window.requestAnimationFrame(() => {
          removeUserSelectStyles(ownerDocument);
        });
      }
    }
  });

  const handleDragStart = (e: MouseEvent | TouchEvent) => {
    // Make it possible to attach event handlers on top of this one.
    localProps.onMouseDown(e);

    // Only accept left-clicks.
    if (
      !localProps.allowAnyClick &&
      e instanceof MouseEvent &&
      typeof e.button === "number" &&
      e.button !== 0
    )
      return false;

    // Get nodes. Be sure to grab relative document (could be iframed)
    if (!nodeRef || !nodeRef.ownerDocument || !nodeRef.ownerDocument.body) {
      throw new Error("<DraggableCore> not mounted on DragStart!");
    }
    const { ownerDocument } = nodeRef;

    // Short circuit if handle or cancel prop was provided and selector doesn't match.
    if (
      localProps.disabled ||
      !(e.target instanceof ownerDocument.defaultView!.Element) ||
      (localProps.handle &&
        !matchesSelectorAndParentsTo(e.target, localProps.handle, nodeRef)) ||
      (localProps.cancel &&
        matchesSelectorAndParentsTo(e.target, localProps.cancel, nodeRef))
    ) {
      return;
    }

    // Prevent scrolling on mobile devices, like ipad/iphone.
    // Important that this is after handle/cancel.
    if (e.type === "touchstart" && !localProps.allowMobileScroll)
      e.preventDefault();

    // Set touch identifier in component state if this is a touch event. This allows us to
    // distinguish between individual touches on multitouch screens by identifying which
    // touchpoint was set to this element.
    const identifier = getTouchIdentifier(e);
    touchIdentifier = identifier;

    // Get the current drag point from the event. This is used as the offset.
    const position = getControlPosition(
      e,
      identifier,
      nodeRef,
      localProps.offsetParent,
      localProps.scale
    );
    if (position == null) return; // not possible but satisfies flow
    const { x, y } = position;

    // Create an event object with all the data parents need to make a decision here.
    const coreEvent = createCoreData(x, y, nodeRef, lastX, lastY);

    // Call event handler. If it returns explicit false, cancel.
    const shouldUpdate = localProps.onStart(e, coreEvent);
    if (shouldUpdate === false || mounted === false) return;

    // Add a style to the body to disable user-select. This prevents text from
    // being selected all over the page.
    if (localProps.enableUserSelectHack) addUserSelectStyles(ownerDocument);

    // Initiate dragging. Set the current x and y as offsets
    // so we know how much we've moved during the drag. This allows us
    // to drag elements around even if they have been moved, without issue.
    dragging = true;
    lastX = x;
    lastY = y;

    // Add events to the document directly so we catch when the user's mouse/touch moves outside of
    // this element. We use different events depending on whether or not we have detected that this
    // is a touch-capable device.
    ownerDocument.addEventListener(dragEventFor.move, handleDrag);
    ownerDocument.addEventListener(dragEventFor.stop, handleDragStop);
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    // Get the current drag point from the event. This is used as the offset.
    const position = getControlPosition(
      e,
      touchIdentifier!,
      nodeRef!,
      localProps.offsetParent,
      localProps.scale
    );
    if (position == null) return;
    let { x, y } = position;

    // Snap to grid if prop has been provided
    if (Array.isArray(localProps.grid)) {
      let deltaX = x - lastX,
        deltaY = y - lastY;
      [deltaX, deltaY] = snapToGrid(localProps.grid, deltaX, deltaY);
      if (!deltaX && !deltaY) return; // skip useless drag
      (x = lastX + deltaX), (y = lastY + deltaY);
    }

    const coreEvent = createCoreData(x, y, nodeRef!, lastX, lastY);

    // Call event handler. If it returns explicit false, trigger end.
    const shouldUpdate = localProps.onDrag(e, coreEvent);
    if (shouldUpdate === false || mounted === false) {
      try {
        // $FlowIgnore
        handleDragStop(new MouseEvent("mouseup"));
      } catch (err) {
        // Old browsers
        const event = document.createEvent("MouseEvents");
        // I see why this insanity was deprecated
        // $FlowIgnore
        event.initMouseEvent(
          "mouseup",
          true,
          true,
          window,
          0,
          0,
          0,
          0,
          0,
          false,
          false,
          false,
          false,
          0,
          null
        );
        handleDragStop(event);
      }
      return;
    }

    lastX = x;
    lastY = y;
  };

  const handleDragStop = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;

    const position = getControlPosition(
      e,
      touchIdentifier!,
      nodeRef!,
      localProps.offsetParent,
      localProps.scale
    );
    if (position == null) return;
    let { x, y } = position;

    // Snap to grid if prop has been provided
    if (Array.isArray(localProps.grid)) {
      let deltaX = x - lastX || 0;
      let deltaY = y - lastY || 0;
      [deltaX, deltaY] = snapToGrid(localProps.grid, deltaX, deltaY);
      (x = lastX + deltaX), (y = lastY + deltaY);
    }

    const coreEvent = createCoreData(x, y, nodeRef!, lastX, lastY);

    // Call event handler
    const shouldContinue = localProps.onStop(e, coreEvent);
    if (shouldContinue === false || mounted === false) return false;

    if (nodeRef) {
      // Remove user-select hack
      if (localProps.enableUserSelectHack)
        removeUserSelectStyles(nodeRef.ownerDocument);
    }

    // Reset the el.
    dragging = false;
    lastX = NaN;
    lastY = NaN;

    if (nodeRef) {
      // Remove event handlers
      nodeRef.ownerDocument.removeEventListener(dragEventFor.move, handleDrag);
      nodeRef.ownerDocument.removeEventListener(
        dragEventFor.stop,
        handleDragStop
      );
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    dragEventFor = eventsFor.mouse; // on touchscreen laptops we could switch back to mouse

    return handleDragStart(e);
  };

  const onMouseUp = (e: MouseEvent) => {
    dragEventFor = eventsFor.mouse;

    return handleDragStop(e);
  };

  // Same as onMouseDown (start drag), but now consider this a touch device.
  const onTouchStart = (e: TouchEvent) => {
    // We're on a touch device now, so change the event handlers
    dragEventFor = eventsFor.touch;

    return handleDragStart(e);
  };

  const onTouchEnd = (e: TouchEvent) => {
    // We're on a touch device now, so change the event handlers
    dragEventFor = eventsFor.touch;

    return handleDragStop(e);
  };

  return (
    <Dynamic
      {...restProps}
      component={localProps.component}
      class={localProps.class}
      style={localProps.style}
      ref={setRef}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      on:touchstart={{ passive: true, handleEvent: onTouchStart }}
      onTouchEnd={onTouchEnd}
    >
      {localProps.children}
    </Dynamic>
  );
}

export default DraggableCore;
