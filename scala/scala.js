(function ($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  }

  $(function () {
    var annotations = window.annotations || window.kelmu;

    if (annotations) {
      JSVEE.afterInitialization(function () {
        var self = this;
        annotations.registerCallback(self.animationId,
          function (action, parameter) {
            if (action === 'skip') {
              JSVEE.utils.ui.setStatusText(self.area, 'Siirrytään eteenpäin');
              self.state.stepsToRun = +parameter;
              self.state.animationsDisabled = true;
              self.state.reEnableAnimations = true;
            } else if (action === 'hideControls') {
              self.area.find('.jsvee-controls-area').hide();
            } else if (action === 'showSequence') {
              self.disableStateSave = true;
            } else if (action === 'showControls') {
              self.area.find('.jsvee-controls-area').show();
            } else if (action === 'getCapabilities') {
              annotations.sendMessage(self.animationId, 'animationCapabilities', null, [ 'animationReady' ]);
            } else if (action === 'getAnimationLength') {
              annotations.sendMessage(self.animationId, 'animationLength', self.animationLength);
            } else if (action === 'getButtonDefinitions') {
              annotations.sendMessage(self.animationId, 'buttonDefinitions', null, { 'step' : '.jsvee-step',
                'redo' : '.jsvee-redo', 'undo' : '.jsvee-undo', 'begin' : '.jsvee-begin' });
            } else if (action === 'postponeEnd') {
              var statusArea = self.area.find('.jsvee-status-area');
              statusArea.text(statusArea.text()
                  .substring(0, statusArea.text().indexOf(JSVEE.messages.animationEnded())));
            } else if (action === 'lastSubstepShown') {
              var statusArea = self.area.find('.jsvee-status-area');
              statusArea.text(statusArea.text() + JSVEE.messages.animationEnded());
            }
          });
      });

      JSVEE.afterEachStep(true, function (instr) {

        if (!this.actionsRunning || !this.state.animationsDisabled) {
          annotations.sendMessage(this.animationId, 'animationReady');
        }

        if (this.hasEnded()) {
          annotations.sendMessage(this.animationId, 'animationEnded');
        }

      });

    }
  });

  JSVEE.messages.addValue = function (value, position, type, x) {
    var valueElem = JSVEE.utils.ui.findValue(this.area, value, type);
    if (valueElem.hasClass('jsvee-scala-as-code')) {
      return 'Noudetaan lauseke {0}'.format(value);
    }
    return 'Noudetaan arvo {0}'.format(value);
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
         * 'Viittaus olioon, joka on muistissa kohdassa ' + id); return ref;
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
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, value.substring(0, 1), "String"));
    } else if (element.hasClass("jsvee-function") && element.data('name') === 'last') {
      var value = element.find('.jsvee-value').first().data('value');
      ready(JSVEE.utils.ui.findOrCreateValue(this.area, value.substr(value.length - 1), "String"));
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

  JSVEE.handlers.classes['aliohjelmia'] = function (ready, area, element) {
    var value1 = $(element.find('.jsvee-value').get(0));
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'imdbLeffa') {
      ready(JSVEE.utils.ui.findOrCreateValue(area, "The Imitation Game", "String"));
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'nayta') {
      area.find(".jsvee-console").append("Parametriksi saatiin: " + value1.attr('data-value') + ".").append("<br />");
      ready(JSVEE.utils.ui.findOrCreateValue(area, value1.attr('data-value').length, "Int"));
    }
  };

  JSVEE.handlers.classes['Tyontekija'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'Tyontekija') {

      var id = $(element.find('.jsvee-value').get(0)).data('id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();

      var names = [ "nimi", "syntynyt", "kkpalkka" ];

      for ( var i = 0; i < names.length; i++) {
        var value = $(element.find('.jsvee-value').get(i + 1));
        var name = names[i];
        var variable = JSVEE.utils.ui.createVariable(name);
        variable.append(value.clone());
        instance.append(variable);
      }

      var value = $(area.find('.jsvee-value[data-value="1.0"]').first());
      var name = "tyoaika";
      var variable = JSVEE.utils.ui.createVariable(name);
      variable.append(value.clone());
      instance.append(variable);

      ready(JSVEE.utils.ui.createReference(area, id));
    }

    if (element.hasClass("jsvee-function") && element.data('name') == 'kuvaus') {
      var id = $(element.find('.jsvee-value').get(0)).data('id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      var nimi = instance.find('.jsvee-variable[data-name="nimi"] .jsvee-value').first().attr('data-value');
      var syntynyt = instance.find('.jsvee-variable[data-name="syntynyt"] .jsvee-value').first().attr('data-value');
      var tyoaika = instance.find('.jsvee-variable[data-name="tyoaika"] .jsvee-value').first().attr('data-value');
      var kkpalkka = instance.find('.jsvee-variable[data-name="kkpalkka"] .jsvee-value').first().attr('data-value');
      var kuvaus = nimi + " (s. " + syntynyt + "), palkka " + tyoaika + " * " + kkpalkka + " euroa";
      ready(JSVEE.utils.ui.findOrCreateValue(area, kuvaus, "String"));
    }

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'ikaVuonna') {
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      var syntynyt = parseInt(instance.find('.jsvee-variable[data-name="syntynyt"] .jsvee-value').first().attr(
        'data-value'), 10);
      var vuosi = parseInt($(element.find('.jsvee-value').get(1)).attr('data-value'), 10);
      ready(JSVEE.utils.ui.findOrCreateValue(area, vuosi - syntynyt, "Int"));
    }

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'korotaPalkkaa') {
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      var palkka = parseFloat(instance.find('.jsvee-variable[data-name="kkpalkka"] .jsvee-value').first().attr(
        'data-value'));
      var korotus = parseFloat($(element.find('.jsvee-value').get(1)).attr('data-value'));
      var value = JSVEE.utils.ui.findOrCreateValue(area, palkka * korotus, "Int");
      instance.find('.jsvee-variable[data-name="kkpalkka"] .jsvee-value').first().replaceWith(value.clone());
      ready(value);
    }
  };

  JSVEE.handlers.classes['None'] = function (ready, area, element) {
    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'getOrElse') {
      var val = $(element.find('.jsvee-value').get(1));
      ready(val.clone().removeClass("jsvee-scala-as-code"));
    }
  };

  JSVEE.handlers.classes['radio'] = function (ready, area, element) {
    var pikavalinnat = [ 87900, 94000, 94900, 88600 ];
    var nimet = {};
    nimet[87900] = "YLE 1";
    nimet[94000] = "Radio Suomi";
    nimet[88600] = "Radio Helsinki";
    nimet[94900] = "Radio Rock";
    nimet[106200] = "Radio Nova";
    nimet[91900] = "YleX";

    var nimi = function (taajuus) {
      if (typeof nimet[taajuus] !== "undefined") {
        return nimet[taajuus];
      } else {
        return "kohinaa";
      }
    };

    var kuvaus = function () {
      var taajuus = area.find('.jsvee-class[data-type="radio"] .jsvee-variable[data-name="taajuusKHz"] .jsvee-value')
          .attr('data-value');
      var taajuusF = parseFloat(taajuus);
      return (taajuusF / 1000.0).toFixed(1) + "MHz: " + nimi(taajuus);
    };

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'valitse') {
      var nro = $(element.find('.jsvee-value').get(1)).attr('data-value') - 1;
      var taajuus = area.find('.jsvee-class[data-type="radio"] .jsvee-variable[data-name="taajuusKHz"] .jsvee-value');
      taajuus.text(pikavalinnat[nro]);
      taajuus.attr('data-value', pikavalinnat[nro]);
      JSVEE.utils.ui.findOrCreateValue(area, pikavalinnat[nro], "Int");
      ready(JSVEE.utils.ui.findOrCreateValue(area, kuvaus(), "String").clone());
    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'virita') {
      var nro = $(element.find('.jsvee-value').get(1)).attr('data-value');
      var askel = area.find('.jsvee-class[data-type="radio"] .jsvee-variable[data-name="pykalaKHz"] .jsvee-value')
          .attr('data-value');
      var taajuus = area.find('.jsvee-class[data-type="radio"] .jsvee-variable[data-name="taajuusKHz"] .jsvee-value');
      var uusi = parseInt(taajuus.attr('data-value')) + parseInt(askel) * parseInt(nro);
      taajuus.text(uusi);
      taajuus.attr('data-value', uusi);
      JSVEE.utils.ui.findOrCreateValue(area, uusi, "Int");
      ready(JSVEE.utils.ui.findOrCreateValue(area, kuvaus(), "String").clone());
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

  JSVEE.handlers.classes['Category'] = function (ready, area, element) {

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'Category') {

      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      instance.attr('data-best', '-1');
      instance.attr('data-bestRef', '-1');
      var names = [ "name", "unit" ];

      for ( var i = 0; i < names.length; i++) {
        var value = $(element.find('.jsvee-value').get(i + 1));
        var name = names[i];
        var variable = JSVEE.utils.ui.createVariable(name);
        variable.append(value.clone());
        instance.append(variable);
      }

      ready(JSVEE.utils.ui.createReference(area, id));

    }

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'addExperience') {
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();

      var expId = $(element.find('.jsvee-value').get(1)).data('id');
      var expInstance = area.find('.jsvee-heap .jsvee-instance[data-id="' + expId + '"]').first();

      var other = expInstance.find('.jsvee-variable[data-name="rating"] .jsvee-value').first().attr('data-value');

      if (parseInt(instance.attr('data-best'), 10) < parseInt(other, 10)) {
        instance.attr('data-best', other);
        instance.attr('data-bestRef', expId);
      }

      ready(createUnit());

    }

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'favorite') {
      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();

      var bestRef = instance.attr('data-bestRef');

      ready(JSVEE.utils.ui.createReference(this.area, bestRef));
    }

  };

  JSVEE.handlers.classes['Experience'] = function (ready, area, element) {

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'Experience') {

      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();

      var names = [ "name", "description", "price", "rating" ];

      for ( var i = 0; i < names.length; i++) {
        var value = $(element.find('.jsvee-value').get(i + 1));
        var name = names[i];
        var variable = JSVEE.utils.ui.createVariable(name);
        variable.append(value.clone());
        instance.append(variable);
      }

      ready(JSVEE.utils.ui.createReference(area, id));
    }

  };

  JSVEE.handlers.classes['EnglishAuction'] = function (ready, area, element) {

    if (element.hasClass("jsvee-function") && element.attr('data-name') == 'EnglishAuction') {

      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();

      var names = [ "description", "startingPrice", "duration" ];

      for ( var i = 0; i < names.length; i++) {
        var value = $(element.find('.jsvee-value').get(i + 1));
        var name = names[i];
        var variable = JSVEE.utils.ui.createVariable(name);
        variable.append(value.clone());
        instance.append(variable);
      }

      var value = instance.find('.jsvee-variable[data-name="duration"] .jsvee-value').first();
      var name = "remaining";
      var variable = JSVEE.utils.ui.createVariable(name);
      variable.append(value.clone());
      instance.append(variable);

      ready(JSVEE.utils.ui.createReference(area, id));

    } else if (element.hasClass("jsvee-function") && element.attr('data-name') == 'advanceOneDay') {

      var id = $(element.find('.jsvee-value').get(0)).data('id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      var remaining = instance.find('.jsvee-variable[data-name="remaining"]').first();
      var daysLeft = parseInt(remaining.find('.jsvee-value').first().data('value'), 10);
      var daysLeftAfter = JSVEE.utils.ui.findOrCreateValue(area, daysLeft - 1, "Int");
      remaining.find('.jsvee-value').replaceWith(daysLeftAfter.clone());

      ready(createUnit());
    }
  };

  JSVEE.handlers.classes['AuctionHouse'] = function (ready, area, element) {

    if (element.hasClass("jsvee-function") && element.data('name') == 'AuctionHouse') {

      var id = $(element.find('.jsvee-value').get(0)).attr('data-id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();

      var names = [ "name" ];

      for ( var i = 0; i < names.length; i++) {
        var value = $(element.find('.jsvee-value').get(i + 1));
        var name = names[i];
        var variable = JSVEE.utils.ui.createVariable(name);
        variable.append(value.clone());
        instance.append(variable);
      }

      createArrayBuffer(function (buffer) {

        var variable = JSVEE.utils.ui.createVariable("items");
        variable.appendTo(instance);
        buffer.appendTo(variable);

        ready(JSVEE.utils.ui.createReference(area, id));
      }, area, undefined, "ArrayBuffer");

    }
    if (element.hasClass("jsvee-function") && element.data('name') === 'addItem') {
      var id = $(element.find('.jsvee-value').get(0)).data('id');
      var instance = area.find('.jsvee-heap .jsvee-instance[data-id="' + id + '"]').first();
      var bufferId = instance.find('.jsvee-variable[data-name="items"] .jsvee-value').first().attr('data-id');
      var bufferInstance = area.find('.jsvee-heap .jsvee-instance[data-id="' + bufferId + '"]').first();
      bufferInstance.append($(element.find('.jsvee-value').get(1)).clone());
      ready();
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
    val.attr('title', 'Unit, tyhjä palautusarvo');
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

    var name = op + "-operaattori";

    if (op == '<')
      name = 'vertailuoperaattori';
    else if (op == '>')
      name = 'vertailuoperaattori';
    else if (op == '<=')
      name = 'vertailuoperaattori';
    else if (op == '>=')
      name = 'vertailuoperaattori';
    else if (op == '==')
      name = 'yhtäsuuruusoperaattori';
    else if (op == '!=')
      name = 'erisuuruusoperaattori';
    else if (type == 'Int' || type == 'Double') {
      if (op == '+')
        name = 'yhteenlaskuoperaattori';
      if (op == '-')
        name = 'vähennyslaskuoperaattori';
      if (op == '*')
        name = 'kertolaskuoperaattori';
      if (op == '/')
        name = 'jakolaskuoperaattori';
    } else if (type == 'String' && op == "+")
      name = 'yhdistämisoperaattori';
    else if (type == 'ArrayBuffer' && op == "( )")
      name = 'puskuristapoimimisoperaattori';
    else if (type == 'ArrayBuffer' && op == "( ) =")
      name = 'puskuriinsijoitusoperaattori';
    else if (type == 'ArrayBuffer' && op == "+=")
      name = 'puskuriinlisäysoperaattori';
    else if (type == 'Array' && op == "( )")
      name = 'taulukostapoimimisoperaattori';
    else if (type == 'Array' && op == "( ) =")
      name = 'taulukkoonsijoitusoperaattori';
    else if (type == 'Vector' && op == "( )")
      name = 'vektoristapoimimisoperaattori';
    else if (type == 'Vector' && op == "( ) =")
      name = 'vektoriinsijoitusoperaattori';

    return "Noudetaan " + name;

  };

  JSVEE.handlers.explanations.addReference = function (id) {
    if (this.settings['noIcons']) {
      return 'Noudetaan viittaus tietoon, joka on muistissa kohdassa {0}'.format(id);
    } else {
      var realId = JSVEE.utils.ui.findReference(this.area, id).attr('data-id');
      return 'Noudetaan viittaus olioon, joka on muistissa kohdassa {0}'.format(realId);
    }
  };

  JSVEE.handlers.explanations.evaluateOperator = function (position) {

    var elem = JSVEE.utils.ui.findElement(this.area, position);
    var op = elem.data('name');
    var type = elem.data('class');
    var name = op + "-operaattori";

    if (op == '<')
      name = 'vertailuoperaattori';
    else if (op == '>')
      name = 'vertailuoperaattori';
    else if (op == '<=')
      name = 'vertailuoperaattori';
    else if (op == '>=')
      name = 'vertailuoperaattori';
    else if (op == '==')
      name = 'yhtäsuuruusoperaattori';
    else if (op == '!=')
      name = 'erisuuruusoperaattori';
    else if (type == 'Int' || type == 'Double') {
      if (op == '+')
        name = 'yhteenlaskuoperaattori';
      if (op == '-')
        name = 'vähennyslaskuoperaattori';
      if (op == '*')
        name = 'kertolaskuoperaattori';
      if (op == '/')
        name = 'jakolaskuoperaattori';
    } else if (type == 'String' && op == "+")
      name = 'yhdistämisoperaattori';
    else if (type == 'ArrayBuffer' && op == "( )")
      name = 'puskuristapoimimisoperaattori';
    else if (type == 'ArrayBuffer' && op == "( ) =")
      name = 'puskuriinsijoitusoperaattori';
    else if (type == 'ArrayBuffer' && op == "+=")
      name = 'puskuriinlisäysoperaattori';
    else if (type == 'Array' && op == "( )")
      name = 'taulukostapoimimisoperaattori';
    else if (type == 'Array' && op == "( ) =")
      name = 'taulukkoonsijoitusoperaattori';
    else if (type == 'Vector' && op == "( )")
      name = 'vektoristapoimimisoperaattori';
    else if (type == 'Vector' && op == "( ) =")
      name = 'vektoriinsijoitusoperaattori';


    return "Suoritetaan " + name;
  };

  JSVEE.handlers.explanations.addFunction = function (name, position, params, className) {

    var noFunctionTerm = this.animationId == 'println' || this.animationId == 'bufferRef1'
        || this.animationId == 'bufferRef2' || this.animationId == 'bufferRef3';

    if (typeof name === "undefined") {
      return "Noudetaan funktio";
    } else {
      if (noFunctionTerm) {
        if (className !== undefined && name == className
            && this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0) {
          return "Noudetaan " + name + "-luomiskäsky";
        } else {
          return "Noudetaan käsky " + name;
        }
      } else {

        if (className !== undefined) {

          if (className === "?") {
            className = JSVEE.utils.ui.findElement(this.area, position, true).data('type');
          }

          if (name == className
              && (this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0)
              || name == "Some") {
            return "Noudetaan " + name + "-luomiskäsky";
          } else if (name == className) {
            return "Noudetaan " + name + "-luokan konstruktori";
          } else if (this.area.find(
            '.jsvee-classes .jsvee-class[data-name="' + className + '"] .jsvee-function[data-name="' + name + '"]')
              .attr('data-static') === "true") {
            return "Noudetaan funktio " + name;
          } else {
            return "Noudetaan metodi " + name;
          }
        } else {
          return "Noudetaan funktio " + name;
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
          return "Suoritetaan " + name + "-luomiskäsky";
        } else {
          return "Suoritetaan käsky " + name;
        }
      } else {

        if (className !== undefined) {
          if (name == className
              && (this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0)
              || name == "Some") {
            return "Suoritetaan " + name + "-luomiskäsky";
          } else if (name == className) {
            return "Suoritetaan " + name + "-luokan konstruktori";
          } else if (this.area.find(
            '.jsvee-classes .jsvee-class[data-name="' + className + '"] .jsvee-function[data-name="' + name + '"]')
              .attr('data-static') === "true") {
            return "Suoritetaan funktio " + name;
          } else {
            return "Suoritetaan metodi " + name;
          }
        } else {
          return "Suoritetaan funktio " + name;
        }

      }
    } else {
      if (typeof func.data('name') !== "undefined") {

        var className = func.attr('data-class');
        var name = func.data('name');
        if (className !== undefined) {
          if (name == className
              && this.area.find('.jsvee-class.jsvee-instance .jsvee-function[data-name="' + name + '"]').length > 0) {
            return "Aloitetaan " + name + "-luomiskäskyn suoritus";
          } else if (name == className) {
            return "Aloitetaan " + name + "-luokan konstruktorin suoritus";
          } else if (this.area.find(
            '.jsvee-classes .jsvee-class[data-name="' + className + '"] .jsvee-function[data-name="' + name + '"]')
              .attr('data-static') === "true") {
            return "Aloitetaan funktion " + name + " suoritus";
          } else {
            return "Aloitetaan metodin " + name + " suoritus";
          }
        } else {
          return "Aloitetaan funktion " + name + " suoritus";
        }

      } else {
        return "Aloitetaan funktion suoritus";
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

    c.attr('title', "Pakkausolio " + name);
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

    c.attr('title', "Piirreluokka " + name);
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
    val.attr('title', 'Evaluoimaton parametriarvo');
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
    return "Luodaan funktioliteraali";
  };

  JSVEE.registerAction('createFunctionLiteral', JSVEE.handlers.actions.createFunctionLiteral);

  var modifyUI = function () {

    if (this.settings.hasOwnProperty('noIcons')) {
      this.area.find('.jsvee-class').each(function () {
        var elem = $(this);
        elem.attr('title', 'Tyypin ' + elem.data('name') + ' määrittely');
      });

      this.area.find('.jsvee-function').each(function () {
        var elem = $(this);
        elem.attr('title', 'Funktion ' + elem.data('name') + " määrittely");
      });

      this.area.find('.jsvee-function[data-name="println"]').attr('title', 'println-aliohjelman määrittely');
      this.area.find('.jsvee-function[data-name="Buffer"]').attr('title', 'Puskurin luomiskäskyn määrittely');

      this.area.find('.jsvee-instance[data-type="String"]').each(function () {
        var elem = $(this);
        elem.attr('title', 'Merkkijono, joka on muistissa kohdassa ' + elem.data('id'));
      });

      this.area.find('.jsvee-instance[data-type="ArrayBuffer"]').each(function () {
        var elem = $(this);
        elem.attr('title', 'Puskuri, joka on muistissa kohdassa ' + elem.data('id'));
      });

    } else {

      this.area.find('.jsvee-class .jsvee-function').each(function () {
        var elem = $(this);
        if (elem.data('name') == elem.data('class'))
          elem.attr('title', elem.data('name') + "-luokan konstruktorin määrittely");
        else
          elem.attr('title', "Metodin " + elem.data('name') + " määrittely");
      });

      this.area.find('.jsvee-class.jsvee-instance .jsvee-function').each(function () {
        var elem = $(this);
        if (elem.data('name') == elem.data('class'))
          elem.attr('title', elem.data('name') + "-luomiskäsky");
      });

    }

    this.area.find('.jsvee-operator').each(function () {
      var elem = $(this);

      if (elem.data('name') == '>')
        elem.attr('title', 'Vertailuoperaattori');
      else if (elem.data('name') == '<')
        elem.attr('title', 'Vertailuoperaattori');
      else if (elem.data('name') == '>=')
        elem.attr('title', 'Vertailuoperaattori');
      else if (elem.data('name') == '<=')
        elem.attr('title', 'Vertailuoperaattori');
      else if (elem.data('name') == '==')
        elem.attr('title', 'Yhtäsuuruusoperaattori');
      else if (elem.data('name') == '!=')
        elem.attr('title', 'Erisuuruusoperaattori');
      else if (elem.data('class') == 'Int' || elem.data('class') == 'Double') {
        if (elem.data('name') == '+')
          elem.attr('title', 'Yhteenlaskuoperaattori');
        if (elem.data('name') == '-')
          elem.attr('title', 'Vähennyslaskuoperaattori');
        if (elem.data('name') == '*')
          elem.attr('title', 'Kertolaskuoperaattori');
        if (elem.data('name') == '/')
          elem.attr('title', 'Jakolaskuoperaattori');
      } else if (elem.data('class') == 'String' && elem.data('name') == "+")
        elem.attr('title', 'Yhdistämisoperaattori');
      else if (elem.data('class') == 'String' && elem.data('name') == "+")
        elem.attr('title', 'Yhtäsuuruusoperaattori');
      else if (elem.data('class') == 'ArrayBuffer' && elem.data('name') == "( )")
        elem.attr('title', 'Puskuristapoimimisoperaattori');
      else if (elem.data('class') == 'ArrayBuffer' && elem.data('name') == "( ) =")
        elem.attr('title', 'Puskuriinsijoitusoperaattori');
      else if (elem.data('class') == 'Array' && elem.data('name') == "( )")
        elem.attr('title', 'Taulukostapoimimisoperaattori');
      else if (elem.data('class') == 'Array' && elem.data('name') == "( ) =")
        elem.attr('title', 'Taulukkoonsijoitusoperaattori');
      else if (elem.data('class') == 'ArrayBuffer' && elem.data('name') == "+=")
        elem.attr('title', 'Puskuriinlisäysoperaattori');
      else if (elem.data('class') == 'Vector' && elem.data('name') == "( )")
        elem.attr('title', 'Vektoristapoimimisoperaattori');
      else if (elem.data('class') == 'Vector' && elem.data('name') == "( ) =")
        elem.attr('title', 'Vektoriinsijoitusoperaattori');
    });

    var frames = this.area.find('.jsvee-stack-frame');

    if (this.area.find('.jsvee-code-table').length == 0)
      return;

    frames.each(function (index, element) {
      var frame = $(this);
      if (frames.length == 1) {
        frame.find('.jsvee-area-label')
            .text(
              'Kehys'
                  + (frame.attr('data-line') === undefined ? '' : ', suoritus käynnissä rivillä '
                      + frame.attr('data-line')));
      } else if (index == frames.length - 1) {
        frame.find('.jsvee-area-label').text(
          'Kehys, suoritus kesken'
              + (frame.attr('data-line') === undefined ? '' : ' rivillä ' + frame.attr('data-line')));
      } else if (index == 0) {
        var func = frame.next('.jsvee-stack-frame').find('.jsvee-function.jsvee-active').first().attr('data-name');
        if (func === undefined)
          func = "nimetön funktio";
        if (frame.attr('data-line') !== undefined) {
          frame.find('.jsvee-area-label').text(
            'Kehys ('
                + func
                + ')'
                + (frame.attr('data-line') === undefined ? '' : ', suoritus käynnissä rivillä '
                    + frame.attr('data-line')));
        } else {
          frame.find('.jsvee-area-label').text('Kehys (' + func + ')');
        }
      } else {
        var func = frame.next('.jsvee-stack-frame').find('.jsvee-function.jsvee-active').first().attr('data-name');
        if (func === undefined)
          func = "nimetön funktio";
        if (frame.attr('data-line') !== undefined) {
          frame.find('.jsvee-area-label').text(
            'Kehys (' + func + '), suoritus kesken'
                + (frame.attr('data-line') === undefined ? '' : ' rivillä ' + frame.attr('data-line')));
        } else {
          frame.find('.jsvee-area-label').text('Kehys (' + func + '), suoritus kesken');
        }
      }

    });
  };

  JSVEE.afterEachStep(false, modifyUI);

}(jQuery));
