(function($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  }

  /**
   * A helper function to fade in elements. This function takes another function
   * as a parameter which creates and places the element.
   */
  var bindAnimation = function(func) {

    return function() {
      var args = [].slice.call(arguments);
      JSVEE.utils.ui.fadeInAndRemove.call(this, args[0], func, args.slice(1));
    };

  };

  // **************************************************************************
  // All the functions below are supposed to be called so that 'this' variable
  // points to the current JSVEE instance.
  // **************************************************************************

  /**
   * Creates a new stack frame.
   *
   * @memberOf JSVEE.handlers.actions
   */
  JSVEE.handlers.actions.createFrame = function(ready, pc, small) {

    var frame = null;
    var newPC = null;

    if (pc && pc.toString()[0] === '@') { // PC can be a label, beginning with @
      newPC = this.findLabel(pc.substring(1));
      frame = JSVEE.utils.ui.createFrame(newPC, small);
    } else {
      newPC = pc || 0;
      frame = JSVEE.utils.ui.createFrame(newPC, small);
    }

    var currentPC = this.getPC();
    this.area.find('.jsvee-stack-frame').first().attr('data-pc', currentPC);

    this.area.find('.jsvee-stack .jsvee-stack-filler').after(frame);

    JSVEE.utils.ui.resizeStack(this.area);
    ready(frame);

  };
  JSVEE.registerAction('createFrame', JSVEE.handlers.actions.createFrame);
  JSVEE.handlers.animations.createFrame = bindAnimation(JSVEE.handlers.actions.createFrame);

  /**
   * Creates a new value to the heap.
   */
  JSVEE.handlers.actions.createValue = function(ready, value, type) {

    var val = JSVEE.utils.ui.findOrCreateValue(this.area, value, type);
    ready(val);

  };
  JSVEE.registerAction('createValue', JSVEE.handlers.actions.createValue);
  JSVEE.handlers.animations.createValue = bindAnimation(JSVEE.handlers.actions.createValue);

  /**
   * Creates a new operator.
   */
  JSVEE.handlers.actions.createOperator = function(ready, operator, type, className, params) {

    var op = JSVEE.utils.ui.createOperator(operator, type, className, params);

    if (className && className.trim().length > 0) {
      this.area.find('.jsvee-class[data-name="' + className + '"]').append(op);
    } else {
      this.area.find('.jsvee-operators').append(op);
    }

    ready(op);

  };
  JSVEE.registerAction('createOperator', JSVEE.handlers.actions.createOperator);
  JSVEE.handlers.animations.createOperator = bindAnimation(JSVEE.handlers.actions.createOperator);

  /**
   * Creates a new function.
   */
  JSVEE.handlers.actions.createFunction = function(ready, name, text, paramCount, pc, className, isStatic) {

    var f = JSVEE.utils.ui.createFunction(name, text, paramCount, pc, className, isStatic);

    if (className) {
      this.area.find('.jsvee-class[data-name="' + className + '"]').last().append(f);
    } else {
      this.area.find('.jsvee-functions').append(f);
    }

    ready(f);

  };
  JSVEE.registerAction('createFunction', JSVEE.handlers.actions.createFunction);
  JSVEE.handlers.animations.createFunction = bindAnimation(JSVEE.handlers.actions.createFunction);
  JSVEE.handlers.explanations.createFunction = JSVEE.messages.createFunction;

  /**
   * Creates a new class.
   */
  JSVEE.handlers.actions.createClass = function(ready, name) {

    var c = JSVEE.utils.ui.createClass(name);
    this.area.find('.jsvee-classes').append(c);
    ready(c);

  };
  JSVEE.registerAction('createClass', JSVEE.handlers.actions.createClass);
  JSVEE.handlers.animations.createClass = bindAnimation(JSVEE.handlers.actions.createClass);

  /**
   * Changes the current line. The evaluation area of the topmost stack frame
   * will be cleared. Optional position defines the exact position of the line.
   */
  JSVEE.handlers.actions.setLine = function(ready, line, position) {

    var stackFrame = this.area.find('.jsvee-stack-frame').first();
    stackFrame.attr('data-line', line);
    stackFrame.find('.jsvee-evaluation-area').children().remove();
    JSVEE.utils.ui.highlightCurrentLine(this.area, line, position);
    this.area.find('.jsvee-code-area').attr('data-line', line);
    ready();

  };
  JSVEE.registerAction('setLine', JSVEE.handlers.actions.setLine);
  JSVEE.handlers.explanations.setLine = JSVEE.messages.setLine;

  // Same functionality as in setLine but a different explanation
  JSVEE.registerAction('jumpTrue', JSVEE.handlers.actions.setLine);
  JSVEE.handlers.explanations.jumpTrue = JSVEE.messages.jumpTrue;
  JSVEE.registerAction('jumpFalse', JSVEE.handlers.actions.setLine);
  JSVEE.handlers.explanations.jumpFalse = JSVEE.messages.jumpFalse;
  JSVEE.registerAction('jumpIterationReady', JSVEE.handlers.actions.setLine);
  JSVEE.handlers.explanations.jumpIterationReady = JSVEE.messages.jumpIterationReady;

  //Same as setLine but keeps the information of the evaluation area.
  JSVEE.handlers.actions.setLineKeepEvalArea = function (ready, line, position) {

    var stackFrame = this.area.find('.jsvee-stack-frame').first();
    stackFrame.attr('data-line', line);
    JSVEE.utils.ui.highlightCurrentLine(this.area, line, position);
    this.area.find('.jsvee-code-area').attr('data-line', line);
    ready();

  };
  JSVEE.registerAction('setLineKeepEvalArea', JSVEE.handlers.actions.setLineKeepEvalArea);
  JSVEE.handlers.explanations.setLineKeepEvalArea = JSVEE.messages.setLine;


  /**
   * Updates the line highlight. This can be used if only a part of the line is
   * highlighted and this part must be changed. Position should be in form
   * "23:34" where the start is a zero-based index and the end last position to
   * be highlighted.
   */
  JSVEE.handlers.actions.setLineHighlight = function(ready, line, position) {

    JSVEE.utils.ui.highlightCurrentLine(this.area, line, position);
    ready();

  };
  JSVEE.registerAction('setLineHighlight', JSVEE.handlers.actions.setLineHighlight);

  /**
   * Creates a new variable to the topmost stack frame. If the name contains a
   * dot, the variable will be considered as a class variable.
   */
  JSVEE.handlers.actions.createVariable = function(ready, name, ref) {

    var variable = JSVEE.utils.ui.createVariable(name);
    JSVEE.utils.ui.placeVariable(this.area, name, variable, ref);
    JSVEE.utils.ui.resizeStack(this.area);
    ready(variable);

  };

  JSVEE.registerAction('createVariable', JSVEE.handlers.actions.createVariable);
  JSVEE.handlers.animations.createVariable = bindAnimation(JSVEE.handlers.actions.createVariable);
  JSVEE.handlers.explanations.createVariable = JSVEE.messages.createVariable;

  // CreateField uses these same functions
  JSVEE.registerAction('createField', JSVEE.handlers.actions.createVariable);
  JSVEE.handlers.animations.createField = bindAnimation(JSVEE.handlers.actions.createVariable);
  JSVEE.handlers.explanations.createField = JSVEE.messages.createField;

  /**
   * Adds the requested value to the evaluation area. Position and type are
   * optional parameters.
   */
  JSVEE.handlers.actions.addValue = function(ready, value, position, type) {

    var val = JSVEE.utils.ui.findOrCreateValue(this.area, value, type).clone();
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    val.appendTo(target);
    ready(val);

  };

  JSVEE.handlers.animations.addValue = function(ready, value, position, type) {

    var val = JSVEE.utils.ui.findOrCreateValue(this.area, value, type);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, val, target, false, ready);

  };

  JSVEE.registerAction('addValue', JSVEE.handlers.actions.addValue);
  JSVEE.handlers.explanations.addValue = JSVEE.messages.addValue;

  /**
   * Assigns the element in the topmost stack frame to the given variable. If
   * the variable does not exist, it will be created. If the index is given, the
   * assignment is considered to be an assignment to a parameter variable.
   */
  JSVEE.handlers.actions.assign = function(ready, name, indexOrRef) {

    var value = null;
    var variable = null;
    var id = null;

    if (indexOrRef === undefined || indexOrRef.toString()[0] === '@') {
      value = JSVEE.utils.ui.findFirstValue(this.area);

      if (indexOrRef && indexOrRef.toString()[0] === '@') {

        if (value.length == 0) {
          value = JSVEE.utils.ui.findVariable(this.area, name).find('.jsvee-value').clone();
        }

        var ref = JSVEE.utils.ui.findVariable(this.area, indexOrRef.substring(1));
        id = ref.find('.jsvee-value').attr('data-id');
        variable = JSVEE.utils.ui.findVariable(this.area, name, id);
      } else {
        variable = JSVEE.utils.ui.findVariable(this.area, name);
      }

    } else {
      value = JSVEE.utils.ui.findParameterValue(this.area, indexOrRef).clone();
      variable = JSVEE.utils.ui.findVariable(this.area, name);
    }

    if (variable) {
      variable.find('.jsvee-value').remove(); // clean possible previous value
      value.appendTo(variable);
      ready(value);
    } else {
      JSVEE.handlers.actions.createVariable.call(this, function(newVar) {
        value.appendTo(newVar);
      }, name, id ? indexOrRef : null);
      ready(value);
    }

  };

  JSVEE.handlers.animations.assign = function(ready, name, indexOrRef) {

    var value = null;
    var moveOriginal = true;
    var variable = null;
    var id = null;
    var highlighted = [];

    if (indexOrRef === undefined || indexOrRef.toString()[0] === '@') {
      value = JSVEE.utils.ui.findFirstValue(this.area);

      if (indexOrRef && indexOrRef.toString()[0] === '@') {

        if (value.length == 0) {
          value = JSVEE.utils.ui.findVariable(this.area, name).find('.jsvee-value');
          moveOriginal = false;
        }

        var ref = JSVEE.utils.ui.findVariable(this.area, indexOrRef.substring(1));
        id = ref.find('.jsvee-value').attr('data-id');
        variable = JSVEE.utils.ui.findVariable(this.area, name, id);
        highlighted.push(ref.find('.jsvee-value'));
        highlighted.push(JSVEE.utils.ui.findValueById(this.area, id));
        $.each(highlighted, function() {
          this.addClass('jsvee-highlight');
        });
      } else {
        variable = JSVEE.utils.ui.findVariable(this.area, name);
      }

    } else {
      value = JSVEE.utils.ui.findParameterValue(this.area, indexOrRef);
      variable = JSVEE.utils.ui.findVariable(this.area, name);
      moveOriginal = false;
    }

    var readyFunction = function() {
      $.each(highlighted, function() {
        this.removeClass('jsvee-highlight');
      });
      ready();
    };

    if (variable) {

      // If this is a reassignment, place the new value
      // on the top of the previous value
      var over = null;
      if (variable.find('.jsvee-value').length > 0) {
        over = variable.find('.jsvee-value').first();
      }

      JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, value, variable, moveOriginal, readyFunction, false,
        over);

    } else {

      var empty = JSVEE.utils.ui.createEmptyVariable();
      JSVEE.utils.ui.placeVariable(this.area, name, empty, id ? indexOrRef : null);
      JSVEE.utils.ui.resizeStack(this.area);
      JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, value, empty, moveOriginal, function() {
        empty.remove();
        readyFunction();
      });

    }

  };

  JSVEE.registerAction('assign', JSVEE.handlers.actions.assign);
  JSVEE.handlers.explanations.assign = JSVEE.messages.assign;

  // AssignParameter will use these same functions
  JSVEE.registerAction('assignParameter', JSVEE.handlers.actions.assign);
  JSVEE.handlers.animations.assignParameter = JSVEE.handlers.animations.assign;
  JSVEE.handlers.explanations.assignParameter = JSVEE.messages.assignParameter;

  // AssignField will use these same functions
  JSVEE.registerAction('assignField', JSVEE.handlers.actions.assign);
  JSVEE.handlers.animations.assignField = JSVEE.handlers.animations.assign;
  JSVEE.handlers.explanations.assignField = JSVEE.messages.assignField;

  /**
   * Assigns the parameter values to the corresponding parameter variables.
   * Names must be a list containing the names of the parameter variables.
   */
  JSVEE.handlers.actions.assignParameters = function(ready, names) {

    var that = this;
    var readyAssignments = [];

    $.each(names, function(i) {
      JSVEE.handlers.actions.assign.call(that, function(value) {

        readyAssignments.push(value);
        if (readyAssignments.length === names.length) {
          ready(readyAssignments);
        }

      }, this, i);
    });

  };

  JSVEE.handlers.animations.assignParameters = function(ready, names) {

    var that = this;
    var readyAssignments = 0;

    $.each(names, function(i) {
      JSVEE.handlers.animations.assign.call(that, function() {

        readyAssignments++;
        if (readyAssignments === names.length) {
          ready();
        }

      }, this, i);
    });

  };

  JSVEE.registerAction('assignParameters', JSVEE.handlers.actions.assignParameters);
  JSVEE.handlers.explanations.assignParameters = JSVEE.messages.assignParameters;

  /**
   * Assigns multiple instance variables in one step.
   */
  JSVEE.handlers.actions.assignFields = function(ready, names, ref) {

    var that = this;
    var readyAssignments = [];

    $.each(names, function(i) {
      JSVEE.handlers.actions.assign.call(that, function(value) {

        readyAssignments.push(value);
        if (readyAssignments.length === names.length) {
          ready(readyAssignments);
        }

      }, this, ref);
    });

  };

  JSVEE.handlers.animations.assignFields = function(ready, names, ref) {

    var that = this;
    var readyAssignments = 0;

    $.each(names, function(i) {
      JSVEE.handlers.animations.assign.call(that, function() {

        readyAssignments++;
        if (readyAssignments === names.length) {
          ready();
        }

      }, this, ref);
    });

  };

  JSVEE.registerAction('assignFields', JSVEE.handlers.actions.assignFields);
  JSVEE.handlers.explanations.assignFields = JSVEE.messages.assignFields;

  /**
   * Adds the value from the variable to the given position in the topmost stack
   * frame.
   */
  JSVEE.handlers.actions.addValueFromVariable = function(ready, name, position) {

    var variable = JSVEE.utils.ui.findVariable(this.area, name);

    if (!variable) {
      throw "Variable " + name + " not found.";
    }

    var value = variable.find('.jsvee-value, .jsvee-function').first().clone();
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    value.appendTo(target);
    ready(value);

  };

  JSVEE.handlers.animations.addValueFromVariable = function(ready, name, position) {

    var variable = JSVEE.utils.ui.findVariable(this.area, name);

    if (!variable) {
      throw "Variable " + name + " not found.";
    }

    var value = variable.find('.jsvee-value, .jsvee-function').first();
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, value, target, false, ready);

  };

  JSVEE.registerAction('addValueFromVariable', JSVEE.handlers.actions.addValueFromVariable);
  JSVEE.handlers.explanations.addValueFromVariable = JSVEE.messages.addValueFromVariable;

  /**
   * Adds the value from the instance variable to the given position in the
   * topmost stack frame.
   */
  JSVEE.handlers.actions.addValueFromField = function(ready, name, ref, position) {

    var value = null;
    var id = null;

    if (ref != "") {
      var refVar = JSVEE.utils.ui.findVariable(this.area, ref.substring(1));
      id = refVar.find('.jsvee-value').attr('data-id');
    } else {
      var element = JSVEE.utils.ui.findElement(this.area, position);
      id = element.attr('data-id');
      element.remove();
    }

    var variable = JSVEE.utils.ui.findVariable(this.area, name, id);
    value = variable.find('.jsvee-value').first().clone();

    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    value.appendTo(target);
    ready(value);

  };

  JSVEE.handlers.animations.addValueFromField = function(ready, name, ref, position) {

    var refVar = null;
    var id = null;
    var highlight = null;

    if (ref != "") {
      refVar = JSVEE.utils.ui.findVariable(this.area, ref.substring(1));
      id = refVar.find('.jsvee-value').attr('data-id');
      highlight = refVar.find('.jsvee-value');
    } else {
      var element = JSVEE.utils.ui.findElement(this.area, position);
      highlight = element;
      id = element.attr('data-id');
    }

    var variable = JSVEE.utils.ui.findVariable(this.area, name, id);
    var value = variable.find('.jsvee-value').first();
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);

    highlight.addClass('jsvee-highlight');
    variable.parents('.jsvee-instance').addClass('jsvee-highlight');

    var readyFunction = function() {
      highlight.removeClass('jsvee-highlight');
      variable.parents('.jsvee-instance').removeClass('jsvee-highlight');
      ready();
    };

    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, value, target, false, readyFunction);

  };

  JSVEE.registerAction('addValueFromField', JSVEE.handlers.actions.addValueFromField);
  JSVEE.handlers.explanations.addValueFromField = JSVEE.messages.addValueFromField;

  /**
   * Adds the operator to the evaluation area.
   */
  JSVEE.handlers.actions.addOperator = function(ready, operator, position, type) {

    var op = JSVEE.utils.ui.findOperator(this.area, operator, position);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    var newOp = op.clone();
    newOp.appendTo(target);

    if (op.attr('data-type') === 'p' || op.attr('data-type') === 'pr') {
      JSVEE.utils.ui.createOperatorParameters(newOp);
    }

    if (type) {
      newOp.attr('data-type', type);
    }

    ready(newOp);

  };

  JSVEE.handlers.animations.addOperator = function(ready, operator, position) {

    var op = JSVEE.utils.ui.findOperator(this.area, operator, position);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, op, target, false, ready);

  };

  JSVEE.registerAction('addOperator', JSVEE.handlers.actions.addOperator);
  JSVEE.handlers.explanations.addOperator = JSVEE.messages.addOperator;

  /**
   * Evaluates the operator at the given position and replaces it with the
   * result.
   */
  JSVEE.handlers.actions.evaluateOperator = function(ready, position) {

    var op = JSVEE.utils.ui.findElement(this.area, position);
    var operands = JSVEE.utils.ui.findOperands(op);

    var readyFunction = function(result) {

      if (result) {
        op.replaceWith(result.clone());
      } else {
        op.remove();
      }

      $.each(operands, function() {
        this.remove();
      });

      ready(result);

    };

    // Find the correct handler for the evaluation
    if (op.attr('data-class') && JSVEE.handlers.classes.hasOwnProperty(op.attr('data-class'))) {
      JSVEE.handlers.classes[op.attr('data-class')].call(this, readyFunction, this.area, op, operands);
    } else if (JSVEE.handlers.operators.hasOwnProperty(op.attr('data-name'))) {
      JSVEE.handlers.operators[op.attr('data-name')].call(this, readyFunction, this.area, op, operands);
    } else if (JSVEE.handlers.global) {
      JSVEE.handlers.global.call(this, readyFunction, this.area, op, operands);
    } else {
      readyFunction();
    }

  };

  JSVEE.handlers.explanations.evaluateOperator = function(position) {
    // Find the name of the operator
    var op = JSVEE.utils.ui.findElement(this.area, position);
    return JSVEE.messages.evaluateOperator(op.attr('data-name'));
  };

  JSVEE.handlers.animations.evaluateOperator = JSVEE.utils.ui.flashElement;
  JSVEE.registerAction('evaluateOperator', JSVEE.handlers.actions.evaluateOperator);

  /**
   * Adds a function to the evaluation area.
   */
  JSVEE.handlers.actions.addFunction = function(ready, name, position, params, className) {

    var func = JSVEE.utils.ui.findFunction(this.area, name, params, className, position);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    var newElement = func.clone().appendTo(target);
    newElement.attr('data-params', params);
    JSVEE.utils.ui.convertFunctionToCallable(newElement);
    ready(newElement);

  };

  JSVEE.handlers.animations.addFunction = function(ready, name, position, params, className) {

    var func = JSVEE.utils.ui.findFunction(this.area, name, params, className, position);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, func, target, false, ready);

  };

  JSVEE.handlers.explanations.addFunction = function(name, position, params, className) {

    if (!className) {
      return JSVEE.messages.addFunction(name);
    }

    return JSVEE.messages.addMethod(name);

  };

  JSVEE.registerAction('addFunction', JSVEE.handlers.actions.addFunction);

  /**
   * Adds a function reference to the evaluation area.
   */
  JSVEE.handlers.actions.addFunctionReference = function(ready, name, position, params, className) {

    var func = JSVEE.utils.ui.findFunction(this.area, name, params, className);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    var newElement = func.clone().appendTo(target);
    newElement.text(newElement.attr('data-name'));
    ready(newElement);

  };

  JSVEE.handlers.animations.addFunctionReference = function(ready, name, position, params, className) {

    var func = JSVEE.utils.ui.findFunction(this.area, name, params, className);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, func, target, false, ready);

  };

  JSVEE.handlers.explanations.addFunctionReference = JSVEE.messages.addFunction;
  JSVEE.registerAction('addFunctionReference', JSVEE.handlers.actions.addFunctionReference);

  /**
   * Adds a function from a variable to the evaluation area.
   */
  JSVEE.handlers.actions.addFunctionFromVariable = function(ready, name, position, params) {

    var variable = JSVEE.utils.ui.findVariable(this.area, name);
    var func = variable.find('.jsvee-function, .jsvee-value').first();

    if (func.hasClass('jsvee-ref')) {
      var id = func.attr('data-id');
      func = JSVEE.utils.ui.findValueById(this.area, id).clone();
      func.children().remove();
      JSVEE.utils.ui.createReference(this.area, id).appendTo(func);
      func.append($('<span>&nbsp;</span>'));
    }

    func.removeClass("jsvee-value");
    func.removeClass("jsvee-instance");
    func.removeClass("jsvee-ref");
    func.addClass("jsvee-function");

    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    var newElement = func.clone().appendTo(target);
    JSVEE.utils.ui.convertFunctionToCallable(newElement);
    ready(newElement);

  };

  JSVEE.handlers.animations.addFunctionFromVariable = function(ready, name, position, params) {

    var variable = JSVEE.utils.ui.findVariable(this.area, name);
    var func = variable.find('.jsvee-function, .jsvee-value').first();
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, func, target, false, ready);

  };

  JSVEE.handlers.explanations.addFunctionFromVariable = JSVEE.messages.addValueFromVariable;
  JSVEE.registerAction('addFunctionFromVariable', JSVEE.handlers.actions.addFunctionFromVariable);

  /**
   * Evaluates the function at the given position. If it is not a built-in
   * function, a new stack frame will be created for the function.
   */
  JSVEE.handlers.actions.evaluateFunction = function(ready, position) {

    var func = JSVEE.utils.ui.findElement(this.area, position);

    if (!JSVEE.utils.ui.isFunctionBuiltin(func)) {
      func.addClass('jsvee-active');
      var newFrame = null;
      JSVEE.handlers.actions.createFrame.call(this, function(frame) {
        newFrame = frame;
      }, func.attr('data-pc'));
      this.setPC(this.area.find('.jsvee-stack-frame').first().attr('data-pc'));
      ready(newFrame);

    } else {

      var readyFunction = function(result) {

        if (result) {
          func.replaceWith(result.clone());
        } else {
          func.remove();
        }

        ready(result);

      };

      // Find the correct handler for the evaluation
      if (func.attr('data-class') && JSVEE.handlers.classes.hasOwnProperty(func.attr('data-class'))) {
        JSVEE.handlers.classes[func.attr('data-class')].call(this, readyFunction, this.area, func);
      } else if (JSVEE.handlers.functions.hasOwnProperty(func.attr('data-name'))) {
        JSVEE.handlers.functions[func.attr('data-name')].call(this, readyFunction, this.area, func);
      } else if (JSVEE.handlers.global) {
        JSVEE.handlers.global.call(this, readyFunction, this.area, func);
      } else {
        readyFunction();
      }

    }

  };

  JSVEE.handlers.animations.evaluateFunction = function(ready, position) {

    var that = this;
    var func = JSVEE.utils.ui.findElement(this.area, position);
    JSVEE.utils.ui.flashElement.call(this, function() {

      if (!JSVEE.utils.ui.isFunctionBuiltin(func)) {

        var curPC = that.getPC(); // don't change PC too early
        bindAnimation.call(that, JSVEE.handlers.actions.evaluateFunction).call(that, ready, position);
        that.setPC(curPC);

      } else {
        ready();
      }

    }, position);
  };

  JSVEE.handlers.explanations.evaluateFunction = function(position) {

    var func = JSVEE.utils.ui.findElement(this.area, position);
    var name = func.attr('data-name');

    // Find the correct type of the function
    if (!JSVEE.utils.ui.isFunctionBuiltin(func) && !func.attr('data-class')) {
      return JSVEE.messages.evaluateFunction(name);
    }

    if (JSVEE.utils.ui.isFunctionBuiltin(func) && !func.attr('data-class')) {
      return JSVEE.messages.evaluateBuiltInFunction(name);
    }

    if (!JSVEE.utils.ui.isFunctionBuiltin(func) && func.attr('data-class')) {
      return JSVEE.messages.evaluateMethod(name);
    }
    return JSVEE.messages.evaluateBuiltInMethod(name);

  };

  JSVEE.registerAction('evaluateFunction', JSVEE.handlers.actions.evaluateFunction);

  /**
   * Creates parameter variables. The variable names are expected to be in a
   * list.
   */
  JSVEE.handlers.actions.createParameterVariables = function(ready, names) {

    var that = this;
    var variables = [];

    var readyFunction = function(variable) {
      variables.push(variable);
      if (variables.length === names.length) { // all variables created?
        ready(variables);
      }
    };

    $.each(names, function() {
      JSVEE.handlers.actions.createVariable.call(that, readyFunction, this);
    });

  };

  JSVEE.registerAction('createParameterVariables', JSVEE.handlers.actions.createParameterVariables);
  JSVEE.handlers.animations.createParameterVariables = bindAnimation(JSVEE.handlers.actions.createParameterVariables);
  JSVEE.handlers.explanations.createParameterVariables = JSVEE.messages.createParameterVariables;

  /**
   * Creates multiple instance variables in one step.
   */
  JSVEE.handlers.actions.createFields = function(ready, names, ref) {

    var that = this;
    var variables = [];

    var readyFunction = function(variable) {
      variables.push(variable);
      if (variables.length === names.length) { // all variables created?
        ready(variables);
      }
    };

    $.each(names, function() {
      JSVEE.handlers.actions.createVariable.call(that, readyFunction, this, ref);
    });

  };

  JSVEE.registerAction('createFields', JSVEE.handlers.actions.createFields);
  JSVEE.handlers.animations.createFields = bindAnimation(JSVEE.handlers.actions.createFields);
  JSVEE.handlers.explanations.createFields = JSVEE.messages.createFields;

  /**
   * Returns the function's return value and replaces the active call with the
   * value.
   */
  JSVEE.handlers.actions.returnValue = function(ready) {

    var retVal = JSVEE.utils.ui.findFirstValue(this.area);
    var func = JSVEE.utils.ui.findActiveCall(this.area);
    var frame = this.area.find('.jsvee-stack-frame').eq(1);
    func.replaceWith(retVal);

    if (frame.attr('data-line')) {
      JSVEE.handlers.actions.setLine.call(this, function() {
        return;
      }, frame.attr('data-line'));
    }

    this.area.find('.jsvee-stack-frame').first().remove();

    var newPC = this.area.find('.jsvee-stack-frame').first().attr('data-pc');
    this.setPC(newPC);

    ready(retVal);

  };

  JSVEE.handlers.animations.returnValue = function(ready) {

    var that = this;
    var retVal = JSVEE.utils.ui.findFirstValue(this.area);
    var func = JSVEE.utils.ui.findActiveCall(this.area);
    var frame = this.area.find('.jsvee-stack-frame').first();
    var label = func.find('.jsvee-function-name, .jsvee-ref').first();
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, retVal, label, true, function() {

      func.before(retVal.clone());
      retVal.hide();
      func.hide();
      JSVEE.utils.ui.resizeStack(that.area);
      frame.delay(that.animationLength).fadeOut(that.animationLength, function() {
        func.before().remove();
        ready();
      });

    }, true);

  };

  JSVEE.registerAction('returnValue', JSVEE.handlers.actions.returnValue);
  JSVEE.handlers.explanations.returnValue = JSVEE.messages.returnValue;

  /**
   * Ends the current call by deleting the topmost stack frame and the active
   * function call in the frame below that.
   */
  JSVEE.handlers.actions.returnVoid = function(ready) {

    var func = JSVEE.utils.ui.findActiveCall(this.area);
    var frame = this.area.find('.jsvee-stack-frame').eq(1);
    func.remove();

    if (frame.attr('data-line')) {
      JSVEE.handlers.actions.setLine.call(this, function() {
        return;
      }, frame.attr('data-line'));
    }

    this.area.find('.jsvee-stack-frame').first().remove();

    var newPC = this.area.find('.jsvee-stack-frame').first().attr('data-pc');
    this.setPC(newPC);

    ready();

  };

  JSVEE.handlers.animations.returnVoid = function(ready) {

    var that = this;
    var frame = this.area.find('.jsvee-stack-frame').first();

    frame.delay(that.animationLength).fadeOut(that.animationLength, function() {
      ready();
    });

  };

  JSVEE.registerAction('returnVoid', JSVEE.handlers.actions.returnVoid);
  JSVEE.handlers.explanations.returnVoid = JSVEE.messages.returnVoid;

  /**
   * Sets the PC by testing the truthness of the current value in the evaluation
   * area.
   */
  JSVEE.handlers.actions.conditionalJump = function(ready, ifTrue, ifFalse) {

    var value = JSVEE.utils.ui.findFirstValue(this.area);
    var result = JSVEE.handlers.truthness(value);

    if (result) {
      this.setPC(ifTrue);
    } else {
      this.setPC(ifFalse);
    }

    ready();

  };
  JSVEE.registerAction('conditionalJump', JSVEE.handlers.actions.conditionalJump);

  /**
   * Creates a new class instance and adds it to the heap. The new instance can
   * contain instance variables which may also have some initial values.
   */
  JSVEE.handlers.actions.createInstance = function(ready, className, variables, values, types) {

    var instance = JSVEE.utils.ui.createInstance(this.area, className);
    this.area.find('.jsvee-heap').append(instance);

    if (variables) {

      var i = 0;
      for (i = 0; i < variables.length; i++) {
        var newVar = JSVEE.utils.ui.createVariable(variables[i]);
        newVar.appendTo(instance);

        if (values && i < values.length) {
          var typeExists = types && i < types.length;
          var newVal = JSVEE.utils.ui.findOrCreateValue(this.area, values[i], typeExists ? types[i] : undefined);
          newVal.clone().appendTo(newVar);
        }
      }
    } else if (!variables && values) {
      for (i = 0; i < values.length; i++) {
        var typeExists = types && i < types.length;
        var newVal = JSVEE.utils.ui.createValue(values[i], instance.attr('data-id'), typeExists ? types[i] : undefined);
        newVal.clone().appendTo(instance);
      }
    }

    ready(instance);

  };

  JSVEE.handlers.animations.createInstance = function(ready, className, variables, values, types) {

    var that = this;
    var originalCounter = that.area.find('.jsvee-heap').attr('data-id-counter');
    var readyFunc = function() {
      // Decrease the global id counter because the element will be removed
      // after the animation!
      that.area.find('.jsvee-heap').attr('data-id-counter', originalCounter);
      ready();
    };

    bindAnimation(JSVEE.handlers.actions.createInstance).call(this, readyFunc, className, variables, values, types);

  };

  JSVEE.handlers.explanations.createInstance = JSVEE.messages.createInstance;
  JSVEE.registerAction('createInstance', JSVEE.handlers.actions.createInstance);

  /**
   * Disables all animations. After this instruction, all the steps will occur
   * immediatelly without an animation.
   */
  JSVEE.handlers.actions.disableAnimations = function(ready) {
    var that = this; // a hack to fix Eclipse's Outline
    JSVEE.utils.ui.setStatusText(that.area, ' ');
    that.state.animationsDisabled = true;
    ready();
  };
  JSVEE.registerAction('disableAnimations', JSVEE.handlers.actions.disableAnimations);

  /**
   * Enables animations. This is expected to be called after animations have
   * been disabled and multiple steps have been executed.
   */
  JSVEE.handlers.actions.enableAnimations = function(ready) {
    var that = this; // a hack to fix Eclipse's Outline
    if (!that.state.reEnableAnimations) {
      that.state.animationsDisabled = false;
    }
    if (that.area.find('.jsvee-status-area').text().trim().length > 0) {
      // JSVEE.utils.ui.appendToStatus(that.area, JSVEE.messages.readyText());
    }
    ready();
  };
  JSVEE.registerAction('enableAnimations', JSVEE.handlers.actions.enableAnimations);

  /**
   * Disables stepping.
   */
  JSVEE.handlers.actions.disableStepping = function(ready) {
    var that = this; // a hack to fix Eclipse's Outline
    that.state.continueRunning = true;
    ready();
  };
  JSVEE.registerAction('disableStepping', JSVEE.handlers.actions.disableStepping);

  /**
   * Enables stepping.
   */
  JSVEE.handlers.actions.enableStepping = function(ready) {
    var that = this; // a hack to fix Eclipse's Outline
    if (!that.state.reEnableAnimations) {
      that.state.continueRunning = false;
    }
    ready();
  };
  JSVEE.registerAction('enableStepping', JSVEE.handlers.actions.enableStepping);

  /**
   * Runs the given number of steps without stopping between the steps.
   */
  JSVEE.handlers.actions.runForward = function(ready, count, text) {
    var that = this; // a hack to fix Eclipse's Outline
    that.state.stepsToRun = +count + 1;
    JSVEE.utils.ui.setStatusText(this.area, text);
    ready();
  };

  JSVEE.registerAction('runForward', JSVEE.handlers.actions.runForward);

  /**
   * Flashes the element at the given position.
   */
  JSVEE.handlers.actions.flashElement = function(ready, position) {
    JSVEE.utils.ui.flashElement.call(this, ready, position);
  };
  JSVEE.registerAction('flashElement', JSVEE.handlers.actions.flashElement);

  /**
   * Shows the given text in the status area.
   */
  JSVEE.handlers.actions.showText = function(ready, text) {
    JSVEE.utils.ui.setStatusText(this.area, text);
    ready();
  };
  JSVEE.registerAction('showText', JSVEE.handlers.actions.showText);

  /**
   * Shows the given alert.
   */

  JSVEE.handlers.actions.alert = function(ready, text) {
    alert(text);
    ready();
  };

  JSVEE.handlers.explanations.alert = JSVEE.messages.alert;

  JSVEE.registerAction('alert', JSVEE.handlers.actions.alert);

  /**
   * Shows the given alert.
   */

  JSVEE.handlers.actions.alertOnce = function(ready, text) {
    this.steps[this.getPC() - 1][0] = "_nop";
    alert(text);
    ready();
  };

  JSVEE.handlers.explanations.alertOnce = JSVEE.messages.alert;

  JSVEE.registerAction('alertOnce', JSVEE.handlers.actions.alertOnce);

  /**
   * Adds the requested reference to the evaluation area. Position is an
   * optional parameter. If the id is negative (or missing), a reference to the
   * most recent class instance will be added.
   */
  JSVEE.handlers.actions.addReference = function(ready, id, position) {

    var ref = JSVEE.utils.ui.findReference(this.area, id);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    ref.appendTo(target);
    ready(ref);

  };

  JSVEE.handlers.animations.addReference = function(ready, id, position) {

    var ref = JSVEE.utils.ui.findReference(this.area, id);
    var instance = JSVEE.utils.ui.findValueById(this.area, ref.attr('data-id'));

    ref.appendTo(this.area.find('.jsvee-animation-area'));
    ref.css('position', 'absolute');
    ref.offset(instance.offset());

    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, ref, target, true, function() {
      ref.remove();
      ready();
    });

  };

  JSVEE.registerAction('addReference', JSVEE.handlers.actions.addReference);
  JSVEE.handlers.explanations.addReference = function(id) {

    var realId = JSVEE.utils.ui.findReference(this.area, id).attr('data-id');
    return JSVEE.messages.addReference(realId);

  };

  /**
   * Creates a new array in the heap. The size of the array is expected to be
   * inside the "new" operator in the evaluation area.
   */
  JSVEE.handlers.actions.createArray = function(ready, position, arrayType, value, valueType, length) {

    var instance = JSVEE.utils.ui.createInstance(this.area, arrayType);
    this.area.find('.jsvee-heap').append(instance);

    var op = JSVEE.utils.ui.findElement(this.area, position);
    var size = +op.find('.jsvee-value').first().text();

    if (length) {
      var lengthVar = JSVEE.utils.ui.createVariable(length);
      var sizeVal = op.find('.jsvee-value').first().clone();
      sizeVal.appendTo(lengthVar);
      lengthVar.appendTo(instance);
    }

    var i = 0,
      element = null;
    for (i = 0; i < size; i++) {
      element = JSVEE.utils.ui.findOrCreateValue(this.area, value, valueType).clone();
      element.appendTo(instance);
    }

    var id = instance.attr('data-id');
    var ref = JSVEE.utils.ui.createReference(this.area, id);

    op.replaceWith(ref);

    ready(instance);

  };

  JSVEE.handlers.animations.createArray = JSVEE.utils.ui.flashElement;

  JSVEE.handlers.explanations.createArray = function(position, arrayType, value, valueType) {
    return JSVEE.messages.createArray(valueType);
  };

  JSVEE.registerAction('createArray', JSVEE.handlers.actions.createArray);

  /**
   * Evaluates the operator at the given position by replacing it with a value
   * from an array.
   */
  JSVEE.handlers.actions.getValueAtIndex = function(ready, position) {

    var op = JSVEE.utils.ui.findElement(this.area, position);
    var id = op.find('.jsvee-value').first().attr('data-id');
    var index = op.find('.jsvee-value').eq(1).text();
    var value = JSVEE.utils.ui.findValueInCollection(this.area, id, index);

    if (value.length == 0) {
      throw "Incorrect index.";
    }

    op.replaceWith(value.clone());
    ready(value);

  };

  JSVEE.handlers.animations.getValueAtIndex = function(ready, position) {

    var that = this;

    var readyFunction = function() {

      var op = JSVEE.utils.ui.findElement(that.area, position);
      var id = op.find('.jsvee-value').first().attr('data-id');
      var index = op.find('.jsvee-value').eq(1).text();
      var value = JSVEE.utils.ui.findValueInCollection(that.area, id, index);

      if (value.length == 0) {
        throw "Incorrect index.";
      }

      JSVEE.utils.ui.animateMoveToTarget.call(that, that.area, value, op, false, ready, false, op.find('.jsvee-value')
        .first());
    };

    JSVEE.utils.ui.flashElement.call(this, readyFunction, position);

  };

  JSVEE.handlers.explanations.getValueAtIndex = JSVEE.messages.getValueAtIndex;
  JSVEE.registerAction('getValueAtIndex', JSVEE.handlers.actions.getValueAtIndex);

  /**
   * Evaluates the operator at the given position by returning the requested key
   * from the set.
   */
  JSVEE.handlers.actions.getValueByKey = function(ready, position) {

    var op = JSVEE.utils.ui.findElement(this.area, position);
    var id = op.find('.jsvee-value').first().attr('data-id');
    var key = op.find('.jsvee-value').eq(1).text();
    var value = JSVEE.utils.ui.findValueInSet(this.area, id, key);
    op.replaceWith(value.clone());
    ready(value);

  };

  JSVEE.handlers.animations.getValueByKey = function(ready, position) {

    var that = this;

    var readyFunction = function() {

      var op = JSVEE.utils.ui.findElement(that.area, position);
      var id = op.find('.jsvee-value').first().attr('data-id');
      var key = op.find('.jsvee-value').eq(1).text();
      var value = JSVEE.utils.ui.findValueInSet(that.area, id, key);
      JSVEE.utils.ui.animateMoveToTarget.call(that, that.area, value, op, false, ready, false, op.find('.jsvee-value')
        .first());
    };

    JSVEE.utils.ui.flashElement.call(this, readyFunction, position);

  };

  JSVEE.handlers.explanations.getValueByKey = JSVEE.messages.getValueByKey;
  JSVEE.registerAction('getValueByKey', JSVEE.handlers.actions.getValueByKey);

  /**
   * Evaluates the operator at the given position by assigning the value to an
   * array.
   */
  JSVEE.handlers.actions.setValueAtIndex = function(ready, position) {

    var op = JSVEE.utils.ui.findElement(this.area, position);
    var id = op.find('.jsvee-value').first().attr('data-id');
    var index = op.find('.jsvee-value').eq(1).text();
    var origValue = JSVEE.utils.ui.findValueInCollection(this.area, id, index);
    var newValue = op.find('.jsvee-value').eq(2);
    origValue.replaceWith(newValue.clone());
    op.remove();
    ready(newValue);

  };

  JSVEE.handlers.animations.setValueAtIndex = function(ready, position) {

    var that = this;

    var readyFunction = function() {

      var op = JSVEE.utils.ui.findElement(that.area, position);
      var id = op.find('.jsvee-value').first().attr('data-id');
      var index = op.find('.jsvee-value').eq(1).text();
      var origValue = JSVEE.utils.ui.findValueInCollection(that.area, id, index);
      var newValue = op.find('.jsvee-value').eq(2);
      JSVEE.utils.ui.animateMoveToTarget.call(that, that.area, newValue, origValue, false, ready, false, origValue);
    };

    JSVEE.utils.ui.flashElement.call(this, readyFunction, position);

  };

  JSVEE.handlers.explanations.setValueAtIndex = JSVEE.messages.setValueAtIndex;
  JSVEE.registerAction('setValueAtIndex', JSVEE.handlers.actions.setValueAtIndex);

  /**
   * Evaluates the operator at the given position by assigning the value to an
   * array.
   */
  JSVEE.handlers.actions.setValueByKey = function(ready, position) {

    var op = JSVEE.utils.ui.findElement(this.area, position);
    var id = op.find('.jsvee-value').first().attr('data-id');
    var key = op.find('.jsvee-value').eq(1);
    var origValue = JSVEE.utils.ui.findValueInSet(this.area, id, key.text());
    var newValue = op.find('.jsvee-value').eq(2);
    if (origValue) {
      origValue.replaceWith(newValue.clone());
      op.remove();
    } else {
      JSVEE.utils.ui.createKeyValuePair(this.area, id, key, newValue);
      op.remove();
    }

    ready();

  };

  JSVEE.handlers.animations.setValueByKey = function(ready, position) {

    var that = this;

    var readyFunction = function() {

      var op = JSVEE.utils.ui.findElement(that.area, position);
      var id = op.find('.jsvee-value').first().attr('data-id');
      var key = op.find('.jsvee-value').eq(1).text();
      var origValue = JSVEE.utils.ui.findValueInSet(that.area, id, key);
      if (origValue) {
        var newValue = op.find('.jsvee-value').eq(2);
        JSVEE.utils.ui.animateMoveToTarget.call(that, that.area, newValue, origValue, false, ready, false, origValue);
      } else {
        ready();
      }
    };

    JSVEE.utils.ui.flashElement.call(this, readyFunction, position);

  };

  JSVEE.handlers.explanations.setValueByKey = JSVEE.messages.setValueByKey;
  JSVEE.registerAction('setValueByKey', JSVEE.handlers.actions.setValueByKey);

  /**
   * No-operation
   */
  JSVEE.handlers.actions.nop = function(ready) {
    ready();
  };

  JSVEE.registerAction('nop', JSVEE.handlers.actions.nop);
  JSVEE.registerAction('end', JSVEE.handlers.actions.nop);

  /**
   * Converts a function reference to callable, ie. evaluation areas are added
   * inside the function element.
   */
  JSVEE.handlers.actions.convertFunctionToCallable = function(ready, position) {

    var element = JSVEE.utils.ui.findElement(this.area, position);
    JSVEE.utils.ui.convertFunctionToCallable(element);
    JSVEE.utils.ui.resizeStack(this.area);
    ready(element);

  };
  JSVEE.registerAction('convertFunctionToCallable', JSVEE.handlers.actions.convertFunctionToCallable);

  /**
   * Shows the given text in the info area. The text will be visible until
   * hideInfo is executed.
   */
  JSVEE.handlers.actions.showInfo = function(ready, text, asHTML) {
    JSVEE.utils.ui.showInfoText(this.area, text, asHTML);
    ready(text);

  };
  JSVEE.registerAction('showInfo', JSVEE.handlers.actions.showInfo);

  /**
   * Hides the info area.
   */
  JSVEE.handlers.actions.hideInfo = function(ready) {

    JSVEE.utils.ui.hideInfo(this.area);
    ready();

  };
  JSVEE.registerAction('hideInfo', JSVEE.handlers.actions.hideInfo);

  /**
   * Creates a new iterator and saves it to the topmost stack frame.
   */
  JSVEE.handlers.actions.createIterator = function(ready, name, collection, from, to, type) {

    var frame = this.area.find(".jsvee-stack-frame").first();
    frame.find('.jsvee-iterator[data-name="' + name + '"]').remove();

    var collectionId = collection;
    if (collection.toString()[0] === '@') {
      // parameter is a reference to a variable
      var variable = JSVEE.utils.ui.findVariable(this.area, collection.substring(1));
      collectionId = variable.find('.jsvee-value').attr('data-id');
    }

    var iterator = JSVEE.utils.ui.createIterator(name, collectionId, from, to, type);
    iterator.appendTo(frame);
    ready(iterator);

  };
  JSVEE.registerAction('createIterator', JSVEE.handlers.actions.createIterator);

  /**
   * Moves the named iterator one step forward and changes the PC according to
   * the state of the iterator.
   */
  JSVEE.handlers.actions.iterate = function(ready, name, ifMore, ifDone) {

    var frame = this.area.find('.jsvee-stack-frame').first();
    var iterator = frame.find('.jsvee-iterator[data-name="' + name + '"]').first();
    var cont = true;
    var current = +iterator.attr('data-current');
    var collectionId = iterator.attr('data-collection');

    if (collectionId) { // collection or integer iterator?
      var collection = JSVEE.utils.ui.findValueById(this.area, collectionId);

      var itemCount = -1;

      if (collection.hasClass('jsvee-instance')) {
        itemCount = collection.children('.jsvee-key-value-pair, .jsvee-value').length;
      } else {
        itemCount = collection.attr('data-value').length;
      }

      cont = ++current < itemCount;
    } else {
      var to = +iterator.attr('data-to');
      cont = current++ < to;
    }

    if (cont) {
      iterator.attr('data-current', current);
      this.setPC(ifMore);
    } else {
      this.setPC(ifDone);
    }

    ready();

  };
  JSVEE.registerAction('iterate', JSVEE.handlers.actions.iterate);

  /**
   * Takes the next element in the collection specified by the name of the
   * iterator and places the value to the evaluation area.
   */
  JSVEE.handlers.actions.takeNext = function(ready, name, position) {

    var frame = this.area.find('.jsvee-stack-frame').first();
    var iterator = frame.find('.jsvee-iterator[data-name="' + name + '"]').first();
    var value = JSVEE.utils.ui.findValueToBeIterated(this.area, iterator);
    var clonedValue = value.clone();

    if (value.parent().is('.jsvee-instance')) {
      if (!value.is(':visible')) {
        clonedValue.show();
        clonedValue.attr('style', null);
      }
    }

    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    clonedValue.appendTo(target);
    ready(clonedValue);

  };

  JSVEE.handlers.animations.takeNext = function(ready, name, position) {

    var frame = this.area.find('.jsvee-stack-frame').first();
    var iterator = frame.find('.jsvee-iterator[data-name="' + name + '"]').first();
    var value = JSVEE.utils.ui.findValueToBeIterated(this.area, iterator);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    var hidden = false;
    if (!value.is(':visible') && value.parent().is('.jsvee-instance')) {
      hidden = true;
      value.show();
    }

    JSVEE.utils.ui.animateMoveToTarget.call(this, this.area, value, target, false, function() {
      if (hidden) {
        value.hide();
      }
      ready();
    });

  };

  JSVEE.registerAction('takeNext', JSVEE.handlers.actions.takeNext);
  JSVEE.handlers.explanations.takeNext = JSVEE.messages.takeNext;

  /**
   * Adds collection initializer to the evaluation area.
   */
  JSVEE.handlers.actions.addCollectionInitializer = function(ready, collectionId, position, params) {

    var init = JSVEE.utils.ui.createCollectionInitializer(this.area, collectionId, params);
    var target = JSVEE.utils.ui.findEvaluationArea(this.area, position);
    init.appendTo(target);
    ready(init);

  };

  JSVEE.handlers.animations.addCollectionInitializer = JSVEE.handlers.animations.addReference;
  JSVEE.handlers.explanations.addCollectionInitializer = JSVEE.messages.addCollectionInitializer;
  JSVEE.registerAction('addCollectionInitializer', JSVEE.handlers.actions.addCollectionInitializer);

  /**
   * Initializes the collection by adding the values inside the initializer to
   * the collection.
   */
  JSVEE.handlers.actions.initializeCollection = function(ready, position) {

    var element = JSVEE.utils.ui.findElement(this.area, position);
    var collectionId = element.find('.jsvee-value').first().attr('data-id');
    var collection = JSVEE.utils.ui.findValueById(this.area, collectionId);
    collection.children('.jsvee-value').remove();
    var values = element.find('.jsvee-value');
    var ref = JSVEE.utils.ui.createReference(this.area, collectionId);
    var i = 0;

    for (i = 1; i < values.length; i++) {
      values.eq(i).clone().appendTo(collection);
    }

    element.replaceWith(ref);

    ready(collection);

  };

  JSVEE.handlers.animations.initializeCollection = JSVEE.utils.ui.flashElement;
  JSVEE.handlers.explanations.initializeCollection = JSVEE.messages.initializeCollection;
  JSVEE.registerAction('initializeCollection', JSVEE.handlers.actions.initializeCollection);

  /**
   * Creates a new variable block. When the block is removed, all the variables
   * in this block will be removed from the stack frame.
   */
  JSVEE.handlers.actions.beginBlock = function(ready) {

    var frame = this.area.find('.jsvee-stack-frame').first();
    var emptyVar = frame.find('.jsvee-variable-empty');
    var block = $('<div></div>').addClass('jsvee-block');
    emptyVar.before(block);
    ready(block);

  };
  JSVEE.registerAction('beginBlock', JSVEE.handlers.actions.beginBlock);

  /**
   * Removes the most recent variable block and all the variables inside it.
   */
  JSVEE.handlers.actions.endBlock = function(ready) {

    var frame = this.area.find('.jsvee-stack-frame').first();
    var emptyVar = frame.find('.jsvee-variable-empty');
    emptyVar.prevUntil('.jsvee-block').remove();
    frame.find('.jsvee-block').last().remove();
    ready();

  };
  JSVEE.registerAction('endBlock', JSVEE.handlers.actions.endBlock);

  /**
   * Removes the given variable from the topmost stack frame.
   */
  JSVEE.handlers.actions.removeVariable = function(ready, name) {

    var variable = JSVEE.utils.ui.findVariable(this.area, name);
    variable.remove();
    ready();

  };
  JSVEE.registerAction('removeVariable', JSVEE.handlers.actions.removeVariable);

  /**
   * Clears the evaluation area in the topmost stack frame.
   */
  JSVEE.handlers.actions.clearEvaluationArea = function(ready) {

    JSVEE.utils.ui.findEvaluationArea(this.area, "0").children().remove();
    ready();

  };
  JSVEE.registerAction('clearEvaluationArea', JSVEE.handlers.actions.clearEvaluationArea);

  /**
   * Deletes the previous step in the undo buffer.
   */
  JSVEE.handlers.actions.deleteState = function(ready) {
    this.deleteState();
    ready();
  };

  JSVEE.registerAction('deleteState', JSVEE.handlers.actions.deleteState);

  /**
   * Sets the PC by testing if the given function exists.
   */
  JSVEE.handlers.actions.ifFunctionDefined = function(ready, name, paramCount, ifDefined, ifNot, className) {

    var func = JSVEE.utils.ui.findFunction(this.area, name, paramCount, className);

    if (func) {
      this.setPC(ifDefined);
    } else {
      this.setPC(ifNot);
    }

    ready();

  };

  JSVEE.registerAction('ifFunctionDefined', JSVEE.handlers.actions.ifFunctionDefined);

}(jQuery));
