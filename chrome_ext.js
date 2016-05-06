// This file is responsible for putting the Google Calendar button on the timesheet page
// and telling the eventPage to open a new tab if the button is clicked
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "create_button") {
      createButton();
    }
 });
function createButton() {
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
function openPopUp() {
  chrome.runtime.sendMessage({action: 'open_popup'});
}
