(function() {
  var TAU, _cm, _history, _historySize, _updateClosure, compileSource, examples, render, scale, update;

  _history = [];

  _historySize = 300;

  _updateClosure = null;

  _cm = null;

  this._min = 0;

  this._max = 0;

  this.log = function(x) {
    console.log(x);
    return x;
  };

  TAU = Math.PI * 2;

  examples = {
    sin: "frequency = 1 # Cycles per second\nMath.sin(time * frequency * TAU)",
    saw: "time % 1\n# The '1' isn't cycles-per-second — what is it?\n# When you change the mod, what happens to the max? Why?\n# What can you do to adjust the mod while keeping the output range between 0 and 1?",
    square: "Math.round(time % 1)\n# The '1' isn't cycles-per-second OR seconds-per-cycle — what is it?\n# When you change the mod, what happens to the rhythm?\n# What can you do to make a more uniform rhythm?",
    triangle: "Math.abs((time % 1 * 2) - 1)\n# This one is more complex. There's a simpler version with half the frequency:\n# Math.abs((time % 2) - 1)",
    silly: "c = Math.cos(time)\np = Math.pow(c, 3)\nMath.sin(p * TAU)\n# Playing with simple trig and pow can produce some fun results\n# What happens if you make the '3' a negative, or a decimal?\n# Watch the 'value' in the chart below",
    chaotic: "# Emergent complexity, much?\nc = Math.cos(time)\np = Math.pow(c, Math.round(2 * time % 3))\nMath.sin(p * TAU)",
    state: "# To put a variable on the window, use the @ sign\n# You should initialize your variables with ?= to avoid null/NaN issues\n@x ?= 0\nif (@x < 0.01)\n\t@x = 1\nelse\n\t@x *= 0.9\n@x",
    random: "Math.random() # Yes, you can access standard functions",
    dT: "dT # Try this in Chrome VS Safari VS IE",
    log: "log(dT) # This is a special pass-through logging function — check your browser inspector!"
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
    this.localStorage["source"] = source;
    results = $('#repl_results');
    this.compiledJS = '';
    try {
      this.compiledJS = CoffeeScript.compile(source, {
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
    _cm = CodeMirror.fromTextArea($("textarea")[0], {
      mode: 'coffeescript'
    });
    _cm.on("changes", function(editor, change) {
      return compileSource(editor);
    });
    $("button[wtf-type]").click(function(e) {
      _history = [];
      _cm.setValue(examples[$(e.target).attr("wtf-type")]);
      return compileSource(_cm);
    });
    if (this.localStorage["source"] != null) {
      _cm.setValue(this.localStorage["source"]);
    } else {
      _cm.setValue(examples.sin);
    }
    compileSource(_cm);
    _updateClosure = function(t) {
      return update(canvas, t);
    };
    firstTick = function(t) {
      this.time = t / 1000;
      return requestAnimationFrame(_updateClosure);
    };
    return requestAnimationFrame(firstTick);
  });

  update = function(canvas, t) {
    var c, e, j, len, n, ref, v;
    this.dT = t / 1000 - this.time;
    this.time = t / 1000;
    try {
      this.value = eval(this.compiledJS);
      if (this.value != null) {
        _history.unshift(this.value);
        if (_history.length > _historySize) {
          _history.pop();
        }
        render(canvas);
        ref = $("table tr [wtf-chart]");
        for (j = 0, len = ref.length; j < len; j++) {
          c = ref[j];
          e = $(c);
          n = e.attr("wtf-chart");
          v = this[n];
          if (v == null) {
            v = this["_" + n];
          }
          e.text(Math.round(v * 1000) / 1000);
        }
      }
    } catch (undefined) {}
    return requestAnimationFrame(_updateClosure);
  };

  render = function(canvas) {
    var context, cx, cy, height, i, j, k, len, len1, v, width, x, y;
    if (!(_history.length > 0)) {
      return;
    }
    context = canvas.getContext("2d");
    width = canvas.width = parseInt(canvas.offsetWidth);
    height = canvas.height = parseInt(canvas.offsetHeight);
    cx = width / 2;
    cy = height / 2;
    context.beginPath();
    context.lineWidth = 2;
    this._min = Infinity;
    this._max = -Infinity;
    for (i = j = 0, len = _history.length; j < len; i = ++j) {
      v = _history[i];
      if (v > this._max) {
        this._max = v;
      }
      if (v < this._min) {
        this._min = v;
      }
    }
    for (i = k = 0, len1 = _history.length; k < len1; i = ++k) {
      v = _history[i];
      x = i / (_historySize - 1) * width;
      y = scale(v, this._min, this._max, height, 0);
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
