module.exports = function(grunt) {

    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


    grunt.initConfig({
        less: {
            run: {
                files: {
                    "build/style.css": "css/style.less"
                }
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'et-book',
                    src: '**',
                    dest: 'build/et-book'
                }, {
                    expand: true,
                    cwd: 'css',
                    src: '**',
                    dest: 'build/css'
                }, {
                    expand: true,
                    cwd: 'js',
                    src: '**',
                    dest: 'build/js'
                }, {
                    expand: true,
                    cwd: 'html',
                    src: '**',
                    dest: 'build/'
                }, {
                    expand: true,
                    cwd: 'img',
                    src: '**',
                    dest: 'build/img'
                }, ]
            }
        },
        watch: {
            less: {
                files: ['css/**/*.less'],
                tasks: ['less']
            },
            default: {
                files: ['css/**/*.less', 'css/**/*.css', 'js/**/*.js', 'html/**/*.html'],
                tasks: ['less:run', 'copy:main']
            },
            options: {
                livereload: true,
            }
        },
        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: "0.0.0.0",
                    base: 'build',
                    livereload: true,
                }
            }
        },
        open: {
            all: {
                path: 'http://localhost:<%= connect.server.options.port%>'
            }
        }
    });


    grunt.registerTask('default', ['less:run', 'copy:main',  'connect:server', 'open', 'watch:default']);


};
