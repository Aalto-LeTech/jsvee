(function($) {
  'use strict';

  if (window.JSVEE === undefined) {
    return;
  }

  JSVEE.animations = {};

  /**
   * Returns the requested animation.
   *
   * @param id The unique id of the animation
   * @memberOf JSVEE.animations
   */
  JSVEE.animations.getAnimation = function(id) {

    if (JSVEE.animations.hasOwnProperty(id)) {
      return JSVEE.animations[id];
    }

    return null;

  };

  JSVEE.animations['hello'] = {
    'lines': ['print(\"Hello world!\")'],
    'settings': { 'code': 'left', 'heapHeight': 0, 'stackHeight': 150, 'width': 800 },
    'init': [['createFrame'], ['setLine', '1'], ['createFunction', 'print', 'print(value)', '1', '-1']],
    'steps': [['goto', '@l0'], ['_label', 'l0'], ['addFunction', 'print', '0', '1'],
        ['addValue', 'Hello world!', '0/0/0', 'str'], ['evaluateFunction', '0']]

  };

  $(function() {
    // Create animations
    $('.jsvee-animation').each(function() {
      var id = $(this).attr('data-id');
      if (id) {
        new JSVEE.ui(id, this);
      }
    });
  });

}(jQuery));
