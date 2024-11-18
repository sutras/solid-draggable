# Solid-Draggable

[![npm downloads](https://img.shields.io/npm/dt/solid-draggable.svg?maxAge=2592000)](http://npmjs.com/package/solid-draggable)
[![gzip size](http://img.badgesize.io/https://npmcdn.com/solid-draggable/build/web/solid-draggable.min.js?compression=gzip)]()
[![version](https://img.shields.io/npm/v/solid-draggable.svg)]()

<p align="center">
  <img src="https://user-images.githubusercontent.com/6365230/95649276-f3a02480-0b06-11eb-8504-e0614a780ba4.gif" />
</p>

A simple component for making elements draggable. (Adapted from react-draggable)

```js
<Draggable>I can now be moved around!</Draggable>
```

- [Demo](http://sutras.github.io/solid-draggable-docs/)

### Installing

```bash
$ npm install solid-draggable
```

If you want a UMD version of the latest `master` revision, you can generate it yourself from master by cloning this
repository and running `$ make`. This will create umd dist files in the `dist/` folder.

### Exports

The default export is `<Draggable>`. At the `.DraggableCore` property is [`<DraggableCore>`](#draggablecore).
Here's how to use it:

```js
import Draggable from "solid-draggable"; // The default
import { DraggableCore } from "solid-draggable"; // <DraggableCore>
import Draggable, { DraggableCore } from "solid-draggable"; // Both at the same time
```

## `<Draggable>`

A `<Draggable>` element wraps an existing element and extends it with new event handlers and styles.
It does not create a wrapper element in the DOM.

Draggable items are moved using CSS Transforms. This allows items to be dragged regardless of their current
positioning (relative, absolute, or static). Elements can also be moved between drags without incident.

If the item you are dragging already has a CSS Transform applied, it will be overwritten by `<Draggable>`. Use
an intermediate wrapper (`<Draggable><span>...</span></Draggable>`) in this case.

### Draggable Usage

View the [Demo](http://sutras.github.io/solid-draggable-docs/) and its
[source](/src/example/Example.tsx) for more.

```tsx
import Draggable from 'solid-draggable';

const App = () => {
  eventLogger = (e: MouseEvent, data: Object) => {
    console.log('Event: ', e);
    console.log('Data: ', data);
  };

  render() {
    return (
      <Draggable
        axis="x"
        handle=".handle"
        defaultPosition={{x: 0, y: 0}}
        position={null}
        grid={[25, 25]}
        scale={1}
        onStart={handleStart}
        onDrag={handleDrag}
        onStop={handleStop}>
        <div class="handle">Drag from here</div>
        <div>This readme is really dragging on...</div>
      </Draggable>
    );
  }
}
```

### Draggable API

The `<Draggable/>` creates an element internally to add the class name, style, and event listener. The default element is `div`.

#### `<Draggable>` Props:

```js
//
// Types:
//
type DraggableEventHandler = (e: Event, data: DraggableData) => void | false;
type DraggableData = {
  node: HTMLElement,
  // lastX + deltaX === x
  x: number, y: number,
  deltaX: number, deltaY: number,
  lastX: number, lastY: number
};

//
// Props:
//
{
  // If set to `true`, will allow dragging on non left-button clicks.
  allowAnyClick: boolean,

  // Default `false` and default behavior before 4.5.0.
  // If set to `true`, the 'touchstart' event will not be prevented,
  // which will allow scrolling inside containers. We recommend
  // using the 'handle' / 'cancel' props when possible instead of enabling this.
  allowMobileScroll: boolean,

  // Determines which axis the draggable can move. This only affects
  // flushing to the DOM. Callbacks will still include all values.
  // Accepted values:
  // - `both` allows movement horizontally and vertically (default).
  // - `x` limits movement to horizontal axis.
  // - `y` limits movement to vertical axis.
  // - 'none' stops all movement.
  axis: string,

  // Specifies movement boundaries. Accepted values:
  // - `parent` restricts movement within the node's offsetParent
  //    (nearest node with position relative or absolute), or
  // - a selector, restricts movement within the targeted node
  // - An object with `left, top, right, and bottom` properties.
  //   These indicate how far in each direction the draggable
  //   can be moved.
  bounds: {left?: number, top?: number, right?: number, bottom?: number} | string,

  // Specifies a selector to be used to prevent drag initialization. The string is passed to
  // Element.matches, so it's possible to use multiple selectors like `.first, .second`.
  // Example: '.body'
  cancel: string,

  // Class names for draggable UI.
  // Default to 'solid-draggable', 'solid-draggable-dragging', and 'solid-draggable-dragged'
  defaultClassName: string,
  defaultClassNameDragging: string,
  defaultClassNameDragged: string,

  // Specifies the `x` and `y` that the dragged item should start at.
  // This is generally not necessary to use (you can use absolute or relative
  // positioning of the child directly), but can be helpful for uniformity in
  // your callbacks and with css transforms.
  defaultPosition: {x: number, y: number},

  // If true, will not call any drag handlers.
  disabled: boolean,

  // Default `true`. Adds "user-select: none" while dragging to avoid selecting text.
  enableUserSelectHack: boolean,

  // Specifies the x and y that dragging should snap to.
  grid: [number, number],

  // Specifies a selector to be used as the handle that initiates drag.
  // Example: '.handle'
  handle: string,

  // If desired, you can provide your own offsetParent for drag calculations.
  // By default, we use the Draggable's offsetParent. This can be useful for elements
  // with odd display types or floats.
  offsetParent: HTMLElement,

  // Called whenever the user mouses down. Called regardless of handle or
  // disabled status.
  onMouseDown: (e: MouseEvent) => void,

  // Called when dragging starts. If `false` is returned any handler,
  // the action will cancel.
  onStart: DraggableEventHandler,

  // Called while dragging.
  onDrag: DraggableEventHandler,

  // Called when dragging stops.
  onStop: DraggableEventHandler,

  // Much like Solid form elements, if this property is present, the item
  // becomes 'controlled' and is not responsive to user input. Use `position`
  // if you need to have direct control of the element.
  position: {x: number, y: number}

  // A position offset to start with. Useful for giving an initial position
  // to the element. Differs from `defaultPosition` in that it does not
  // affect the position returned in draggable callbacks, and in that it
  // accepts strings, like `{x: '10%', y: '10%'}`.
  positionOffset: {x: number | string, y: number | string},

  // Specifies the scale of the canvas your are dragging this element on. This allows
  // you to, for example, get the correct drag deltas while you are zoomed in or out via
  // a transform or matrix in the parent of this element.
  scale: number
}
```

## Controlled vs. Uncontrolled

`<Draggable>` is a 'batteries-included' component that manages its own state. If you want to completely
control the lifecycle of the component, use `<DraggableCore>`.

For some users, they may want the nice state management that `<Draggable>` provides, but occasionally want
to programmatically reposition their components. `<Draggable>` allows this customization via a system that
is similar to how Solid handles form components.

If the prop `position: {x: number, y: number}` is defined, the `<Draggable>` will ignore its internal state and use
the provided position instead. Alternatively, you can seed the position using `defaultPosition`. Technically, since
`<Draggable>` works only on position deltas, you could also seed the initial position using CSS `top/left`.

We make one modification to the Solid philosophy here - we still allow dragging while a component is controlled.
We then expect you to use at least an `onDrag` or `onStop` handler to synchronize state.

To disable dragging while controlled, send the prop `disabled={true}` - at this point the `<Draggable>` will operate
like a completely static component.

## `<DraggableCore>`

For users that require absolute control, a `<DraggableCore>` element is available. This is useful as an abstraction
over touch and mouse events, but with full control. `<DraggableCore>` has no internal state.

`<DraggableCore>` is a useful building block for other libraries that simply want to abstract browser-specific
quirks and receive callbacks when a user attempts to move an element. It does not set styles or transforms
on itself and thus must have callbacks attached to be useful.

### DraggableCore API

`<DraggableCore>` takes a limited subset of options:

```js
{
  allowAnyClick: boolean,
  allowMobileScroll: boolean,
  cancel: string,
  disabled: boolean,
  enableUserSelectHack: boolean,
  offsetParent: HTMLElement,
  grid: [number, number],
  handle: string,
  onStart: DraggableEventHandler,
  onDrag: DraggableEventHandler,
  onStop: DraggableEventHandler,
  onMouseDown: (e: MouseEvent) => void,
  scale: number
}
```

Note that there is no start position. `<DraggableCore>` simply calls `drag` handlers with the below parameters,
indicating its position (as inferred from the underlying MouseEvent) and deltas. It is up to the parent
to set actual positions on `<DraggableCore>`.

Drag callbacks (`onStart`, `onDrag`, `onStop`) are called with the [same arguments as `<Draggable>`](#draggable-api).

---

### Contributing

- Fork the project
- Run the project in development mode: `$ npm run dev`
- Make changes.
- Add appropriate tests
- `$ npm test`
- If tests don't pass, make them pass.
- Update README with appropriate docs.
- Commit and PR

### Release checklist

- Update CHANGELOG
- `make release-patch`, `make release-minor`, or `make-release-major`
- `make publish`

### License

MIT
