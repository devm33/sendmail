// gulp build file
var gulp = require('gulp');
// gulp plugins
var jshint = require('gulp-jshint');
var compass = require('gulp-compass');
//var concat = require('gulp-concat');
//var uglify = require('gulp-uglify');
//var rename = require('gulp-rename');

// lint task
gulp.task('lint', function () {
    return gulp.src([
        'static/main.js',
        '*.js',
        'lib/*.js'
    ])
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// compass task
gulp.task('compass', function () {
    return gulp.src('sass/*.scss')
    .pipe(compass())
    .pipe(gulp.dest('static/stylesheets'));
});

// js tasks
//TODO

// watch task
//TODO

// default task
gulp.task('default', [
    'lint',
    'compass'
 ]);