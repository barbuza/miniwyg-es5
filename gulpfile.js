var gulp = require("gulp"),
    connect = require("gulp-connect"),
    browserify = require("gulp-browserify"),
    es6ify = require("es6ify"),
    stylus = require("gulp-stylus"),
    autoprefixer = require("gulp-autoprefixer"),
    haml = require("gulp-haml"),
    plumber = require("gulp-plumber");

gulp.task("js", function() {
  gulp.src("src/*.js")
      .pipe(plumber())
      .pipe(browserify({
        transform: ["es6ify"],
      }))
      .pipe(gulp.dest("build"))
      .pipe(connect.reload())
});

gulp.task("stylus", function() {
  gulp.src("src/*.styl")
      .pipe(plumber())
      .pipe(stylus({use: ["nib"]}))
      .pipe(autoprefixer())
      .pipe(gulp.dest("build"))
      .pipe(connect.reload());
});

gulp.task("haml", function() {
  gulp.src("src/**/*.haml")
      .pipe(plumber())
      .pipe(haml())
      .pipe(gulp.dest("build"))
      .pipe(connect.reload());
});

gulp.task("fonts", function() {
  gulp.src("src/fonts/*.*")
      .pipe(gulp.dest("build/fonts"));
});

gulp.task("connect", connect.server({
  root: ["build"],
  port: 5678,
  livereload: true
}));

gulp.task("watch", function() {
  gulp.watch(["src/**/*.haml"], ["haml"]);
  gulp.watch(["src/**/*.js"], ["js"]);
  gulp.watch(["src/**/*.styl"], ["stylus"]);
});

gulp.task("build", ["fonts", "haml", "stylus", "js"]);

gulp.task("default", ["build", "connect", "watch"]);
