// This file is responsible for printing the google calendar events on the page
// and sending the data to the eventPage when the user submits the data

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

  // if the start date changes, make sure the end date is in the future or same day as start
  // if the end date changes, make sure the start date is in the past or same day as end
  $('#startDate').change(function() {
    var startDate = $('#startDate').val();
    var endDate   = $('#endDate').val();
    if ( startDate > endDate) {
      $('#endDate').val(startDate);
    }
  });
  $('#endDate').change(function() {
    var startDate = $('#startDate').val();
    var endDate   = $('#endDate').val();
    if ( endDate < startDate) {
      $('#startDate').val(endDate);
    }
  });

});

document.getElementById('authorize-button').addEventListener('click', getEvents);
document.getElementById('log-time-button').addEventListener('click', logTime);
document.getElementById('settings').addEventListener('click', openSettings);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "show_events") {
    	var events = JSON.parse(request.events);
    	displayCalendar(events.items, request.defaultTicket);
    }
    else if (request.action == "update_row") {
      updateRow(request.rowId, request.status);
    }
});

function openSettings() {
  chrome.runtime.sendMessage({action: 'open_settings'});
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
  chrome.runtime.sendMessage({action: 'get_events', timeFrame: timeFrame});
}

function displayCalendar(events, defaultTicket) {
  if (events.length > 0) {
    $('#warning-row').addClass("hidden");
    $('#log-time-button').removeClass("disabled");

    for (i = 0; i < events.length; i++) {
      var event = events[i];
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
        addRow(event, i, defaultTicket);
      }
    }
  }
  else {
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
}

function addRow(event, counter, defaultTicket) {
  var tableBody = document.getElementById('timesheet-table').getElementsByTagName('tbody')[0];
  var newRow = tableBody.insertRow(tableBody.rows.length);
  newRow.id = 'row[' + counter + ']';

  var meetingCell = newRow.insertCell(0);
  //var meetingText = document.createTextNode(event.summary);
  //var meetingTextHiddenInput = '<input id="meetingText[' + counter + ']" type="hidden" value="' + event.summary + '">';
	var meetingTextMarkup = '<input id="meetingText[' + counter + ']" class="form-control" type="text" value="' + event.summary + '">';
  //meetingCell.innerHTML = meetingTextHiddenInput;
	meetingCell.innerHTML = meetingTextMarkup;
  //meetingCell.appendChild(meetingText);

  var startCell = newRow.insertCell(1);
  var startTime = document.createTextNode(formatDate(event.start.dateTime));
  var startTimeForAPI = formatTimeForAPI(event.start.dateTime);
  var startTimeHiddenInput = '<input id="startTime[' + counter + ']" type="hidden" value="' + startTimeForAPI + '">';
  startCell.innerHTML = startTimeHiddenInput;
  startCell.appendChild(startTime);

  var endCell = newRow.insertCell(2);
  var endTime = document.createTextNode(formatDate(event.end.dateTime));
  endCell.appendChild(endTime);

  var timeCell = newRow.insertCell(3);
  var timeMarkUp = '<input id="worklog[' + counter + ']" class="form-control" type="text" value="'+ event.timeElapsed +'"">';
  timeCell.innerHTML = timeMarkUp;

  var ticketCell = newRow.insertCell(4);
  checkEventForTicket(event);

  var checkBoxCell = newRow.insertCell(5);

  shouldLog(event);

  // find out if the description or summary of the event contains a ticket number
  // if it does, use that instead of the default ticket. event title trumps event description
  function checkEventForTicket(event) {
    var ticket       = '';
    var ticketMarkUp = '';

    if (event.description) {
      // check the description and the meeting title for a ticket
      if (event.description.match(/([A-Za-z]+-[0-9]+)/)) {
        var ticketInDescription = event.description.match(/([A-Za-z]+-[0-9]+)/)[0];
        ticket = ticketInDescription;
      }
      if (event.summary.match(/([A-Za-z]+-[0-9]+)/)) {
        var ticketInTitle = event.summary.match(/([A-Za-z]+-[0-9]+)/)[0];
        ticket = ticketInTitle;
      }
      // if the event had a description but no ticket was found, set the ticket to the default
      else if (!ticketInDescription && !ticketInTitle) {
        ticket = defaultTicket;
      }
    }
    // if the event has no description (or no title), set the ticket to the default
    else {
      ticket = defaultTicket;
    }

    ticketMarkUp = '<input id="ticket[' + counter + ']" class="form-control" type="text" value="'+ ticket +'"">';
    ticketCell.innerHTML = ticketMarkUp;
  }
  
  // check if log is enabled and user attended the meeting and if they did, check the box next to the meeting
  function shouldLog(event) {
    if (checkIfLogEnabled(event) && hasAttended(event)) {
      var checkBoxMarkUp = '<input id="checkbox[' + counter + ']" type="checkbox" checked> <label for="checkbox[' + counter + ']"></label>';
    }
    else {
      var checkBoxMarkUp = '<input id="checkbox[' + counter + ']" type="checkbox"> <label for="checkbox[' + counter + ']"></label>';
    }
    checkBoxCell.innerHTML = checkBoxMarkUp;
  }
  
  //check if this meeting has a "NO_JIRA_LOG" (case insensitive) tag, determining that this meeting should not be logged by default
  function checkIfLogEnabled(event) {
    return !(event.description && event.description.match(/[Nn][Oo]_[Jj][Ii][Rr][Aa]_[Ll][Oo][Gg]/)) && !event.summary.match(/[Nn][Oo]_[Jj][Ii][Rr][Aa]_[Ll][Oo][Gg]/);
  }

  // find out if the user attended the meeting
  function hasAttended(event) {
    var attended = false;
    if (!event.attendees) {
      attended = true;
    }
    else {
      for (k = 0; k < event.attendees.length; k++) {
        var attendee = event.attendees[k];
        if (attendee.self == true) {
          if (attendee.responseStatus == "accepted") {
            k += event.attendees.length;
            attended = true;
          }
        }
      }
    }
    return attended;
  }
}

