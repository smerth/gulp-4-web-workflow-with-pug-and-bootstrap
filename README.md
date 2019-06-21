# Gulp 4 web workflow with pug and bootstrap

This demo uses Gulp to process pug (Jade) template files and a NODE_ENV variable to allow different builds for Development and Staging.

## Usage

Clone the repo. Install the dependancies and run gulp

```bash
gulp
```

The default gulp task runs a series of build tasks and then runs a watch task. The browser should open and re-fresh whenever you make a change to files in `src`

## Gulpfile.js

```javascript
var gulp = require("gulp");

var autoprefixer = require("gulp-autoprefixer");
var browserSync = require("browser-sync").create();
var sass = require("gulp-sass");
var cleanCSS = require("gulp-clean-css");
var sourcemaps = require("gulp-sourcemaps");
var concat = require("gulp-concat");
var imagemin = require("gulp-imagemin");
var changed = require("gulp-changed");
var uglify = require("gulp-uglify");
var lineendingcorrector = require("gulp-line-ending-corrector");
var pug = require("gulp-pug");
var del = require("del");
var ghPages = require("gulp-gh-pages");
// var gulpif = require("gulp-if");

// Global environment variables to set different task processing
var env = process.env.NODE_ENV || "development";
if (env === "development") {
  outputDir = "builds/development/";
  sassStyle = "expanded";
} else {
  outputDir = "./builds/production/";
  sassStyle = "compressed";
}

// Directories
var libraries = "./src/libraries/"; // external js
var css = "./src/css/"; // expternal css
var scss = "./src/scss/";
var images = "./src/images/";
var js = "./src/js/";
var pages = "./src/pages/";

// Watch for changes in these files
var pugTemplates = pages + "**/*.pug";
var pugIncludes = "./src/includes/**/*.pug";
var scssFiles = scss + "**/*.scss";
var cssFiles = css + "**/*.css";
var imageFiles = images + "**/*";
var libraryFiles = libraries + "**/*.js";
var jsFiles = js + "**/*.js"; // haven't built a task to process js yet

// If you have a bunch of js library files and you want
// to process them in a specific order
var librariesORDERED = [
  // libraries + "bootstrap.min.js"
  // libraries + "bootstrap-hover.js",
  // libraries + "nav-scroll.js",
  libraries + "prism.js"
  // libraries + "resizeSensor.js",
  // libraries + "sticky-sidebar.js",
  // libraries + "stick-sb.js",
  // libraries + "skip-link-focus-fix.js",
];

// If you have a bunch of css files and you want
// to process them in a specific order
var cssORDERED = [
  // css + "bootstrap.min.css",
  css + "sticky-footer.css",
  // css + "all.css",
  css + "prism.css"
  // css + "style.css",
];

// TASKS

// The `clean` function is not exported so it can be considered a private task.
// It can still be used within the `series()` composition.
function clean() {
  return del(["./builds/"]);
}

// Import you scss partial files into your style.scss file
// then use this function to transpile you scss into css in the build folders
function compileSCSS() {
  return gulp
    .src([scss + "style.scss"])
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(
      sass({
        outputStyle: "expanded"
      })
    )
    .on("error", sass.logError)
    .pipe(autoprefixer("last 2 versions"))
    .pipe(sourcemaps.write())
    .pipe(lineendingcorrector())
    .pipe(gulp.dest(outputDir + "/css/"));
}

// If you have several css files from several libraries (like prism and bootstrap)
// use this function to concat everything together in order
function concatCSS() {
  return gulp
    .src(cssORDERED)
    .pipe(sourcemaps.init({ loadMaps: true, largeFile: true }))
    .pipe(concat("libraries.min.css"))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write("./maps/"))
    .pipe(lineendingcorrector())
    .pipe(gulp.dest(outputDir + "/css/"));
}

// If you have several javascript files from several libraries (like prism and bootstrap)
// use this function to concat everything together in order
function concatLibraries() {
  return gulp
    .src(librariesORDERED)
    .pipe(concat("libraries.js"))
    .pipe(uglify())
    .pipe(lineendingcorrector())
    .pipe(gulp.dest(outputDir + "js/"));
}

// image optimization
function imgmin() {
  return gulp
    .src(images + "/**/*")
    .pipe(changed(outputDir + "/images/"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 })
      ])
    )
    .pipe(gulp.dest(outputDir + "/images/"));
}

function pugPages() {
  return gulp
    .src(pages + "/**/*.pug")
    .pipe(pug())
    .pipe(gulp.dest(outputDir));
}

function build() {
  gulp.series(compileSCSS, concatCSS, concatLibraries, imgmin, jadePages);
}

function watch() {
  browserSync.init({
    server: {
      baseDir: outputDir
    },
    open: "external"
  });
  gulp.watch(scssFiles, gulp.series([compileSCSS, concatCSS]));
  gulp.watch(libraryFiles, concatLibraries);
  gulp.watch(cssFiles, concatCSS);
  gulp.watch(imageFiles, imgmin);
  gulp.watch(pugTemplates, pugPages);
  gulp.watch(pugIncludes, pugPages);
  gulp.watch([outputDir]).on("change", browserSync.reload);
}

function deploy(cb) {
  gulp.src("./builds/development/**/*").pipe(ghPages());
  cb();
}

// gulp.task('deploy', function () {
//   return gulp.src("./prod/**/*")
//     .pipe(ghPages({
//       remoteUrl: "https://github.com/your_github_username_here/your_github_username_here.github.io.git",
//       branch: "master"
//     }))
// });

var build = gulp.series(
  compileSCSS,
  concatCSS,
  concatLibraries,
  imgmin,
  pugPages
);

exports.compileSCSS = compileSCSS;
exports.concatCSS = concatCSS;
exports.concatLibraries = concatLibraries;
exports.watch = watch;
exports.imgmin = imgmin;
exports.pugPages = pugPages;
exports.build = build;
exports.deploy = deploy;

var develop = gulp.series(clean, build, watch);

gulp.task("default", develop);

// Gulp tasks for processing js files
// not yet converted from Gulp 3

// Task from http://stackoverflow.com/a/28088306
// gulp.task('js', function() {
//     browserify('./src/js/main', { debug: true})
//         .transform(to5ify)
//         .bundle()
//         .on('error', gutil.log.bind(gutil, 'Browserify Error'))
//         .pipe(source('bundle.js'))
//         .pipe(buffer())
//         .pipe(sourcemaps.init({
//             loadMaps: true
//         })) // loads map from browserify file
//         .pipe(uglify())
//         .pipe(sourcemaps.write('./')) // writes .map file
//         .pipe(gulp.dest('./builds/development/js'));
// });

// add write source maps as above
// gulp.task('js', function() {
//     browserify('./src/js/main', { debug: env === 'development'}).bundle()
//         .pipe(source('bundle.js'))
//         .pipe(streamify(gulpif(env === 'production', uglify())))
//         .pipe(gulp.dest(outputDir + '/js'))
//         .pipe(connect.reload());
// });
```

## Links

### Gulp

[GulpJS](https://gulpjs.com/)

[Gulp 4 Tutorial with Node JS, ImageMin, Browser Sync, SASS, SourceMaps, CleanCSS & More](https://www.youtube.com/watch?v=tTrPLQ6nOX8)

### Jade

[Jade Language - Node Template Engine](http://jade-lang.com/)

[Baking Bootstrap Snippets with Jade](https://webdesign.tutsplus.com/tutorials/baking-bootstrap-snippets-with-jade--cms-22798)

[Jade Syntax Documentation by example](https://naltatis.github.io/jade-syntax-docs/#mixin)
