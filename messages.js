(function($) {
  'use strict';

  if (window.JSVEE === 'undefined') {
    return;
  }

  const _ = typeof(window._) === "function" ?
    window._ :
    function(msg) {
    return msg;
  };

  JSVEE.messages = {};

  // http://stackoverflow.com/questions/18405736/is-there-a-c-sharp-string-format-equivalent-in-javascript

  if (!String.prototype.format) {
    /**
     * Formats a string by replacing {0} etc. with corresponding parameters.
     *
     * @returns {String}
     */
    String.prototype.format = function() {
      var args = arguments;
      return this.replace(/\{(\d+)\}/g, function(match, number) {
        return (args[number] !== undefined) ? args[number] : match;
      });
    };
  }

  // ********************************************

  JSVEE.messages.beginButton = function() {
    return _('Back to start');
  };

  JSVEE.messages.prevButton = function() {
    return _('Step backward');
  };

  JSVEE.messages.stepButton = function() {
    return _('Step forward');
  };

  JSVEE.messages.redoButton = function() {
    return _('Step forward');
  };

  JSVEE.messages.consoleTitle = function() {
    return _('Text console');
  };

  JSVEE.messages.stackTitle = function() {
    return _('Call Stack: all the stack frames are stored here.');
  };

  JSVEE.messages.literals = function() {
    return _('Literals');
  };

  JSVEE.messages.stack = function() {
    return _('Call Stack');
  };

  JSVEE.messages.literalsTitle = function() {
    return _('Literal values needed by the program are stored here.');
  };

  JSVEE.messages.stackFrameTitle = function() {
    return _('Stack frame: a memory area that tracks the progress of the running code.');
  };

  JSVEE.messages.evaluationAreaTitle = function() {
    return _('Evaluation area: expressions are evaluated here');
  };

  JSVEE.messages.stackFrame = function() {
    return _('Stack frame');
  };

  JSVEE.messages.evaluationArea = function() {
    return _('Evaluation area');
  };

  JSVEE.messages.valueTitle = function(value) {
    return _('Value {0}').format(value);
  };

  JSVEE.messages.valueTitleWithType = function(type, value) {
    return _('Value {0} of type {1}').format(value, type);
  };

  JSVEE.messages.operatorTitle = function(op) {
    return _('Operator {0}').format(op);
  };

  JSVEE.messages.functionTitle = function(name) {
    return _('Function {0}').format(name);
  };

  JSVEE.messages.methodTitle = function(name) {
    return _('Method {0}').format(name);
  };

  JSVEE.messages.classTitle = function(name) {
    return _('Class {0}').format(name);
  };

  JSVEE.messages.readyText = function() {
    return _(' - ready.');
  };

  JSVEE.messages.failedText = function() {
    return _(' - failed!');
  };

  JSVEE.messages.variable = function(name) {
    return _('Variable {0}').format(name);
  };

  JSVEE.messages.instanceTitle = function(className, id) {
    return _('{0} object, in memory at location {1}').format(className, id);
  };

  JSVEE.messages.referenceTitle = function(id) {
    return _("A reference to an object, located in memory at {0}").format(id);
  };

  JSVEE.messages.undo = function() {
    return _('Moved one step backwards.');
  };

  JSVEE.messages.begin = function() {
    return _('Rewound back to the start.');
  };

  JSVEE.messages.redo = function() {
    return _('Moved one step forward.');
  };

  JSVEE.messages.animationEnded = function() {
    return _('End of the animation.');
  };

  // ******************** ACTIONS ********************

  JSVEE.messages.setLine = function(line) {
    return _('Moving to line {0}').format(line);
  };

  JSVEE.messages.jumpFalse = function(line) {
    return _('Condition is false, moving to line {0}').format(line);
  };

  JSVEE.messages.jumpTrue = function(line) {
    return _('Condition is true, moving to line {0}').format(line);
  };

  JSVEE.messages.jumpIterationReady = function(line) {
    return _('Finished the iteration, moving to line {0}').format(line);
  };

  JSVEE.messages.createVariable = function(name) {
    return _('Creating a new variable {0}').format(name);
  };

  JSVEE.messages.addValue = function(value, position, type) {
    return _('Fetching value {0}').format(value);
  };

  JSVEE.messages.assign = function(name) {
    return _('Assigning value to the variable {0}').format(name);
  };

  JSVEE.messages.assignField = function(name) {
    return _('Assigning value to the instance variable {0}').format(name);
  };

  JSVEE.messages.assignFields = function () {
    return _('Assigning values to the instance variables');
  };

  JSVEE.messages.addValueFromVariable = function(name) {
    return _('Fetching value from the variable {0}').format(name);
  };

  JSVEE.messages.addValueFromField = function(name) {
    return _('Fetching value from the instance variable {0}').format(name);
  };

  JSVEE.messages.addOperator = function(name) {
    if (name == 'int') {
      return _('Fetching the type-cast operator {0}').format(name);
    } else {
      return _('Fetching the operator {0}').format(name);
    }

  };

  JSVEE.messages.evaluateOperator = function(name) {
    if (name == 'int') {
      return _('Evaluating the type-cast operator {0}').format(name);
    } else {
      return _('Evaluating the operator {0}').format(name);
    }

  };

  JSVEE.messages.addFunction = function(name) {
    return _('Fetching the function {0}').format(name);
  };

  JSVEE.messages.addMethod = function(name) {
    return _('Fetching the method {0}').format(name);
  };

  JSVEE.messages.createParameterVariables = function() {
    return _('Creating the parameter variables');
  };

  JSVEE.messages.createFields = function () {
    return _('Creating the instance variables');
  };

  JSVEE.messages.assignParameter = function(name) {
    return _('Assigning value to the parameter variable ').format(name);
  };

  JSVEE.messages.assignParameters = function() {
    return _('Assigning parameter values to the parameter variables');
  };

  JSVEE.messages.evaluateBuiltInFunction = function(name) {
    return _('Evaluating the built-in function {0}').format(name);
  };

  JSVEE.messages.evaluateFunction = function(name) {
    return _('Starting to evaluate the function {0}').format(name);
  };

  JSVEE.messages.evaluateBuiltInMethod = function(name) {
    return _('Evaluating the built-in method {0}').format(name);
  };

  JSVEE.messages.evaluateMethod = function(name) {
    return _('Starting to evaluate the method {0}').format(name);
  };

  JSVEE.messages.returnValue = function() {
    return _('Returning the value');
  };

  JSVEE.messages.returnVoid = function() {
    return _('Ending the call');
  };

  JSVEE.messages.addReference = function(id) {
    return _('Fetching a reference to an object, located in memory at {0}').format(id);
  };

  JSVEE.messages.createInstance = function(className) {
    if (className === 'dict') {
      return _('Creating a new dictionary');
    } else if (className === 'list') {
      return _('Creating a new list');
    }
    return _('Creating a new {0} object').format(className);
  };
  JSVEE.messages.createField = function(name) {
    return _('Creating a new instance variable {0}').format(name);
  };

  JSVEE.messages.createArray = function(name) {
    return _('Creating a new {0} array').format(name);
  };

  JSVEE.messages.getValueAtIndex = function() {
    return _('Fetching value from the list');
  };

  JSVEE.messages.getValueByKey = function() {
    return _('Fetching value by the key');
  };

  JSVEE.messages.setValueAtIndex = function() {
    return _('Assigning value to the list');
  };

  JSVEE.messages.setValueByKey = function() {
    return _('Assigning value to the dictionary');
  };

  JSVEE.messages.addCollectionInitializer = function() {
    return _('Starting to initialize the collection');
  };

  JSVEE.messages.initializeCollection = function() {
    return _('Initializing the collection');
  };

  JSVEE.messages.takeNext = function() {
    return _('Fetching the next value from the collection');
  };

  JSVEE.messages.createFunction = function(name) {
    return _('Defining function {0}').format(name);
  };

}(jQuery));