function getTimeElapsed(startTime, endTime) {
  startTimeMilliseconds = new Date(startTime).getTime();
  endTimeMilliseconds = new Date(endTime).getTime();

  var timeElapsedMilliseconds = endTimeMilliseconds - startTimeMilliseconds;
  var timeElapsedFormatted = getHoursMinutes(timeElapsedMilliseconds);

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

function convertToSeconds(worklog) {
  var times = worklog.match(/(\d+h)?\s?(\d+m)?/);
  var seconds = 0;
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

  return seconds;
}

// takes a date like '2015-11-30T10:00:00-05:00'
// and returns       '2015-11-30T10:00:00.000-0500'
// needed because google and jira use different formats
function formatTimeForAPI(time) {
  // first remove the last semicolon
  var endOfTime = time.match(/\d\d[-\+]\d\d:\d\d/);
  endOfTime = endOfTime[0].replace(':', '');
  time = time.replace(/\d\d[-\+]\d\d:\d\d/, endOfTime);

  // then add milliseconds
  startOfTime = time.split(/[-\+]\d\d\d\d/)[0];
  endOfTime   = time.split(/T\d\d:\d\d:\d\d/)[1];
  startOfTime = startOfTime + '.000';

  time = startOfTime + endOfTime;
  return time;
}

function logTime() {
  if ( $('#log-time-button').hasClass('disabled') ) {
    // if the button is disabled, do nothing
  }
  else {
    $('#log-time-button').addClass('disabled');
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
        var timesheet = {
          "id": i,
          "worklog": worklog,
          "ticket": ticket.value,
          "startTime": startTime.value,
          "meetingTitle": meetingTitle.value
        }
        timesheets.push(timesheet);
      }
    }
    chrome.runtime.sendMessage({action: 'log_time', timesheets: timesheets});
  }
}
