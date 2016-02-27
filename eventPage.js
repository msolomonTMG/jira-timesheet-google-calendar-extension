chrome.runtime.onInstalled.addListener(function (onInstalled) {
    if (onInstalled.reason === 'install') {
        // Check if we have the data we need. If not, prompt for settings data
        chrome.storage.sync.get({
            jira_user: 'unknown',
            jira_password: 'unknown',
            jira_url: 'unknown'
        },
        function(items) {
            var missingItems = false;
            for (k = 0; k < items.length; k++) {
                if (items[k] == 'unknown') {
                    missingItems = true;
                    k += items.length;
                }
            }
            if (missingItems) {
                chrome.tabs.create({url: 'chrome://extensions/?options=' + chrome.runtime.id}, function (tab) {
                    //open the options page on install
                });
            }
        });
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    checkForValidUrl(tab.url);
});

function checkForValidUrl(url) {
    // Compare with the URL
    if (url.match(/\/secure\/TempoUserBoard!timesheet.jspa/) || url.match(/\/secure\/TempoUserView.jspa/)) {
        //if the url matches, send an event to the content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "create_button"});
        });
    }
};

function getCalendarEvents(token, startDate, endDate, callback) {
    var xhttp = new XMLHttpRequest();
    var method = "GET";
    var url = "https://www.googleapis.com/calendar/v3/calendars/primary/events?";

    xhttp.onload = function() {
        if (xhttp.status === 401 || xhttp.status === 404) {
            callback(xhttp.responseText);
        }
        else {
            var events = JSON.parse(xhttp.responseText);
            callback(xhttp.responseText);
        }
    };
    xhttp.onerror = function() {
        callback(xhttp.status);
    };

    if (endDate) {
        endDate = new Date(endDate).toISOString();
        var endParams = String('timeMax=' + endDate + '&');
        url = url.concat(endParams);
    }
    if (startDate) {
        startDate = new Date(startDate).toISOString();
        var startParams = String('timeMin=' + startDate + '&');
        url = url.concat(startParams);
    }

    url = url.concat('singleEvents=true&');
    url = url.concat('orderBy=startTime&');

    xhttp.open(method, url, true);
    xhttp.setRequestHeader('Authorization', 'Bearer ' + token);
    xhttp.send();
    return true; // prevents the callback from being called too early on return
}

function sendEventsAndDefaultTicket(events) {
    chrome.storage.sync.get({
        jira_ticket: 'unknown'
    },
    function(items) {
        if (items.jira_ticket == 'unknown') {
            return false;
            chrome.tabs.create({url: 'chrome://extensions/?options=' + chrome.runtime.id}, function (tab) {});
        }
        else {
            var defaultTicket = items.jira_ticket;
            sendEventsAndDefaultTicket(defaultTicket);
        }
    });

    function sendEventsAndDefaultTicket(defaultTicket) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "show_events", events: events, defaultTicket: defaultTicket});
        });
    }
}

function logTime(timesheets) {
    function postTimeSheetData(jiraInfo) {
        for (i = 0; i < timesheets.length; i++) {
            writeTimesheet(timesheets[i], jiraInfo);
        }
    }

    getJiraInfo(postTimeSheetData);

    // gets jira credentials and jira URL from chrome storage
    // kicks off a function to POST data to JIRA after credentials are received
    function getJiraInfo(callback) {
        chrome.storage.sync.get({
            jira_user: 'unknown',
            jira_password: 'unknown',
            jira_url: 'unknown'
        },
        function(items) {
            // if any of the necessary jira info is missing, send user to options page
            if (items.jira_user == 'unknown' || items.jira_password == 'unknown' || items.jira_url == 'unknown') {
                return false;
                chrome.tabs.create({url: 'chrome://extensions/?options=' + chrome.runtime.id}, function (tab) {});
            }
            else {
                var credentials = btoa(items.jira_user + ":" + items.jira_password);
                var jiraInfo = JSON.stringify({
                    "credentials": credentials,
                    "url": items.jira_url
                });
                callback(jiraInfo, timesheets);
            }
        });
    }

    function writeTimesheet(timesheet, jiraInfo) {
        jiraInfo = JSON.parse(jiraInfo);
        var credentials = jiraInfo.credentials;
        var url = jiraInfo.url + '/rest/api/2/issue/' + timesheet.ticket + '/worklog';

        var data = JSON.stringify({
            "timeSpentSeconds": timesheet.worklog,
            "comment": timesheet.meetingTitle,
            "started": timesheet.startTime
        });

        var xhttp = new XMLHttpRequest();

        xhttp.onload = function() {
            if (xhttp.status === 201) {
                updateRow(timesheet.id, "success");
            }
            else {
                updateRow(timesheet.id, "fail");
            }
        };
        xhttp.onerror = function() {
            // Do whatever you want on error. Don't forget to invoke the
            // callback to clean up the communication port.
            updateRow(timesheet.id, "fail");
        };

        xhttp.open('POST', url, true);

        xhttp.setRequestHeader('Content-Type', 'application/json');
        xhttp.setRequestHeader("X-Atlassian-Token", "nocheck");
        xhttp.setRequestHeader('Authorization', 'Basic ' + credentials);

        xhttp.send(data);
        return true; // prevents the callback from being called too early on return
    }

    function updateRow(rowId, status) {
        // send a message to the content script to update the row based on the status of POSTing the worklog
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "update_row", status: status, rowId: rowId});
        });
    }
}

