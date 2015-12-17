var gulp = require("gulp")
    , exec          = require('gulp-exec')
    , argv          = require('yargs').argv
    , data          = require('gulp-data')
    , gutil         = require('gulp-util')
    , format        = require('string-format')
    , runSequence   = require('run-sequence')
    , template      = require('gulp-template')
    , StringDecoder = require('string_decoder').StringDecoder
;

format.extend(String.prototype, {});

/* Basic parameters */
var ENVIRONMENT = (argv.env || argv.e || 'dev').toLowerCase();

/**
 * Fresh build:
    - Create docker files for given environment (default is dev)
    - Clean previous docker app process/image (excluding BASE image)
    - Build app containers
 */
gulp.task("init", function (cb) {
   runSequence('setup', 'clean', 'build', cb);
});

/**
 * Setup environment templates and files (such as creating Dockerfile for 'dev' environment)
 */
gulp.task('setup', function (cb) {
    runSequence('setup_genfiles', 'setup_copy_compose', cb);
});

/**
 * Setup: generate files from templates
 */
gulp.task('setup_genfiles', function (cb) {
    var templateStringValue = require('./dockerdat/template/{}/string.js'.format(ENVIRONMENT));

    gulp.src('dockerdat/template/master/*')
        .pipe(template(templateStringValue))
        .pipe(gulp.dest("gen"))
        .on('end', function () {
            //- Call cb here because gulp.dest ends prematurely and setup_copy_compose ran
            // before any gen/docker-compose-flannel.yml is generated.
            cb();
        })
    ;
});

/**
 * Setup: copy gen/docker-compose-app.yml to root folder,
 * reason: docker-compose-app.yml can only be ran on root folder
 */
gulp.task('setup_copy_compose', function () {
    gulp.src('gen/docker-compose-app.yml')
        .pipe(gulp.dest('.'));
});

/**
 * Build docker image
 */
gulp.task("build", function() {
    var options = {
        pipeStdout: true,
        environment: ENVIRONMENT
    };

    return gulp.src("")
    /** Build media: data volume container */
        .pipe(exec('(echo "Build media: data volume container" && (docker build -q -t gdtdemo/media -f gen/Dockerfile-media .))',options))
        .pipe(exec.reporter())
    /** Build war file */
        .pipe(exec('./gradlew clean war', options))
        .pipe(exec.reporter())
    /** Build base image */
        .pipe(exec('echo $(docker images --filter="label=name=gdtdemo-base" -q)', options))
        .pipe(data(getId))
        .pipe(exec.reporter())
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                           (echo "Build base image" && (docker build -q -t gdtdemo/base -f gen/Dockerfile-base .)) || \
                            echo "Build base image: SKIP, image exists"', options))
        .pipe(exec.reporter())
    /** Build app image */
        .pipe(exec('(echo "Build app image" && (docker build -q -t gdtdemo/app -f gen/Dockerfile-app .))', options))
        .pipe(exec.reporter())
    /**
    /* Compose our container
    /* TODO: Before docker-compose 1.6, we're unable to set a image name built with docker-compose.
    /*       Move docker build to docker compose after we update to docker-compose 1.6.
    /*/
        .pipe(exec('docker-compose -f docker-compose-app.yml up -d', options))
        .pipe(exec.reporter())
        .on('end', function () {
            gutil.log('Build completed.');
        });
});

/**
 * Remove app container and image, leaving media container intact, and rebuild a new app container
 */
gulp.task("rebuild-app", ['setup', 'clean-app'], function() {
    var options = {
        pipeStdout: true,
        environment: ENVIRONMENT
    };

    return gulp.src("")
    /** Build war file */
        .pipe(exec('./gradlew clean war', options))
        .pipe(exec.reporter())
    /** Build app image */
        .pipe(exec('(echo "Build app image" && (docker build -q -t gdtdemo/app -f gen/Dockerfile-app .))', options))
        .pipe(exec.reporter())
    /**
    /* Compose our container
    /* TODO: Before docker-compose 1.6, we're unable to set a image name built with docker-compose.
    /*       Move docker build to docker compose after we update to docker-compose 1.6.
    /*/
        .pipe(exec('docker-compose -f docker-compose-app.yml up -d', options))
        .pipe(exec.reporter())
        .on('end', function () {
            gutil.log('Build completed.');
        });
});

/**
 Cleanup: Remove all media, app container and image
 NOTE: base image is not removed
 */
gulp.task('clean', function () {
    var options = {
        pipeStdout: true
    };

    return gulp.src('')
    /** Find all of our running container (media and app) */
        .pipe(exec('echo $(docker ps -a -q --filter name=gdtdemo)', options))
        .pipe(data(getId))
    /** Stop the docker process */
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                            echo "Stop docker process: NOT exists, SKIP" || \
                           (echo "Stop docker process" && docker stop <%= file.ids %>)', options))
        .pipe(exec.reporter())
    /** Remove the docker container */
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                            echo "Remove docker container: NOT exists, SKIP" || \
                           (echo "Remove docker container" && docker rm <%= file.ids %>)', options))
        .pipe(exec.reporter()) //note: multiple reporter must be instantiated separatedly
    /** Remove the image */
        .pipe(exec('echo $(docker images --filter="label=name=gdtdemo-app" -q)', options))
        .pipe(data(getId))
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                            echo "Remove docker image: NOT exists, SKIP" || \
                           (echo "Remove docker image" && docker rmi <%= file.ids %>)', options))
        .pipe(exec.reporter())
        .on('end', function () {
            gutil.log('Clean completed.');
        });
});

gulp.task('clean-app', function() {
    var options = {
        pipeStdout: true
    };

    return gulp.src('')
    /** Find our running process */
        .pipe(exec('echo $(docker ps -a -q --filter name=gdtdemo_app)', options))
        .pipe(data(getId))
    /** Stop the docker process */
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                            echo "Stop docker process: NOT exists, SKIP" || \
                           (echo "Stop docker process" && docker stop <%= file.ids %>)', options))
        .pipe(exec.reporter())
    /** Remove the docker container */
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                            echo "Remove docker container: NOT exists, SKIP" || \
                           (echo "Remove docker container" && docker rm <%= file.ids %>)', options))
        .pipe(exec.reporter()) //note: multiple reporter must be instantiated separatedly
    /** Remove the image */
        .pipe(exec('echo $(docker images --filter="label=name=gdtdemo-app" -q)', options))
        .pipe(data(getId))
        .pipe(exec('[ -z "<%= file.ids %>" ] && \
                            echo "Remove docker image: NOT exists, SKIP" || \
                           (echo "Remove docker image" && docker rmi <%= file.ids %>)', options))
        .pipe(exec.reporter())
        .on('end', function () {
            gutil.log('App is removed completed.');
        });
});

/** Common functions */
var getId = function (file) {
    var decoder = new StringDecoder('utf8');
    var ids  = decoder.write(file.contents);
    file.ids = ids.trim();
    return file;
};
