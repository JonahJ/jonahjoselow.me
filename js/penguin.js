/**
 * Load Opening Text
 */

d3.xml("img/hi-jonah.svg", "image/svg+xml", function(xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    d3.select("#svg-container-text").node().appendChild(importedNode);
});

// /**
//  * Load Solo Jazz...
//  */

// d3.xml("img/solo.svg", "image/svg+xml", function(xml) {
//     var importedNode = document.importNode(xml.documentElement, true);
//     d3.select("#svg-container-solo-jazz").node().appendChild(importedNode);
// });


var PENGUIN_CLICK_TRANSITION_SPEED = 300;

/**
 * Load Penguin SVG
 */
d3.xml("img/penguin.svg", "image/svg+xml", function(xml) {
    var importedNode = document.importNode(xml.documentElement, true);
    d3.select("#svg-container-face").node().appendChild(importedNode);


    var svg_penguin = d3.select("#svg_penguin");
    var penguin_body = svg_penguin.select("#body");

    var penguin_mouth = svg_penguin.select("#mouth");
    var penguin_mouth_upper = penguin_mouth.select("#mouth-upper");
    var penguin_mouth_lower = penguin_mouth.select("#mouth-lower");

    var penguin_eyes = svg_penguin.select("#eyes");
    var penguin_eye_left = penguin_eyes.select("#eye-left");
    var penguin_eye_right = penguin_eyes.select("#eye-right");

    var arms_down = svg_penguin.select("#arms-down");
    var arm_down_left = arms_down.select("#arm-down-left");
    var arm_down_right = arms_down.select("#arm-down-right");

    var arms_up_down = svg_penguin.select("#arms-up");
    var arm_up_left = arms_up_down.select("#arm-up-left");
    var arm_up_right = arms_up_down.select("#arm-up-right");


    penguin_eyes
        .attr("stroke", "#2DAAE1");

    penguin_mouth
        .attr("fill", "#FF4500");

    /**
     * Assign original d to move back on clicks
     */
    arm_down_left.attr("original-d", arm_down_left.attr("d"));
    arm_down_right.attr("original-d", arm_down_right.attr("d"));

    /**
     * Eyes Movement
     */
    var EYES_SPEED = 0.3;
    var EYES_MAX_DISTANCE_X = 25;
    var EYES_MAX_DISTANCE_Y = 25;

    var last_touch_moved = Date.now();
    var MIN_TIME_FOR_ANIMATION = 100;

    d3.select(window).on('mousemove', mouse_move);
    d3.select(window).on('touchmove.drag', mouse_move);
    d3.select(window).on('touchmove.dragstart', function() {
        openAnimations();
        // var delta = (Date.now() - last_touch_moved);
        // if (delta >= 1000) {
        //     last_touch_moved = Date.now();

        // openAnimations();
        // }
    });
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


    function mouse_move() {
        var mouse_coordinates = [0, 0];
        mouse_coordinates = d3.mouse(penguin_eyes.node());

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
    }

    /**
     * Open and Close Mouth
     */
    var MOUTH_MAX_DISTANCE_X = 0;
    var MOUTH_MAX_DISTANCE_Y = 20;
    d3.select(window).on('mousedown', openAnimations);
    d3.select(window).on('mouseup', closeAnimations);



    function openAnimations() {
        penguin_mouth_lower
            .transition()
            .duration(PENGUIN_CLICK_TRANSITION_SPEED)
            .attr("transform", "translate(" + MOUTH_MAX_DISTANCE_X + ", " + "+" + MOUTH_MAX_DISTANCE_Y + ")");

        arm_down_left
            .transition()
            .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
            .attr("d", arm_up_left.attr("d"));
        // .attr("transform", function() {
        //     var center_x = this.getBBox().x;
        //     var center_y = this.getBBox().y;
        //     return "rotate(" + 25 + ", " + center_x + ", " + center_y + ") translate(-5, -30) ";
        // });

        arm_down_right
            .transition()
            .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
            .attr("d", arm_up_right.attr("d"));
    };

    function closeAnimations() {
        penguin_mouth_lower
            .transition()
            .duration(PENGUIN_CLICK_TRANSITION_SPEED)
            .attr("transform", "translate(0,0)");

        arm_down_left
            .transition()
            .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
            .attr("d", arm_down_left.attr("original-d"));

        arm_down_right
            .transition()
            .duration(PENGUIN_CLICK_TRANSITION_SPEED / 5)
            .attr("d", arm_down_right.attr("original-d"));
    };
});
