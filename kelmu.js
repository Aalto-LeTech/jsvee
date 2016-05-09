(function($) {

  $(function() {

    'use strict';

    if (window.JSVEE === undefined) {
      return;
    }

    var runToLineActive = false;

    var annotations = window.kelmu;
    if (annotations) {
      JSVEE.afterInitialization(function() {
        var self = this;
        annotations.registerCallback(self.animationId,
          function(action, parameter) {
            if (action === 'skip') {
              JSVEE.utils.ui.setStatusText(self.area, 'Moving forward');
              self.state.stepsToRun = +parameter;
              self.state.animationsDisabled = true;
              self.state.reEnableAnimations = true;
            } else if (action === 'runToLine') {
              JSVEE.utils.ui.setStatusText(self.area, 'Moving forward');
              self.state.runToLine = +parameter;
              self.state.reEnableAnimations = true;
              runToLineActive = true;
              self.makeStep();
            } else if (action === 'skipToLine') {
              JSVEE.utils.ui.setStatusText(self.area, 'Moving forward');
              self.state.runToLine = +parameter;
              self.state.reEnableAnimations = true;
              self.state.animationsDisabled = true;
              runToLineActive = true;
              self.makeStep();
            } else if (action === 'hideControls') {
              self.area.find('.jsvee-controls-area').hide();
            } else if (action === 'showSequence') {
              self.disableStateSave = true;
            } else if (action === 'showControls') {
              self.area.find('.jsvee-controls-area').show();
            } else if (action === 'getCapabilities') {
              annotations.sendMessage(self.animationId, 'animationCapabilities', null, ['animationReady']);
            } else if (action === 'getAnimationLength') {
              annotations.sendMessage(self.animationId, 'animationLength', self.animationLength);
            } else if (action === 'getButtonDefinitions') {
              annotations.sendMessage(self.animationId, 'buttonDefinitions', null, {
                'step': '.jsvee-step',
                'redo': '.jsvee-redo',
                'undo': '.jsvee-undo',
                'begin': '.jsvee-begin'
              });
            } else if (action === 'postponeEnd') {
              var statusArea = self.area.find('.jsvee-status-area');
              statusArea.text(statusArea.text()
                .substring(0, statusArea.text().indexOf(JSVEE.messages.animationEnded())));
            } else if (action === 'lastSubstepShown') {
              var statusArea = self.area.find('.jsvee-status-area');
              statusArea.text(statusArea.text() + JSVEE.messages.animationEnded());
            } else if (action === 'getCurrentStep') {
              annotations.sendMessage(self.animationId, 'currentStep', (self.initSkippedSteps || 0) + self.state.stepNumberAll);
            } else if (action === 'getCurrentLine') {
              annotations.sendMessage(self.animationId, 'currentLine', self.area.find('.jsvee-code-area').attr(
                'data-line'));
            }
          });
      });

      JSVEE.afterEachStep(true, function(instr) {

        if (!this.actionsRunning && runToLineActive) {
          annotations.sendMessage(this.animationId, 'currentStep', (this.initSkippedSteps || 0) + this.state.stepNumberAll);
        }

        if (!this.actionsRunning || !this.state.animationsDisabled) {
          annotations.sendMessage(this.animationId, 'animationReady');
        }

        if (this.hasEnded()) {
          annotations.sendMessage(this.animationId, 'animationEnded');
        }

      });

    }

  });

})(jQuery);
