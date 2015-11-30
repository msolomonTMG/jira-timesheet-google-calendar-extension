chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
  	console.log(request);
    if (request.action == "create_button") {
    	console.log('getting asked to create btton');
    	createButton();
    }
    if (request.action == "show_events") {
    	showEvents(request.events);
    }
 });

function createButton() {
	console.log('creating button...');
	var existingButton = document.getElementById('google-calendar-button');
	// build button if not done already
	if (!existingButton) {
		var newButton = '<a href="#" class="aui-button" aria-pressed="false">Google Calendar</a>';
		var newButton = document.createElement("a");
		$(newButton).addClass("aui-button");
		$(newButton).text("Google Calendar");
		$(newButton).attr("aria-pressed", "false");
		$(newButton).attr("href", "#");
		$(newButton).attr("id", "google-calendar-button");
		newButton.addEventListener('click', openPopUp);

		if (document.getElementsByClassName('aui-page-header-actions')[0]) {
			var buttonList = document.getElementsByClassName('aui-page-header-actions')[0].firstChild.nextElementSibling;
		}
		else {
			var buttonList = $('._header__view_navigation___1v2v0').children().eq(1);
		}

		$(buttonList).prepend(newButton);
	}
}

function showEvents(events) {
	//$('.command-bar').hide();
	//$('.tt-content-container').hide();
	//$('.tts-tempo-smartsheet').hide();
	$('#issuetable').find('thead').html('<tr><th>Meeting</th><th>Start Time</th><th>End Time</th><th>Time Spent</th><th>Ticket</th><th>Log</th></tr>');
	$('#tempo-table').find('tbody').html('<td>Sup</td><td>Naah</td>');
	$('#tempo-table').find('tfoot').hide();

	printEvents(events);

	function printEvents(events) {
		var events = JSON.parse(events);
		events = events.items;
		console.log(events.length);
		console.log(events);
	    if (events.length > 0) {
	      for (i = 0; i < events.length; i++) {
	        var event = events[i];

	        if (event.start.dateTime != null) {
	          var startTime = event.start.dateTime;
	          var endTime = event.end.dateTime;

	          var timeElapsed = getTimeElapsed(startTime, endTime);
	          event.timeElapsed = timeElapsed;
	          //addRow(event, i);
	          console.log(event);          
	        }
	      }
	    }
	    else {
	        console.log('No upcoming events found.');
	    }

		function getTimeElapsed(startTime, endTime) {
		  startTimeMilliseconds = new Date(startTime).getTime();
		  endTimeMilliseconds = new Date(endTime).getTime();

		  var timeElapsedMilliseconds = endTimeMilliseconds - startTimeMilliseconds;
		  var timeElapsedFormatted = getHoursMinutes(timeElapsedMilliseconds);

		  return timeElapsedFormatted;
		}

		function formatDate(date) {
		  date = new Date(date);
		  date = String(date).split('GMT')[0];
		  parts = date.match(/([A-Za-z]+)\s([A-Za-z]+)\s(\d\d)\s(\d\d\d\d)\s(\d\d):(\d\d):(\d\d)/);
		  
		  var dayOfWeek  = parts[1];
		  var month      = parts[2];
		  var dayOfMonth = parts[3];
		  var year       = parts[4];
		  var hour       = parseInt(parts[5]);
		  var minutes    = parts[6];
		  var meridian   = "";
		  var space      = " ";

		  if (hour > 12) {
		    hour = hour - 12;
		    meridian = "pm";
		  }
		  else {
		    meridian = "am";
		  }

		  var formatDate = dayOfWeek.concat(space, month, space, dayOfMonth, space, hour, ":", minutes, meridian);
		  return formatDate;
		}

		function getHoursMinutes(duration) {
		  var minutes = parseInt((duration/(1000*60))%60);
		  var hours = parseInt((duration/(1000*60*60))%24);

		  if (hours == 0) {
		    return minutes + "m";
		  }
		  else if (minutes == 0) {
		    return hours + "h";
		  }
		  else {
		    return hours + "h " + minutes + "m"; 
		  }
		}

	}
	//$('#footer').prev().append('<h1>Hello</h1>');
	//console.log(events);
	//var containers = document.getElementsByClassName('content-container tt-content-container');
}

function openPopUp() {
	chrome.runtime.sendMessage({action: 'open_popup'});
}
function getEvents() {
	var timeFrame = getTimeFrame();
	chrome.runtime.sendMessage({action: 'get_events', timeFrame: timeFrame});
}

function getTimeFrame() {
	var timeFrameRaw = $('#tempo-timeframe-bar span').text();
	console.log(timeFrameRaw);
	var timeFramePieces = timeFrameRaw.match(/([A-Za-z]+)\s(\d+),?\s(\d+)?\s?-\s([A-Za-z]+)\s(\d+),\s(\d+)/);
	console.log(timeFramePieces.length);

	//TO DO: THIS NEEDS A SERIOUS LOOKIN AT
	if (timeFramePieces.length < 7) {
		var startMonth 	= timeFramePieces[1];
		var startDay 	= timeFramePieces[2];
		var endMonth 	= timeFramePieces[3];
		var endDay		= timeFramePieces[4];
		var endYear		= timeFramePieces[5];
		var startYear	= timeFramePieces[5];
	}
	else {
		var startMonth 	= timeFramePieces[1];
		var startDay 	= timeFramePieces[2];
		var startYear 	= timeFramePieces[6];
		var endMonth	= timeFramePieces[4];
		var endDay		= timeFramePieces[5];
		var endYear		= timeFramePieces[6];
	}
	var startDate = startMonth.concat(" ", startDay, ", ", startYear);
	var endDate   = endMonth.concat(" ", endDay, ", ", endYear);
	
	var dates = [];
	dates.push(startDate, endDate);
	
	return dates;
}

function requestJiraInfo() {
	/* 	
		all this function does is reuest the eventPage.js to look for jira credentials in local storage
		the eventPage.js will return with "unknown" or the jira credentials.
		right after the credz get passed back, we kick off the createTicket() function
	*/
	var jiraInfo;
	chrome.runtime.sendMessage(
		{
			action: 'get_jira_info'
		}, 

		function(response) {
			// do nothing
	});
}

function createTicket(jiraInfo) {
	var user = jiraInfo.user;
	var password = jiraInfo.password;
	var url = jiraInfo.url;
	var project = jiraInfo.project;

	var pullRequestTitle = $("#pull_request_title").val();
	var credentials = btoa(user + ":" + password);

	var ticketData = JSON.stringify({
		"fields": {
			"project": {
				"key": project
			},
			"summary": pullRequestTitle,
			"description": "Creating ticket automatically with chrome extension",
			"issuetype": {
				"name": "Task"
			},
			"assignee": {
				"name": user
			}
		}
	});

	//POST to JIRA and create a ticket
	chrome.runtime.sendMessage(
		{
	    method: 'POST',
	    action: 'createTicket',
	    credentials: credentials,
	    url: url + '/rest/api/2/issue/',
	    data: ticketData
		}, 
	// on the call back, change to a success message, add ticket to PR title and make create button available
	function(response) {
		response = JSON.parse(response);
		var ticket = response.key;

		launchSuccessMessage(url, ticket);
		amendPullRequestTitle(ticket);
		toggleCreateButtonAvailability("enable");

	});
}
