var PENGUIN_CLICK_TRANSITION_SPEED = 300;

define(["d3"], function(d3) {

    var loadSVG = function(xml) {
        var importedNode = document.importNode(xml.documentElement, true);
        d3.select("#svg-container-penguin").node().appendChild(importedNode);

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
        penguin.arm.left.down.attr("original-d", penguin.arm.left.down.attr("d"));
        penguin.arm.right.down.attr("original-d", penguin.arm.right.down.attr("d"));

        /**
         * Eyes Movement
         */
        var EYES_SPEED = 0.3;
        var EYES_MAX_DISTANCE_X = 25;
        var EYES_MAX_DISTANCE_Y = 25;

        var last_touch_moved = Date.now();
        var MIN_TIME_FOR_ANIMATION = 100;

        var mouse_move = function() {
            var mouse_coordinates = d3.mouse(penguin_eyes.node()) || [0, 0];

            var x_boundary = Number(svg_penguin[0]['0'].getAttribute('viewBox').split(" ")[0]);
            var y_boundary = Number(svg_penguin[0]['0'].getAttribute('viewBox').split(" ")[2]);

            var translate_x = mouse_coordinates[0] - x_boundary;
            var translate_y = mouse_coordinates[1];

            /**
             * Get direction and go max distance
             */
            if (Math.abs(translate_x) > EYES_MAX_DISTANCE_X) {
                var direction = translate_x / Math.abs(translate_x)
                translate_x = direction * EYES_MAX_DISTANCE_X;
            }

            if (Math.abs(translate_y) > EYES_MAX_DISTANCE_Y) {
                var direction = translate_y / Math.abs(translate_y)
                translate_y = direction * EYES_MAX_DISTANCE_Y;
            }

            /**
             * Limit speed
             */
            translate_x *= EYES_SPEED;
            translate_y *= EYES_SPEED;

            penguin_eyes
                .attr("transform", "translate(" + translate_x + "," + translate_y + ")");
        };

        var openAnimations = function() {
            penguin.mouth.lower
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED)
                .attr("transform", "translate(" + MOUTH_MAX_DISTANCE_X + ", " + "+" + MOUTH_MAX_DISTANCE_Y + ")");

            penguin.arm.left.down
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
                .attr("d", penguin.arm.left.up.attr("d"));

            penguin.arm.right.down
                .transition()
                .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
                .attr("d", penguin.arm.right.up.attr("d"));
        };

        var closeAnimations = function() {
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


        d3.select(window).on('mousemove', mouse_move);
        d3.select(window).on('touchmove.drag', mouse_move);
        d3.select(window).on('touchmove.dragstart', openAnimations);
        d3.select(window).on('touchmove.dragend', function() {

            /**
             * Touch events happen to quickly so fake it
             */
            var delta = (Date.now() - last_touch_moved);
            if (delta >= MIN_TIME_FOR_ANIMATION) {
                last_touch_moved = Date.now();
                closeAnimations();
            }
        });


        /**
         * Open and Close Mouth
         */
        var MOUTH_MAX_DISTANCE_X = 0;
        var MOUTH_MAX_DISTANCE_Y = 20;
        d3.select(window).on('mousedown', openAnimations);
        d3.select(window).on('mouseup', closeAnimations);
    }

    /**
     * Load Penguin SVG
     */
    d3.xml("img/svg/penguin.svg", "image/svg+xml", loadSVG);
});
