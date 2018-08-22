(function ($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  };

  const _ = typeof(window._) === "function" ?
  window._ :
  function(msg) {
    return msg;
  };

  JSVEE.messages.addValue = function (value, position, type, x) {
    var valueElem = JSVEE.utils.ui.findValue(this.area, value, type);
    if (valueElem.hasClass('jsvee-scala-as-code')) {
      return _("Fetching expression {0}").format(value);
    }
    return _("Fetching value {0}").format(value);
  };
  JSVEE.handlers.explanations.addValue = JSVEE.messages.addValue;

  JSVEE.handlers.global = function (ready, area, element, params) {

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'round') {
      var value1 = $(element.find('.jsvee-value').get(0));
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.round(value1.attr('data-value')), 'Long'));
      return;
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'toInt') {
      var value1 = $(element.find('.jsvee-value').get(0));
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.round(value1.data('value')), 'Int'));
      return;
    }

    if (element.hasClass('jsvee-operator')) {

      var prev = params[0];
      var next = params[1];
      var op = element.attr('data-name');
      var isRef = false;

      var prevType = prev.attr('data-type');
      var nextType = next.attr('data-type');

      if (prev.hasClass("jsvee-ref")) {
        isRef = true;
        prev = JSVEE.utils.ui.findValueById(this.area, prev.attr('data-id'));
        next = JSVEE.utils.ui.findValueById(this.area, next.attr('data-id'));
      }

      var resultType = null;
      if (prevType === nextType) {
        resultType = prevType;
      } else if (nextType === "String" || prevType === "String") {
        resultType = "String";
      } else {
        resultType = "Double";
      }

      var pval = prev.attr('data-value');
      var nval = next.attr('data-value');

      if (prevType === "String" || prevType === "Char")
        pval = '"' + pval + '"';
      if (nextType === "String" || nextType === "Char")
        nval = '"' + nval + '"';

      var result = eval(pval + op + nval);

      if (typeof result === "boolean")
        resultType = "Boolean";

      if (resultType === "Int" && op === "/")
        result = ~~result;

      if (resultType === "Double" && result.toString().indexOf(".") < 0) {
        result = result.toFixed("1");
      }

      if (!isRef) {
        ready(JSVEE.utils.ui.findOrCreateValue(this.area, result, resultType).clone());
      } else {
        /*
         * var id = this.createInstance(resultType, 'value', result); var ref =
         * $('<div></div>').addClass('value ref'); ref.attr('data-id', id);
         * ref.attr('data-type', resultType); ref.text(id); ref.attr('title',
         * 'Reference to an object, location in memory: ' + id); return ref;
         */
      }
    }

  };

  JSVEE.handlers.classes['String'] = function (ready, area, element) {

    if (element.hasClass('jsvee-operator') && element.attr('data-name') === "+") {

      var isRef = false;

      var prev = element.prev();
      var next = element.next();

      if (prev.hasClass("jsvee-ref")) {
        isRef = true;
        prev = this.area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.data('id') + '"] .jsvee-value');
        next = this.area.find('.jsvee-heap .jsvee-instance[data-id="' + next.data('id') + '"] .jsvee-value');
      }

      if (!isRef) {
        ready(JSVEE.utils.ui.findOrCreateValue(this.area, prev.data('value') + next.data('value'), "String").clone());
      } else {

        var instance = JSVEE.utils.ui.createInstance(area, "String");
        instance.appendTo(area.find('.jsvee-heap'));
        instance.append(JSVEE.utils.ui.createValue(prev.data('value') + next.data('value'), instance.attr('data-id'),
          "String"));
        ready(JSVEE.utils.ui.createReference(area, instance.attr('data-id')));

      }

    } else if (element.hasClass("jsvee-function") && element.data('name') === 'head') {
      var value = element.find('.jsvee-value').first().data('value');
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, value.substring(0, 1), "Char"));
    } else if (element.hasClass("jsvee-function") && element.data('name') === 'last') {
      var value = element.find('.jsvee-value').first().data('value');
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, value.substr(value.length - 1), "Char"));
    } else if (element.hasClass("jsvee-function") && element.data('name') === 'length') {
      var value = element.find('.jsvee-value').first().data('value');
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, value.length, "Int"));
    } else if (element.hasClass("jsvee-function") && element.data('name') === 'substring') {
      var value = element.find('.jsvee-value').first().data('value');
      var p1 = parseInt($(element.find('.jsvee-value').get(1)).data('value'), 10);
      var p2 = parseInt($(element.find('.jsvee-value').get(2)).data('value'), 10);
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, value.substring(p1, p2), "String"));
    } else if (element.hasClass("jsvee-operator") && element.data('name') === '!=') {
      var prev = element.prev();
      var next = element.next();
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, (prev.data('value') != next.data('value')).toString(),
        "Boolean"));
    }

  };

  JSVEE.handlers.classes['Char'] = function (ready, area, element) {
    if (element.hasClass("jsvee-operator") && element.data('name') === '!=') {
      var prev = element.prev();
      var next = element.next();
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, (prev.data('value') != next.data('value')).toString(),
        "Boolean"));
    }
  };

  JSVEE.handlers.classes['Predef'] = function (ready, area, element) {

    if (element.attr('data-name') == "println") {
      var console = this.area.find(".jsvee-console");
      var first = true;
      var print = element;
      var isRef = false;

      if (element.find('.jsvee-value').first().hasClass("jsvee-ref")) {
        print = this.area.find('.jsvee-heap .jsvee-instance[data-id="'
            + element.find('.jsvee-value').first().attr('data-id') + '"]');
        isRef = true;
      }

      var text = "";

      print.find(".jsvee-value").each(function (index, currentElement) {
        if (!first) {
          text += ',&nbsp;';
        }
        text += ($(currentElement).text().replace(/^"|^'|'$|"$/g, ""));
        first = false;
      });

      if (isRef) {
        text = print.attr('data-type') + "(" + text + ")";
      }

      if (text !== 'Unit') {
        console.append(text);
      } else {
        console.append('()');
      }
      console.append("<br />");

      if (!this.settings.hasOwnProperty('noUnit')) {
        ready(createUnit());
      } else {
        ready();
      }
    }

  };

  JSVEE.handlers.classes['Buffer'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'Buffer') {
      return (createArrayBuffer(ready, area, element, "ArrayBuffer"));
    }
  };

  JSVEE.handlers.classes['Vector'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') === 'Vector') {
      return (createArrayBuffer(ready, area, element, "Vector"));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') === "lift") {
      var index = parseInt($(element.find('.jsvee-value').get(1)).attr('data-value'));
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      if (index > (instance.find('.jsvee-value').length - 1)) {
        ready(JSVEE.utils.ui.createReference(area, "1"));
      } else {
        var item = $(instance).find('.jsvee-item').get(index);

        var newInstance = JSVEE.utils.ui.createInstance(area, "Some");
        area.find('.jsvee-heap').append(newInstance);

        var value = $(item).find('.jsvee-value').first().clone();
        value.clone().appendTo(newInstance);


       ready(JSVEE.utils.ui.createReference(area, newInstance.attr('data-id')));

      }
    } else if (element.attr('data-name') === "( )") {
      var prev = element.prev();
      var index = parseInt(element.find('.jsvee-value').data('value'));
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.data('id') + '"]').first();
      var item = $(buffer).find('.jsvee-item').get(index);
      prev.remove();
      ready($(item).find('.jsvee-value').first().clone());
    } else if (element.attr('data-name') === "( ) =") {
      var prev = element.prev();
      var next = element.next();
      var index = parseInt(element.find('.jsvee-value').data('value'));
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.data('id') + '"]').first();
      var item = $(buffer).find('.jsvee-item').get(index);
      $(item).find('.jsvee-value').replaceWith(next.clone());
      prev.remove();
      next.remove();
      ready();
    }
  };

  JSVEE.handlers.classes['ArrayBuffer'] = function (ready, area, element) {

    if (element.hasClass("jsvee-operator") && element.attr('data-name') === "( ) =") {
      var prev = element.prev();
      var next = element.next();
      var index = parseInt(element.find('.jsvee-value').attr('data-value'));
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.attr('data-id') + '"]').first();
      var item = $(buffer).find('.jsvee-item').get(index);
      $(item).find('.jsvee-value').replaceWith(next.clone());
      prev.remove();
      next.remove();
      ready();
    } else if (element.hasClass("jsvee-operator") && element.attr('data-name') === "( )") {
      var prev = element.prev();
      var index = parseInt(element.find('.jsvee-value').attr('data-value'));
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.attr('data-id') + '"]').first();
      var item = $(buffer).find('.jsvee-item').get(index);
      prev.remove();
      ready($(item).find('.jsvee-value').first().clone());
    } else if (element.hasClass("jsvee-operator") && element.attr('data-name') == '+=') {
      var prev = element.prev();
      var next = element.next();
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.attr('data-id') + '"]').first();
      next.clone().appendTo(buffer);
      prev.remove();
      next.remove();
      ready();
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'sum') {
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      var sum = 0;
      instance.find('.jsvee-value').each(function () {
        sum += +($(this).text());
      });
      ready(JSVEE.utils.ui.findOrCreateValue(area, sum, "Int"));
    }

  };

  JSVEE.handlers.classes['math'] = function (ready, area, element) {
    var value1 = $(element.find('.jsvee-value').get(0));
    var value2 = $(element.find('.jsvee-value').get(1));

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'abs') {
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.abs(value1.attr('data-value')), value1.attr('data-type')));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'min') {
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.min(value1.attr('data-value'), value2.attr('data-value')),
        value1.attr('data-type')));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'max') {
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.max(value1.attr('data-value'), value2.attr('data-value')),
        value1.attr('data-type')));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'pow') {
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.pow(value1.attr('data-value'), value2.attr('data-value')),
        "Double"));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'sqrt') {
      var res = Math.sqrt(value1.attr('data-value'));
      if (res.toString().indexOf(".") < 0) {
        res = res.toFixed("1");
      }
      ready(JSVEE.utils.ui.findOrCreateValue(area, res, "Double"));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'hypot') {
      ready(JSVEE.utils.ui.findOrCreateValue(area, Math.sqrt(value1.attr('data-value') * value1.attr('data-value')
          + value2.attr('data-value') * value2.attr('data-value')), "Double"));
    }
  };

  JSVEE.handlers.classes['None'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'getOrElse') {
      var val = $(element.find('.jsvee-value').get(1));
      ready(val.clone().removeClass("jsvee-scala-as-code"));
    }
  };

  JSVEE.handlers.classes['Some'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'Some') {

      var instance = JSVEE.utils.ui.createInstance(area, "Some");
      area.find('.jsvee-heap').append(instance);

      var value = $(element.find('.jsvee-value').get(0));
      value.clone().appendTo(instance);

      ready(JSVEE.utils.ui.createReference(area, instance.attr('data-id')));

    } else if (element.hasClass("jsvee-function") && (element.attr('data-name') === 'get')
        || element.attr('data-name') === 'getOrElse' || element.attr('data-name') === 'unapply') {
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      ready(instance.find('.jsvee-value').first().clone());
    }
  };

  JSVEE.handlers.classes['Array'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'Array') {
      createArrayBuffer(ready, area, element, "Array");
    } else if (element.attr('data-name') === "( )") {
      var prev = element.prev();
      var index = parseInt(element.find('.jsvee-value').data('value'));
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.data('id') + '"]').first();
      var item = $(buffer).find('.jsvee-item').get(index);
      prev.remove();
      ready($(item).find('.jsvee-value').first().clone());
    } else if (element.attr('data-name') === "( ) =") {
      var prev = element.prev();
      var next = element.next();
      var index = parseInt(element.find('.jsvee-value').data('value'));
      var buffer = area.find('.jsvee-heap .jsvee-instance[data-id="' + prev.data('id') + '"]').first();
      var item = $(buffer).find('.jsvee-item').get(index);
      $(item).find('.jsvee-value').replaceWith(next.clone());
      prev.remove();
      next.remove();
      ready();
    }
  };

  var createArrayBuffer = function (ready, area, element, type) {
    var instance = JSVEE.utils.ui.createInstance(area, type);
    area.find('.jsvee-heap').append(instance);

    var bufferElement = instance;
    $(element).find('.jsvee-value').each(function (index, value) {
      var item = $('<div></div>').addClass('jsvee-item');
      item.css('display', 'inline-block');
      item.appendTo(bufferElement);
      $(value).clone().appendTo(item);
    });

    ready(JSVEE.utils.ui.createReference(area, instance.attr('data-id')));
  };

  var createUnit = function () {
    var val = $('<div>Unit</div>').addClass('jsvee-value');
    val.attr('data-type', 'Unit').attr('data-value', 'Unit');
    val.attr('title', _("Unit: empty return value"));
    return val;
  };

  JSVEE.ui.finishLayout = function () {

    if (this.engine.settings.noIcons) {
      this.area.find('.jsvee-class.jsvee-instance').each(function () {
        var elem = $(this);
        elem.attr('title', '');
        elem.find('.jsvee-name').text(elem.find('.jsvee-name2').text());
      });
    }

    modifyUI.call(this.engine);

  };

  JSVEE.handlers.explanations.addOperator = function (op, position) {
    var type = "";
    if (position === undefined) {
      type = this.area.find(".jsvee-evaluation-area").first().children().last().data('type');
    } else {
      type = JSVEE.utils.ui.findElement(this.area, position, true).data('type');
    }

    var name = op + _(" operator");

    if (op == '<')
      name = _("comparison operator");
    else if (op == '>')
      name = _("comparison operator");
    else if (op == '<=')
      name = _("comparison operator");
    else if (op == '>=')
      name = _("comparison operator");
    else if (op == '==')
      name = _("equality operator");
    else if (op == '!=')
      name = _("inequality operator");
    else if (type == 'Int' || type == 'Double') {
      if (op == '+')
        name = _("addition operator");
      if (op == '-')
        name = _("subtraction operator");
      if (op == '*')
        name = _("multiplication operator");
      if (op == '/')
        name = _("division operator");
    } else if (type == 'String' && op == "+")
      name = _("concatenation operator");
    else if (type == 'ArrayBuffer' && op == "( )")
      name = _("buffer-read operator");
    else if (type == 'ArrayBuffer' && op == "( ) =")
      name = _("buffer-update operator");
    else if (type == 'ArrayBuffer' && op == "+=")
      name = _("buffer-append operator");
    else if (type == 'Array' && op == "( )")
      name = _("array-read operator");
    else if (type == 'Array' && op == "( ) =")
      name = _("array-update operator");
    else if (type == 'Vector' && op == "( )")
      name = _("vector-read operator");

    return _("Fetching ") + name;

  };

  JSVEE.handlers.explanations.addReference = function (id) {
    if (this.settings['noIcons']) {
      return _("Fetching reference to data at memory location {0}").format(id);
    } else {
      var realId = JSVEE.utils.ui.findReference(this.area, id).attr('data-id');
      return _("Fetching reference to an object at memory location {0}").format(realId);
    }
  };

  JSVEE.handlers.explanations.evaluateOperator = function (position) {

    var elem = JSVEE.utils.ui.findElement(this.area, position);
    var op = elem.data('name');
    var type = elem.data('class');
    var name = op + _(" operator");

    if (op == '<')
      name = _("comparison operator");
    else if (op == '>')
      name = _("comparison operator");
    else if (op == '<=')
      name = _("comparison operator");
    else if (op == '>=')
      name = _("comparison operator");
    else if (op == '==')
      name = _("equality operator");
    else if (op == '!=')
      name = _("inequality operator");
    else if (type == 'Int' || type == 'Double') {
      if (op == '+')
        name = _("addition operator");
      if (op == '-')
        name = _("subtraction operator");
      if (op == '*')
        name = _("multiplication operator");
      if (op == '/')
        name = _("division operator");
    } else if (type == 'String' && op == "+")
      name = _("concatenation operator");
    else if (type == 'ArrayBuffer' && op == "( )")
      name = _("buffer-read operator");
    else if (type == 'ArrayBuffer' && op == "( ) =")
      name = _("buffer-update operator");
    else if (type == 'ArrayBuffer' && op == "+=")
      name = _("buffer-append operator");
    else if (type == 'Array' && op == "( )")
      name = _("array-read operator");
    else if (type == 'Array' && op == "( ) =")
      name = _("array-update operator");
    else if (type == 'Vector' && op == "( )")
      name = _("vector-read operator");

    return _("Evaluating ") + name;
  };

  JSVEE.handlers.explanations.addFunction = function (name, position, params, className) {

    var noFunctionTerm = this.animationId == 'println' || this.animationId == 'bufferRef1'
        || this.animationId == 'bufferRef2' || this.animationId == 'bufferRef3';

    if (typeof name === "undefined") {
      return _("Fetching function");
    } else {
      if (noFunctionTerm) {
        if (className !== undefined && name == className
            && this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0) {
          return _("Fetching command to create {0}").format(name);
        } else {
          return _("Fetching command ") + name;
        }
      } else {

        if (className !== undefined) {

          if (className === "?") {
            className = JSVEE.utils.ui.findElement(this.area, position, true).data('type');
          }

          if (name == className
              && (this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0)
              || name == "Some") {
            return _("Fetching command to create {0}").format(name);
          } else if (name == className) {
            return _("Fetching the constructor of class {0}").format(name);
          } else if (this.area.find(
            '.jsvee-classes .jsvee-class[data-name="' + className + '"] .jsvee-function[data-name="' + name + '"]')
              .attr('data-static') === "true") {
            return _("Fetching function ") + name;
          } else {
            return _("Fetching method ") + name;
          }
        } else {
          return _("Fetching function ") + name;
        }

      }
    }
  };

  JSVEE.handlers.explanations.evaluateFunction = function (position) {

    var noFunctionTerm = this.animationId == 'println' || this.animationId == 'bufferRef1'
        || this.animationId == 'bufferRef2' || this.animationId == 'bufferRef3';
    var func = JSVEE.utils.ui.findElement(this.area, position);
    var name = func.data('name');
    var className = func.attr('data-class');

    if (func.data('pc') < 0) {
      if (noFunctionTerm) {
        if (className !== undefined && name == className
            && (this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0)
            || name == "Some") {
          return _("Evaluating command to create {0}").format(name);
        } else {
          return _("Evaluating command ") + name;
        }
      } else {

        if (className !== undefined) {
          if (name == className
              && (this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0)
              || name == "Some") {
            return _("Evaluating command to create {0}").format(name);
          } else if (name == className) {
            return _("Evaluating the constructor of class {0}").format(name);
          } else if (this.area.find(
            '.jsvee-classes .jsvee-class[data-name="' + className + '"] .jsvee-function[data-name="' + name + '"]')
              .attr('data-static') === "true") {
            return _("Evaluating function ") + name;
          } else {
            return _("Evaluating method ") + name;
          }
        } else {
          return _("Evaluating function ") + name;
        }

      }
    } else {
      if (typeof func.data('name') !== "undefined") {

        var className = func.attr('data-class');
        var name = func.data('name');
        if (className !== undefined) {
          if (name == className
              && this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0) {
            return _("Starting to execute command to create {0}").format(name);
          } else if (name == className) {
            return _("Starting to execute constructor of class {0}").format(name);
          } else if (this.area.find(
            '.jsvee-classes .jsvee-class[data-name="' + className + '"] .jsvee-function[data-name="' + name + '"]')
              .attr('data-static') === "true") {
            return _("Starting to execute function {0}").format(name);
          } else {
            return _("Starting to execute method {0}").format(name);
          }
        } else {
          return _("Starting to execute function {0}").format(name);
        }

      } else {
        return _("Starting to execute function");
      }
    }
  };

  /**
   *
   */
  JSVEE.handlers.actions.noLabels = function (ready) {
    this.settings['noLabels'] = true;
    this.area.find('.jsvee-area-label').remove();
    this.area.find('.jsvee-stack').css('border', '0');
    this.area.find('.jsvee-right-panels').css('border', '0');
    this.area.find('.jsvee-heap').css('border', '0');
    JSVEE.utils.ui.resizeStack(this.area);
    ready();

  };
  JSVEE.registerAction('noLabels', JSVEE.handlers.actions.noLabels);

  /**
   *
   */
  JSVEE.handlers.actions.noIcons = function (ready) {
    this.settings['noIcons'] = true;
    this.area.find('.jsvee-classes').addClass('jsvee-scala-no-icon');
    ready();
  };
  JSVEE.registerAction('noIcons', JSVEE.handlers.actions.noIcons);

  /**
   *
   */
  JSVEE.handlers.actions.noUnit = function (ready) {
    this.settings['noUnit'] = true;
    ready();
  };
  JSVEE.registerAction('noUnit', JSVEE.handlers.actions.noUnit);

  /**
   *
   */
  JSVEE.handlers.actions.createObject = function (ready, name) {
    var instance = JSVEE.utils.ui.createInstance(this.area, name);
    instance.addClass('jsvee-class');
    instance.attr('data-name', name);
    this.area.find('.jsvee-classes').append(instance);
    ready(instance);
  };
  JSVEE.registerAction('createObject', JSVEE.handlers.actions.createObject);

  /**
   *
   */
  JSVEE.handlers.actions.noLiterals = function (ready) {
    this.settings['noLiterals'] = true;
    this.area.find('.jsvee-literals').remove();
    ready();
  };
  JSVEE.registerAction('noLiterals', JSVEE.handlers.actions.noLiterals);

  /**
   *
   */
  JSVEE.handlers.actions.createPackage = function (ready, name) {
    var classes = this.area.find('.jsvee-classes');
    var c = $('<div></div>').addClass('jsvee-class').attr('data-name', name).addClass('jsvee-scala-package');
    var n = $('<div></div>').addClass('jsvee-name').append(document.createTextNode(name));

    c.attr('title', _("Package object ") + name);
    n.appendTo(c);
    c.appendTo(classes);

  };
  JSVEE.registerAction('createPackage', JSVEE.handlers.actions.createPackage);

  /**
   *
   */
  JSVEE.handlers.actions.createTrait = function (ready, name) {
    var classes = this.area.find('.jsvee-classes');
    var c = $('<div></div>').addClass('jsvee-class').attr('data-name', name).addClass('jsvee-scala-trait');
    var n = $('<div></div>').addClass('jsvee-name').append(document.createTextNode(name));

    c.attr('title', _("Trait ") + name);
    n.appendTo(c);
    c.appendTo(classes);
    ready();
  };
  JSVEE.registerAction('createTrait', JSVEE.handlers.actions.createTrait);

  /**
   *
   */
  JSVEE.handlers.actions.addExtends = function (ready, name, base) {
    var nameLabel = this.area.find('.jsvee-classes .jsvee-class[data-name="' + name + '"] .jsvee-name');
    var extendsLabel = $('<div></div>').addClass('jsvee-name3').text('extends ' + base);
    extendsLabel.insertAfter(nameLabel);
    ready();
  };
  JSVEE.registerAction('addExtends', JSVEE.handlers.actions.addExtends);

  /**
   *
   */
  JSVEE.handlers.actions.createUnit = function (ready) {
    var unit = createUnit();
    var target = JSVEE.utils.ui.findEvaluationArea(this.area);
    unit.appendTo(target);
    ready();
  };

  JSVEE.registerAction('createUnit', JSVEE.handlers.actions.createUnit);

  /**
   *
   */
  JSVEE.handlers.actions.hideLine = function (ready, line) {
    this.area.find('.jsvee-code-line').eq(line - 1).addClass("jsvee-hidden");
    ready();
  };

  JSVEE.registerAction('hideLine', JSVEE.handlers.actions.hideLine);

  /**
   *
   */
  JSVEE.handlers.actions.showCode = function (ready) {
    this.area.find('.jsvee-code-table').show();
    this.area.find('.jsvee-code-line.jsvee-hidden').removeClass("jsvee-hidden");
    ready();
  };

  JSVEE.registerAction('showCode', JSVEE.handlers.actions.showCode);

  /**
   *
   */
  JSVEE.handlers.actions.removeFrame = function (ready) {
    this.area.find('.jsvee-stack-frame').remove();
    ready();
  };

  JSVEE.registerAction('removeFrame', JSVEE.handlers.actions.removeFrame);

  /**
   * A dummy implementation for testing the truthness.
   */

  JSVEE.handlers.truthness = function (element) {
    return element.text() === 'true';
  };

  /**
   *
   */
  JSVEE.handlers.actions.raiseError = function (ready, type, description) {
    this.area.find('.jsvee-evaluation-area').first().children().remove();
    var val = JSVEE.utils.ui.createValue(type, this.state.idCounter++, type).addClass('jsvee-error');
    this.area.find('.jsvee-evaluation-area').first().append(val);
    JSVEE.utils.ui.setStatusText(this.area, description);
    this.setPC(999999);
    ready();
  };

  JSVEE.registerAction('raiseError', JSVEE.handlers.actions.raiseError);

  /**
   *
   */
  JSVEE.handlers.actions.createCodeValue = function (ready, value, type, functionName, paramCount, pc) {
    var val = JSVEE.utils.ui.findOrCreateValue(this.area, value, type);
    val.attr('title', _("Unevaluated parameter"));
    if (functionName) {
      val.attr('data-name', functionName);
      val.attr('data-params', paramCount);
      val.attr('data-pc', pc);
    }
    this.area.find('.jsvee-heap .jsvee-value[data-value="' + value + '"]').addClass("jsvee-scala-as-code");
    return val;
  };

  JSVEE.registerAction('createCodeValue', JSVEE.handlers.actions.createCodeValue);

  /**
   *
   */
  JSVEE.handlers.actions.createCompanion = function (ready, name) {
    var companion = $('<div></div>').addClass("jsvee-scala-companion").appendTo(this.area.find('.jsvee-classes'));
    this.area.find('.jsvee-class[data-name="' + name + '"]').appendTo(companion);
    companion.find('.jsvee-instance').attr('title', 'Luokan ' + name + ' kumppaniolio');
  };

  JSVEE.registerAction('createCompanion', JSVEE.handlers.actions.createCompanion);

  /**
   *
   */
  JSVEE.handlers.actions.hideClass = function (ready, name) {
    this.area.find('.jsvee-class[data-name="' + name + '"]').hide();
  };

  JSVEE.registerAction('hideClass', JSVEE.handlers.actions.hideClass);

  /**
   *
   */
  JSVEE.handlers.actions.createFunctionLiteral = function (ready, text, paramCount, pc) {
    var func = JSVEE.utils.ui.createInstance(this.area, "Function" + paramCount);
    func.appendTo(this.area.find('.jsvee-heap'));
    var funcElement = this.area.find('.jsvee-heap .jsvee-instance[data-id="' + func.attr('data-id') + '"]').first();

    funcElement.append($('<div></div>').addClass("jsvee-value jsvee-scala-as-code").text(text));
    funcElement.attr('data-params', paramCount);
    funcElement.attr('data-pc', pc);

    ready(JSVEE.utils.ui.createReference(this.area, func.attr('data-id')));
  };

  JSVEE.handlers.explanations.createFunctionLiteral = function () {
    return _("Creating function literal");
  };

  JSVEE.registerAction('createFunctionLiteral', JSVEE.handlers.actions.createFunctionLiteral);

  var modifyUI = function () {

    if (this.settings.hasOwnProperty('noIcons')) {
      this.area.find('.jsvee-class').each(function () {
        var elem = $(this);
        elem.attr('title', _("Definition of type {0}").format(elem.data('name')));
      });

      this.area.find('.jsvee-function').each(function () {
        var elem = $(this);
        elem.attr('title', _("Definition of function {0}").format(elem.data('name')));
      });

      this.area.find('.jsvee-function[data-name="println"]').attr('title', _("definition of the println subprogram"));
      this.area.find('.jsvee-function[data-name="Buffer"]').attr('title', _("definition of buffer-creating command"));

      this.area.find('.jsvee-instance[data-type="String"]').each(function () {
        var elem = $(this);
        elem.attr('title', _("String at memory location ") + elem.data('id'));
      });

      this.area.find('.jsvee-instance[data-type="ArrayBuffer"]').each(function () {
        var elem = $(this);
        elem.attr('title', _("Buffer in memory location ") + elem.data('id'));
      });

    } else {

      this.area.find('.jsvee-class .jsvee-function').each(function () {
        var elem = $(this);
        if (elem.data('name') == elem.data('class'))
          elem.attr('title', _("Constructor definition for {0}").format(elem.data('name')));
        else
          elem.attr('title', _("Definition of method {0}").format(elem.data('name')));
      });

      this.area.find('.jsvee-class.jsvee-instance .jsvee-function').each(function () {
        var elem = $(this);
        if (elem.data('name') == elem.data('class'))
          elem.attr('title', _("{0}-creating command").format(elem.data('name')));
      });

    }

    this.area.find('.jsvee-operator').each(function () {
      var elem = $(this);

      if (elem.data('name') == '>')
        elem.attr('title', _("Comparison operator"));
      else if (elem.data('name') == '<')
        elem.attr('title', _("Comparison operator"));
      else if (elem.data('name') == '>=')
        elem.attr('title', _("Comparison operator"));
      else if (elem.data('name') == '<=')
        elem.attr('title', _("Comparison operator"));
      else if (elem.data('name') == '==')
        elem.attr('title', _("Equality operator"));
      else if (elem.data('name') == '!=')
        elem.attr('title', _("Inequality operator"));
      else if (elem.data('class') == 'Int' || elem.data('class') == 'Double') {
        if (elem.data('name') == '+')
          elem.attr('title', _("Addition operator"));
        if (elem.data('name') == '-')
          elem.attr('title', _("Subtraction operator"));
        if (elem.data('name') == '*')
          elem.attr('title', _("Multiplication operator"));
        if (elem.data('name') == '/')
          elem.attr('title', _("Division operator"));
      } else if (elem.data('class') == 'String' && elem.data('name') == "+")
        elem.attr('title', _("Concatenation operator"));
      else if (elem.data('class') == 'ArrayBuffer' && elem.data('name') == "( )")
        elem.attr('title', _("Buffer-read operator"));
      else if (elem.data('class') == 'ArrayBuffer' && elem.data('name') == "( ) =")
        elem.attr('title', _("Buffer-update operator"));
      else if (elem.data('class') == 'Array' && elem.data('name') == "( )")
        elem.attr('title', _("Array-read operator"));
      else if (elem.data('class') == 'Array' && elem.data('name') == "( ) =")
        elem.attr('title', _("Array-update operator"));
      else if (elem.data('class') == 'ArrayBuffer' && elem.data('name') == "+=")
        elem.attr('title', _("Buffer-append operator"));
      else if (elem.data('class') == 'Vector' && elem.data('name') == "( )")
        elem.attr('title', _("Vector-read operator"));
    });

    var frames = this.area.find('.jsvee-stack-frame');

    if (this.area.find('.jsvee-code-table').length == 0)
      return;

    frames.each(function (index, element) {
      var frame = $(this);
      if (frames.length == 1) {
        frame.find('.jsvee-area-label')
            .text(
              _("Frame")
                  + (frame.attr('data-line') === undefined ? '' : _(", executing line ")
                      + frame.attr('data-line')));
      } else if (index == frames.length - 1) {
        frame.find('.jsvee-area-label').text(
          _("Frame; execution suspended")
              + (frame.attr('data-line') === undefined ? '' : _(" on line ") + frame.attr('data-line')));
      } else if (index == 0) {
        var func = frame.next('.jsvee-stack-frame').find('.jsvee-function.jsvee-active').first().attr('data-name');
        if (func === undefined)
          func = _("anonymous function");
        if (frame.attr('data-line') !== undefined) {
          frame.find('.jsvee-area-label').text(
            _("Frame") + ' ('
                + func
                + ')'
                + (frame.attr('data-line') === undefined ? '' : _(", executing line ")
                    + frame.attr('data-line')));
        } else {
          frame.find('.jsvee-area-label').text(_("Frame") +  ' (' + func + ')');
        }
      } else {
        var func = frame.next('.jsvee-stack-frame').find('.jsvee-function.jsvee-active').first().attr('data-name');
        if (func === undefined)
          func = _("anonymous function");
        if (frame.attr('data-line') !== undefined) {
          frame.find('.jsvee-area-label').text(
            _("Frame") + ' (' + func + ') ' + _("execution suspended")
                + (frame.attr('data-line') === undefined ? '' : _(" on line ") + frame.attr('data-line')));
        } else {
          frame.find('.jsvee-area-label').text(_("Frame") +  ' (' + func + ')' + _("execution suspended"));
        }
      }

    });
  };

  JSVEE.afterEachStep(false, modifyUI);

}(jQuery));
