import classNames from "classnames";
import { createCSSTransform } from "./utils/domFns";
import {
  canDragX,
  canDragY,
  createDraggableData,
  getBoundPosition,
} from "./utils/positionFns";
import DraggableCore, { defaultDraggableCoreProps } from "./DraggableCore";
import type { DraggableCoreProps } from "./DraggableCore";
import {
  mergeProps,
  onCleanup,
  splitProps,
  createMemo,
  createEffect,
  JSX,
  on,
} from "solid-js";
import { createStore } from "solid-js/store";
import type {
  Bounds,
  ControlPosition,
  CustomPosition,
  DraggableEventHandler,
  PositionOffsetControlPosition,
} from "./types";

type DraggableState = {
  dragging: boolean;
  dragged: boolean;
  x: number;
  y: number;
  slackX: number;
  slackY: number;
  prevPropsPosition: ControlPosition;
};

export interface DraggableProps extends DraggableCoreProps {
  axis?: "both" | "x" | "y" | "none";
  bounds?: Bounds | string | false;
  defaultClassName?: string;
  defaultClassNameDragging?: string;
  defaultClassNameDragged?: string;
  defaultPosition?: ControlPosition;
  scale?: number;
  positionOffset?: PositionOffsetControlPosition;
  position?: ControlPosition;
  customUnit?: (position: ControlPosition) => {
    x: string;
    y: string;
  };
}

const defaultDraggableProps = {
  ...defaultDraggableCoreProps,
  axis: "both" as const,
  bounds: false as const,
  defaultClassName: "solid-draggable",
  defaultClassNameDragging: "solid-draggable-dragging",
  defaultClassNameDragged: "solid-draggable-dragged",
  defaultPosition: { x: 0, y: 0 },
  scale: 1,
};

