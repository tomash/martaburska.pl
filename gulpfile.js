const { src, dest, watch, series, parallel } = require("gulp");
const plumber = require("gulp-plumber");
const browserSync = require("browser-sync").create();
const autoprefixerImport = require("gulp-autoprefixer");
const autoprefixer = autoprefixerImport.default || autoprefixerImport;
const sass = require("gulp-sass")(require("sass"));
const rename = require("gulp-rename");
const csso = require("gulp-csso");
const inject = require("gulp-inject");
const streamSeries = require("stream-series");
const uglify = require("gulp-uglify");

const paths = {
    base: "./assets/sass/base/*.scss",
    layout: "./assets/sass/layout/*.scss",
    pages: "./assets/sass/pages/*.scss",
    themes: "./assets/sass/themes/*.scss",
    shortcodes: "./assets/sass/shortcodes/*.scss",
    shortcodeEntry: "./assets/sass/shortcodes/shortcodes.scss",
    styleEntry: "./assets/sass/style.scss",
    html: "./*.html",
    scripts: "./assets/js/*.js",
    mainScript: "./assets/js/scripts.js"
};

// Autoprefixer config
const AUTOPREFIXER_BROWSERS = [
    "last 2 version",
    "> 1%",
    "ie >= 9",
    "ie_mob >= 10",
    "ff >= 30",
    "chrome >= 34",
    "safari >= 7",
    "opera >= 23",
    "ios >= 7",
    "android >= 4",
    "bb >= 10"
];

function serve(done) {
    browserSync.init({
        server: "./",
        notify: false
    });
    done();
}

function shortcode() {
    return src(paths.shortcodeEntry)
        .pipe(plumber())
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({ overrideBrowserslist: AUTOPREFIXER_BROWSERS }))
        .pipe(dest("./assets/css"))
        .pipe(browserSync.stream())
        .pipe(csso())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest("./assets/css"));
}

function theme() {
    return src(paths.themes)
        .pipe(plumber())
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({ overrideBrowserslist: AUTOPREFIXER_BROWSERS }))
        .pipe(dest("./assets/css"))
        .pipe(browserSync.stream())
        .pipe(csso())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest("./assets/css"));
}

function style() {
    return src(paths.styleEntry)
        .pipe(plumber())
        .pipe(sass().on("error", sass.logError))
        .pipe(autoprefixer({ overrideBrowserslist: AUTOPREFIXER_BROWSERS }))
        .pipe(dest("./assets/css"))
        .pipe(browserSync.stream())
        .pipe(csso())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest("./assets/css"));
}

function watchFiles() {
    watch(paths.shortcodes, shortcode);
    watch(paths.themes, theme);
    watch([paths.base, paths.layout, paths.pages], style);
    watch(paths.html).on("change", browserSync.reload);
    watch(paths.scripts).on("change", browserSync.reload);
}

function injectAssets() {
    var vendorPaths = [
        "!./assets/vendor/jquery",
        "!./assets/vendor/slider-revolution/**",
        "!./assets/vendor/modernizr",
        "!./assets/vendor/backward",
        "!./assets/vendor/bootstrap/**",
        "!./assets/vendor/masonry",
        "./assets/vendor/**",
        "./assets/vendor/**/**",
        "./assets/vendor/**/**/**"
    ];

    var main = src([
        "./assets/vendor/modernizr/*.js",
        "./assets/vendor/jquery/**.js",
        "./assets/vendor/bootstrap/**/bootstrap.min.js",
        "./assets/vendor/bootstrap/**/bootstrap.min.css"
    ], {
        read: false
    });

    var project = src([
        paths.mainScript,
        "./assets/css/shortcodes.css",
        "./assets/css/style.css",
        "./assets/css/default-theme.css"
    ], {
        read: false
    });

    var vendorJS = vendorPaths.map(function(item) { return item + "/*.js"; });
    var vendorCSS = vendorPaths.map(function(item) { return item + "/*.css"; });
    var libs = src(vendorJS.concat(vendorCSS), { read: false });

    return src(paths.html)
        .pipe(inject(streamSeries(main, libs, project), { relative: true }))
        .pipe(dest("./"));
}

function script() {
    return src(paths.mainScript)
        .pipe(plumber())
        .pipe(uglify())
        .pipe(rename({ suffix: ".min" }))
        .pipe(dest("./assets/js/"));
}

const build = parallel(shortcode, style, theme);
const dev = series(build, serve, watchFiles);

exports.serve = serve;
exports.shortcode = shortcode;
exports.theme = theme;
exports.style = style;
exports.watch = watchFiles;
exports.inject = injectAssets;
exports.script = script;
exports.build = build;
exports.default = dev;