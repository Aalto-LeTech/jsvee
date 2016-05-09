(function($) {
  'use strict';

  /**
   * Creates a new instance of JSVEE.
   *
   * @constructor
   */
  var JSVEE = function(area, settings) {

    var defaultSettings = {};
    this.settings = $.extend(true, defaultSettings, settings);

    /**
     * @type jQueryObject
     */
    this.area = $(area);

    this.stateNumber = 0;
    this.animationLength = 300;

    this.steps = [];

    this.state = {};

    this.state.continueRunning = false;
    this.state.animationsDisabled = false;
    this.state.explanationsDisabled = false;
    this.state.stepsToRun = 0;
    this.state.stepNumber = 0;
    this.state.stepNumberAll = 0;

    this.undoableElements = [];
    this.undoStack = [];
    this.redoStack = [];

    var coreData = $('<div></div>').addClass('jsvee-core');
    coreData.appendTo(this.area);
    coreData.attr('data-pc', '0');
    this.addUndoableElement('.jsvee-core');

    this.actionsRunning = false;
    this.animationDisabled = false;
    this.initialized = false;
    this.disableStateSave = false;

  };

  JSVEE.utils = {};
  JSVEE.handlers = {
    'functions': {},
    'operators': {},
    'classes': {},
    'actions': {},
    'animations': {},
    'explanations': {},
    'global': null,
    'truthness': null
  };

  JSVEE.beforeEachInstructionCBs = [];
  JSVEE.beforeEachStepCBs = [];
  JSVEE.afterEachInstructionCBs = [];
  JSVEE.afterEachStepAfterCBs = [];
  JSVEE.afterEachStepBeforeCBs = [];
  JSVEE.afterInitializationCBs = [];

  /**
   * Registers a new action handler.
   *
   * @param name
   * @param func
   */
  JSVEE.registerAction = function(name, func) {

    this.prototype[name] = function() {

      var that = this;
      var args = [].slice.call(arguments);

      // When the instruction is called, make sure that
      // the first argument is always a function
      if (typeof args[0] !== 'function') {
        args.unshift(function() {
          return; // nop
        });
      }

      if (!this.initialized || this.state.animationsDisabled || this.animationDisabled) {
        // Execute only the instruction, no animation or explanation
        func.apply(that, args);
      } else {

        var afterAnim = function() {
          try {
            func.apply(that, args);
          } catch (e) {
            console.log(e); // XXX
            JSVEE.utils.ui.appendToStatus(that.area, JSVEE.messages.failedText());
            that.state.stepsToRun = 0;
            that.state.runToLine = 0;
            that.animationDisabled = false;
            that.setPC(999999);
            that.actionsRunning = false;
            that.disableStateSave = false;

            $.each(JSVEE.afterEachStepBeforeCBs, function() {
              this.call(that, null);
            });

            $.each(JSVEE.afterEachStepAfterCBs, function() {
              this.call(that, null);
            });

          }
        };

        var args2 = [].slice.call(args);
        args2[0] = afterAnim;

        // Show the explanation if it exists
        if (JSVEE.handlers.explanations.hasOwnProperty(name) && !this.explanationsDisabled && this.state.stepsToRun == 0) {
          var text = JSVEE.handlers.explanations[name].apply(this, args2.slice(1));
          JSVEE.utils.ui.setStatusText(this.area, text);

          // Wrap the original callback so that it will be
          // called after the status text has been changed.
          var originalCb = args[0];
          args[0] = function() {
            var args3 = [].slice.call(arguments);
            JSVEE.utils.ui.appendToStatus(that.area, JSVEE.messages.readyText());
            originalCb.call(this, args3);
          };

        } else {
          if (this.state.stepsToRun == 0) {
            JSVEE.utils.ui.setStatusText(this.area, ' ');
          }
        }

        // Show the animation if it exists
        if (JSVEE.handlers.animations.hasOwnProperty(name)) {
          JSVEE.handlers.animations[name].apply(that, args2);
        } else {
          afterAnim();
        }

      }

    };
  };

  /**
   * Executes the next step.
   */
  JSVEE.prototype.makeStep = function() {

    if (this.actionsRunning || this.hasEnded()) {
      return;
    }

    var that = this;
    var runCounter = 0;
    var instrToBeExecuted = null;

    this.state.stepNumber++;

    if (this.initialized) {
      this.state.stepNumberAll++;
    }

    var caller = function(instr, func) {

      return function() {
        if (that.initialized) {
          $.each(JSVEE.afterEachInstructionCBs, function() {
            this.call(that, instr);
          });
        }
        func();
      };

    };

    // Execute a single instruction
    var execute = function(ready, instr, anim) {

      var name = that.getInstructionName(instr);
      var args = instr.slice(1);
      var original = that.animationDisabled;

      if (that.initialized) {
        $.each(JSVEE.beforeEachInstructionCBs, function() {
          this.call(that, instr);
        });
      }

      that.animationDisabled = anim || false;
      args.unshift(ready);
      that[name].apply(that, args);
      that.animationDisabled = original;

    };

    // After the actual instruction, execute all
    // post instructions ending with an underscore
    var postInstr = function f() {

      var pc = that.peekNextInstruction();
      var instr = that.steps[pc];

      if (!that.hasEnded() && instr && instr[0][instr[0].length - 1] === '_') {
        that.setPC(pc + 1);
        instrToBeExecuted = instr;
        execute(caller(instr, f), instr, true);
      } else {

        // The instruction sequence is ready

        var currentLine = +that.area.find('.jsvee-code-area').attr('data-line');

        if (that.state.stepsToRun == 1 || that.state.runToLine && currentLine === that.state.runToLine) {
          that.state.stepsToRun = 0;

          if (!that.state.runToLine || that.state.animationsDisabled) {
            JSVEE.utils.ui.appendToStatus(that.area, JSVEE.messages.readyText());
          }

          if (that.state.reEnableAnimations) {
            that.state.animationsDisabled = false;
          }

        }

        if ((that.state.continueRunning || that.state.stepsToRun > 1 || (that.state.runToLine && currentLine !== that.state.runToLine)) && !that.hasEnded()) {

          that.state.stepsToRun = Math.max(0, that.state.stepsToRun - 1);

          if (that.initialized) {
            $.each(JSVEE.afterEachStepBeforeCBs, function() {
              this.call(that, instr);
            });

            $.each(JSVEE.afterEachStepAfterCBs, function() {
              this.call(that, instr);
            });
          }

          if (that.state.runToLine && currentLine !== that.state.runToLine) {
            that.state.stepNumberAll++;
          }

          // Start another sequence
          runCounter++;
          if (runCounter < 300 && that.state.animationsDisabled) {
            preInstr();
          } else {
            runCounter = 0;
            window.setTimeout(preInstr, 0); // Avoid stack overflow
          }

        } else {

          if (that.state.runToLine && currentLine === that.state.runToLine) {
            that.state.runToLine = 0;
          }

          that.actionsRunning = false;

          if (that.initialized) {
            $.each(JSVEE.afterEachStepBeforeCBs, function() {
              this.call(that, instr);
            });
          }

          if (!that.disableStateSave && that.initialized) {
            that.saveState();
          }
          that.disableStateSave = false;

          if (that.initialized) {
            $.each(JSVEE.afterEachStepAfterCBs, function() {
              this.call(that, instr);
            });
          }
        }

      }

    };

    // Execute the actual instruction
    var runInstr = function() {
      var pc = that.peekNextInstruction();
      var instr = that.steps[pc];
      var ended = that.hasEnded();
      that.setPC(pc + 1);
      if (!ended && instr) {
        instrToBeExecuted = instr;
        execute(caller(instr, postInstr), instr, false);
      } else {
        postInstr();
      }
    };

    // Execute all the pre-instructions starting
    // with an underscore
    var preInstr = function f() {
      var pc = that.peekNextInstruction();
      var instr = that.steps[pc];

      if (!that.hasEnded() && instr && instr[0][0] === '_') {
        that.setPC(pc + 1);
        instrToBeExecuted = instr;
        execute(caller(instr, f), instr, true);
      } else {
        runInstr();
      }
    };

    this.actionsRunning = true;

    if (that.initialized) {
      $.each(JSVEE.beforeEachStepCBs, function() {
        this.call(that);
      });
    }

    // Start the function chain
    try {
      preInstr();
    } catch (err) {
      console.log(err); // XXX
      JSVEE.utils.ui.appendToStatus(that.area, JSVEE.messages.failedText());
      that.state.stepsToRun = 0;
      that.state.runToLine = 0;
      that.animationDisabled = false;
      that.setPC(999999);
      that.actionsRunning = false;
      that.disableStateSave = false;

      if (that.initialized) {
        $.each(JSVEE.afterEachStepBeforeCBs, function() {
          this.call(that, instrToBeExecuted);
        });

        $.each(JSVEE.afterEachStepAfterCBs, function() {
          this.call(that, instrToBeExecuted);
        });
      }
    }

  };

  /**
   * Saves the current state to the undo stack.
   */
  JSVEE.prototype.saveState = function() {

    if (this.undoableElements.length > 0) {

      var state = $.extend(true, {}, this.state);
      state.dom = {};

      var that = this;
      $.each(this.undoableElements, function(i, val) {
        var clone = that.area.find(val).clone();
        state.dom[val] = $.extend(true, {}, clone);
      });

      if (this.redoStack.length === 0 && this.undoStack.length === 0) {
        // Save the initial state in case of initReady has not been called
        this.undoStack.push($.extend(true, { 'number': ++this.stateNumber }, this.state));
      } else if (this.redoStack.length > 0) {
        // Save also the current state before the new state
        this.undoStack.push(this.redoStack.pop());
      }

      state.number = ++this.stateNumber;
      this.undoStack.push(state);

      // Clear the redo stack
      this.redoStack.splice(0);

    }
  };

  /**
   * Deletes the most recent state from the undo stack, ie. prevents moving
   * backwards to the previous state.
   */
  JSVEE.prototype.deleteState = function() {
    this.undoStack.pop();
  };

  /**
   * Tells if it is possible to undo.
   *
   * @returns {Boolean}
   */
  JSVEE.prototype.canUndo = function() {
    return this.undoStack.length > 1 || (this.undoStack.length == 1 && this.redoStack.length > 0);
  };

  /**
   * Tells if it possible to redo.
   *
   * @returns {Boolean}
   */
  JSVEE.prototype.canRedo = function() {
    return this.redoStack.length > 0;
  };

  /**
   * Moves the state one step backwards.
   */
  JSVEE.prototype.undo = function() {

    if (this.undoStack.length > 0 && !this.actionsRunning) {
      var again = false;

      var state = this.undoStack.pop();

      // The current state is the topmost state in
      // the undo stack after a step has been executed
      if (state.number === this.stateNumber) {
        again = true;
      }

      this.state = $.extend(true, {}, state);
      this.stateNumber = state.number;
      this.redoStack.push(state);
      var that = this;

      if (again) {
        this.undo();
      } else {
        $.each(this.undoableElements, function(i, val) {
          $(that.area.find(val)).replaceWith(state.dom[val].clone());
        });
      }
    }

  };

  /**
   * Moves the state one step forward if the user has moved backwards. No
   * animations will be shown.
   */
  JSVEE.prototype.redo = function() {

    if (this.redoStack.length > 0 && !this.actionsRunning) {
      var again = false;

      var state = this.redoStack.pop();

      if (state.number === this.stateNumber) {
        again = true;
      }

      this.state = $.extend(true, {}, state);
      this.stateNumber = state.number;

      this.undoStack.push(state);
      var that = this;

      if (again) {
        this.redo();
      } else {
        $.each(this.undoableElements, function(i, val) {
          $(that.area.find(val)).replaceWith(state.dom[val].clone());
        });
      }
    }
  };

  /**
   * Reverts all the steps and moves the state back to the initial state.
   */
  JSVEE.prototype.toBegin = function() {
    while (!this.actionsRunning && this.undoStack.length > 0) {
      this.undo();
    }
  };

  /**
   * Returns the current value of the program counter. The PC is stored in the
   * topmost stack frame.
   *
   * @returns {number}
   */
  JSVEE.prototype.getPC = function() {
    return +this.area.find('.jsvee-core').attr('data-pc');
  };

  /**
   * Sets the current value of the program counter. The PC is stored in the
   * topmost stack frame.
   *
   * @param pc The new value, as an integer or a label starting with '@'
   */
  JSVEE.prototype.setPC = function(pc) {

    if (pc.toString()[0] === '@') {
      this.area.find('.jsvee-core').attr('data-pc', this.findLabel(pc) + 1);
    } else {
      this.area.find('.jsvee-core').attr('data-pc', pc);
    }

  };

  /**
   * Returns true if all the steps has been executed, otherwise false.
   *
   * @returns {Boolean}
   */
  JSVEE.prototype.hasEnded = function() {
    return this.getPC() >= this.steps.length || this.getInstructionName(this.steps[this.getPC()]) === 'end';
  };

  /**
   * Finds the PC of the given label. Returns the next PC value after the label
   * if the label is found. If the label is not found, the function returns last
   * PC value + 1.
   *
   * @param label
   * @returns {number}
   */
  JSVEE.prototype.findLabel = function(label) {

    var cleaned = label;
    if (label[0] === '@') { // Remove the preceeding '@' if present
      cleaned = label.substring(1);
    }

    var i = 0;
    for (i = 0; i < this.steps.length; i++) {
      if (this.getInstructionName(this.steps[i]) === 'label' && this.steps[i][1] === cleaned) {
        return i;
      }
    }

    return this.steps.length + 1;
  };

  /**
   * This function must be called after the initial state is constructed. It
   * saves the initial state and allows animations to be executed.
   */
  JSVEE.prototype.initReady = function() {

    var that = this;
    this.initialized = true;

    // Save the initial state of the DOM
    var dom = {};
    $.each(this.undoableElements, function(i, val) {
      var clone = that.area.find(val).clone();
      dom[val] = $.extend(true, {}, clone);
    });
    this.state.dom = dom;

    // Push the initial state to the undo stack
    this.undoStack.push($.extend(true, { 'number': ++this.stateNumber }, this.state));

    $.each(JSVEE.afterInitializationCBs, function() {
      this.call(that);
    });

  };

  /**
   * Adds a new DOM element to the list of elements which should be saved after
   * each step.
   *
   * @param element A jQuery selector as a string or an array of them.
   */
  JSVEE.prototype.addUndoableElement = function(element) {
    var that = this;
    if (typeof element === 'string') {
      this.undoableElements.push(element);
    } else if ($.isArray(element)) {
      $.each(function(i, val) {
        that.undoableElements.push(val);
      });
    }
  };

  /**
   * Adds a new step to the visualized program.
   */
  JSVEE.prototype.addStep = function(step) {
    this.steps.push(step);
  };

  /**
   * Returns position of the next executable instruction but does not change the
   * current PC value.
   *
   * @param startAt An optional PC value, the current PC value will be used if
   *          not given
   * @returns {number}
   */
  JSVEE.prototype.peekNextInstruction = function(startAt) {

    var pc = startAt || this.getPC();
    var instr = null;

    while (pc < this.steps.length) {

      instr = this.steps[pc];
      if (this.getInstructionName(instr) === 'label') {
        pc++;
      } else if (this.getInstructionName(instr) === 'goto') {

        // Is it a new PC value or a label?
        if (instr[1].toString()[0] === '@') {
          pc = this.findLabel(instr[1]);
        } else {
          pc = +instr[1];
        }

      } else {
        // Current instruction is executeble
        break;
      }

    }

    return pc;

  };

  /**
   * Returns the name of the instruction without the leading or trailing
   * underscore.
   *
   * @returns {String}
   */
  JSVEE.prototype.getInstructionName = function(instruction) {

    // Remove preceeding underscore
    if (instruction[0][0] === '_') {
      return instruction[0].substring(1);
    }

    // Remove trailing underscore
    if (instruction[0][instruction[0].length - 1] === '_') {
      return instruction[0].substring(0, instruction[0].length - 1);
    }

    return instruction[0];

  };

  /**
   * Adds a callback function which is always called before each executed
   * instruction.
   */
  JSVEE.beforeEachInstruction = function(func) {
    JSVEE.beforeEachInstructionCBs.push(func);
  };

  /**
   * Adds a callback function which is always called before each step.
   */
  JSVEE.beforeEachStep = function(func) {
    JSVEE.beforeEachStepCBs.push(func);
  };

  /**
   * Adds a callback function which is always called after each executed
   * instruction.
   */
  JSVEE.afterEachInstruction = function(func) {
    JSVEE.afterEachInstructionCBs.push(func);
  };

  /**
   * Adds a callback function which is called after one step is executed. If the
   * parameter afterSave is true, the callback will be called after the state
   * has been saved, otherwise before saving the state.
   */
  JSVEE.afterEachStep = function(afterSave, func) {

    if (afterSave) {
      JSVEE.afterEachStepAfterCBs.push(func);
    } else {
      JSVEE.afterEachStepBeforeCBs.push(func);
    }

  };

  /**
   * Adds a callback function which is always called after the core is
   * initialized.
   */
  JSVEE.afterInitialization = function(func) {
    JSVEE.afterInitializationCBs.push(func);
  };

  // Add the library to the global namespace
  window.JSVEE = JSVEE;

}(jQuery));
