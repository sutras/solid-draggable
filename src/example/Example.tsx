import Draggable from "@/components/Draggable";
import {
  ControlPosition,
  DraggableEventHandler,
} from "@/components/Draggable/types";
import { createStore } from "solid-js/store";

export default function App() {
  const [state, setState] = createStore({
    activeDrags: 0,
    deltaPosition: {
      x: 0,
      y: 0,
    },
    controlledPosition: {
      x: -400,
      y: 200,
    },
  });

  const handleDrag: DraggableEventHandler = (e, ui) => {
    const { x, y } = state.deltaPosition;
    setState({
      deltaPosition: {
        x: x + ui.deltaX,
        y: y + ui.deltaY,
      },
    });
  };

  const onStart = () => {
    setState({ activeDrags: state.activeDrags + 1 });
  };

  const onStop = () => {
    setState({ activeDrags: state.activeDrags - 1 });
  };
  const onDrop: DraggableEventHandler = (e) => {
    onStop();
    const target = e.target as Element;
    if (target.classList.contains("drop-target")) {
      alert("Dropped!");
      target.classList.remove("hovered");
    }
  };
  const onDropAreaMouseEnter = (e: MouseEvent) => {
    if (state.activeDrags) {
      (e.target as Element).classList.add("hovered");
    }
  };
  const onDropAreaMouseLeave = (e: MouseEvent) => {
    (e.target as Element).classList.remove("hovered");
  };

  // For controlled component
  const adjustXPos = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { x, y } = state.controlledPosition;
    setState({ controlledPosition: { x: x - 10, y } });
  };

  const adjustYPos = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { controlledPosition } = state;
    const { x, y } = controlledPosition;
    setState({ controlledPosition: { x, y: y - 10 } });
  };

  const onControlledDrag: DraggableEventHandler = (e, position) => {
    const { x, y } = position;
    setState({ controlledPosition: { x, y } });
  };

  const onControlledDragStop: DraggableEventHandler = (e, position) => {
    onControlledDrag(e, position);
    onStop();
  };

  const dragHandlers = { onStart: onStart, onStop: onStop };

  return (
    <div>
      <h1>Solid Draggable</h1>
      <p>Active DragHandlers: {state.activeDrags}</p>
      <p>
        <a href="https://github.com/sutras/solid-draggable/blob/master/src/example/Example.tsx">
          Demo Source
        </a>
      </p>
      <Draggable {...dragHandlers} class="box">
        I can be dragged anywhere
      </Draggable>
      <Draggable axis="x" {...dragHandlers} class="box cursor-x">
        I can only be dragged horizonally (x axis)
      </Draggable>
      <Draggable axis="y" {...dragHandlers} class="box cursor-y">
        I can only be dragged vertically (y axis)
      </Draggable>
      <Draggable onStart={() => false} class="box">
        I don't want to be dragged
      </Draggable>
      <Draggable onDrag={handleDrag} {...dragHandlers} class="box">
        <div>I track my deltas</div>
        <div>
          x: {state.deltaPosition.x.toFixed(0)}, y:{" "}
          {state.deltaPosition.y.toFixed(0)}
        </div>
      </Draggable>
      <Draggable handle="strong" {...dragHandlers} class="box no-cursor">
        <strong class="cursor">
          <div>Drag here</div>
        </strong>
        <div>You must click my handle to drag me</div>
      </Draggable>
      <Draggable
        handle="strong"
        class="box no-cursor"
        style={{ display: "flex", "flex-direction": "column" }}
      >
        <strong class="cursor">
          <div>Drag here</div>
        </strong>
        <div style={{ overflow: "scroll" }}>
          <div style={{ background: "yellow", "white-space": "pre-wrap" }}>
            I have long scrollable content with a handle
            {"\n" + Array(40).fill("x").join("\n")}
          </div>
        </div>
      </Draggable>
      <Draggable cancel="strong" {...dragHandlers} class="box">
        <strong class="no-cursor">Can't drag here</strong>
        <div>Dragging here works</div>
      </Draggable>
      <Draggable grid={[25, 25]} {...dragHandlers} class="box">
        I snap to a 25 x 25 grid
      </Draggable>
      <Draggable grid={[50, 50]} {...dragHandlers} class="box">
        I snap to a 50 x 50 grid
      </Draggable>
      <Draggable
        bounds={{ top: -100, left: -100, right: 100, bottom: 100 }}
        {...dragHandlers}
        class="box"
      >
        I can only be moved 100px in any direction.
      </Draggable>
      <Draggable
        {...dragHandlers}
        class="box drop-target"
        onMouseEnter={onDropAreaMouseEnter}
        onMouseLeave={onDropAreaMouseLeave}
      >
        I can detect drops from the next box.
      </Draggable>
      <Draggable
        {...dragHandlers}
        onStop={onDrop}
        class={`box ${state.activeDrags ? "no-pointer-events" : ""}`}
      >
        I can be dropped onto another box.
      </Draggable>
      <div
        class="box"
        style={{
          height: "500px",
          width: "500px",
          position: "relative",
          overflow: "auto",
          padding: "0",
        }}
      >
        <div style={{ height: "1000px", width: "1000px", padding: "10px" }}>
          <Draggable bounds="parent" {...dragHandlers} class="box">
            I can only be moved within my offsetParent.
            <br />
            <br />
            Both parent padding and child margin work properly.
          </Draggable>
          <Draggable bounds="parent" {...dragHandlers} class="box">
            I also can only be moved within my offsetParent.
            <br />
            <br />
            Both parent padding and child margin work properly.
          </Draggable>
        </div>
      </div>
      <Draggable bounds="body" {...dragHandlers} class="box">
        I can only be moved within the confines of the body element.
      </Draggable>
      <Draggable
        {...dragHandlers}
        class="box"
        style={{ position: "absolute", bottom: "100px", right: "100px" }}
      >
        I already have an absolute position.
      </Draggable>
      <Draggable
        {...dragHandlers}
        class="box rem-position-fix"
        style={{
          position: "absolute",
          bottom: "6.25rem",
          right: "18rem",
        }}
        customUnit={transformToRem}
      >
        I use <span style={{ "font-weight": 700 }}>rem</span> instead of{" "}
        <span style={{ "font-weight": 700 }}>px</span> for my transforms. I also
        have absolute positioning.
        <br />
        <br />I depend on a CSS hack to avoid double absolute positioning.
      </Draggable>
      <Draggable
        defaultPosition={{ x: 25, y: 25 }}
        {...dragHandlers}
        class="box"
      >
        {"I have a default position of {x: 25, y: 25}, so I'm slightly offset."}
      </Draggable>
      <Draggable
        positionOffset={{ x: "-10%", y: "-10%" }}
        {...dragHandlers}
        class="box"
      >
        {
          "I have a default position based on percents {x: '-10%', y: '-10%'}, so I'm slightly offset."
        }
      </Draggable>
      <Draggable
        position={state.controlledPosition}
        {...dragHandlers}
        onDrag={onControlledDrag}
        class="box"
      >
        My position can be changed programmatically. <br />I have a drag handler
        to sync state.
        <div>
          <a href="#" onClick={adjustXPos}>
            Adjust x ({state.controlledPosition.x})
          </a>
        </div>
        <div>
          <a href="#" onClick={adjustYPos}>
            Adjust y ({state.controlledPosition.y})
          </a>
        </div>
      </Draggable>
      <Draggable
        position={state.controlledPosition}
        {...dragHandlers}
        onStop={onControlledDragStop}
        class="box"
      >
        My position can be changed programmatically. <br />I have a dragStop
        handler to sync state.
        <div>
          <a href="#" onClick={adjustXPos}>
            Adjust x ({state.controlledPosition.x})
          </a>
        </div>
        <div>
          <a href="#" onClick={adjustYPos}>
            Adjust y ({state.controlledPosition.y})
          </a>
        </div>
      </Draggable>
    </div>
  );
}

function transformToRem(position: ControlPosition) {
  return {
    x: position.x / 16 + "rem",
    y: position.y / 16 + "rem",
  };
}
