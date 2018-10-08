// This is the angular controller and the code pane
var jvonapp = angular.module("JVON", ["ngTouch", "ngSanitize"]);

jvonapp.controller('JVONController', ["$scope", "$timeout", "$interval", function ($scope, $timeout ,$interval) {
	// List of available commands
	$scope.commands = commands;

	// The code pane
	$scope.code_lines = new Array();

	// The result pane
	$scope.results = new Array();

	// What is displayed on the screen
	$scope.screen = new Array();

	$scope.execution_started = false;

	$scope.speed = 1; // 1 second interval between code

	// Set language to spanish by default or load english if it's saved in the browser
	if (localStorage.language == 1) {
		$scope.language = 1;
		$scope.strings = english_strings;
	}
	else {
		$scope.language = 0;
		$scope.strings = spanish_strings;
	}

	// Initialize, this variable is only set to show that the code has changd to update the display
	$scope.imported_code = false;

	// Set and ID
	$scope.identifier = new Date().getTime().toString() + navigator.userAgent + Math.random().toString();
	$scope.identifier = CryptoJS.SHA512($scope.identifier).toString();

	// Change the language between english and spanish
	$scope.change_language = function () {
		if ($scope.language == 1) {
			$scope.strings = english_strings;
			localStorage.language = 1;
		}
		else {
			$scope.strings = spanish_strings;
			localStorage.language = 0;
		}
	};

	$scope.change_speed = function () {
		$timeout.cancel($scope.promise);
		if ($scope.execution_started == false) {
			$scope.execution_started = true;
			$scope.promise = $timeout($scope.execute_line, 1);
		}
		else {
			$scope.promise = $timeout($scope.execute_line, 1000 * $scope.speed);
		}
	};

	$scope.paused_blink = function (enabled) {
		if (enabled == true) {
			$scope.blinking = true;
			$scope.blink_state = false;
			$scope.opacity = 1;
			$scope.blink_promise = $interval($scope.blink, 20);
		}
		else {
			$interval.cancel($scope.blink_promise);
			element = document.getElementById("pause_code");
			element.style.opacity = 1;
			element.style.filter = "alpha(opacity=" + 1 * 100 + ")";
		}
	};

	$scope.blink = function () {
		element = document.getElementById("pause_code");
		if ($scope.blink_state == false) {
			if ($scope.opacity <= 0.1) {
				$scope.blink_state = true;
				$scope.opacity = 0.1;
			}
			else {
				element.style.opacity = $scope.opacity;
				element.style.filter = "alpha(opacity=" + $scope.opacity * 100 + ")";
				$scope.opacity -= $scope.opacity * 0.1;
			}
		}
		else {
			if ($scope.opacity >= 1) {
				$scope.blink_state = false;
				$scope.opacity = 1;
			}
			else {
				element.style.opacity = $scope.opacity;
				element.style.filter = "alpha(opacity=" + $scope.opacity * 100 + ")";
				$scope.opacity += $scope.opacity * 0.1;
			}
		}
	};

	$scope.cancel_timer = function () {
		$timeout.cancel($scope.promise);
	};

	// Show the help window
	$scope.show_help = function () {
		document.getElementById("help_window").style.visibility = "visible";
		document.getElementById("blur").style.visibility = "visible";
		$scope.disable_scroll();
	};

	// Hide the help window
	$scope.hide_help = function () {
		if (document.getElementById("help_window").style.visibility == "visible") {
			document.getElementById("help_window").style.visibility = "hidden";
			document.getElementById("blur").style.visibility = "hidden";
			$scope.enable_scroll();
		}
	};

	$scope.disable_scroll = function () {
	    document.documentElement.style.overflow = 'hidden';  // firefox, chrome
	    document.body.scroll = "no"; // ie only
	}

	$scope.enable_scroll = function () {
	    document.documentElement.style.overflow = 'auto';  // firefox, chrome
	    document.body.scroll = "yes"; // ie only
	}

	$scope.show_input_prompt = function () {
		document.getElementById("input_prompt").style.visibility = "visible";
		document.getElementById("blur").style.visibility = "visible";
		document.getElementById("rda").focus();
		$scope.disable_scroll();
	};

	$scope.hide_input_prompt = function () {
		document.getElementById("input_prompt").style.visibility = "hidden";
		document.getElementById("blur").style.visibility = "hidden";
		document.getElementById("rda").value = "";
		$scope.enable_scroll();
	};

	$scope.disable_code_buttons = function () {
		document.getElementById("add_line").disabled = true;
		document.getElementById("insert_line").disabled = true;
		document.getElementById("delete_line").disabled = true;
		document.getElementById("clear_code").disabled = true;
	};

	$scope.enable_code_buttons = function () {
		document.getElementById("add_line").disabled = false;
		document.getElementById("insert_line").disabled = false;
		document.getElementById("delete_line").disabled = false;
		document.getElementById("clear_code").disabled = false;
	};

	// Add a new line the the code pane
	$scope.add_line = function () {
		var len = $scope.code_lines.length - 1;

		if (len != -1) {
			var line_number = parseInt($scope.code_lines[len].line) + 1;
			var line = {
				line: line_number.toString(),
				highlighted: false,
				command: $scope.commands[0],
				value: ""
			};
			$scope.code_lines.push(line);
		}
		else {
			$scope.code_lines = [
				{
					line: "1",
					highlighted: false,
					command: commands[0],
					value: ""
				}
			];
		}
	};

	$scope.insert_line = function () {
		if ($scope.code_lines.length > 0) {
			// Find the last highlighted line
			var highlighted = null;
			for (var i = $scope.code_lines.length - 1; i >= 0; i--) {
				if ($scope.code_lines[i].highlighted == true) {
					highlighted = i;
					break;
				}
			}
			if (highlighted == null) {
				highlighted = $scope.code_lines.length - 1;
			}

			// Add a line after the last highlighted
			var new_code_lines = new Array();
			var j = 1;
			for (var i = 0; i < $scope.code_lines.length; i++) {
				if (highlighted == i) {
					$scope.code_lines[i].line = j.toString();
					new_code_lines.push($scope.code_lines[i]);

					j++;
					var line = {
						line: j.toString(),
						highlighted: false,
						command: $scope.commands[0],
						value: ""
					};
					new_code_lines.push(line);
					j++;
				}
				else {
					$scope.code_lines[i].line = j.toString();
					new_code_lines.push($scope.code_lines[i]);
					j++;
				}
			}
			$scope.code_lines = new_code_lines;
		}
	};

	// Delete the highlighted lines
	$scope.delete_line = function () {
		var new_code_lines = new Array();
		var j = 1;
		for (var i = 0; i < $scope.code_lines.length; i++) {
			if (!$scope.code_lines[i].highlighted) {
				$scope.code_lines[i].line = j.toString();
				j++;
				new_code_lines.push($scope.code_lines[i]);
			}
		}
		$scope.code_lines = new_code_lines;
	};

	// Delete all code lines
	$scope.clear_code = function () {
		$scope.code_lines = new Array();
	};

	$scope.select_line = function (line_number, result) {
		// If execution finished remove all highlights
		if ($scope.finished == true) {
			$scope.finished = false;
			for (var i = 0; i < $scope.code_lines.length; i++) {
				if ($scope.code_lines[i].highlighted == true) {
					// Unhighlight
					var line;
					line = document.getElementById("line1_" + i.toString());
					line.className = line.className.substring(0,line.className.length - 21);
					line = document.getElementById("line2_" + i.toString());
					line.className = line.className.substring(0,line.className.length - 21);
					line = document.getElementById("line3_" + i.toString());
					line.className = line.className.substring(0,line.className.length - 21);
					$scope.code_lines[i].highlighted = false;
				}
			}
		}

		if ($scope.executing == true && result == true) {
			if ($scope.code_lines[line_number].highlighted == false) {
				// Highlight
				var line;
				line = document.getElementById("line1_" + line_number.toString());
				line.className += " code_number_selected";
				line = document.getElementById("line2_" + line_number.toString());
				line.className += " code_number_selected";
				line = document.getElementById("line3_" + line_number.toString());
				line.className += " code_number_selected";
				$scope.code_lines[line_number].highlighted = true;
			}
			else {
				// Unhighlight
				var line;
				line = document.getElementById("line1_" + line_number.toString());
				line.className = line.className.substring(0,line.className.length - 21);
				line = document.getElementById("line2_" + line_number.toString());
				line.className = line.className.substring(0,line.className.length - 21);
				line = document.getElementById("line3_" + line_number.toString());
				line.className = line.className.substring(0,line.className.length - 21);
				$scope.code_lines[line_number].highlighted = false;
			}
		}
		else if ($scope.executing == false && result == false) {
			if ($scope.code_lines[line_number].highlighted == false) {
				// Highlight
				var line;
				line = document.getElementById("line1_" + line_number.toString());
				line.className += " line_number_selected";
				line = document.getElementById("line2_" + line_number.toString());
				line.className += " line_number_selected";
				line = document.getElementById("line3_" + line_number.toString());
				line.className += " line_number_selected";
				$scope.code_lines[line_number].highlighted = true;
			}
			else {
				// Unhighlight
				var line;
				line = document.getElementById("line1_" + line_number.toString());
				line.className = line.className.substring(0,line.className.length - 21);
				line = document.getElementById("line2_" + line_number.toString());
				line.className = line.className.substring(0,line.className.length - 21);
				line = document.getElementById("line3_" + line_number.toString());
				line.className = line.className.substring(0,line.className.length - 21);
				$scope.code_lines[line_number].highlighted = false;
			}
		}
	};

	$scope.export_code = function() {
		// Encrypt the data
		var data = $scope.code_lines;

		// Remove highlights from saved data
		for (var i = 0; i < data.length; i++) {
			data[i].highlighted = false;
		}

		var encrypted = $scope.encrypt(JSON.stringify(data));

		// Create an invisble link
		var link = document.createElement("a");
		link.style.display = "none";
		link.setAttribute("href", 'data:application/octet-stream;charset=utf-8,' + encrypted);
		link.setAttribute("download", "codigo.jvon");

		// Add the link to the DOM
		document.body.appendChild(link);

		// Start the download
		link.click();
		// Delete the link from DOM
		document.body.removeChild(link);
	};

	$scope.key = CryptoJS.enc.Utf8.parse("ciq3IpalFhkRSerOhNmsbjcD3dRszglG");

	$scope.encrypt = function(data) {
		var encrypted = CryptoJS.AES.encrypt(data, $scope.key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.ZeroPadding });
		var hmac = CryptoJS.HmacSHA512(encrypted.toString(), CryptoJS.SHA512($scope.key)).toString();
		return $scope.identifier + hmac + encrypted;
	};

	$scope.decrypt = function(data) {
		var hmac = data.substring(128,256);
		var encrypted = data.substring(256);

		if (hmac != CryptoJS.HmacSHA512(encrypted, CryptoJS.SHA512($scope.key)).toString()) {
			// The file is invalid or hacked
			alert($scope.strings.file_load_failed);
			return null;
		}
		else {
			var decrypted = CryptoJS.AES.decrypt(encrypted, $scope.key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.ZeroPadding });
			$scope.identifier = data.substring(0,128);
			return decrypted.toString(CryptoJS.enc.Utf8);
		}
	};

	// Watch for changes to the code from external sources and update accordingly
	$scope.$watch('imported_code',function(newValue, oldValue) {
		if (newValue) {
			$scope.code_lines = newValue;
			$scope.imported_code = false;

			// Reset the select dropdowns
			for (var i = 0; i < $scope.code_lines.length; i++) {
				for (var j = 0; j < $scope.commands.length; j++) {
					if ($scope.code_lines[i].command.name == $scope.commands[j].name) {
						$scope.code_lines[i].command = $scope.commands[j];
					}
				}
			}
		}
	});

	// Execute code line by line with an interval
	$scope.repeater = function () {
		if ($scope.execution_started == false) {
			$scope.execution_started = true;
			$scope.promise = $timeout($scope.execute_line, 1);
		}
		else {
			$scope.promise = $timeout($scope.execute_line, 1000 * $scope.speed);
		}
	};

	window.onbeforeunload = function() {
		// Warn the user about leaving the page
	        return $scope.strings.leave;
	};
}]);

// This directive is used to listen for a change to the file box and read the file
jvonapp.directive("importFile", function () {
	return {
		restrict: "A",
		link: function ($scope, element, attributes) {
			element.bind('change', function (evt) {
				var file = evt.target.files[0];

				if (file) {
					var reader = new FileReader();
					reader.onload = function(e) {
						// Decrypt the code and parse it
						var data = $scope.decrypt(e.target.result);
						$scope.imported_code = JSON.parse(data);
						// Erase current lines to rebuild it from the imported file
						for (var i = 0; i < $scope.code_lines.length; i++) {
							if ($scope.code_lines[i].highlighted == true) {
								// Remove highlights from the DOM before we load anything
								$scope.finished = true;
								$scope.select_line(i, true);
							}
						}
						$scope.code_lines = new Array();
						$scope.$apply();
					}

					reader.readAsText(file);
				}
				else {
					alert($scope.strings.file_load_failed);
				}
			});
		}
	};
});

function initialize() {
    document.getElementById("pause_code").disabled = true;
    document.getElementById("stop_code").disabled = true;
}