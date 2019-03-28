// This is the result pane which executes the commands
// Wait for the DOM to load then add this to the angular controller
document.addEventListener('DOMContentLoaded', function () {
    // Get the controller
    var $scope = angular.element(document.getElementById("jvon")).scope();

    $scope.stopped = true;
    $scope.executing = false;
    $scope.finished = false;

    // Execute code
    $scope.execute_code = function () {
        // Check if there is any code to run
        if ($scope.code_lines.length > 0) {
            $scope.executing = true;
            $scope.stopped = false;
            $scope.previous = null;
            $scope.finished = false;

            $scope.ac = "";
            $scope.memory = new Array();
            $scope.memory[0] = null; // 80
            $scope.memory[1] = null; // 81
            $scope.memory[2] = null; // 82
            $scope.memory[3] = null; // 83
            $scope.memory[4] = null; // 84
            $scope.memory[5] = null; // 85

            document.getElementById("execute_code").disabled = true;
            document.getElementById("pause_code").disabled = false;
            document.getElementById("stop_code").disabled = false;

            // Unhighlight lines
            for (var i = 0; i < $scope.code_lines.length; i++) {
                if ($scope.code_lines[i].highlighted == true) {
                    $scope.select_line(i, true);
                }
            }

            $scope.disable_code_buttons();

            $scope.results = new Array();
            $scope.screen = new Array();
            $scope.line_number = 0;
            $scope.repeater();
        }
    };

    $scope.stop_code = function () {
        $scope.cancel_timer();
        if ($scope.blinking == true) {
            $scope.paused_blink(false);
        }
        $scope.stopped = true;
        $scope.executing = false;
        $scope.finished = true;
        $scope.enable_code_buttons();
        document.getElementById("execute_code").disabled = false;
        document.getElementById("pause_code").disabled = true;
        document.getElementById("stop_code").disabled = true;
    };

    $scope.paused_code = function () {
        if ($scope.stopped == false) {
            $scope.paused_blink(true);
            $scope.cancel_timer();
            $scope.stopped = true;
        }
        else {
            $scope.paused_blink(false);
            $scope.stopped = false;
            $scope.repeater();
        }
    };

    $scope.execute_line = function () {
        if ($scope.stopped == false) {
            if ($scope.line_number >= $scope.code_lines.length) {
                alert($scope.strings.error_no_command);
                $scope.stopped_code();
            }
            else {
                // Unhighlight previous line
                if ($scope.previous == null) {
                    $scope.previous = $scope.line_number;
                }
                else {
                    $scope.select_line($scope.previous, true);
                    $scope.previous = $scope.line_number;
                }

                $scope.select_line($scope.line_number, true);
                switch ($scope.code_lines[$scope.line_number].command.name) {
                    case "":
                        $scope.line_number++;
                        $scope.repeater();
                        break;
                    case "rda":
                        $scope.rda($scope.code_lines[$scope.line_number].value);
                        break;
                    case "lda":
                        $scope.lda($scope.code_lines[$scope.line_number].value);
                        break;
                    case "str":
                        $scope.str($scope.code_lines[$scope.line_number].value);
                        break;
                    case "wrt":
                        $scope.wrt($scope.code_lines[$scope.line_number].value);
                        break;
                    case "add":
                        $scope.add($scope.code_lines[$scope.line_number].value);
                        break;
                    case "sub":
                        $scope.sub($scope.code_lines[$scope.line_number].value);
                        break;
                    case "mul":
                        $scope.mul($scope.code_lines[$scope.line_number].value);
                        break;
                    case "div":
                        $scope.div($scope.code_lines[$scope.line_number].value);
                        break;
                    case "jmp":
                        $scope.jmp($scope.code_lines[$scope.line_number].value);
                        break;
                    case "jmpZ":
                        $scope.jmpZ($scope.code_lines[$scope.line_number].value);
                        break;
                    case "jmpL":
                        $scope.jmpL($scope.code_lines[$scope.line_number].value);
                        break;
                    case "sqr":
                        $scope.sqr($scope.code_lines[$scope.line_number].value);
                        break;
                    case "pow":
                        $scope.pow($scope.code_lines[$scope.line_number].value);
                        break;
                    case "End":
                        $scope.End($scope.code_lines[$scope.line_number].value);
                        break;
                    default:
                        alert($scope.code_lines[$scope.line_number].command.name + " is not implemented yet.");
                        $scope.line_number++;
                        $scope.repeater();
                }
            }
        }
    };

    $scope.check_syntax = function (value) {
        var result;

        if (value == "") {
            return {type: "blank", value: ""};
        }

        var regex = /^(\d+)$/;
        if ((result = regex.exec(value)) !== null) {
            if (result.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            return {type: "memory", value: result[1]};
        }

        var regex = /^\[(\d+)\]$/;
        if ((result = regex.exec(value)) !== null) {
            if (result.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            return {type: "address", value: result[1]};
        }

        var regex = /^#(-?[0-9]*?\.?[0-9]+)$/;
        if ((result = regex.exec(value)) !== null) {
            if (result.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            return {type: "number", value: result[1]};
        }

        return {type: "invalid", value: value};
    };

    $scope.check_memory_address = function(value) {
        value = parseFloat(value);
        if (value < 80 || value > 85) {
            return false;
        }
        return true;
    };

    $scope.check_memory_value = function(value) {
        value = parseFloat(value) - 80;
        if ($scope.memory[value] == null) {
            return false;
        }
        return true;
    };

    $scope.rda = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "invalid" || syntax.type == "number" || syntax.type == "blank") {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true) {
                $scope.rda_value = value;
                $scope.show_input_prompt();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            // Memory address
            if ($scope.check_memory_address(syntax.value) == true) {
                syntax.value = parseFloat(syntax.value);
                syntax.value = syntax.value - 80;
                var new_memory = $scope.memory[syntax.value];

                var regex = /^\d+$/;
                var result;

                if ((result = regex.exec(new_memory)) !== null && $scope.check_memory_address(new_memory) == true) {
                    $scope.rda_value = new_memory;
                    $scope.show_input_prompt();
                }
                else {
                    alert($scope.strings.error_memory);
                    $scope.stopped_code();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
    };

    $scope.rda_value_received = function () {
        var value = document.getElementById("rda").value;

        var regex = /^-?[0-9]*?\.?[0-9]+$/;
        var result;

        if ((result = regex.exec(value)) !== null) {
            value = parseFloat(value);
            $scope.rda_value = parseFloat($scope.rda_value);

            $scope.hide_input_prompt();

            $scope.create_result($scope.line_number, $scope.rda_value, value);

            $scope.rda_value = $scope.rda_value - 80;
            $scope.memory[$scope.rda_value] = value;

            $scope.line_number++;
            $scope.repeater();
        }
        else {
            alert($scope.strings.error_input);
        }
    };

    $scope.lda = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "invalid" || syntax.type == "blank") {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
        else if (syntax.type == "number") {
            $scope.ac = syntax.value;

            $scope.create_result($scope.line_number, "ac", $scope.ac);

            $scope.line_number++;
            $scope.repeater();
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = parseFloat(value) - 80;
                $scope.ac = $scope.memory[value];

                $scope.create_result($scope.line_number, "ac", $scope.ac);

                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            // Memory address
            if ($scope.check_memory_address(syntax.value) == true && $scope.check_memory_value(syntax.value) == true) {
                var new_value = parseFloat(syntax.value) - 80;
                new_value = $scope.memory[new_value];
                if ($scope.check_memory_address(new_value) == true && $scope.check_memory_value(new_value) == true) {
                    new_value = new_value - 80;
                    $scope.ac = $scope.memory[new_value];

                    $scope.create_result($scope.line_number, "ac", $scope.ac);

                    $scope.line_number++;
                    $scope.repeater();
                }
                else {
                    alert($scope.strings.error_memory);
                    $scope.stopped_code();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
    };

    $scope.str = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "invalid" || syntax.type == "number" || syntax.type == "blank") {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true) {
                new_value = parseFloat(value) - 80;
                $scope.memory[new_value] = $scope.ac;

                $scope.create_result($scope.line_number, parseFloat(value), $scope.ac);

                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            // Memory address
            if ($scope.check_memory_address(syntax.value) == true) {
                syntax.value = parseFloat(syntax.value);
                syntax.value = syntax.value - 80;
                var new_memory = $scope.memory[syntax.value];

                var regex = /^\d+$/;
                var result;

                if ((result = regex.exec(new_memory)) !== null && $scope.check_memory_address(new_memory) == true) {
                    new_memory = parseFloat(new_memory) - 80;
                    $scope.memory[new_memory] = $scope.ac;

                    $scope.create_result($scope.line_number, parseFloat(new_memory) + 80, $scope.ac);

                    $scope.line_number++;
                    $scope.repeater();
                }
                else {
                    alert($scope.strings.error_memory);
                    $scope.stopped_code();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
    };

    $scope.wrt = function (value) {
        if (value == "") {
            $scope.create_result($scope.line_number, "wrt", $scope.ac);
            $scope.line_number++;
            $scope.repeater();
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.add = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "number") {
            $scope.ac = parseFloat($scope.ac) + parseFloat(syntax.value);

            $scope.create_result($scope.line_number, "ac", $scope.ac);
            $scope.line_number++;
            $scope.repeater();
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = $scope.memory[value - 80];
                $scope.ac = parseFloat($scope.ac) + parseFloat(value);

                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true && $scope.check_memory_value(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                $scope.ac = parseFloat($scope.ac) + value;

                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.sub = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "number") {
            $scope.ac = parseFloat($scope.ac) - parseFloat(syntax.value);

            $scope.create_result($scope.line_number, "ac", $scope.ac);
            $scope.line_number++;
            $scope.repeater();
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = $scope.memory[value - 80];
                $scope.ac = parseFloat($scope.ac) - parseFloat(value);

                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true && $scope.check_memory_value(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                $scope.ac = parseFloat($scope.ac) - value;

                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.mul = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "number") {
            $scope.ac = parseFloat($scope.ac) * parseFloat(syntax.value);

            $scope.create_result($scope.line_number, "ac", $scope.ac);
            $scope.line_number++;
            $scope.repeater();
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = $scope.memory[value - 80];
                $scope.ac = parseFloat($scope.ac) * parseFloat(value);

                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true && $scope.check_memory_value(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                $scope.ac = parseFloat($scope.ac) * value;

                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.div = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "number") {
            $scope.ac = parseFloat($scope.ac) / parseFloat(syntax.value);

            var regex = /^-?[0-9]*\.?[0-9]+$/;
            var result;

            if ((result = regex.exec($scope.ac)) !== null) {
                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_math);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = $scope.memory[value - 80];
                $scope.ac = parseFloat($scope.ac) / parseFloat(value);

                var regex = /^-?[0-9]*\.?[0-9]+$/;
                var result;

                if ((result = regex.exec($scope.ac)) !== null) {
                    $scope.create_result($scope.line_number, "ac", $scope.ac);
                    $scope.line_number++;
                    $scope.repeater();
                }
                else {
                    alert($scope.strings.error_math);
                    $scope.stopped_code();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true && $scope.check_memory_value(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                $scope.ac = parseFloat($scope.ac) / value;

                var regex = /^-?[0-9]*\.?[0-9]+$/;
                var result;

                if ((result = regex.exec($scope.ac)) !== null) {
                    $scope.create_result($scope.line_number, "ac", $scope.ac);
                    $scope.line_number++;
                    $scope.repeater();
                }
                else {
                    alert($scope.strings.error_math);
                    $scope.stopped_code();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.jmp = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "memory") {
            $scope.line_number = parseFloat(value) - 1;
            $scope.repeater();
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                $scope.line_number = parseFloat(value) - 1;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.jmpZ = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "memory") {
            if (parseFloat($scope.ac) == 0) {
                $scope.line_number = parseFloat(value) - 1;
                $scope.repeater();
            }
            else {
                $scope.line_number++;
                $scope.repeater();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true) {
                if (parseFloat($scope.ac) == 0) {
                    value = parseFloat($scope.memory[temp_value - 80]);
                    $scope.line_number = parseFloat(value) - 1;
                    $scope.repeater();
                }
                else {
                    $scope.line_number++;
                    $scope.repeater();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.jmpL = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "memory") {
            if (parseFloat($scope.ac) < 0) {
                $scope.line_number = parseFloat(value) - 1;
                $scope.repeater();
            }
            else {
                $scope.line_number++;
                $scope.repeater();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true) {
                if (parseFloat($scope.ac) < 0) {
                    value = parseFloat($scope.memory[temp_value - 80]);
                    $scope.line_number = parseFloat(value) - 1;
                    $scope.repeater();
                }
                else {
                    $scope.line_number++;
                    $scope.repeater();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.sqr = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "blank") {
            if ($scope.ac == "") {
                alert($scope.strings.error_ac);
                $scope.stopped_code();
            }
            else {
                var sqr = Math.sqrt(parseFloat($scope.ac));
                if (sqr == "NaN") {
                    alert($scope.strings.error_math);
                    $scope.stopped_code();
                }
                else {
                    $scope.ac = sqr;
                    $scope.create_result($scope.line_number, "ac", $scope.ac);
                    $scope.line_number++;
                    $scope.repeater();
                }
            }
        }
        else if (syntax.type == "number") {
            var sqr = Math.sqrt(syntax.value);
            if (sqr == "NaN") {
                alert($scope.strings.error_math);
                $scope.stopped_code();
            }
            else {
                $scope.ac = sqr;
                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = parseFloat($scope.memory[value - 80]);
                var sqr = Math.sqrt(value);
                if (sqr == "NaN") {
                    alert($scope.strings.error_math);
                    $scope.stopped_code();
                }
                else {
                    $scope.ac = sqr;
                    $scope.create_result($scope.line_number, "ac", $scope.ac);
                    $scope.line_number++;
                    $scope.repeater();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true && $scope.check_memory_value(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                var sqr = Math.sqrt(value);
                if (sqr == "NaN") {
                    alert($scope.strings.error_math);
                    $scope.stopped_code();
                }
                else {
                    $scope.ac = sqr;
                    $scope.create_result($scope.line_number, "ac", $scope.ac);
                    $scope.line_number++;
                    $scope.repeater();
                }
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.pow = function (value) {
        var syntax = $scope.check_syntax(value);
        if (syntax.type == "number") {
            if ($scope.ac != "" || $scope.ac == 0) {
                var new_value;
                value = parseFloat(syntax.value);
                if (value < 0) {
                    // The exponent is negative
                    value = Math.abs(parseFloat(value));
                    new_value = 1 / $scope.pow_repeat(parseFloat(value), parseFloat($scope.ac));
                }
                else {
                    // The exponent is positive
                    new_value = $scope.pow_repeat(parseFloat(value), parseFloat($scope.ac));
                }
                $scope.ac = new_value;
                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_ac);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "memory") {
            if ($scope.check_memory_address(value) == true && $scope.check_memory_value(value) == true) {
                value = parseFloat($scope.memory[value - 80]);
                var new_value;
                if (value < 0) {
                    // The exponent is negative
                    value = Math.abs(parseFloat(value));
                    new_value = 1 / $scope.pow_repeat(parseFloat(value), parseFloat($scope.ac));
                }
                else {
                    // The exponent is positive
                    new_value = $scope.pow_repeat(parseFloat(value), parseFloat($scope.ac));
                }
                $scope.ac = new_value;
                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else if (syntax.type == "address") {
            var temp_value = $scope.memory[syntax.value - 80];
            if ($scope.check_memory_address(temp_value) == true) {
                value = parseFloat($scope.memory[temp_value - 80]);
                var new_value;
                if (value < 0) {
                    // The exponent is negative
                    value = Math.abs(parseFloat(value));
                    new_value = 1 / $scope.pow_repeat(parseFloat(value), parseFloat($scope.ac));
                }
                else {
                    // The exponent is positive
                    new_value = $scope.pow_repeat(parseFloat(value), parseFloat($scope.ac));
                }
                $scope.ac = new_value;
                $scope.create_result($scope.line_number, "ac", $scope.ac);
                $scope.line_number++;
                $scope.repeater();
            }
            else {
                alert($scope.strings.error_memory);
                $scope.stopped_code();
            }
        }
        else {
            alert($scope.strings.error_syntax);
            $scope.stopped_code();
        }
    };

    $scope.pow_repeat = function (exponent, base) {
        if (exponent == 0) {
            return 1;
        }
        else {
            return base * $scope.pow_repeat(exponent -1, base);
        }
    }

    $scope.End = function (value) {
        // Rap-up everything
        $scope.stopped_code();
    };

    $scope.create_result = function (line, key, value) {
        var result = {
            line: line + 1,
            first: "",
            second: "",
            third: "",
            fourth: "",
            fifth: "",
            sixth: "",
            ac: "",
            wrt: ""
        };

        switch (key) {
            case 80:
                key = "first";
                break;
            case 81:
                key = "second";
                break;
            case 82:
                key = "third";
                break;
            case 83:
                key = "fourth";
                break;
            case 84:
                key = "fifth";
                break;
            case 85:
                key = "sixth";
                break;
            case "80":
                key = "first";
                break;
            case "81":
                key = "second";
                break;
            case "82":
                key = "third";
                break;
            case "83":
                key = "fourth";
                break;
            case "84":
                key = "fifth";
                break;
            case "85":
                key = "sixth";
                break;
            case "wrt":
                $scope.screen.push({result: value});
                break;
        }

        result[key] = value;
        $scope.results.push(result);
    };

    $scope.$apply();
});