function Draggable(props: DraggableProps) {
  const mergedPrps = mergeProps(defaultDraggableProps, props);

  const [localProps, draggableCoreProps] = splitProps(mergedPrps, [
    "axis",
    "bounds",
    "children",
    "defaultPosition",
    "defaultClassName",
    "defaultClassNameDragging",
    "defaultClassNameDragged",
    "position",
    "positionOffset",
    "class",
    "style",
    "scale",
    "ref",
    "customUnit",
  ]);

  let nodeRef: HTMLElement | undefined;

  const setRef = (el: HTMLElement) => {
    nodeRef = el;
    if (typeof localProps.ref === "function") {
      localProps.ref(el);
    }
  };

  const [state, setState] = createStore({
    // Whether or not we are currently dragging.
    dragging: false,

    // Whether or not we have been dragged before.
    dragged: false,

    // Current transform x and y.
    x: localProps.position
      ? localProps.position.x
      : localProps.defaultPosition.x,
    y: localProps.position
      ? localProps.position.y
      : localProps.defaultPosition.y,

    prevPropsPosition: { ...localProps.position },

    // Used for compensating for out-of-bounds drags
    slackX: 0,
    slackY: 0,
  });

  createEffect(() => {
    if (localProps.position && !(props.onDrag || props.onStop)) {
      // eslint-disable-next-line no-console
      console.warn(
        "A `position` was applied to this <Draggable>, without drag handlers. This will make this " +
          "component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the " +
          "`position` of this element."
      );
    }
  });

  createEffect(
    on(
      () => localProps.position,
      () => {
        if (localProps.position) {
          setState(localProps.position);
        }
      }
    )
  );

  onCleanup(() => {
    if (state.dragging) {
      setState({ dragging: false }); // prevents invariant if unmounted while dragging
    }
  });

  const onDragStart: DraggableEventHandler = (e, coreData) => {
    // Short-circuit if user's callback killed it.
    const shouldStart = props.onStart?.(
      e,
      createDraggableData(localProps.scale, state.x, state.y, coreData)
    );
    // Kills start event on core as well, so move handlers are never bound.
    if (shouldStart === false) return false;

    setState({ dragging: true, dragged: true });
  };

  const onDrag: DraggableEventHandler = (e, coreData) => {
    if (!state.dragging) return false;

    const uiData = createDraggableData(
      localProps.scale,
      state.x,
      state.y,
      coreData
    );

    const newState = {
      x: uiData.x,
      y: uiData.y,
      slackX: 0,
      slackY: 0,
    };

    // Keep within bounds.
    if (localProps.bounds) {
      // Save original x and y.
      const { x, y } = newState;

      // Add slack to the values used to calculate bound position. This will ensure that if
      // we start removing slack, the element won't react to it right away until it's been
      // completely removed.
      newState.x += state.slackX;
      newState.y += state.slackY;

      // Get bound position. This will ceil/floor the x and y within the boundaries.
      const [newStateX, newStateY] = getBoundPosition(
        localProps.bounds,
        nodeRef!,
        newState.x,
        newState.y
      );
      newState.x = newStateX;
      newState.y = newStateY;

      // Recalculate slack by noting how much was shaved by the boundPosition handler.
      newState.slackX = state.slackX + (x - newState.x);
      newState.slackY = state.slackY + (y - newState.y);

      // Update the event we fire to reflect what really happened after bounds took effect.
      uiData.x = newState.x;
      uiData.y = newState.y;
      uiData.deltaX = newState.x - state.x;
      uiData.deltaY = newState.y - state.y;
    }

    // Short-circuit if user's callback killed it.
    const shouldUpdate = props.onDrag?.(e, uiData);
    if (shouldUpdate === false) return false;

    setState(newState);
  };

  const onDragStop: DraggableEventHandler = (e, coreData) => {
    if (!state.dragging) return false;

    // Short-circuit if user's callback killed it.
    const shouldContinue = props.onStop?.(
      e,
      createDraggableData(localProps.scale, state.x, state.y, coreData)
    );
    if (shouldContinue === false) return false;

    const newState: Partial<DraggableState> = {
      dragging: false,
      slackX: 0,
      slackY: 0,
    };

    // If this is a controlled component, the result of this operation will be to
    // revert back to the old position. We expect a handler on `onDragStop`, at the least.
    if (localProps.position) {
      const { x, y } = localProps.position;
      newState.x = x;
      newState.y = y;
    }

    setState(newState);
  };

  const style = createMemo<JSX.CSSProperties>(() => {
    // If this is controlled, we don't want to move it - unless it's dragging.
    const controlled = Boolean(localProps.position);
    const draggable = !controlled || state.dragging;

    const validPosition = localProps.position || localProps.defaultPosition;
    let transformOpts: ControlPosition | CustomPosition = {
      // Set left if horizontal drag is enabled
      x: canDragX(localProps.axis) && draggable ? state.x : validPosition.x,

      // Set top if vertical drag is enabled
      y: canDragY(localProps.axis) && draggable ? state.y : validPosition.y,
    };
    if (localProps.customUnit) {
      transformOpts = localProps.customUnit(transformOpts);
    }
    return createCSSTransform(
      transformOpts,
      localProps.positionOffset,
      !!localProps.customUnit
    );
  });

  // Mark with class while dragging
  const className = createMemo(() =>
    classNames(localProps.class, localProps.defaultClassName, {
      [localProps.defaultClassNameDragging]: state.dragging,
      [localProps.defaultClassNameDragged]: state.dragged,
    })
  );

  // Reuse the child provided
  // This makes it flexible to use whatever element is wanted (div, ul, etc)
  return (
    <DraggableCore
      {...draggableCoreProps}
      class={className()}
      style={{
        ...localProps.style,
        ...style(),
      }}
      ref={setRef}
      onStart={onDragStart}
      onDrag={onDrag}
      onStop={onDragStop}
    >
      {localProps.children}
    </DraggableCore>
  );
}

export default Draggable;
