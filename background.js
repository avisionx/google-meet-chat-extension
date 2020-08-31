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
messages = [];
watching = false;
function getNotificationId() {
  var id = (Date.now() * 100) + 1;
  return id.toString();
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "notification") {
    messages.push(request.opt);
    if (!watching) {
      watching = true;
      notifier();
    }
    sendResponse(true);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type == "clean") {
    messages = [];
  }
  sendResponse(true);
});

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