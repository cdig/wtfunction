beepbeep = require "beepbeep"
browser_sync = require("browser-sync").create()
chalk = require "chalk"
gulp = require "gulp"
gulp_autoprefixer = require "gulp-autoprefixer"
gulp_coffee = require "gulp-coffee"
gulp_concat = require "gulp-concat"
gulp_kit = require "gulp-kit"
gulp_notify = require "gulp-notify"
gulp_rename = require "gulp-rename"
gulp_sass = require "gulp-sass"
gulp_shell = require "gulp-shell"
gulp_sourcemaps = require "gulp-sourcemaps"
gulp_using = require "gulp-using"
run_sequence = require "run-sequence"


# CONFIG ##########################################################################################


assetTypes = "CNAME,.css,gif,html,ico,jpeg,jpg,json,js,m4v,mp3,mp4,png,svg,swf,woff,xml"


paths =
  assets:
    source: "source/**/*{#{assetTypes}}"
  coffee:
    source: "source/**/*.coffee"
    watch: "source/**/*.coffee"
  kit:
    source: "source/pages/**/*.kit"
    watch: "source/**/*.kit"
  scss:
    source: [
      "source/**/vars.scss"
      "source/**/*.scss"
    ]
    watch: "source/**/*.scss"


gulp_notify.logLevel(0)
gulp_notify.on "click", ()->
  do gulp_shell.task "open -a Terminal"


# HELPER FUNCTIONS ################################################################################


logAndKillError = (err)->
  beepbeep()
  console.log chalk.bgRed("\n## Error ##")
  console.log chalk.red err.message + "\n"
  gulp_notify.onError(
    emitError: true
    icon: false
    message: err.message
    title: "👻"
    wait: true
    )(err)
  @emit "end"


# TASKS: APP COMPILATION ##########################################################################


gulp.task "assets", ()->
  gulp.src paths.assets.source
    # .pipe gulp_using() # Uncomment for debug
    .pipe gulp_rename (path)->
      path.dirname = path.dirname.replace /.*\/pack\//, ''
      path
    .pipe gulp.dest "public"
    .pipe browser_sync.stream
      match: "**/*.{#{assetTypes}}"
        

gulp.task "coffee", ()->
  gulp.src paths.coffee.source
    # .pipe gulp_using() # Uncomment for debug
    # .pipe gulp_sourcemaps.init()
    .pipe gulp_concat "scripts.coffee"
    .pipe gulp_coffee()
    .on "error", logAndKillError
    # .pipe gulp_sourcemaps.write "."
    .pipe gulp.dest "public"
    .pipe browser_sync.stream
      match: "**/*.js"
      

gulp.task "kit", ()->
  gulp.src paths.kit.source
    # .pipe gulp_using() # Uncomment for debug
    .pipe gulp_kit()
    .on "error", logAndKillError
    .pipe gulp_rename (path)->
      if path.basename is "index"
        path.dirname = ""
      else
        path.dirname = path.dirname + "/" + path.basename
        path.basename = "index"
      return path
    .pipe gulp.dest "public"
    .pipe browser_sync.stream
      match: "**/*.html"
      

gulp.task "sass", ["scss"]
gulp.task "scss", ()->
  gulp.src paths.scss.source
    # .pipe gulp_using() # Uncomment for debug
    # .pipe gulp_sourcemaps.init()
    .pipe gulp_concat "styles.scss"
    .pipe gulp_sass
      errLogToConsole: true
      outputStyle: "compressed"
      precision: 1
    .on "error", logAndKillError
    .pipe gulp_autoprefixer
      browsers: "last 5 Chrome versions, last 2 ff versions, IE >= 10, Safari >= 8, iOS >= 8"
      cascade: false
      remove: false
    # .pipe gulp_sourcemaps.write "."
    .pipe gulp.dest "public"
    .pipe browser_sync.stream
      match: "**/*.css"
      

gulp.task "serve", ()->
  browser_sync.init
    ghostMode: false
    online: false
    server:
      baseDir: "public"
    ui: false


gulp.task "default", ["assets", "coffee", "kit", "scss"], ()->
  gulp.watch paths.assets.source, ["assets"]
  gulp.watch paths.coffee.watch, ["coffee"]
  gulp.watch paths.kit.watch, ["kit"]
  gulp.watch paths.scss.watch, ["scss"]
  run_sequence "serve" # Must come last
