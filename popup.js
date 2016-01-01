var CLIENT_ID = '826186761919-hibt42ul8mkqn7l43mbmcrtjd0g7vq4u.apps.googleusercontent.com';
var SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Check if current user has authorized this application.
 */
function checkAuth() {
  $('#loading-wrapper').show();
  gapi.auth.authorize(
    {
      'client_id': CLIENT_ID,
      'scope': SCOPES.join(' '),
      'immediate': true
    }, handleAuthResult);
}

/**
 * Handle response from authorization server.
 *
 * @param {Object} authResult Authorization result.
 */
function handleAuthResult(authResult) {
  if (authResult && !authResult.error) {
    // Hide auth UI, then load client library.
    loadCalendarApi();
  } else {
    // Show auth UI, allowing the user to initiate authorization by
    // clicking authorize button.
    $('#authorize-wrapper').show();
    $('#loading-wrapper').hide();
  }
}

/**
 * Initiate auth flow in response to user clicking authorize button.
 *
 * @param {Event} event Button click event.
 */
function handleAuthClick(event) {
  console.log(event);
  gapi.auth.authorize(
    {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
    handleAuthResult);
  return false;
}

/**
 * Load Google Calendar client library. List upcoming events
 * once client library is loaded.
 */
function loadCalendarApi() {
  gapi.client.load('calendar', 'v3', listUpcomingEvents);
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
function listUpcomingEvents() {
  var roosterID   = 'thrillist.com_2d3936303334393335393533@resource.calendar.google.com';
  var sharkTankID = 'thrillist.com_31383134303732383237@resource.calendar.google.com';
  var wombatID    = 'thrillist.com_2d3535373539383936343135@resource.calendar.google.com';
  var elephantID  = 'thrillist.com_2d3239313936373834383339@resource.calendar.google.com';
  var meerkatID   = 'thrillist.com_2d31393431303037352d3332@resource.calendar.google.com';
  var gorillaID   = 'thrillist.com_2d37323835323835332d353234@resource.calendar.google.com';
  var chipmunkID  = 'thrillist.com_2d34303432303330342d373136@resource.calendar.google.com';
  var ostritchID  = 'thrillist.com_3135313833383834363636@resource.calendar.google.com';
  var giraffeID   = 'thrillist.com_2d3630313530313135313732@resource.calendar.google.com';
  var pandaID     = 'thrillist.com_2d3430383731353137353131@resource.calendar.google.com';
  var sealID      = 'thrillist.com_2d3732343833303537313735@resource.calendar.google.com';

  var calendarRequest = function(calendarID) {
    var timeMin = new Date();
    var timeMax = new Date().setHours(24, 0, 0);
    timeMax = new Date(timeMax);

    return gapi.client.calendar.events.list({
      'calendarId': calendarID,
      'timeMin': timeMin.toISOString(),
      'timeMax': timeMax.toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'orderBy': 'startTime'
    });
  };

  var roosterEvents   = calendarRequest(roosterID);
  var sharkTankEvents = calendarRequest(sharkTankID);
  var wombatEvents    = calendarRequest(wombatID);
  var elephantEvents  = calendarRequest(elephantID);
  var meerkatEvents   = calendarRequest(meerkatID);
  var gorillaEvents   = calendarRequest(gorillaID);
  var chipmunkEvents  = calendarRequest(chipmunkID);
  var ostritchEvents  = calendarRequest(ostritchID);
  var giraffeEvents   = calendarRequest(giraffeID);
  var pandaEvents     = calendarRequest(pandaID);
  var sealEvents      = calendarRequest(sealID);

  var batch = gapi.client.newBatch();

  batch.add(roosterEvents,  {'id': 'roosterEvents'}); 
  batch.add(sharkTankEvents,{'id': 'sharkTankEvents'});
  batch.add(wombatEvents,   {'id': 'wombatEvents'});
  batch.add(elephantEvents, {'id': 'elephantEvents'});
  batch.add(meerkatEvents,  {'id': 'meerkatEvents'});
  batch.add(gorillaEvents,  {'id': 'gorillaEvents'});
  batch.add(chipmunkEvents, {'id': 'chipmunkEvents'});
  batch.add(ostritchEvents, {'id': 'ostritchEvents'});
  batch.add(giraffeEvents,  {'id':  'giraffeEvents'});
  batch.add(pandaEvents,    {'id': 'pandaEvents'});
  batch.add(sealEvents,     {'id': 'sealEvents'});

  batch.execute(createRooms);

  function createRooms(responseMap) {
    console.log(responseMap);
    var rooms = [];

    var room = function(id, name, floor, events) {
      return {
        'id': id,
        'name': name,
        'floor': floor,
        'events': events.result.items
      };
    };

    var rooster   = room(roosterID,  'Rooster',   4, responseMap.roosterEvents);
    var sharkTank = room(sharkTankID,'Shark Tank',4, responseMap.sharkTankEvents);
    var wombat    = room(wombatID,   'Wombat',    4, responseMap.wombatEvents);
    var elephant  = room(elephantID, 'Elephant',  4, responseMap.elephantEvents);
    var meerkat   = room(meerkatID,  'Meerkat',   5, responseMap.meerkatEvents);
    var giraffe   = room(giraffeID,  'Giraffe',   5, responseMap.giraffeEvents);
    var gorilla   = room(gorillaID,  'Gorilla',   5, responseMap.gorillaEvents);
    var chipmunk  = room(chipmunkID, 'Chipmunk',  5, responseMap.chipmunkEvents);
    var ostritch  = room(ostritchID, 'Ostritch',  5, responseMap.ostritchEvents);
    var panda     = room(pandaID,    'Panda',     6, responseMap.pandaEvents);
    var seal      = room(sealID,     'Seal',      6, responseMap.sealEvents);

    //rooms.push(rooster, sharkTank, wombat, elephant, meerkat, giraffe, gorilla, chipmunk, ostritch, panda, seal);
    rooms.push(elephant, rooster, sharkTank, wombat, chipmunk, giraffe, gorilla, meerkat, ostritch, panda, seal);
    
    rooms.forEach(function(room) {
      findIfOccupied(room);
      findNextAvailableTime(room, 0);
      findAvailableUntilTime(room);
      addRow(room);
    });
    $('[data-toggle="tooltip"]').tooltip({
      html: true
    });

    function findIfOccupied(room) {
      var isOccupied = false;

      if (room.events.length > 0) {
        var now   = new Date();
        var start = new Date(room.events[0].start.dateTime);
        var end   = new Date(room.events[0].end.dateTime);

        if (start < now && end > now) {
          isOccupied = true;
        }
      }
      else {
        room.isOccupied = false;
      }

      room.isOccupied = isOccupied;
    };

    function findNextAvailableTime(room, index) {
      var nextAvailableTime = new Date();

      if (room.events.length === 0) {
        var now = new Date();

        if (now.getMinutes() < 30) {
          nextAvailableTime.setHours(now.getHours(), 30, 0);
        }
        else {
          nextAvailableTime.setHours(now.getHours() + 1, 0, 0);
        }
      }
      else {
        if (room.events[index + 1] == undefined) {
          nextAvailableTime = new Date(room.events[index].end.dateTime);
        }
        else {
          var currentEndTime = new Date(room.events[index].end.dateTime);
          var nextStartTime  = new Date(room.events[index+1].start.dateTime);
          var secsUntilNextEvent = nextStartTime - currentEndTime;
          // if there is no time in between the end of the current event and the start of the next,
          // recursively call this function and look at the next set of meetings
          if (secsUntilNextEvent === 0) {
            findNextAvailableTime(room, index + 1);
            return false;
          }
          // TO DO: secsUntilNextEvent should be the maximum time you can book the room to ensure that 
          // we do not try to book a room that is booked at an odd time like on the 15's or 45's
          //
          // if there is some time in between the end of the current meeting and the start of the next,
          // the next available time for the room is the end of the current meeting
          else {
            nextAvailableTime = currentEndTime;
          }
        }
      }
      room.nextAvailableTime = nextAvailableTime;
      
      if (room.nextAvailableTime) {
        setDisplayTime();
        setNextAvailableEndTime();

        function setNextAvailableEndTime() {
          if (room.events[index + 1]) {
            room.nextAvailableEndTime = new Date(room.events[index + 1].start.dateTime);
          }
        }

        function setDisplayTime() {
          var displayHours = room.nextAvailableTime.getHours();
          var displayMins  = room.nextAvailableTime.getMinutes();
          var meridian     = 'am';

          if (displayHours > 11) {
            meridian = 'pm';
          }
          if (displayHours > 12) {
            displayHours = displayHours - 12;
          }
          if (displayMins < 10) {
            displayMins = '0' + displayMins;
          }
          room.nextAvailableTimeDisplay = displayHours + ':' + displayMins + meridian;
        }
      }
    };

    function findAvailableUntilTime(room) {
      // if there are no upcoming events for the room, it is available for the rest of the day
      // the next available time to book will last until the next 30m or the next hour (whatever is first)
      if (room.events.length === 0) {
        var now = new Date();
        if (now.getMinutes() < 30) {
          var availableUntil = new Date().setHours(now.getHours(), 30, 0);
        }
        else {
          var availableUntil = new Date().setHours(now.getHours() + 1, 0, 0);
        }
        room.availableUntil = new Date(availableUntil);
        room.availableUntilDisplay = 'Available for the rest of the day';
      }
      // if there are upcoming events, the room is available until the start of the next event
      else {
        room.availableUntil = new Date(room.events[0].start.dateTime);
        var displayHours = room.availableUntil.getHours();
        var displayMins  = room.availableUntil.getMinutes();
        var meridian     = 'am';

        if (displayHours > 12) {
          displayHours = displayHours - 12;
          meridian     = 'pm';
        }
        if (displayMins < 10) {
          displayMins = '0' + displayMins;
        }
        room.availableUntilDisplay = 'Available until ' + displayHours + ':' + displayMins + meridian;
      }
    }

    function addRow(room) {
      // put a new row on the table
      var tableBody = document.getElementById('rooms-table').getElementsByTagName('tbody')[0];
      var newRow    = tableBody.insertRow(tableBody.rows.length);
      // put a class on the row representing the floor number so we can filter on it later
      $(newRow).addClass('' + room.floor + '');

      // ROOM COLUMN
      var roomCell = newRow.insertCell(0);
      var roomText = document.createTextNode(room.name);
      roomCell.appendChild(roomText);

      // MEETING TITLE COLUMN
      var meetingCell = newRow.insertCell(1);
      var meetingText = document.createElement('span');

      // BOOK NOW BUTTON
      var bookNowButtonCell = newRow.insertCell(2);
      $(bookNowButtonCell).addClass('text-center');
      var bookNowButton = document.createElement('button');
      $(bookNowButton).attr('id', 'bookNow_' + room.name);
      // if the room is occupied show the current meeting and disable the book now button
      if (room.isOccupied) {
        $(meetingText).text(room.events[0].summary);

        $(bookNowButton).addClass('btn btn-xs btn-default disabled');
        $(bookNowButton).text('not available');
      }
      // if the room is open show that it is available with a book now button and text in the meeting column
      else {
        $(bookNowButton).addClass('btn btn-xs btn-primary');
        $(bookNowButton).text('book now');
        $(bookNowButton).attr('roomID', room.id);
        $(bookNowButton).attr('nextAvailableTime', room.nextAvailableTime);
        $(bookNowButton).attr('availableUntil', room.availableUntil);

        $(bookNowButton).one("click", function() {
          book('now', $(this), room);
          //bookNow( $(this), room );
        });

        $(meetingText).text(room.availableUntilDisplay);
      }
      bookNowButtonCell.appendChild(bookNowButton);

      meetingCell.appendChild(meetingText);
      $(meetingCell).attr('id', 'meetingCell_' + room.name);

      if (room.events.length > 0) {
        addToolTip(room, $(meetingText));
      }

      // BOOK LATER BUTTON
      var bookLaterButtonCell = newRow.insertCell(3);
      $(bookLaterButtonCell).addClass('text-center');
      var bookLaterButton = document.createElement('button');
      $(bookLaterButton).attr('id', 'bookLater_' + room.name);

      if (!room.isOccupied && room.events.length > 0) {
        addToolTip(room, $(meetingText));
      }
      $(bookLaterButton).addClass('btn btn-xs btn-default');
      $(bookLaterButton).text(room.nextAvailableTimeDisplay);
      $(bookLaterButton).attr('nextAvailableTime', room.nextAvailableTime);
      $(bookLaterButton).attr('nextAvailableEndTime', room.nextAvailableEndTime);
      $(bookLaterButton).attr('roomID', room.id);
      bookLaterButtonCell.appendChild(bookLaterButton);

      $(bookLaterButton).one("click", function() {
        book('later', $(this), room);
       // bookLater( $(this) );
      });

      nextAvailableTimeContainer = document.createElement('span');
      nextAvailableTimeInput = '<input id="nextTime_' + room.id + '" type="hidden" value="' + room.nextAvailableTime + '">';
      $(nextAvailableTimeContainer).html(nextAvailableTimeInput);
      bookLaterButtonCell.appendChild(nextAvailableTimeContainer);
    };
    console.log(rooms);
    displayRoomInfo();
  };
}

function addToolTip(room, meetingText) {
  var toolTipPosition = 'right';
  var owner;

  $(meetingText).attr('data-toggle', 'tooltip');
  $(meetingText).attr('data-placement', toolTipPosition);
  $(meetingText).attr('data-container', 'body');

  if (room.events.length > 0) {
    if (room.isOccupied && room.events[0].attendees) {
      var attendeesString = ' ';
      room.events[0].attendees.forEach(function(attendee) {
        if (!attendee.resource) {
          if (!attendee.displayName) {
            var attendeeName = attendee.email;
          }
          else {
            var attendeeName = attendee.displayName;
          }

          if (attendee.organizer === true) {
            attendeeName += ' (owner)';
          }

          if (attendee.responseStatus == "accepted") {
            attendeesString += attendeeName + ' <i class="fa fa-check"></i>' + '\n';
          }
          else if (attendee.responseStatus == "declined"){
            attendeesString += '<del>' + attendeeName + '</del> <i class="fa fa-times"></i>' + '\n';
          }
          else if (attendee.responseStatus == "tentative") {
            attendeesString += attendeeName + ' <i class="fa fa-question"></i>' + '\n';
          }
          else {
            attendeesString += attendeeName + '\n';
          }
        }
      });
      $(meetingText).attr('title', attendeesString);
      //$(meetingText).attr('title', '<i class="fa fa-refresh"></i>');
    }
    else {
      // as far as I know, the creator and organizer are the same thing
      // but if I'm wrong, check if they exist and use the one that is present
      // if nothing exists, then show nothing in the tooltip.
      if (room.events[0].organizer) {
        if (!room.events[0].organizer.displayName) {
          owner = room.events[0].organizer.email;
        }
        else {
          owner = room.events[0].organizer.displayName;
        }
      }
      else if (room.events[0].creator) {
        if (!room.events[0].creator.displayName) {
          owner = room.events[0].creator.email;
        }
        else {
          owner = room.events[0].creator.displayName;
        }
      }
      else {
        owner = 'unknown';
      }
      var nextMeetingStart = room.availableUntilDisplay.match(/Available until (.+)/)[1];
      $(meetingText).attr('title', owner + ' booked this room at ' + nextMeetingStart + ' for ' + room.events[0].summary);
    }
  }
}

function book(timeframe, buttonElement, room) {
  var summary   = 'Ad Hoc Meeting';
  var startTime;
  var endTime;

  $(buttonElement).html('<i class="fa fa-refresh fa-spin"></i>');

  if (timeframe == 'now') {
    startTime = new Date();
    endTime   = room.availableUntil;

    if (!endTime) {
      var now = new Date();
      if (now.getMinutes() < 30) {
        endTime = new Date(now.getHours(), 30, 0);
      }
      else {
        endTime = new Date(now.getHours() + 1, 0, 0);
      }
      POSTgoogle();
    }
    else {
      endTime = new Date(endTime);
      adjustDuration(POSTgoogle);
    }
  }
  else {
    startTime = room.nextAvailableTime;
    endTime   = room.nextAvailableEndTime;

    startTime = new Date(startTime);
    if (!endTime) {
      endTime = new Date();
      if (startTime.getMinutes() < 30) {
        endTime = endTime.setHours(startTime.getHours(), 30, 0);
        endTime = new Date(endTime);
      }
      else {
        endTime = endTime.setHours(startTime.getHours() + 1, 0, 0);
        endTime = new Date(endTime);
      }
      POSTgoogle();
    }
    else {
      endTime = new Date(endTime);
      adjustDuration(POSTgoogle);
    }
  }

  // booking from now until the next available time could result in meetings that last for hours
  // we should adjust the duration of the meeing to be 30min or the start of the next meeting (whichever is first)
  function adjustDuration(callback) {
    var duration = (endTime - startTime)/60000; // get the duration in minutes
    if (duration > 30) {
      if (startTime.getMinutes() < 30) {
        endTime = new Date().setHours(startTime.getHours(), 30, 0);
      }
      else{
        endTime = new Date().setHours(startTime.getHours() + 1, 0, 0);
      }
      endTime = new Date(endTime);
    }
    callback();
  }

  function POSTgoogle() {
    var event = {
      'summary': summary,
      'description': 'Created with the Thrillist Rooms Chrome Extension: http://bit.ly/thrillist_rooms_extension',
      'start': {
        'dateTime': startTime
      },
      'end': {
        'dateTime': endTime
      },
      'attendees': [
        {'email': room.id}
      ]
    };
    var request = gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': event
    });

    request.execute(function(event) {
      console.log(event);
      if (event.code) {
        console.log('error');
        $(buttonElement).removeClass('btn-default');
        $(buttonElement).addClass('btn-danger');
        $(buttonElement).html('error!');
      }
      else {
        $(buttonElement).removeClass('btn-default');
        $(buttonElement).addClass('btn-success');
        $(buttonElement).html('booked!');

        if (timeframe == 'now') {
          $('#meetingCell_' + room.name).html(summary);
        }
      }
    });
  }
}

