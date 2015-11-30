// var script = document.createElement('script');
// script.src = 'jquery-2.1.1.min.js';
// script.type = 'text/javascript';
// document.getElementsByTagName('head')[0].appendChild(script);

$(document).ready(function() {
	$('#startDate').datepicker();
	$('#endDate').datepicker();

  // Set default to today
  var defaultDate   = new Date();
  var defaultDay    = defaultDate.getDate();
  var defaultMonth  = (defaultDate.getMonth()) + 1;
  var defaultYear   = defaultDate.getFullYear();

  $('#startDate').val(defaultMonth + '/' + defaultDay + '/' + defaultYear);
  $('#endDate').val(defaultMonth + '/' + defaultDay + '/' + defaultYear);

});

document.getElementById('authorize-button').addEventListener('click', getEvents);
document.getElementById('log-time-button').addEventListener('click', logTime);
document.getElementById('settings').addEventListener('click', openSettings);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
   console.log(request);
    if (request.action == "show_events") {
    	var events = JSON.parse(request.events);
    	displayCalendar(events.items);
    }
    else if (request.action == "update_row") {
      updateRow(request.rowId, request.status);
    }
});

function openSettings() {
  chrome.runtime.sendMessage({action: 'open_settings'}, function(response){ console.log(response); });
}

function getEvents() {
  $('#table-body').empty();
  var startDate = $('#startDate').val();
  var endDate = $('#endDate').val();

  startDate = new Date(startDate);
  endDate 	= new Date(endDate);

  // google api is not inclusive of the end date. 
  // since the user will generally intend to get all meetings for the end date, we need to add a day to the end date
  endDate = endDate.setDate(endDate.getDate() + 1);
  endDate = new Date(endDate);

  startDate = startDate.toISOString();
  endDate = endDate.toISOString();

  var timeFrame = [startDate, endDate];
  console.log(timeFrame);
  chrome.runtime.sendMessage({action: 'get_events', timeFrame: timeFrame}, function(response){ console.log(response); });
}

function displayCalendar(events) {
    if (events.length > 0) {
      $('#warning-row').addClass("hidden");
      $('#log-time-button').removeClass("disabled");

      for (i = 0; i < events.length; i++) {
        var event = events[i];
        console.log(event);
        if (event.start == undefined) {
        	//don't do anything
        }
        else if (!event.start.dateTime) {
          var startTime = event.start.date;
          var endTime = event.end.date;
        }
        else {
          var startTime = event.start.dateTime;
          var endTime = event.end.dateTime;

          var timeElapsed = getTimeElapsed(startTime, endTime);
          event.timeElapsed = timeElapsed;
          addRow(event, i);          
        }
      }
    } 
    else {
        console.log('No upcoming events found.');
        $('#warning-row').removeClass("hidden");
        if ( $('#log-time-button').hasClass('disabled') == false ) {
          $('#log-time-button').addClass('disabled');
        }
    }
}

function updateRow(rowId, status) {
  var row = 'row[' + rowId + ']';
  row = document.getElementById(row);

  if (status == "success") {
    $(row).addClass('success');
  }
  else {
    $(row).addClass('danger');
    if ( $('#danger-row').hasClass('hidden') ) {
      $('#danger-row').removeClass('hidden');
    }
  }

  console.log(request.status);
  console.log(request.rowId);
}

