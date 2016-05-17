history = []
historySize = 300
updateClosure = null
cm = null
window.min = 0
window.max = 0
PI = Math.PI
TAU = Math.PI * 2
# window.x = 0

examples =
  silly: "c = Math.cos(time)\np = Math.pow(c, 2)\nMath.sin(p * TAU)"
  sin: "Math.sin(time * TAU)"
  square: "Math.round(time * 5) % 2"
  triangle: "Math.abs((time % 2) - 1)"
  random: "Math.random()"
  state: "window.x ?= 0\nif (window.x < 0.01)\n\twindow.x = 1\nelse\n\twindow.x *= 0.9\n1 - window.x"
  clear: ""


scale = (input, inputMin, inputMax, outputMin, outputMax)->
  if inputMax is inputMin
    outputMin
  else
    input -= inputMin
    input /= inputMax - inputMin
    input *= outputMax - outputMin
    input += outputMin
    input

compileSource = (editor)->
  source = editor.getValue()
  window.localStorage["source"] = source
  
  results = $('#repl_results')
  window.compiledJS = ''
  try
    window.compiledJS = CoffeeScript.compile source, bare: on
    results.text("")
  catch {location, message}
    if location?
      message = "Error on line #{location.first_line + 1}: #{message}"
    results.text(message).addClass 'error'


ready ()->
  canvas = document.querySelector "canvas"
  context = canvas.getContext "2d"
  
  # Configure CM
  CodeMirror.defaults.lineNumbers = true
  CodeMirror.defaults.tabSize = 2
  CodeMirror.defaults.historyEventDelay = 200
  CodeMirror.defaults.viewportMargin = Infinity
  CodeMirror.defaults.extraKeys =
    Tab: false
    "Shift-Tab": false
    "Cmd-Enter": ()->
      render(true)
  cm = CodeMirror.fromTextArea $("textarea")[0], mode: 'coffeescript'
  cm.on "changes", (editor, change)->
    compileSource(editor)
  
  $("button").click (e)->
    cm.setValue(examples[$(e.target).attr("wtf-type")])
    compileSource(cm)
  
  if window.localStorage["source"]?
    cm.setValue(window.localStorage["source"])
  else
    cm.setValue(examples.silly)
  compileSource(cm)
  
  updateClosure = (t)-> update(canvas, t)
  firstTick = (t)->
    window.time = t/1000
    requestAnimationFrame updateClosure
  requestAnimationFrame firstTick



update = (canvas, t)->
  
  window.dT = t/1000 - window.time
  window.time = t/1000
  
  for c in $("table tr [value]")
    e = $(c)
    v = e.attr("value")
    e.text Math.round(window[v] * 1000)/1000
  
  try
    window.value = eval window.compiledJS
    if window.value?
      history.unshift window.value
      
      history.pop() if history.length > historySize
  
    render(canvas)
  requestAnimationFrame updateClosure


render = (canvas)->
  context = canvas.getContext "2d"
  
  # Just do everything at 2x so that we're good for most retina displays (hard to detect)
  width = canvas.width = parseInt(canvas.offsetWidth)
  height = canvas.height = parseInt(canvas.offsetHeight)
  
  cx = width/2
  cy = height/2
  
  context.beginPath()
  context.lineWidth = 2

  window.min = 0
  window.max = 0
  for v, i in history
    window.max = v if v > window.max
    window.min = v if v < window.min
  
  for v, i in history
    x = i/(historySize-1) * width
    y = scale(v, window.min, window.max, height, 0)

    if i == 0
      context.arc(x, y, 6, 0, TAU)
      context.fill()
      context.moveTo(x, y);
    else
      context.lineTo(x, y);
  
  context.stroke()
