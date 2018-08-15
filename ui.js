(function($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  }

  /**
   * Constructs the UI.
   *
   * @constructor
   * @param id
   * @param area
   * @param settings
   */
  JSVEE.ui = function(id, area, settings) {

    this.animation = $.extend(true, {}, JSVEE.animations.getAnimation(id));
    if ($.isEmptyObject(this.animation)) {
      console.log("JSVEE warning: animation '" + id + "' was not found!");
      return;
    }

    var defaultSettings = {
      'code': 'top',
      'console': true,
      'controls': true,
      'stackHeight': 100,
      'rightPanelsWidth': 150,
      'heapHeight': 80,
      'width': 850,
      'codeWidth': 'auto',
      'classesLeft': false,
      'consoleBelowHeap': false,
      'consoleLeft': false
    };
    this.settings = $.extend(true, defaultSettings, settings, this.animation.settings);

    this.area = $(area);
    this.engine = new JSVEE(this.area, this.settings);
    this.engine.ui = this;
    this.engine.animationId = id;

    this.createLayout();
    this.initializeEngine();

    if (this.animation.description) {
      var descr = $('<div></div>').html(this.animation.description);
      this.area.before(descr);
      descr.after($('<hr>'));
    }

    /*
     * JSVEE.beforeEachInstruction(function (instr) { return; // nop });
     *
     * JSVEE.beforeEachStep(function () { return; // nop });
     *
     * JSVEE.afterEachInstruction(function (instr) { return; // nop });
     */

    this.updateButtons();
    this.updateInfo();

  };

  JSVEE.afterEachStep(false, function(instr) {

    // Don't resize the stack if there is a sequence of steps running
    if (!this.actionsRunning || !this.state.animationsDisabled) {
      JSVEE.utils.ui.resizeStack(this.area);
      this.ui.updateInfo();
    }

  });

  JSVEE.afterEachStep(true, function(instr) {

    if (!this.actionsRunning) {
      this.ui.updateButtons();
    }

    if (this.hasEnded()) {
      JSVEE.utils.ui.appendToStatus(this.area, ' ' + JSVEE.messages.animationEnded());
    }

  });

  /**
   * Creates the layout for the animations.
   */
  JSVEE.ui.prototype.createLayout = function() {

    this.area.css('position', 'relative');

    var animationArea = $('<div></div>').addClass('jsvee-animation-area');
    animationArea.css('width', this.settings.width + 'px');
    animationArea.appendTo(this.area);
    var extraSpace = animationArea.outerWidth(true) - animationArea.width();
    animationArea.css('width', (+this.settings.width - extraSpace) + 'px');
    this.area.css('width', animationArea.outerWidth(true) + 'px');

    if (this.settings.small === true) {
      this.area.addClass('jsvee-small');
    }

    this.engine.addUndoableElement('.jsvee-animation-area');
    this.engine.addUndoableElement('.jsvee-info-area');

    this.createStatusArea();
    this.createControls();
    this.createCodeArea();
    var memoryArea = this.createMemoryArea();

    var infoArea = $('<div></div>').addClass('jsvee-info-area');
    infoArea.hide();
    infoArea.appendTo(this.area);

    if (this.settings.console) {
      var console = $('<div></div>').addClass('jsvee-console');
      console.attr('data-title', JSVEE.messages.consoleTitle());
      console.appendTo(memoryArea);

      var heap = this.area.find('.jsvee-heap');
      
      if (this.settings.consoleBelowHeap === true) {
        heap.css('position', 'relative');
        console.css('position', 'absolute');
        console.css('bottom', 0);
        console.css('width', (heap.width() - (console.outerWidth(true) - console.width())) + 'px');
        console.appendTo(heap);
      }

      if (this.settings.consoleLeft === true) {
        heap = this.area.find('.jsvee-heap');
        console.appendTo(heap.parent());
      }

      if (this.settings.consoleFull) {
        memoryArea.after(console);
      }

    }

    // Highlight the actual instance of an reference and
    // draw an arrow between the reference and the instance
    var that = this;
    this.area.on('mouseenter', '.jsvee-ref', function() {
      var elem = that.area.find('.jsvee-instance[data-id="' + $(this).data('id') + '"]');
      elem.addClass('jsvee-highlight');
      var arrow = JSVEE.utils.ui.drawArrow(that.area, $(this), elem);
      arrow.appendTo(that.area);
    });

    // Remove the highlight and the arrow
    this.area.on('mouseleave', '.jsvee-ref', function() {
      that.area.find('.jsvee-instance[data-id="' + $(this).data('id') + '"]').removeClass('jsvee-highlight');
      that.area.find('.jsvee-ref[data-id="' + $(this).data('id') + '"]').removeClass('jsvee-highlight');
      that.area.find('.jsvee-ref-arrow').remove();
    });

  };

  /**
   * Runs all the initialization instructions.
   */
  JSVEE.ui.prototype.initializeEngine = function() {

    var that = this;
    $.each(this.animation.init, function() {
      var name = this[0];
      this.shift();
      that.engine[name].apply(that.engine, this);
    });

    $.each(this.animation.steps, function() {
      that.engine.addStep(this);
    });

    if (this.area.attr('data-jsvee-startline')) {
      var r = 0;
      that.engine.initSkippedSteps = 0;
      while (r < 200 && !this.engine.hasEnded() && +this.area.find('.jsvee-code-area').attr('data-line') != +this.area.attr('data-jsvee-startline')) {
        that.engine.makeStep();
        that.engine.initSkippedSteps++;
        r++;
      }
    }

    JSVEE.utils.ui.resizeStack(this.area);

    if (JSVEE.ui.finishLayout) {
      JSVEE.ui.finishLayout.call(this);
    }

    this.engine.initReady();

  };

  /**
   * Creates the controls to the control area.
   */
  JSVEE.ui.prototype.createControls = function() {

    if (!this.settings.controls) {
      return;
    }

    var that = this;

    var controls = $('<div></div>').addClass('jsvee-controls-area');
    controls.appendTo(this.area);

    // Empty divs are for the icons, images are in CSS

    var beginButton = $('<button></button>').addClass('jsvee-button jsvee-btn jsvee-begin').attr('title',
      JSVEE.messages.beginButton());
    $('<div></div>').appendTo(beginButton);
    beginButton.appendTo(controls);
    beginButton.click(function(e) {

      e.preventDefault();
      that.engine.toBegin();
      that.updateButtons();
      JSVEE.utils.ui.setStatusText(that.area, JSVEE.messages.begin());

    });

    var prevButton = $('<button></button>').addClass('jsvee-button jsvee-btn jsvee-undo').attr('title',
      JSVEE.messages.prevButton());
    $('<div></div>').appendTo(prevButton);
    prevButton.appendTo(controls);
    prevButton.click(function(e) {

      e.preventDefault();
      that.engine.undo();
      that.updateButtons();
      JSVEE.utils.ui.setStatusText(that.area, JSVEE.messages.undo());

    });

    var stepButton = $('<button></button>').addClass('jsvee-button jsvee-btn jsvee-step').attr('title',
      JSVEE.messages.stepButton());
    $('<div></div>').appendTo(stepButton);
    stepButton.appendTo(controls);
    stepButton.click(function(e) {

      e.preventDefault();
      that.area.find('.jsvee-controls-area button').attr('disabled', 'disabled');
      that.engine.makeStep();

    });

    var forwardButton = $('<button></button>').addClass('jsvee-button jsvee-btn jsvee-redo').attr('title',
      JSVEE.messages.redoButton());
    $('<div></div>').appendTo(forwardButton);
    forwardButton.appendTo(controls);
    forwardButton.click(function(e) {

      e.preventDefault();
      that.engine.redo();
      that.updateButtons();
      JSVEE.utils.ui.setStatusText(that.area, JSVEE.messages.redo());

    });

    return controls;

  };

  /**
   * Creates the element for the status area.
   */
  JSVEE.ui.prototype.createStatusArea = function() {

    var status = $('<div>&nbsp;</div>').addClass('jsvee-status-area');
    status.appendTo(this.area);

  };

  /**
   * Creates the memory area containing the heap, the stack and the panels on
   * the right (classes, functions and operators).
   */
  JSVEE.ui.prototype.createMemoryArea = function() {

    var animationArea = this.area.find('.jsvee-animation-area');
    var codeArea = this.area.find('.jsvee-code-area');

    var secondColumn = null;

    if (this.settings.twoColumns) {
      secondColumn = $('<div></div>').css('float', 'right');
      codeArea.after(secondColumn);
      codeArea.css('float', 'left');
    }

    var memoryArea = $('<div></div>').addClass('jsvee-memory-area');
    memoryArea.appendTo(animationArea);

    if (this.settings.code === 'left') {
      memoryArea.css('display', 'inline-block');
    }

    var heap = $('<div></div>').addClass('jsvee-heap');
    heap.attr('data-id-counter', 1);
    var heapWidth = 0;
    if (this.settings.twoColumns) {
      heapWidth = animationArea.width() - codeArea.outerWidth(true) - 20;
    } else if (this.settings.code === 'left') {
      heap.appendTo(memoryArea);
      heapWidth = animationArea.width() - codeArea.outerWidth(true) - (heap.outerWidth(true) - heap.width()) - 20;
    } else if (this.settings.code === 'top' || this.settings.code === 'none') {
      heap.appendTo(memoryArea);
      heapWidth = animationArea.width() - (heap.outerWidth(true) - heap.width()) - 20;
    } else if (this.settings.code === 'top-left') {
      codeArea.css('float', 'left');
      heap.css('float', 'right');
      memoryArea.css('clear', 'both');
      codeArea.after(heap);
      heapWidth = animationArea.width() - codeArea.outerWidth(true) - (heap.outerWidth(true) - heap.width()) - 20;
    }

    heap.css('width', heapWidth + 'px');
    heap.css('min-height', this.settings.heapHeight + 'px');

    var literals = $('<div></div>').addClass('jsvee-literals');
    literals.attr('title', JSVEE.messages.literalsTitle());
    literals.text(JSVEE.messages.literals());

    var stackAndRight = $('<div></div>').addClass('jsvee-stack-and-right').appendTo(memoryArea);

    var stack = $('<div></div>').addClass('jsvee-stack').appendTo(stackAndRight);
    stack.attr('title', JSVEE.messages.stackTitle());
    stack.css('min-height', this.settings.stackHeight + 'px');
    $('<div></div>').addClass('jsvee-area-label').text(JSVEE.messages.stack()).appendTo(stack);
    $('<div></div>').addClass('jsvee-stack-filler').appendTo(stack);

    var rightPanels = $('<div></div>').addClass('jsvee-right-panels').appendTo(stackAndRight);
    rightPanels.css('width', this.settings.rightPanelsWidth + 'px');

    if (this.settings.heapHeight === 0) {
      literals.appendTo(rightPanels);
      heap.css('padding', '0');
    } else {
      literals.appendTo(heap);
    }

    if (this.settings.twoColumns) {
      heap.appendTo(secondColumn);
    }

    $('<div></div>').addClass('jsvee-classes').appendTo(rightPanels);
    $('<div></div>').addClass('jsvee-functions').appendTo(rightPanels);
    $('<div></div>').addClass('jsvee-operators').appendTo(rightPanels);

    var stackWidth = heap.outerWidth(true) - rightPanels.outerWidth(true) - (stack.outerWidth(true) - stack.width());

    if (this.settings.twoColumns) {
      stackWidth = codeArea.width() - (stack.outerWidth(true) - stack.width() - 5);
    } else if (this.settings.code === 'top-left') {
      stackWidth = animationArea.width() - rightPanels.outerWidth(true) - (stack.outerWidth(true) - stack.width());
    } else if (this.settings.code === 'aboveHeapAndPanels') {
      var contentPanel = $('<div></div>');
      contentPanel.css('display', 'inline-block');
      contentPanel.css('float', 'left');
      contentPanel.css('vertical-align', 'top');
      contentPanel.css('margin-right', '10px');
      memoryArea.css('display', 'inline-block');
      memoryArea.css('float', 'left');
      rightPanels.css('float', 'left');
      literals.css('float', 'right');
      heap.css('float', 'left');
      codeArea.appendTo(contentPanel);
      rightPanels.appendTo(contentPanel);
      heap.appendTo(contentPanel);
      contentPanel.prependTo(animationArea);
      $('<div style="height: 1px; clear: both;">&nbsp;</div>').appendTo(animationArea);
      stackWidth = animationArea.width() - contentPanel.outerWidth(true) - (stack.outerWidth(true) - stack.width());
      heapWidth = contentPanel.width() - rightPanels.outerWidth(true) - (heap.outerWidth(true) - heap.width()) - 20;
      heap.css('width', heapWidth + 'px');
    }

    if (this.settings.classesLeft === true) {
      stack.before(rightPanels);
      rightPanels.css('margin-right', rightPanels.css('margin-left'));
      rightPanels.css('margin-left', 0);
    }

    if (this.settings.literals === "left") {
      literals.css('float', 'left');
      literals.css('margin-bottom', '10px');
      literals.after($('<div></div>').css('clear', 'both'));
    }

    if (this.settings.literals === "right") {
      literals.css('float', 'right');
    }

    stack.css('width', stackWidth + 'px');

    if (this.settings.twoColumns) {
      rightPanels.appendTo(secondColumn);
    }

    return memoryArea;

  };

  /**
   * Generates the view for program code.
   */
  JSVEE.ui.prototype.createCodeArea = function() {

    var codeArea = $('<div></div>').addClass('jsvee-code-area');
    codeArea.appendTo(this.area.find('.jsvee-animation-area'));

    var codeTable = $('<table></table>').addClass('jsvee-code-table');
    codeTable.appendTo(codeArea);

    var lines = this.animation.lines;
    var lineNumber = 1;

    if (lines) {
      $.each(lines, function(i, val) {

        var row = $('<tr></tr>');
        var col1 = $('<td></td>').text(lineNumber++).addClass('jsvee-gutter');
        var col2 = $('<td></td>').attr('data-text', val).addClass('jsvee-code-line');

        $('<span></span>').text(val.length > 0 ? val : ' ').appendTo(col2);
        col1.appendTo(row);
        col2.appendTo(row);
        row.appendTo(codeTable);

      });

    }

    if (this.settings.code === 'left') {
      codeArea.addClass('jsvee-code-left');
      codeTable.css('margin-bottom', '0');
      codeArea.css('vertical-align', 'top');
    }

    if (this.settings.codeWidth !== 'auto') {
      codeArea.css('width', this.settings.codeWidth + 'px');
      codeArea.css('overflow', 'auto');
    }

    if (this.settings.code === 'none') {
      codeArea.css('display', 'none');
    }

    return codeArea;

  };

  /**
   * Update the state of the buttons.
   */
  JSVEE.ui.prototype.updateButtons = function() {

    var beginButton = this.area.find('.jsvee-button.jsvee-begin');
    var undoButton = this.area.find('.jsvee-button.jsvee-undo');
    var stepButton = this.area.find('.jsvee-button.jsvee-step');
    var redoButton = this.area.find('.jsvee-button.jsvee-redo');

    if (this.engine.canUndo()) {
      beginButton.removeAttr('disabled');
      undoButton.removeAttr('disabled');
    } else {
      beginButton.attr('disabled', 'disabled');
      undoButton.attr('disabled', 'disabled');
    }

    if (this.engine.canRedo()) {
      redoButton.removeAttr('disabled');
    } else {
      redoButton.attr('disabled', 'disabled');
    }

    if (!this.engine.hasEnded() && !this.engine.actionsRunning) {
      stepButton.removeAttr('disabled');
    } else {
      stepButton.attr('disabled', 'disabled');
    }

  };

  /**
   * Updates the possible explanation texts.
   */
  JSVEE.ui.prototype.updateInfo = function() {

    var currentLine = 'line' + this.area.find('.jsvee-code-area').attr('data-line');
    var infoArea = this.area.find('.jsvee-info-area');

    // Remove previous info after the line has changed
    if (infoArea.attr('data-info') && infoArea.attr('data-info') !== currentLine) {
      JSVEE.utils.ui.hideInfo(this.area);
      infoArea.removeAttr('data-info');
    }

    // Show explanation text for this line, if exists
    if (this.animation.explanations && this.animation.explanations.hasOwnProperty(currentLine)) {
      JSVEE.utils.ui.showInfoText(this.area, this.animation.explanations[currentLine]);
      infoArea.attr('data-info', currentLine);
    }

  };

}(jQuery));
