(function($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  }

  JSVEE.utils.ui = {};

  /**
   * Creates an empty stack frame element. If the PC is given, that will be
   * assigned to the stack frame.
   *
   * @memberOf JSVEE.utils.ui
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createFrame = function(pc, small) {

    var frame = $('<div></div>').addClass('jsvee-stack-frame');
    var label = $('<div></div>').text(JSVEE.messages.stackFrame());
    var emptyVar = JSVEE.utils.ui.createEmptyVar();
    var evArea = JSVEE.utils.ui.createEvaluationArea();

    frame.attr('title', JSVEE.messages.stackFrameTitle());
    frame.attr('data-pc', pc);

    if (small) {
      frame.addClass('jsvee-small');
    } else {
      label.addClass('jsvee-area-label jsvee-area-label2');
      label.appendTo(frame);
    }

    emptyVar.appendTo(frame);
    evArea.appendTo(frame);

    return frame;

  };

  /**
   * Creates an empty variable which is usually a placeholder for new variables
   * inside a stack frame.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createEmptyVar = function() {

    var emptyVar = $('<div></div>');
    emptyVar.addClass('jsvee-variable-empty');
    return emptyVar;

  };

  /**
   * Creates a new evaluation area.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createEvaluationArea = function() {

    var area = $('<div></div>').addClass('jsvee-evaluation-area');
    area.attr('title', JSVEE.messages.evaluationAreaTitle());
    area.attr('data-title', JSVEE.messages.evaluationArea());
    return area;

  };

  /**
   * Resizes the filler element inside the stack so that all the stack frames
   * are in the bottom of the stack.
   */
  JSVEE.utils.ui.resizeStack = function(area) {

    var stack = area.find('.jsvee-stack');
    var frameHeightSum = 0;
    var stackFiller = stack.find('.jsvee-stack-filler');
    var codeArea = area.find('.jsvee-code-area'),
      stackHeight = 0;
    var rightPanels = area.find('.jsvee-right-panels');

    stack.find('.jsvee-stack-frame').each(function() {
      frameHeightSum += $(this).outerHeight(true);
    });

    /*
     * if (stack.attr('data-height') && frameHeightSum ===
     * +stack.attr('data-height')) { return; }
     */

    stackFiller.css('height', '0px');
    stackHeight = stack.height();

    if (stackHeight - frameHeightSum > 0) {
      stackFiller.css('height', (stackHeight - frameHeightSum) + 'px');
    }

    if (rightPanels.outerHeight(true) > stackHeight) {
      var current = parseInt(stackFiller.css('height'), 10);
      stackFiller.css('height', (current + (rightPanels.outerHeight(true) - stack.outerHeight(true))) + 'px');
    }

    if (codeArea.hasClass('jsvee-code-left') && codeArea.outerHeight(true) > area.find('.jsvee-memory-area').outerHeight(true)) {
      var extra = codeArea.outerHeight(true) - area.find('.jsvee-memory-area').outerHeight(true);
      var current = parseInt(stackFiller.css('height'), 10);
      stackFiller.css('height', (current + extra) + 'px');
    }

    stack.attr('data-height', frameHeightSum);

  };

  /**
   * Creates a new element for the given value.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createValue = function(value, id, type) {

    var val = $('<div></div>').addClass('jsvee-value');
    val.attr('data-type', type).attr('data-value', value);
    val.attr('data-id', id);

    if (type) {
      val.attr('title', JSVEE.messages.valueTitleWithType(type, value));
    } else {
      val.attr('title', JSVEE.messages.valueTitle(value));
    }

    val.text(value);

    return val;

  };

  /**
   * Finds the requested value from the heap. The type is optional.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findValue = function(area, value, type) {

    var heap = area.find('.jsvee-heap');

    if (type) {
      return heap.children('.jsvee-value[data-value="' + value + '"][data-type="' + type + '"]').first();
    }

    return heap.children('.jsvee-value[data-value="' + value + '"]').first();

  };

  /**
   * Finds the requested value from the heap by the id value. If the id value is
   * negative, the value with highest id will be returned.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findValueById = function(area, id) {

    if (+id >= 0) {
      var result = area.find('.jsvee-instance[data-id="' + id + '"]');
      if (result.length > 0)
        return result.first();

      return area.find('.jsvee-heap .jsvee-value[data-id="' + id + '"]').first();
    }

    var lastId = +area.find('.jsvee-heap').attr('data-id-counter');
    return area.find('.jsvee-instance[data-id="' + (lastId - 1) + '"]').first();

  };

  /**
   * Tries to find the requested value from the heap. If the value does not
   * exist, it will be created.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findOrCreateValue = function(area, value, type) {

    var result = JSVEE.utils.ui.findValue(area, value, type);

    // If the value was not found, create a new
    if (result.length === 0) {

      // Increase the global id counter
      var id = +area.find('.jsvee-heap').attr('data-id-counter');
      area.find('.jsvee-heap').attr('data-id-counter', id + 1);

      var newVal = value;

      if (type === "Double" && value.toString().split(".").length > 1 && value.toString().split(".")[1].length > 3) {
        newVal = value.toFixed(3);
      }

      var newValue = JSVEE.utils.ui.createValue(newVal, id, type);
      var heap = area.find('.jsvee-heap');
      newValue.appendTo(heap);
      return newValue;

    }

    return result.first();

  };

  /**
   * Creates a new element for a class instance.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createInstance = function(area, className) {

    // Increase the global id counter
    var id = +area.find('.jsvee-heap').attr('data-id-counter');
    area.find('.jsvee-heap').attr('data-id-counter', id + 1);

    var instance = $('<div></div>').addClass('jsvee-instance');
    var name = $('<div></div>').addClass('jsvee-name');
    var name2 = $('<div></div>').addClass('jsvee-name2');

    instance.attr('data-type', className);
    instance.attr('data-id', id);
    instance.attr('title', JSVEE.messages.instanceTitle(className, id));

    name.text(id);
    name.appendTo(instance);
    name2.text(className);
    name2.appendTo(name);

    return instance;

  };

  /**
   * Creates a new element for a reference.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createReference = function(area, id) {

    var ref = $('<div></div>').addClass('jsvee-value jsvee-ref');
    var type = area.find('.jsvee-instance[data-id="' + id + '"]').first().attr('data-type');
    ref.attr('data-id', id);
    ref.attr('data-type', type);
    ref.text(id);
    ref.attr('title', JSVEE.messages.referenceTitle(id));
    return ref;

  };

  /**
   * Finds the most recent class instance in the heap.
   */
  JSVEE.utils.ui.findLastInstance = function(area) {
    return area.find('.jsvee-heap .jsvee-instance').last();
  };

  /**
   * Finds and creates a new reference. If the id is not defined or it is
   * negative, a reference to the most recent object will be returned.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findReference = function(area, id) {

    var ref = null;

    if (id === undefined || +id < 0) {
      ref = JSVEE.utils.ui.findLastInstance(area);
    } else {
      ref = JSVEE.utils.ui.findValueById(area, id);
    }

    return JSVEE.utils.ui.createReference(area, ref.attr('data-id'));

  };

  /**
   * Creates a new operator element.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createOperator = function(operator, type, className, params) {

    var op = $('<div></div>').addClass('jsvee-operator');
    op.attr('title', JSVEE.messages.operatorTitle(operator));
    op.attr('data-name', operator);
    op.attr('data-class', (className && className.trim().length > 0) ? className : null);
    op.attr('data-type', type);
    op.attr('data-params', params);
    op.text(operator);
    return op;

  };

  /**
   * Creates a new function element.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createFunction = function(name, text, paramCount, pc, className, isStatic) {

    var f = $('<div></div>').addClass('jsvee-function');
    f.attr('data-name', name);
    f.attr('data-params', paramCount);
    f.attr('data-pc', pc);
    f.attr('data-class', className);
    f.attr('data-static', isStatic);
    f.text(text);

    if (className) {
      f.attr('title', JSVEE.messages.methodTitle(name));
    } else {
      f.attr('title', JSVEE.messages.functionTitle(name));
    }

    if (+pc <= 0) {
      f.addClass('jsvee-function-builtin');
    }

    return f;

  };

  /**
   * Creates a new class element.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createClass = function(name) {

    var c = $('<div></div>').addClass('jsvee-class').attr('data-name', name);
    c.attr('title', JSVEE.messages.classTitle(name));

    var n = $('<div></div>').addClass('jsvee-name');
    n.text(name);
    n.appendTo(c);

    return c;

  };

  /**
   * Calls an function which creates an element, hides it, fades it in and then
   * removes the element. This is useful if the animation just fades in the
   * element.
   */
  JSVEE.utils.ui.fadeInAndRemove = function(ready, func, args) {

    var that = this,
      args2 = [];

    // The given function will call this function and gives
    // the created element as parameter
    args2.push(function(element) {

      // The function may have created multiple elements
      if (!$.isArray(element)) {

        element.hide().fadeIn(that.animationLength, function() {
          element.remove();
          ready(); // notifies that the animation is completed
        });

      } else {

        $.each(element, function(i) {
          var that = this;
          this.hide().fadeIn(that.animationLength, function() {
            that.remove();
            if (i === element.length - 1) {
              ready(); // call the callback after the last element
            }
          });
        });
      }

    });

    args2.push.apply(args2, args);

    func.apply(this, args2); // call the actual function

  };

  /**
   * Highlights the current code line and optionally only a portion of it.
   */
  JSVEE.utils.ui.highlightCurrentLine = function(area, line, position) {

    var codeTable = area.find('.jsvee-code-table');
    codeTable.find('.jsvee-arrow-right').remove();
    codeTable.find('.jsvee-gutter.jsvee-current').removeClass('jsvee-current');

    var arrow = $('<div></div>').addClass('jsvee-arrow-right');
    codeTable.find('.jsvee-gutter').eq(line - 1).addClass('jsvee-current').prepend(arrow);

    var parent = area.find('.jsvee-current-code-line').parent();

    // If only a part of the line is currently highlighted,
    // convert the line back to a single span

    // data-text in parent contains the original line

    if (parent.children().length > 1) {
      parent.find('span').remove();
      $('<span></span>').text(parent.attr('data-text')).appendTo(parent);
    }

    codeTable.find('.jsvee-current-code-line').removeClass('jsvee-current-code-line');

    var newLine = codeTable.find('.jsvee-code-line').eq(line - 1);
    newLine.children().remove();

    if (position) {
      // Position should be in format "a:b" where
      // a is the starting index (starting from 0) and
      // b is the position of the last character to be highlighted
      var parts = position.split(':');
      parts[1] = parseInt(parts[1], 10);
      $('<span></span>').text(newLine.attr('data-text').substring(0, parts[0])).appendTo(newLine);

      var x = $('<span></span>').text(newLine.attr('data-text').substring(parts[0], parts[1] + 1));
      x.addClass('jsvee-current-code-line').appendTo(newLine);

      $('<span></span>').text(newLine.attr('data-text').substring(parts[1] + 1)).appendTo(newLine);

    } else {
      $('<span></span>').text(newLine.attr('data-text')).addClass('jsvee-current-code-line').appendTo(newLine);
    }
  };

  /**
   * Shows the given text in the info area.
   */
  JSVEE.utils.ui.showInfoText = function(area, text, asHTML) {

    if (!asHTML) {
      area.find('.jsvee-info-area').text(text).show();
    } else {
      area.find('.jsvee-info-area').html(text).show();
    }

  };

  /**
   * Clears the current info text and hides the info area.
   */
  JSVEE.utils.ui.hideInfo = function(area) {
    area.find('.jsvee-info-area').hide().text('').children().remove();
  };

  /**
   * Sets the status text to the status area.
   */
  JSVEE.utils.ui.setStatusText = function(area, text) {
    area.find('.jsvee-status-area').text(text);
  };

  /**
   * Appends the given text to the status area.
   */
  JSVEE.utils.ui.appendToStatus = function(area, text) {
    var statusArea = area.find('.jsvee-status-area');
    statusArea.text(statusArea.text() + text);
  };

  /**
   * Creates a new variable element.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createVariable = function(name) {

    var parts = name.split('.');
    var n = parts[parts.length - 1];
    var variable = $('<div></div>').addClass('jsvee-variable');
    variable.attr('data-name', n);
    variable.attr('title', JSVEE.messages.variable(n));
    $('<div></div>').text(n).addClass('jsvee-name').appendTo(variable);
    return variable;

  };

  /**
   * Creates an empty variable element which has only borders.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createEmptyVariable = function() {
    return $('<div></div>').addClass('jsvee-variable-empty-hover');
  };

  /**
   * Places the given variable element to the correct parent element.
   */
  JSVEE.utils.ui.placeVariable = function(area, name, variable, ref) {

    var parts = name.split('.');

    if (parts.length === 1 && !ref) {

      // normal local variable
      area.find('.jsvee-stack-frame').first().find('.jsvee-variable-empty').before(variable);

    } else if (ref) {

      // an instance variable
      var refVar = JSVEE.utils.ui.findVariable(area, ref.substring(1));
      var id = refVar.find('.jsvee-value').attr('data-id');
      var instance = JSVEE.utils.ui.findValueById(area, id);
      instance.append(variable);

    } else {

      // a class variable
      var classV = area.find('.jsvee-class[data-name="' + parts[0] + '"]').last();

      // Find the correct place for the variable:
      // a) last of the existing variables
      // b) before methods
      if (classV.find('.jsvee-variable-empty').length > 0) {
        classV.find('.jsvee-variable-empty').before(variable);
      } else if (classV.find('.jsvee-function').length > 0) {
        classV.find('.jsvee-function').first().before(variable);
      } else {
        classV.append(variable);
      }

      // Make sure that the empty container for variables exists
      if (classV.find('.jsvee-variable-empty').length === 0) {
        var emptyVar = $('<div></div>').addClass('jsvee-variable-empty');
        classV.find('.jsvee-variable, .jsvee-variable-empty-hover').last().after(emptyVar);
      }

    }

  };

  /**
   * Finds the correct evaluation area in the topmost stack frame.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findEvaluationArea = function(area, position) {

    var target = area.find('.jsvee-evaluation-area').first();
    var i = 0;

    if (position) {
      var parts = position.split('/');
      for (i = 0; i < parts.length - 1; i++) {
        if (i % 2 === 0) {
          target = target.children().eq(parts[i]);
        } else {
          target = target.find('.jsvee-evaluation-area-param').eq(parts[i]);
        }
      }
    }

    return target;

  };

  /**
   * Animates the movement of the element to the given evaluation area.
   */
  JSVEE.utils.ui.animateMoveToTarget = function(area, element, target, original, ready, before, over) {

    var clone = element.clone();

    clone.css('top', '');
    clone.css('left', '');

    var point = null;

    if (over) { // use the given element as the end position
      point = [over.position().left, over.position().top];
    } else {

      if (!before) {
        clone.appendTo(target); // add the element in to the target
      } else {
        target.before(clone); // add the element before the target
      }

      point = [clone.position().left, clone.position().top];

    }

    clone.remove();

    JSVEE.utils.ui.animateMove.call(this, area, element, point, original, function() {
      ready();
    });

  };

  /**
   * Animates the movement of the element to the given coordinates. When this
   * function is called, 'this' should point to a JSVEE instance.
   */
  JSVEE.utils.ui.animateMove = function(area, element, endPoint, moveOriginal, ready) {

    var animLength = this.animationLength;
    var move = element;
    var clone = null;
    var placeholder = null;

    if (!moveOriginal) {

      clone = element.clone().css('position', 'absolute');
      clone.appendTo(area);
      clone.offset(element.offset());

      // Use the literal area as starting point for values
      // if the values in the heap are invisible
      if (!element.is(':visible') && element.is('.jsvee-value')) {
        clone.offset(area.find('.jsvee-literals').offset());
      }

      clone.css('z-index', '999');
      move = clone;

    } else {

      element.css('z-index', '999');

      if (element.css('position') !== 'absolute') {
        element.css('position', 'absolute');
        element.offset(element.offset());
      }

      if (!element.parent().is('.jsvee-animation-area')) {
        placeholder = $('<div></div>').css('height', element.outerHeight(true) + 'px').css('width',
          element.outerWidth(true) + 'px');
        element.before(placeholder);
      }

    }

    move.animate({ top: endPoint[1] + 'px', left: endPoint[0] + 'px' }, animLength, function() {

      if (clone !== null) {
        clone.remove();
      } else {
        element.css('z-index', '');
        element.css('position', '');
        element.css('top', '');
        element.css('left', '');
      }

      if (placeholder !== null) {
        placeholder.remove();
      }

      ready();

    });
  };

  /**
   * Finds the requested variable. Returns null, if the variable was not found.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findVariable = function(area, name, id) {

    var variable = null;
    var parts = name.split('.');

    // Local, instance or class variable?
    if (parts.length === 1 && !id) {

      variable = area.find('.jsvee-stack-frame').first().find('.jsvee-variable[data-name="' + name + '"]');

    } else if (id) {

      var instance = JSVEE.utils.ui.findValueById(area, id);
      variable = instance.find('.jsvee-variable[data-name="' + name + '"]');

    } else {

      var x = area.find('.jsvee-class[data-name="' + parts[0] + '"]').last();
      variable = x.find('.jsvee-variable[data-name="' + parts[1] + '"]');

    }

    if (variable.length === 0) {
      return null;
    }

    return variable.last();

  };

  /**
   * Finds the first value in the topmost stack frame and returns it.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findFirstValue = function(area) {
    var evArea = area.find('.jsvee-stack-frame').first().find('.jsvee-evaluation-area').first();
    return evArea.find('.jsvee-value, .jsvee-function').first();
  };

  /**
   * Finds the element in the topmost stack frame in the given position.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findElement = function(area, position, previous) {

    if (!position) {
      return null;
    }

    var target = area.find('.jsvee-evaluation-area').first();
    var parts = position.split('/');
    var i = 0;
    var j = null;

    for (i = 0; i < parts.length; i++) {

      if (target.length === 0) {
        return null;
      }

      j = parts[i];
      if (i === parts.length - 1 && previous) {
        target = target.children().eq(j - 1);
      } else if (target.hasClass('jsvee-function') || target.hasClass('jsvee-operator')) {
        target = target.find('.jsvee-evaluation-area-param').eq(j);
      } else {
        target = target.children().eq(j);
      }
    }

    return target;

  };

  /**
   * Finds the correct operator element.
   *
   * @param {jQueryObject} area
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findOperator = function(area, operator, position) {

    var previous = null;
    if (!position) {
      previous = area.find('.jsvee-evaluation-area').first().children().last();
    } else {
      previous = JSVEE.utils.ui.findElement(area, position, true);
    }

    // Try to find the operator from the correct class
    var dataType = previous.attr('data-type');
    var op = area.find('.jsvee-class[data-name="' + dataType + '"] .jsvee-operator[data-name="' + operator + '"]');

    // If not found, use a generic operator
    if (op.length === 0) {
      op = area.find('.jsvee-operators .jsvee-operator[data-name="' + operator + '"]');
    }

    return op.first();

  };

  /**
   * Finds the operands of the given operator.
   *
   * @returns {Array}
   */
  JSVEE.utils.ui.findOperands = function(op) {

    var prev = op.prev();
    var next = op.next();
    var operands = [];

    if (op.attr('data-type') === 'lr') {
      operands = [prev, next];
    } else if (op.attr('data-type') === 'l') {
      operands = [prev];
    } else if (op.attr('data-type') === 'r') {
      operands = [next];
    }

    return operands;

  };

  /**
   * Flashes the element at the given position. When this function is called,
   * 'this' should point to a JSAV instance.
   */
  JSVEE.utils.ui.flashElement = function(ready, position) {

    var that = this;
    var target = JSVEE.utils.ui.findElement(this.area, position);
    target.addClass('jsvee-highlight');
    target.animate({ delay: 1 }, that.animationLength / 2, function() {
      target.removeClass('jsvee-highlight');
      target.animate({ delay: 1 }, that.animationLength / 2, function() {
        ready();
      });
    });

  };

  /**
   * Finds the requested function (or method) element.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findFunction = function(area, name, params, className, position) {

    if (!className) {

      var func = area.find('.jsvee-functions .jsvee-function[data-name="' + name + '"][data-params="' + params + '"]')
        .first();

      if (func.length == 0) {
        func = area.find('.jsvee-functions .jsvee-function[data-name="' + name + '"]').first();
        if (+func.attr('data-params') < 0)
          return func;
      } else {
        return func;
      }

      return null;

    }

    var realName = className;

    // Get the correct type by looking the reference which should already be
    // in the evaluation area
    if (className === '?') {
      var element = JSVEE.utils.ui.findElement(area, position, true);
      realName = element.attr('data-type');
    }

    if (+params > 0) {
      var s1 = '.jsvee-classes .jsvee-class[data-name="' + realName + '"]';
      var s2 = ' .jsvee-function[data-name="' + name + '"][data-params="' + params + '"]';
      var s3 = ' .jsvee-function[data-name="' + name + '"][data-params="-1"]';
      return area.find(s1 + s2 + ", " + s1 + s3).first();
    }

    var s = '.jsvee-classes .jsvee-class[data-name="' + realName + '"] .jsvee-function[data-name="' + name + '"]';
    return area.find(s).first();

  };

  /**
   * Converts a function element to contain the evaluation areas for the
   * parameters. This is called after a function is added to the evaluation
   * area.
   */
  JSVEE.utils.ui.convertFunctionToCallable = function(element) {

    element.attr('title', '');

    if (!element.children().first().hasClass('jsvee-ref')) {
      element.text('');

      var nameLabel = $('<div></div>').addClass('jsvee-function-name');
      nameLabel.css('display', 'inline-block');
      nameLabel.text(element.attr('data-name'));
      nameLabel.appendTo(element);
    }

    var params = +element.attr('data-params');

    var i = 0;
    for (i = 0; i < params; i++) {
      if (i > 0) {
        element.append($('<div style="display: inline-block; vertical-align: bottom;">&nbsp;,&nbsp;</div>'));
      }
      $('<div></div>').addClass('jsvee-evaluation-area-param').appendTo(element);
    }

    // Place the method's self reference inside the function
    if (element.attr('data-class') && !element.attr('data-static')) {
      var selfParam = $('<div></div>');
      selfParam.addClass('jsvee-evaluation-area-param jsvee-self-param').prependTo(element);
      var self = element.prev();
      self.remove();
      self.appendTo(selfParam);
      nameLabel.text(' . ' + nameLabel.text());
    }

  };

  /**
   * Creates a new element for collection initializer.
   */
  JSVEE.utils.ui.createCollectionInitializer = function(area, id, paramCount) {

    var element = $('<div></div>').addClass("jsvee-operator");

    var selfParam = $('<div></div>');
    selfParam.addClass('jsvee-evaluation-area-param jsvee-self-param').appendTo(element);
    var collection = JSVEE.utils.ui.findValueById(area, id);
    var self = JSVEE.utils.ui.createReference(area, collection.attr('data-id'));
    self.appendTo(selfParam);

    var arrow = $('<span></span>').html(' &larr; ');
    arrow.appendTo(element);

    var i = 0;
    for (i = 0; i < paramCount; i++) {
      if (i > 0) {
        element.append($('<div style="display: inline-block; vertical-align: bottom;">&nbsp;,&nbsp;</div>'));
      }
      $('<div></div>').addClass('jsvee-evaluation-area-param').appendTo(element);
    }

    return element;

  };

  /**
   * Adds the evaluation areas inside the given operator element.
   */
  JSVEE.utils.ui.createOperatorParameters = function(element) {

    var parts = element.attr('data-params').split('#');
    element.text('');

    if (element.attr('data-type') === 'pr') {
      var selfParam = $('<div></div>');
      selfParam.addClass('jsvee-evaluation-area-param jsvee-self-param').prependTo(element);
      element.prev().appendTo(element);
    }

    $.each(parts, function(i, val) {

      var span = $('<span></span>').text(val);
      element.append(span);

      if (i < parts.length - 1) {
        var evArea = $('<div></div>').addClass('jsvee-evaluation-area-param');
        evArea.appendTo(element);
      }

    });

  };

  /**
   * Returns if the given function element represents a built-in function, ie.
   * the PC value of the function is negative.
   *
   * @returns {Boolean}
   */
  JSVEE.utils.ui.isFunctionBuiltin = function(element) {

    var pc = element.attr('data-pc');
    return !(pc.toString()[0] === '@' || +pc >= 0);

  };

  /**
   * Finds the topmost active function call which is located in the stack frame
   * below the topmost stack frame.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findActiveCall = function(area) {

    var frame = area.find('.jsvee-stack-frame').eq(1);
    var call = frame.find('.jsvee-function.jsvee-active');
    return call;

  };

  /**
   * Finds the requested parameter value in the topmost active function call.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findParameterValue = function(area, index) {

    var evArea = JSVEE.utils.ui.findActiveCall(area).find('.jsvee-evaluation-area-param').eq(index);
    var value = evArea.find('.jsvee-value, .jsvee-function').first();
    return value;

  };

  /**
   * Finds the value which is located in the given collection at the specified
   * index.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findValueInCollection = function(area, id, index) {

    var collection = JSVEE.utils.ui.findValueById(area, id);
    var children = collection.children('.jsvee-value');
    var idx = +index;

    if (idx < 0) {
      idx = children.length + idx;
    }

    return children.eq(idx);

  };

  /**
   * Finds the requested value in a set by using the key.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findValueInSet = function(area, id, key) {

    var set = JSVEE.utils.ui.findValueById(area, id);
    var pair = set.children('.jsvee-key-value-pair[data-key="' + key + '"]');
    if (pair.length == 0) {
      return null;
    } else {
      return pair.find('.jsvee-value').eq(1);
    }

  };

  /**
   * Creates the given key-value pair.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createKeyValuePair = function(area, id, key, value) {

    var set = JSVEE.utils.ui.findValueById(area, id);
    var pair = $('<div></div>').addClass("jsvee-key-value-pair").attr('data-key', key.text());
    pair.appendTo(set);
    key.clone().appendTo(pair);
    $('<span></span>').text(':').appendTo(pair);
    value.clone().appendTo(pair);
    return pair;

  };

  /**
   * Creates an overlay for a popup window.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.createOverlay = function() {
    var overlay = $('<div></div>').addClass('jsvee-overlay');
    var oContent = $('<div></div>').addClass('jsvee-overlay-content');

    overlay.appendTo($('body'));
    oContent.appendTo($('body'));

    overlay.css('height', $(document).height() + "px");
    oContent.css('height', ($(window).height() - 100) + "px");

    return oContent;
  };

  /**
   * Removes the created overlay element.
   */
  JSVEE.utils.ui.removeOverlay = function() {
    $('.jsvee-overlay, .jsvee-overlay-content').remove();
  };

  /**
   * Creates a new iterator element.
   */
  JSVEE.utils.ui.createIterator = function(name, collectionId, from, to, type) {

    var iterator = $('<div></div>').addClass("jsvee-iterator").attr('data-name', name);

    iterator.attr('data-first', 'true');

    if (!from && !to) {
      iterator.attr('data-collection', collectionId);
      iterator.attr('data-current', -1);
      if (type) {
        iterator.attr('data-type', type);
      }
    } else {
      iterator.attr('data-to', to);
      iterator.attr('data-type', type);
      iterator.attr('data-current', +from - 1);
    }

    return iterator;
  };

  /**
   * Finds the next value element to be iterated.
   *
   * @returns {jQueryObject}
   */
  JSVEE.utils.ui.findValueToBeIterated = function(area, iterator) {

    var item = null;
    var collectionId = iterator.attr('data-collection');

    iterator.attr('data-first', 'false');

    if (collectionId) {
      var collection = JSVEE.utils.ui.findValueById(area, collectionId);
      var current = +iterator.attr('data-current');

      if (collection.hasClass('jsvee-instance')) {
        if (collection.children('.jsvee-item').length > 0) {
          item = collection.children('.jsvee-item').eq(current).find('.jsvee-value').first();
        } else if (collection.children('.jsvee-key-value-pair').length > 0) {
          item = collection.children('.jsvee-key-value-pair').eq(current).find('.jsvee-value').first();
        } else {
          item = collection.children('.jsvee-value').eq(current);
        }
      } else {
        item = collection.attr('data-value').charAt(current);
        item = JSVEE.utils.ui.findOrCreateValue(area, item, iterator.attr('data-type'));
      }
    } else {
      var current = +iterator.attr('data-current');
      item = JSVEE.utils.ui.findOrCreateValue(area, current, iterator.attr('data-type'));
    }

    return item;
  };

  /**
   * Draws and returns a SVG arrow between the two given elements.
   */
  JSVEE.utils.ui.drawArrow = function(area, element1, element2) {

    var calculateMidPoints = function(element) {
      var topCenter = [element.position().left + element.outerWidth() / 2, element.position().top];
      var bottomCenter = [element.position().left + element.outerWidth() / 2,
          element.position().top + element.outerHeight()];
      var leftCenter = [element.position().left, element.position().top + element.outerHeight() / 2];
      var rightCenter = [element.position().left + element.outerWidth(),
          element.position().top + element.outerHeight() / 2];
      return [topCenter, bottomCenter, leftCenter, rightCenter];
    };

    var midPoints1 = calculateMidPoints(element1);
    var midPoints2 = calculateMidPoints(element2);

    // Use the top-center and bottom-center points if possible
    if (element2.position().top - element1.position().top < -50 && $.contains(area.find('.jsvee-heap')[0], element2[0])) {
      midPoints2 = [midPoints2[1], midPoints2[1], midPoints2[1], midPoints2[1]];
      midPoints1 = [midPoints1[0], midPoints1[0], midPoints1[0], midPoints1[0]];
    }

    var best = null;
    var distance = -1;

    // Find the shortest path for the arrow
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var dX = (midPoints1[i][0] - midPoints2[j][0]);
        var dY = (midPoints1[i][1] - midPoints2[j][1]);
        var curDist = dX * dX + dY * dY;
        if (distance < 0 || curDist < distance) {
          distance = curDist;
          best = [midPoints1[i], midPoints2[j]];
        }
      }
    }

    var width = area.width();
    var height = area.height();

    var arrow = '<svg pointer-events="none" class="jsvee-ref-arrow" width="' + width + '" height="' + height + '" version="1.1" xmlns="http://www.w3.org/2000/svg" style="position: absolute; top: 0; left: 0;"><defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="4" orient="auto"><path stroke="#2756A3" fill="#2756A3" d="M 0 0 L 10 5 L 0 10 z"/></marker></defs>' + '<path d="M ' + best[0][0] + ' ' + best[0][1] + ' L ' + best[1][0] + ' ' + best[1][1] + '" ' + '" fill="none" stroke="#2756A3" stroke-width="1.5" marker-end="url(#arrow)"/></svg>';

    return $(arrow);
  };

}(jQuery));
