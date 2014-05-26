// gulp build file
var gulp = require('gulp');
// gulp plugins
var compass = require('gulp-compass');
var minifyCSS = require('gulp-minify-css');
var jshint = require('gulp-jshint');
//var concat = require('gulp-concat');
//var uglify = require('gulp-uglify');
//var filesize = require('gulp-filesize');
//var ngmin = require('gulp-ngmin');

// js files that belong to this project (should be linted)
var project_js = [
    '/static/js/*.js',
    '/*.js',
    '/lib/*.js'
];

// lint task
gulp.task('lint', function () {
    return gulp.src(project_js)
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

// compass task
gulp.task('compass', function () {
    return gulp.src('sass/**/*.scss')
    .pipe(compass({
        config_file: 'config/compass.rb',
        css: 'static/stylesheets',
        sass: 'sass'
    }))
    .pipe(minifyCSS())
    .pipe(gulp.dest('static/stylesheets/prod'));
});

// js tasks
//TODO concat, uglify, etc.
//Note pass uglify mangle: false

// watch task
gulp.task('watch', function () {
    gulp.watch('sass/**/*.scss', ['compass']);
    gulp.watch(project_js, ['lint']);
});

// default task
gulp.task('default', [
    'lint',
    'compass',
    'watch'
 ]);

// build task (no watching)
gulp.task('build', [
    'lint',
    'compass'
 ]);