function displayRoomInfo() {
  $('#loading-wrapper').addClass('fade');
  $('.container').show('fade', function() {
    $('#loading-wrapper').hide();
  });
  $('#4floor').change(function() {
    $('.4').toggle('slow');
    saveFilter();
  });
  $('#5floor').change(function() {
    $('.5').toggle('slow');
    saveFilter();
  });
  $('#6floor').change(function() {
    $('.6').toggle('slow');
    saveFilter();
  });
}

function saveFilter() {
  var showFourthFloorByDefault = true;
  var showFifthFloorByDefault  = true;
  var showSixthFloorByDefault  = true;

  if ( !$('.4').is(':visible') ) {
    showFourthFloorByDefault = false;
  }
  if ( !$('.5').is(':visible') ) {
    showFifthFloorByDefault = false;
  }
  if ( !$('.6').is(':visible') ) {
    showSixthFloorByDefault = false;
  }

  chrome.storage.sync.set({
    show_fourth_floor: showFourthFloorByDefault,
    show_fifth_floor: showFifthFloorByDefault,
    show_sixth_floor: showSixthFloorByDefault
  });
}

$(document).ready(function(){
  $('.container').hide();
  
  $('#authorize-button').click(function() {
    handleAuthClick(event)
  });

  chrome.storage.sync.get({
    show_fourth_floor: true,
    show_fifth_floor: true,
    show_sixth_floor: true
  },
  function (items) {
    if (items.show_fourth_floor === false) {
      $('.4').toggle();
    }
    if (items.show_fifth_floor === false) {
      $('.5').toggle();
    }
    if (items.show_sixth_floor === false) {
      $('.6').toggle();
    }
  });
});