// handle the different types of requests that can come from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == 'get_events') {
        var startDate = request.timeFrame[0];
        var endDate   = request.timeFrame[1];

        authenticatedXhr("get", "https://www.googleapis.com/calendar/v3/calendars/primary", getCalendarEvents);
        function authenticatedXhr(method, url, callback) {
            var retry = true;
            getTokenAndXhr();

            function getTokenAndXhr() {
              chrome.identity.getAuthToken({ 'interactive': true }, function (access_token) {
                  if (chrome.runtime.lastError) {
                    callback(chrome.runtime.lastError);
                    return;
                  }

                  var xhr = new XMLHttpRequest();
                  xhr.open(method, url);
                  xhr.setRequestHeader('Authorization','Bearer ' + access_token);
                  xhr.send();

                  xhr.onload = function () {
                    if (this.status === 401 && retry) {
                      // This status may indicate that the cached
                      // access token was invalid. Retry once with
                      // a fresh token.
                      retry = false;
                      chrome.identity.removeCachedAuthToken(
                          { 'token': access_token },
                          getTokenAndXhr);
                      return;
                    }

                    callback(access_token, startDate, endDate, sendEventsAndDefaultTicket);
                  }
              });
            }
        }
    }
    else if (request.action == 'open_popup') {
        chrome.tabs.create({'url': 'google-calendar.html'}, function(window) {});
    }
    else if (request.action == 'open_settings') {
        chrome.tabs.create({'url': 'options.html'}, function(window) {});
    }
    else if (request.action == "log_time") {
        logTime(request.timesheets);
    }
    else if (request.action == "xhttp") {
        var xhttp = new XMLHttpRequest();

        var method = request.method ? request.method.toUpperCase() : 'GET';

        if (method == 'POST') {
            xhttp.setRequestHeader('Content-Type', 'application/json');
            xhttp.setRequestHeader("X-Atlassian-Token", "nocheck");
        }

        xhttp.onload = function() {
            if (xhttp.response) {
                var errors = JSON.parse(xhttp.response);
            }

            if (xhttp.getResponseHeader('x-seraph-loginreason') == 'OUT, AUTHENTICATED_FAILED') {
                sendResponse({"errorMessages":["Invalid Credentials"], "errors":{}});
            }
            else if (errors) {
                sendResponse(errors);
            }
            else if (xhttp.status === 401 || xhttp.status === 404) {
                sendResponse(xhttp.status);
            }
            else {
                sendResponse(xhttp.responseText);
            }
        };
        xhttp.onerror = function() {
            // Do whatever you want on error. Don't forget to invoke the
            // callback to clean up the communication port.
            sendResponse(xhttp.status);
        };
        xhttp.open(method, request.url, true);
        xhttp.setRequestHeader('Authorization', 'Basic ' + request.credentials);
        if (xhttp.status === 401) {
            sendResponse({"errorMessages":["Invalid credentials"],"errors":{}});
        }
        xhttp.send(request.data);
        return true; // prevents the callback from being called too early on return
    }
});
