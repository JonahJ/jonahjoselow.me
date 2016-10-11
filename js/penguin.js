"use strict";

var PENGUIN_CLICK_TRANSITION_SPEED = 300;
var MOUTH_MAX_DISTANCE = {
    x: 0,
    y: 20
}
var EYES_SPEED = 0.3;
var EYES_MAX_DISTANCE = {
    x: 25,
    y: 25,
}
var MIN_TIME_FOR_ANIMATION = 100;

define(function(require) {
    var d3 = require('d3');

    var loadSVG = function(xml) {
        var importedNode = document.importNode(xml.documentElement, true);
        d3.select("#svg-container-penguin")
            .node()
            .appendChild(importedNode);

        var svg_penguin = d3.select("#svg_penguin");
        var penguin_body = svg_penguin.select("#body");
        var penguin_mouth = svg_penguin.select("#mouth");
        var penguin_eyes = svg_penguin.select("#eyes");

        var arms_down = svg_penguin.select("#arms-down");
        var arms_up_down = svg_penguin.select("#arms-up");

        var penguin = {
            mouth: {
                upper: penguin_mouth.select("#mouth-upper"),
                lower: penguin_mouth.select("#mouth-lower"),
            },
            eye: {
                left: penguin_eyes.select("#eye-left"),
                right: penguin_eyes.select("#eye-right"),
            },
            arm: {
                left: {
                    up: arms_up_down.select("#arm-up-left"),
                    down: arms_down.select("#arm-down-left")
                },
                right: {
                    up: arms_up_down.select("#arm-up-right"),
                    down: arms_down.select("#arm-down-right"),
                }
            }
        };

        penguin_eyes.attr("stroke", "#2DAAE1");
        penguin_mouth.attr("fill", "#FF4500");

        /**
         * Assign original d to move back on clicks
         */
        penguin.arm.left.down
            .attr("original-d", penguin.arm.left.down.attr("d"));
        penguin.arm.right.down
            .attr("original-d", penguin.arm.right.down.attr("d"));

        /**
         * Movement
         */

        var eyesFollow = function() {
            var boundaries = svg_penguin[0]['0'].getAttribute('viewBox').split(" ");

            var boundary = {
                x: boundaries[0],
                y: boundaries[2]
            };

            var mouse_coordinates = d3.mouse(penguin_eyes.node()) || [0, 0];

            var translate = {
                x: mouse_coordinates[0] - boundary.x,
                y: mouse_coordinates[1]
            }

            /**
             * Get direction and go max distance
             */
            if (Math.abs(translate.x) > EYES_MAX_DISTANCE.x) translate.x = (translate.x / Math.abs(translate.x)) * EYES_MAX_DISTANCE.x;
            if (Math.abs(translate.y) > EYES_MAX_DISTANCE.y) translate.y = (translate.y / Math.abs(translate.y)) * EYES_MAX_DISTANCE.y;

            /**
             * Limit speed
             */
            translate.x *= EYES_SPEED;
            translate.y *= EYES_SPEED;

            penguin_eyes
                .attr("transform", "translate(" + translate.x + "," + translate.y + ")");
        };

        var stateActive = function() {
            penguin.mouth.lower
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED)
                .attr("transform", "translate(" + MOUTH_MAX_DISTANCE.x + ", " + "+" + MOUTH_MAX_DISTANCE.y + ")");

            penguin.arm.left.down
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
                .attr("d", penguin.arm.left.up.attr("d"));

            penguin.arm.right.down
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
                .attr("d", penguin.arm.right.up.attr("d"));
        };

        var stateRest = function() {
            penguin.mouth.lower
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED)
                .attr("transform", "translate(0,0)");

            penguin.arm.left.down
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
                .attr("d", penguin.arm.left.down.attr("original-d"));

            penguin.arm.right.down
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
                .attr("d", penguin.arm.right.down.attr("original-d"));
        };

        var last_touch_moved = Date.now();

        var stateActiveThrottler = function() {

            /**
             * Touch events happen to quickly so fake it
             */
            var time_delta = (Date.now() - last_touch_moved);
            if (time_delta < MIN_TIME_FOR_ANIMATION) return;

            last_touch_moved = Date.now();
            stateRest();
        };

        d3.select(window).on('mousemove', eyesFollow);
        d3.select(window).on('touchmove.drag', eyesFollow);
        d3.select(window).on('touchmove.dragstart', stateActive);
        d3.select(window).on('touchmove.dragend', stateActiveThrottler);
        d3.select(window).on('mousedown', stateActive);
        d3.select(window).on('mouseup', stateRest);
    }

    /**
     * Load Penguin SVG
     */
    d3.xml("img/svg/penguin.svg", "image/svg+xml", loadSVG);
});
