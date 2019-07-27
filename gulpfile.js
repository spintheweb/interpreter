var fs = require('fs');
var gulp = require('gulp');
var replace = require('gulp-replace');
var minify = require('gulp-minifier');
var rename = require('gulp-rename');

// TODO: move all *.js and *.css into air_end.htm

gulp.task('default', function () {
	var pack = JSON.parse(fs.readFileSync('./package.json'));

	gulp.src('index.htm')
		.pipe(replace('<small id="rev"></small>', `<small id="rev">${pack.name}@${pack.version} ${(new Date()).toISOString()}</small>`))
		.pipe(replace('<link rel="stylesheet" href="css/air_end.css">', readFile('./css/air_end.css', 'style')))
		.pipe(replace('<script src="js/settings.js"></script>', readFile('./js/settings.js', 'script')))
		.pipe(replace('<script src="js/ui.js"></script>', readFile('./js/ui.js', 'script')))
		.pipe(replace('<script src="js/air_end.js"></script>', readFile('./js/air_end.js', 'script')))
		.pipe(replace('<script src="js/report.js"></script>', readFile('./js/report.js', 'script')))
		.pipe(minify({
			minify: true,
			minifyHTML: {
				collapseWhitespace: true,
				conservativeCollapse: true,
			},
			minifyJS: {
				sourceMap: true
			},
			minifyCSS: true,
			getKeptComment: function (content, filePath) {
				var m = content.match(/\/\*![\s\S]*?\*\//img);
				return m && m.join('\n') + '\n' || '';
			}
		}))
		.pipe(rename(`air-end_${pack.version}.htm`))
		.pipe(gulp.dest('build'));
});

function readFile(path, wrap) {
	var file = fs.readFileSync(path);
	return `<${wrap}>${file.toString()}</${wrap}>`;
}