(function() {
  var PI, TAU, cm, compileSource, examples, history, historySize, render, scale, update, updateClosure;

  history = [];

  historySize = 300;

  updateClosure = null;

  cm = null;

  window.min = 0;

  window.max = 0;

  PI = Math.PI;

  TAU = Math.PI * 2;

  examples = {
    silly: "c = Math.cos(time)\np = Math.pow(c, 2)\nMath.sin(p * TAU)",
    sin: "Math.sin(time * TAU)",
    square: "Math.round(time * 5) % 2",
    triangle: "Math.abs((time % 2) - 1)",
    jitter: "Math.random()",
    state: "window.x ?= 0\nif (window.x < 0.01)\n\twindow.x = 1\nelse\n\twindow.x *= 0.9\n1 - window.x",
    clear: ""
  };

  scale = function(input, inputMin, inputMax, outputMin, outputMax) {
    if (inputMax === inputMin) {
      return outputMin;
    } else {
      input -= inputMin;
      input /= inputMax - inputMin;
      input *= outputMax - outputMin;
      input += outputMin;
      return input;
    }
  };

  compileSource = function(editor) {
    var error, location, message, results, source;
    source = editor.getValue();
    window.localStorage["source"] = source;
    results = $('#repl_results');
    window.compiledJS = '';
    try {
      window.compiledJS = CoffeeScript.compile(source, {
        bare: true
      });
      return results.text("");
    } catch (error) {
      location = error.location, message = error.message;
      if (location != null) {
        message = "Error on line " + (location.first_line + 1) + ": " + message;
      }
      return results.text(message).addClass('error');
    }
  };

  ready(function() {
    var canvas, context, firstTick;
    canvas = document.querySelector("canvas");
    context = canvas.getContext("2d");
    CodeMirror.defaults.lineNumbers = true;
    CodeMirror.defaults.tabSize = 2;
    CodeMirror.defaults.historyEventDelay = 200;
    CodeMirror.defaults.viewportMargin = Infinity;
    CodeMirror.defaults.extraKeys = {
      Tab: false,
      "Shift-Tab": false,
      "Cmd-Enter": function() {
        return render(true);
      }
    };
    cm = CodeMirror.fromTextArea($("textarea")[0], {
      mode: 'coffeescript'
    });
    cm.on("changes", function(editor, change) {
      return compileSource(editor);
    });
    $("button").click(function(e) {
      cm.setValue(examples[$(e.target).attr("wtf-type")]);
      return compileSource(cm);
    });
    if (window.localStorage["source"] != null) {
      cm.setValue(window.localStorage["source"]);
    } else {
      cm.setValue(examples.silly);
    }
    compileSource(cm);
    updateClosure = function(t) {
      return update(canvas, t);
    };
    firstTick = function(t) {
      window.time = t / 1000;
      return requestAnimationFrame(updateClosure);
    };
    return requestAnimationFrame(firstTick);
  });

  update = function(canvas, t) {
    var c, e, j, len, ref, v;
    window.dT = t / 1000 - window.time;
    window.time = t / 1000;
    ref = $("table tr [value]");
    for (j = 0, len = ref.length; j < len; j++) {
      c = ref[j];
      e = $(c);
      v = e.attr("value");
      e.text(Math.round(window[v] * 1000) / 1000);
    }
    try {
      window.value = eval(window.compiledJS);
      if (window.value != null) {
        history.unshift(window.value);
        if (history.length > historySize) {
          history.pop();
        }
      }
      render(canvas);
    } catch (undefined) {}
    return requestAnimationFrame(updateClosure);
  };

  render = function(canvas) {
    var context, cx, cy, height, i, j, k, len, len1, v, width, x, y;
    context = canvas.getContext("2d");
    width = canvas.width = parseInt(canvas.offsetWidth);
    height = canvas.height = parseInt(canvas.offsetHeight);
    cx = width / 2;
    cy = height / 2;
    context.beginPath();
    context.lineWidth = 2;
    window.min = 0;
    window.max = 0;
    for (i = j = 0, len = history.length; j < len; i = ++j) {
      v = history[i];
      if (v > window.max) {
        window.max = v;
      }
      if (v < window.min) {
        window.min = v;
      }
    }
    for (i = k = 0, len1 = history.length; k < len1; i = ++k) {
      v = history[i];
      x = i / (historySize - 1) * width;
      y = scale(v, window.min, window.max, height, 0);
      if (i === 0) {
        context.arc(x, y, 6, 0, TAU);
        context.fill();
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    return context.stroke();
  };

}).call(this);
