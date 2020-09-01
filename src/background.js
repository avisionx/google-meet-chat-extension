// Msg array for notifs
var messages = [];
// Is watching for new msgs
var watching = false;

// Generate id based on time
function getNotificationId() {
  var id = (Date.now() * 100) + 1;
  return id.toString();
}

// On install thank you msg
chrome.runtime.onInstalled.addListener(function () {
  chrome.notifications.create(
    {
      type: "basic",
      title: "Welcome",
      message: "Thank you for installing!",
      iconUrl: "./images/get_started128.png"
    }
  );
});

// Create desktop notif using message array
function notifier() {
  if (messages.length > 0) {
    nId = getNotificationId();
    notification = chrome.notifications.create(nId, messages.shift(), function (nId) {
      setTimeout(function (_nId) {
        chrome.notifications.clear(_nId, () => {
          notifier();
        });
      }, 4000, nId);
    });
  } else {
    watching = false;
  }
}

// Listener for new msgs notif event
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "notification") {
    messages.push(request.notifData);
    if (!watching) {
      watching = true;
      notifier();
    }
    sendResponse(true);
  }
});

// Listen for clean msg event
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "clean") {
    messages = [];
  }
  sendResponse(true);
});