function addRow(event, counter) {
  var tableBody = document.getElementById('timesheet-table').getElementsByTagName('tbody')[0];
  var newRow = tableBody.insertRow(tableBody.rows.length);
  newRow.id = 'row[' + counter + ']';
  
  var meetingCell = newRow.insertCell(0);
  var meetingText = document.createTextNode(event.summary);
  var meetingTextHiddenInput = '<input id="meetingText[' + counter + ']" type="hidden" value="' + event.summary + '">';
  meetingCell.innerHTML = meetingTextHiddenInput;
  meetingCell.appendChild(meetingText);

  var startCell = newRow.insertCell(1);
  var startTime = document.createTextNode(formatDate(event.start.dateTime));
  var startTimeHiddenInput = '<input id="startTime[' + counter + ']" type="hidden" value="' + event.start.dateTime + '">';
  startCell.innerHTML = startTimeHiddenInput;
  startCell.appendChild(startTime);

  var endCell = newRow.insertCell(2);
  var endTime = document.createTextNode(formatDate(event.end.dateTime));
  endCell.appendChild(endTime);

  var timeCell = newRow.insertCell(3);
  var timeMarkUp = '<input id="worklog[' + counter + ']" class="form-control" type="text" value="'+ event.timeElapsed +'"">';
  timeCell.innerHTML = timeMarkUp;

  var ticketCell = newRow.insertCell(4);
  // TO DO: SAVE DEFAULT TICKET IN CHROME MEMORY
  var defaultTicket = "TR-264";
  var ticketMarkUp = '<input id="ticket[' + counter + ']" class="form-control" type="text" value="'+ defaultTicket +'"">';
  ticketCell.innerHTML = ticketMarkUp;

  var checkBoxCell = newRow.insertCell(5);
  //var userAttendedMeeting = attendedMeeting(event);
  var userAttendedMeeting = true;
  if (userAttendedMeeting === true) {
    var checkBoxMarkUp = '<input id="checkbox[' + counter + ']" type="checkbox" checked> <label for="checkbox[' + counter + ']"></label>';
  }
  else {
    var checkBoxMarkUp = '<input id="checkbox[' + counter + ']" type="checkbox"> <label for="checkbox[' + counter + ']"></label>';
  }
  checkBoxCell.innerHTML = checkBoxMarkUp;
}

function attendedMeeting(event) {
  console.log(event.summary);
  var attended = false;
  for (i = 0; i < event.attendees.length; i++) {
    var attendee = event.attendees[i];
    if (attendee.self == true) {
      if (attendee.responseStatus == true) {
        i += event.attendees.length;
        attended = true;
      }
    }
  }
  console.log("Attended " + event.summary + ": " + attended);
  return attended;
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

function convertToSeconds(worklog) {
  var times = worklog.match(/(\d+h)?\s?(\d+m)?/);
  console.log(times);
  var seconds = 0;
  //for (i = 0; i < times.length; i++) {
    var hours = 0;
    var minutes = 0;
    if (times[1] == undefined) {
      minutes = times[2].split('m')[0];
    }
    else if (times[2] == undefined) {
      hours = times[1].split('h')[0];
    }
    else {
      hours = times[1].split('h')[0];

      minutes = times[2].split(' ')[0];
      minutes = minutes.split('m')[0];
    }
    hours = parseInt(hours);
    minutes = parseInt(minutes);

    hours = hours * 3600;
    minutes = minutes * 60;

    seconds += hours;
    seconds += minutes;
  //}
  return seconds;
}

function logTime() {
  if ( $('#log-time-button').hasClass('disabled') ) {
    // if the button is disabled, do nothing
  }
  else {
    var worklogs = $("[id^=worklog]");
    var tickets = $("[id^=ticket");
    var startTimes = $("[id^=startTime");
    var meetingTitles = $("[id^=meetingText");
    var checkboxes = $("[id^=checkbox]");
    var timesheets = [];

    for (i = 0; i < worklogs.length; i++) {
      var id = i;
      var worklog = worklogs[i];
      var ticket = tickets[i];
      var startTime = startTimes[i];
      var meetingTitle = meetingTitles[i];
      var checkbox = checkboxes[i];
      var isChecked = $(checkbox).is(":checked");

      if (isChecked == true) {
        worklog = convertToSeconds(worklog.value);
        console.log(worklog);
        var timesheet = {
          "id": i,
          "worklog": worklog,
          "ticket": ticket.value,
          "startTime": startTime.value,
          "meetingTitle": meetingTitle.value
        }
        timesheets.push(timesheet);
      }

      //console.log("worklog: " + worklog.value);
      //console.log("ticket: " + ticket.value);
      //console.log("checkbox: " + isChecked);
    }
    console.log(timesheets);
    chrome.runtime.sendMessage({action: 'log_time', timesheets: timesheets}, function(response){ console.log(response); });
  }
}