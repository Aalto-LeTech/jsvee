(function($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  }


  /**
   * A global handler to evaluate operators and functions.
   */
  JSVEE.handlers.global = function(ready, area, element, params) {

    if (element.hasClass('jsvee-operator')) {

      if (element.attr('data-type') == 'n') {
        ready();
        return;
      }

      if (element.attr('data-type') == 'r') {
        var result = eval(element.text() + params[0].text());
        ready(JSVEE.utils.ui.findOrCreateValue(area, result, params[0].attr('data-type')));
        return;
      }

      // XXX: no operator type checked here (l, r or lr)

      var p1 = (params[0].attr('data-type') == "str" || params[0].attr('data-type') == "char") ? '"' + params[0].text() + '"' : params[0].text();

      var p2 = (params[1].attr('data-type') == "str" || params[1].attr('data-type') == "char") ? '"' + params[1].text() + '"' : params[1].text();

      if (params[0].attr('data-type') == "bool") {
        p1 = p1.toLowerCase();
      }

      if (params[1].attr('data-type') == "bool") {
        p2 = p2.toLowerCase();
      }

      var op = element.text();

      if (op == "and")
        op = "&&";
      if (op == "or")
        op = "||";

      if (op == 'in') {
        var collection = JSVEE.utils.ui.findValueById(area, params[1].attr('data-id'));
        if (collection.find('.jsvee-value[data-value="' + params[0].text() + '"]').length > 0) {
          var newElement = JSVEE.utils.ui.findOrCreateValue(area, "True", 'bool');
          ready(newElement);
          return;
        } else if (collection.find('.jsvee-key-value-pair[data-key="' + params[0].text() + '"]').length > 0) {
          var newElement = JSVEE.utils.ui.findOrCreateValue(area, "True", 'bool');
          ready(newElement);
          return;
        } else {
          var newElement = JSVEE.utils.ui.findOrCreateValue(area, "False", 'bool');
          ready(newElement);
          return;
        }
      }

      if (op == '==' && p1 == 'None') {
        p1 = '"None"';
      }

      if (op == '==' && p2 == 'None') {
        p2 = '"None"';
      }

      var result = eval(p1 + " " + op + " " + p2);

      var dataType = params[0].attr('data-type');

      if (params[0].attr('data-type') == "float" || params[1].attr('data-type') == "float") {
        dataType = "float";
      }

      if (params[0].attr('data-type') == "String" || params[1].attr('data-type') == "String") {
        dataType = "String";
      }

      if (typeof result === "boolean") {
        // true -> True
        dataType = "bool";
        result = result.toString().charAt(0).toUpperCase() + result.toString().slice(1);
      }

      if (op == "/") {
        dataType = "float";
      }

      if (dataType === "float" && result.toString().indexOf(".") < 0) {
        result = result.toFixed("1");
      }

      if (dataType === "float" && result.toString().length - result.toString().indexOf(".") > 5) {
        result = result.toFixed("5");
      }

      var newElement = JSVEE.utils.ui.findOrCreateValue(area, result, dataType);
      ready(newElement);

    } else if (element.hasClass('jsvee-function') && (element.attr('data-name') === 'print')) {

      var str = '';
      $.each(element.find('.jsvee-value'), function(i) {
        if (i > 0) {
          str += ' ';
        }
        if ($(this).attr('data-type') == "bool") {
          str += $(this).text().charAt(0).toUpperCase() + $(this).text().slice(1);
        } else {
          str += $(this).text();
        }

      });

      if (element.find('.jsvee-value').first().attr('data-type') === 'list') {
        var arrayList = JSVEE.utils.ui.findValueById(area, element.find('.jsvee-value').eq(0).attr('data-id'));
        var values = [];
        arrayList.find('.jsvee-value').each(function() {
          values.push($(this).text());
        });
        str = '[' + values.join(', ') + ']';
      }

      var consoleArea = area.find('.jsvee-console');

      if (element.attr('data-name') === 'print') {
        consoleArea.text(consoleArea.text() + str + '\n');
      } else {
        consoleArea.text(consoleArea.text() + str);
      }

      ready();

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'input') {

      var param = element.find('.jsvee-value').eq(0).text();
      var result = prompt(param) || '';
      var newElement = JSVEE.utils.ui.findOrCreateValue(area, result, 'str');
      ready(newElement);

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'rstrip') {

      var str = element.find('.jsvee-value').eq(0).text().slice(0, -2);
      var newElement = JSVEE.utils.ui.findOrCreateValue(area, str, 'str');
      ready(newElement);

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'float') {

      var param = element.find('.jsvee-value').eq(0).text();
      var result = Number(param);
      if (!isNaN(result)) {

        if (result.toString().indexOf(".") < 0) {
          result = result.toFixed("1");
        }

        if (result.toString().length - result.toString().indexOf(".") > 5) {
          result = result.toFixed("5");
        }

        var newElement = JSVEE.utils.ui.findOrCreateValue(area, result, 'float');
        ready(newElement);
      } else {
        var evArea = JSVEE.utils.ui.findEvaluationArea(area);
        evArea.children().remove();
        var newElement = JSVEE.utils.ui.findOrCreateValue(area, 'ValueError', 'ValueError').addClass('jsvee-error');
        evArea.append(newElement);
        this.setPC(99999);
        throw "ValueError";
        ready();
      }

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'int') {

      var param = element.find('.jsvee-value').eq(0).text().replace('\\n', '');
      var result = Number(param);
      if (!isNaN(result) && result.toString().indexOf(".") < 0) {
        var newElement = JSVEE.utils.ui.findOrCreateValue(area, result, 'int');
        ready(newElement);
      } else {
        var evArea = JSVEE.utils.ui.findEvaluationArea(area);
        evArea.children().remove();
        var newElement = JSVEE.utils.ui.findOrCreateValue(area, 'ValueError', 'ValueError').addClass('jsvee-error');
        evArea.append(newElement);
        if (param != "two") {
          this.setPC(99999);
          throw "ValueError";
        }
        ready();
      }

    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'min') {
      var value1 = element.find('.jsvee-value').eq(0);
      var value2 = element.find('.jsvee-value').eq(1);
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.min(value1.attr('data-value'), value2.attr('data-value')),
        value1.attr('data-type')));
    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'len') {

      if (!element.find('.jsvee-value').hasClass('jsvee-ref')) {
        var result = element.find('.jsvee-value').first().text().length;
        var newElement = JSVEE.utils.ui.findOrCreateValue(area, result, 'int');
        ready(newElement);
      } else {
        var result = element.find('.jsvee-value').first();
        var actualElement = JSVEE.utils.ui.findValueById(area, result.attr('data-id'));
        var length = actualElement.find('.jsvee-key-value-pair').length;
        if (length == 0) {
          length = actualElement.find('.jsvee-value').length;
        }
        var newElement = JSVEE.utils.ui.findOrCreateValue(area, length, 'int');
        ready(newElement);
      }

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'range') {

      
      var param1 = +element.find('.jsvee-value').eq(0).text();
      var param2 = +element.find('.jsvee-value').eq(1).text();

      var start = 0;
      var end = param1;

      if (param2) {
        start = param1;
        end = param2;
      }      
      
      var i;
      var elements = [];
      for (i = start; i < end; i++) {
        elements.push(JSVEE.utils.ui.findOrCreateValue(area, i, 'int'));
      }
      
      var newElement = JSVEE.utils.ui.createInstance(area, 'range');
      
      elements.forEach(function(value) {
        value.appendTo(newElement).hide();
      });
      
      newElement.appendTo(area.find('.jsvee-heap'));
      var ref = JSVEE.utils.ui.createReference(area, newElement.attr('data-id'));
      ready(ref);

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'append' && element.attr('data-class') === 'list') {

      var params = element.find('.jsvee-value');
      var list = JSVEE.utils.ui.findValueById(area, params.eq(0).attr('data-id'));
      list.append(params.eq(1).clone());
      ready();

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'split' && element.attr('data-class') === 'str') {

      var param1 = element.find('.jsvee-value').eq(0).text();
      var param2 = element.find('.jsvee-value').eq(1).text();

      var instance = JSVEE.utils.ui.createInstance(area, "list");
      area.find('.jsvee-heap').append(instance);

      var parts = param1.split(param2);
      for (var i = 0; i < parts.length; i++) {
        var newElement = JSVEE.utils.ui.findOrCreateValue(area, parts[i], 'str');
        newElement.appendTo(instance);
      }

      var newElement = JSVEE.utils.ui.createReference(area, instance.attr('data-id'));
      ready(newElement);

    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'format' && element.attr('data-class') === 'str') {
      var value1 = element.find('.jsvee-value').eq(0);
      var formatted = value1.text();
      var index = 1;
      formatted = formatted.replace(/\{.*?\}/g, function(match, number) {
        var text = element.find('.jsvee-value').eq(index++).text();
        var format = /\{.*?\.(\d+)f\}/.exec(match);
        if (format) {
          text = parseFloat(text).toFixed(parseInt(format[1], 10));
        }
        return text;
      });

      ready(JSVEE.utils.ui.findOrCreateValue(area, formatted, 'str'));
    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'abs') {

      var param1 = element.find('.jsvee-value').eq(0).text();
      var newElement;

      if (element.find('.jsvee-value').eq(0).attr('data-type') === 'float') {
        result = Math.abs(parseFloat(param1, 10));
        if (result.toString().indexOf(".") < 0) {
          result = result.toFixed("1");
        }
        newElement = JSVEE.utils.ui.findOrCreateValue(area, result, 'float');
      } else {
        newElement = JSVEE.utils.ui.findOrCreateValue(area, Math.abs(parseInt(param1, 10)), 'int');
      }

      ready(newElement);

    } else if (element.hasClass('jsvee-function') && element.attr('data-name') === 'max') {

      var param1 = element.find('.jsvee-value').eq(0).text();
      var param2 = element.find('.jsvee-value').eq(1).text();
      var newElement = JSVEE.utils.ui.findOrCreateValue(area, Math.max(parseInt(param1, 10), parseInt(param2, 10)), 'int');
      ready(newElement);

    } else {

      ready();

    }

  };

  /**
   * An implementation for testing the truthness.
   */

  JSVEE.handlers.truthness = function(element) {
    return element.text() === 'true' || element.text() === 'True';
  };

  // *******************************************************************

  JSVEE.handlers.actions.removeElement = function(ready, position, prev) {
    JSVEE.utils.ui.findElement(this.area, position, prev).remove();
    ready();
  };

  JSVEE.registerAction('removeElement', JSVEE.handlers.actions.removeElement);

  JSVEE.handlers.actions.raiseError = function(ready, type, description, errorDescription) {
    this.area.find('.jsvee-evaluation-area').first().children().remove();
    var val = JSVEE.utils.ui.createValue(type, this.state.idCounter++, type);
    val.attr('data-description', errorDescription);
    this.area.find('.jsvee-evaluation-area').first().append(val);
    JSVEE.utils.ui.setStatusText(this.area, description);
    ready();
  };

  JSVEE.registerAction('raiseError', JSVEE.handlers.actions.raiseError);

}(jQuery));
