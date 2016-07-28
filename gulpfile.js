// task from https://youtu.be/OQk2MhdzIHo?list=PLRk95HPmOM6PN-G1xyKj9q6ap_dc9Yckm

// Require NPM modules
var gulp     = require('gulp'),
	jade       = require('gulp-jade'),
	browserify = require('browserify'),
	uglify     = require('gulp-uglify'),
	streamify  = require('gulp-streamify'),
	source     = require('vinyl-source-stream'),
	sass       = require('gulp-sass'),
	gulpif     = require('gulp-if'),
	deploy     = require('gulp-gh-pages'),
	connect    = require('gulp-connect');

// Global environment variables to set different task processing
// for development and production environments
// var env       = process.env.NODE_ENV || 'development';
// var outputDir = 'builds/development'

// Environment variables
var env = process.env.NODE_ENV || 'development';

if (env==='development'){
	outputDir = 'builds/development/';
	sassStyle = 'expanded';
}else{
	outputDir = 'builds/staging/';
	sassStyle = 'compressed';
}




// TASKS

gulp.task('clean', function(done) {
  del(['builds'], done);
});

gulp.task('jade', function() {
    return gulp.src('src/templates/**/*.jade')
        .pipe(jade())
        .pipe(gulp.dest(outputDir))
        .pipe(connect.reload());
});

//Needed for the JS Task from http://stackoverflow.com/a/28088306
// var gutil = require('gulp-util');
// var sourcemaps = require('gulp-sourcemaps');
// var buffer = require('vinyl-buffer');
// var to5ify = require('6to5ify');

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
gulp.task('js', function() {
    browserify('./src/js/main', { debug: env === 'development'}).bundle()
        .pipe(source('bundle.js'))
        .pipe(streamify(gulpif(env === 'production', uglify())))
        .pipe(gulp.dest(outputDir + '/js'))
        .pipe(connect.reload());
});

gulp.task('sass', function(){
	var config = {}
	if (env === 'development') {
		config.sourceComments = 'map';
	}
	if (env === 'production') {
		config.outputStyle = 'compressed';
	}
	return gulp.src('src/sass/styles.scss')
	.pipe(sass(config)) // doesn't appear to function - no maps
	.pipe(gulp.dest(outputDir + '/css'))
	.pipe(connect.reload());
});

// Rerun tasks whenever a file changes.
gulp.task('watch', function() {
  gulp.watch('src/js/**/*.js', ['js']);
  gulp.watch('src/templates/**/*.jade', ['jade'])
  gulp.watch('src/sass/**/*.scss', ['sass']);
});

gulp.task('connect', function() {
  connect.server({
  	root: [outputDir],
  	livereload: true,
    port: 8080
  });
});

/**
 * Push build to gh-pages
 */
gulp.task('deploy', function () {
  return gulp.src("./builds/staging/**/*")
    .pipe(deploy())
});

// The default task (called when we run `gulp` from cli)
gulp.task('default', ['sass', 'js', 'jade', 'watch', 'connect']);


