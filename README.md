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
of using Jsvee. Animations made with Jsvee are available
at [our smart content server](http://acos.cs.hut.fi/).

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

## Additional Information

More documentation about using the library will be added later.

## Publications

Teemu Sirkiä. 2014. [Exploring expression-level program visualization in CS1.](http://dx.doi.org/10.1145/2674683.2674687) In Proceedings of the 14th Koli Calling International Conference on Computing Education Research (Koli Calling '14). ACM, New York, NY, USA, 153-157.
