var gulp = require('gulp');
var babel = require('gulp-babel');

gulp.task('babel', function() {
  return gulp.src('./*.es6')
    .pipe(babel())
    .pipe(gulp.dest('./'));
});

gulp.task('watch', function() {
  gulp.watch('./*.es6', ['babel']);
});

gulp.task('default', ['babel', 'watch']);
