(function($) {
  'use strict';

  if (window.JSVEE === 'undefined') {
    return;
  }

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
    return 'Move to begin';
  };

  JSVEE.messages.prevButton = function() {
    return 'Undo';
  };

  JSVEE.messages.stepButton = function() {
    return 'Step forward';
  };

  JSVEE.messages.redoButton = function() {
    return 'Redo';
  };

  JSVEE.messages.consoleTitle = function() {
    return 'Text console';
  };

  JSVEE.messages.stackTitle = function() {
    return 'Stack, all the stack frames are stored here.';
  };

  JSVEE.messages.literals = function() {
    return 'Literals';
  };

  JSVEE.messages.stack = function() {
    return 'Stack';
  };

  JSVEE.messages.literalsTitle = function() {
    return 'Values needed during the execution are stored here.';
  };

  JSVEE.messages.stackFrameTitle = function() {
    return 'Stack frame, memory area containing the data related to the currently running code.';
  };

  JSVEE.messages.evaluationAreaTitle = function() {
    return 'Evaluation area, expressions will be evaluated here';
  };

  JSVEE.messages.stackFrame = function() {
    return 'Stack frame';
  };

  JSVEE.messages.evaluationArea = function() {
    return 'Evaluation area';
  };

  JSVEE.messages.valueTitle = function(value) {
    return 'Value {0}'.format(value);
  };

  JSVEE.messages.valueTitleWithType = function(type, value) {
    return 'Value {0} of type {1}'.format(value, type);
  };

  JSVEE.messages.operatorTitle = function(op) {
    return 'Operator {0}'.format(op);
  };

  JSVEE.messages.functionTitle = function(name) {
    return 'Function {0}'.format(name);
  };

  JSVEE.messages.methodTitle = function(name) {
    return 'Method {0}'.format(name);
  };

  JSVEE.messages.classTitle = function(name) {
    return 'Class {0}'.format(name);
  };

  JSVEE.messages.readyText = function() {
    return ' - ready.';
  };

  JSVEE.messages.failedText = function() {
    return ' - failed!';
  };

  JSVEE.messages.variable = function(name) {
    return 'Variable {0}'.format(name);
  };

  JSVEE.messages.instanceTitle = function(className, id) {
    return '{0} object, in memory at location {1}'.format(className, id);
  };

  JSVEE.messages.referenceTitle = function(id) {
    return 'A reference to an object, which is in the memory at location {0}'.format(id);
  };

  JSVEE.messages.undo = function() {
    return 'Moved one step backwards.';
  };

  JSVEE.messages.begin = function() {
    return 'Rewound back to the start.';
  };

  JSVEE.messages.redo = function() {
    return 'Moved one step forward.';
  };

  JSVEE.messages.animationEnded = function() {
    return 'End of the animation.';
  };

  // ******************** ACTIONS ********************

  JSVEE.messages.setLine = function(line) {
    return 'Moving to the line {0}'.format(line);
  };

  JSVEE.messages.jumpFalse = function(line) {
    return 'Condition is false, moving to the line {0}'.format(line);
  };

  JSVEE.messages.jumpTrue = function(line) {
    return 'Condition is true, moving to the line {0}'.format(line);
  };

  JSVEE.messages.jumpIterationReady = function(line) {
    return 'Finished the iteration, moving to the line {0}'.format(line);
  };

  JSVEE.messages.createVariable = function(name) {
    return 'Creating a new variable {0}'.format(name);
  };

  JSVEE.messages.addValue = function(value, position, type) {
    return 'Fetching value {0}'.format(value);
  };

  JSVEE.messages.assign = function(name) {
    return 'Assigning value to the variable {0}'.format(name);
  };

  JSVEE.messages.assignField = function(name) {
    return 'Assigning value to the instance variable {0}'.format(name);
  };

  JSVEE.messages.addValueFromVariable = function(name) {
    return 'Fetching value from the variable {0}'.format(name);
  };

  JSVEE.messages.addValueFromField = function(name) {
    return 'Fetching value from the instance variable {0}'.format(name);
  };

  JSVEE.messages.addOperator = function(name) {
    if (name == 'int') {
      return 'Fetching the type cast operator {0}'.format(name);
    } else {
      return 'Fetching the operator {0}'.format(name);
    }

  };

  JSVEE.messages.evaluateOperator = function(name) {
    if (name == 'int') {
      return 'Evaluating the type cast operator {0}'.format(name);
    } else {
      return 'Evaluating the operator {0}'.format(name);
    }

  };

  JSVEE.messages.addFunction = function(name) {
    return 'Fetching the function {0}'.format(name);
  };

  JSVEE.messages.addMethod = function(name) {
    return 'Fetching the method {0}'.format(name);
  };

  JSVEE.messages.createParameterVariables = function() {
    return 'Creating the parameter variables';
  };

  JSVEE.messages.assignParameter = function(name) {
    return 'Assigning value to the parameter variable '.format(name);
  };

  JSVEE.messages.assignParameters = function() {
    return 'Assigning parameter values to the parameter variables';
  };

  JSVEE.messages.evaluateBuiltInFunction = function(name) {
    return 'Evaluating the built-in function {0}'.format(name);
  };

  JSVEE.messages.evaluateFunction = function(name) {
    return 'Starting evaluation of the function {0}'.format(name);
  };

  JSVEE.messages.evaluateBuiltInMethod = function(name) {
    return 'Evaluating the built-in method {0}'.format(name);
  };

  JSVEE.messages.evaluateMethod = function(name) {
    return 'Starting evaluation of the method {0}'.format(name);
  };

  JSVEE.messages.returnValue = function() {
    return 'Returning the return value';
  };

  JSVEE.messages.returnVoid = function() {
    return 'Ending the call';
  };

  JSVEE.messages.addReference = function(id) {
    return 'Fetching a reference to an object, which is in the memory at location {0}'.format(id);
  };

  JSVEE.messages.createInstance = function(className) {
    if (className === 'dict') {
      return 'Creating a new dictionary';
    } else if (className === 'list') {
      return 'Creating a new list';
    }
    return 'Creating a new {0} object'.format(className);
  };
  JSVEE.messages.createField = function(name) {
    return 'Creating a new instance variable {0}'.format(name);
  };

  JSVEE.messages.createArray = function(name) {
    return 'Creating a new {0} array'.format(name);
  };

  JSVEE.messages.getValueAtIndex = function() {
    return 'Fetching value from the list';
  };

  JSVEE.messages.getValueByKey = function() {
    return 'Fetching value by the key';
  };

  JSVEE.messages.setValueAtIndex = function() {
    return 'Assigning value to the list';
  };

  JSVEE.messages.setValueByKey = function() {
    return 'Assigning value to the dictionary';
  };

  JSVEE.messages.addCollectionInitializer = function() {
    return 'Starting the initialization of the collection';
  };

  JSVEE.messages.initializeCollection = function() {
    return 'Initializing the collection';
  };

  JSVEE.messages.takeNext = function() {
    return 'Fetching the next value of the collection';
  };

  JSVEE.messages.createFunction = function(name) {
    return 'Defining function {0}'.format(name);
  };

}(jQuery));
