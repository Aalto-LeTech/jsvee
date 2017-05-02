# Jsvee - JavaScript Visual Execution Environment

## General Information

Jsvee is a JavaScript library whose main purpose is
to provide common core features that are required for
creating program animations. These include controlling and
creating a layout for the animation. The library provides
the technical parts and the user of the library can
concentrate more on developing the content.

The library provides about 50 ready-made operations that
control the notional machine implemented in the library. By
combining these operations, the end result is a step-by-step
animation in which the operations are visually executed.

See [a short video](https://www.youtube.com/watch?v=Q3T_QLRWb78)
of using Jsvee. Some animations made with Jsvee are available
at [our smart content server](http://acos.cs.hut.fi/). The
file `example.zip` contains a sample package to get familiar
with the Jsvee and Kelmu libraries.

## Repository Layout

### Files

`actions.js` describes the actions available for controlling
the notional machine.

`animations.js` contains the definitions for animations.

`core.js` contains the actual core that executes the operation
sequence.

`demo.html` is a demonstration of embedding animations in
HTML pages.

`kelmu.js` provides support for Kelmu augmentation toolkit.

`messages.js` contains textual explanations for the actions.

`ui_utils.js` contains handy utilities for manipulating the UI.
Used mostly with actions.

`ui.js` provides the user interface for the animations.

`/python` contains the Python language pack and transpiler.

### Using the Repository

After cloning the repository, `demo.html` should contain a runnable
example.

## Embedding an animation

See `demo.html` for a minimal example. To define animations, using a transpiler is a suggested way of generating the required operation sequence. An example is in `animations.js` and `/python/transpiler.py` contains a Python transpiler.

### Options

The operation sequence also contains some options related to the layout. Default values for the options are the following:

```javascript
{ 'code': 'top',
  'console': true,
  'controls': true,
  'stackHeight': 100,
  'rightPanelsWidth': 150,
  'heapHeight': 80,
  'width': 850,
  'codeWidth': 'auto',
  'classesLeft': false,
  'consoleBelowHeap': false,
  'consoleLeft': false
}
```

#### `code`

Defines the position of the code area. Can be `top`, `left`, `none`, `top-left` or `aboveHeapAndPanels`.

#### `stackHeight`

The height of each stack frame is about from 100 to 120 pixels. Calculate the maximum number of stack frames at the same time and adjust the value accordingly.

#### `codeWidth`

Can be `auto` or the width of the code area in pixels.

## Built-in operations

The library contains the following operations: `addFunction`, `addFunctionFromVariable`, `addFunctionReference`, `addOperator`, `addReference`, `addValue`, `addValueFromField`, `addValueFromVariable`, `alert`, `alertOnce`, `assign`, `assignField`, `assignFields`, `assignParameter`, `assignParameters`, `conditionalJump`, `convertFunctionToCallable`, `createArray`, `createClass`, `createField`, `createFields`, `createFrame`, `createFunction`, `createInstance`, `createIterator`, `createOperator`, `createParameterVariables`, `createValue`, `createVariable`, `disableAnimations`, `disableStepping`, `enableAnimations`, `enableStepping`, `end`, `evaluateFunction`, `evaluateOperator`, `flashElement`, `getValueAtIndex`, `getValueByKey`, `hideInfo`, `iterate`, `jumpFalse`, `jumpIterationReady`, `jumpTrue`, `nop`, `returnValue`, `returnVoid`, `runForward`, `setLine`, `setLineHighlight`, `setValueAtIndex`, `setValueByKey`, `showInfo`, `showText`, `takeNext`

These are documented in `actions.js`

### Positioning system

Many operations have a parameter `position`. This means the position of an element in the evaluation area. It can be, for example, `1` or `0/0/1`. It is a single value or multiple values separated with slashes. The number of values is always odd. The first (and possible only) value is always the position in the outmost evaluation area. If there is a function, it contains nested evaluation areas for the parameters.

The position `0/1/3` means the first element in the evaluation area (`0`), the second parameter (`1`) and fourth element inside the second parameter (`3`). For example, in statement `print(a, 2 + b * c)` the multiplication operator can be evaluated with that position by calling the operation `evaluateOperator`.

## Extending the library

To create a language pack or other extensions for Jsvee, create a JavaScript file that is loaded after the Jsvee library and inject new functions to the Jsvee namespace. See `/python/python.js`. It contains a minimal set of Python features that can be used with Jsvee. The file `ui_utils.js` contains many useful functions that can be used.

### Global handler

When evaluating functions or operators, the following function is called to determine the result:

```javascript
JSVEE.handlers.global = function (ready, area, element, params) {

  // An example
  if (element.hasClass('jsvee-function') && element.attr('data-name') === 'input') {

      var param = element.find('.jsvee-value').eq(0).text();
      var result = prompt(param) || '';
      var newElement = JSVEE.utils.ui.findOrCreateValue(area, result, 'str');
      ready(newElement);

    }

}
```

The parameter `area` contains the Jsvee area as a jQuery object. The elements can be search and modified by using that reference. The parameter `element` contains the element that is evaluated. If the element is an operator, the parameter `params` will contain the operands. Otherwise the parameter is not present.

Because the handler can contain async code, the function `ready` must always be called when the operation is ready. The result will be given as its parameter.

### Handlers for functions and methods

In order to avoid a massive `if` statement in the global handler, it is also possible to register handlers for classes and functions.

```javascript
JSVEE.handlers.classes['MyClass'] = function (ready, area, element) {
}

JSVEE.handlers.functions['myFunction'] = function (ready, area, element) {
}
```

Class handler is always called when methods or operators attached to a class are evaluated.

### Implementing custom actions

To create a custom action `myAction`, define the following functions and call the `registerAction` function. The functions for animation and explanation are not mandatory.

To get better overview, see the built-in actions in `actions.js`.

```javascript
JSVEE.handlers.actions.myAction = function (ready, parameter) {
  alert('Hi there! The parameter is ' + parameter);
  ready();
};

JSVEE.handlers.animations.myAction = function (ready, parameter) {
  // Place the animation for the action here, if implemented
  ready();
};

JSVEE.handlers.explanations.myAction = function (parameter) {
  return 'Running my action';
};

JSVEE.registerAction('myAction', JSVEE.handlers.actions.myAction);
```

Because running the action and animation can have async actions, the callback `ready` must always be called when finished. Inside these functions, `this` always refers to the current Jsvee instance.

### Testing truthness

The language pack must implement the following function to determine whether the value if true or not:

```javascript
JSVEE.handlers.truthness = function (element) {
  return element.text() === 'true' || element.text() === 'True';
};
```

## Publications

Teemu Sirkiä. 2014. [Exploring expression-level program visualization in CS1.](http://dx.doi.org/10.1145/2674683.2674687) In Proceedings of the 14th Koli Calling International Conference on Computing Education Research (Koli Calling '14). ACM, New York, NY, USA, 153-157.

Teemu Sirkiä. 2016. [Jsvee & Kelmu: Creating and tailoring program animations for computing education.](https://doi.org/10.1109/VISSOFT.2016.24) 2016 IEEE Working
Conference on Software Visualization (VISSOFT), 36–45

## License

Copyright Teemu Sirkiä and Aalto University, 2016.
Licensed under MIT license.
