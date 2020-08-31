'use strict';

chrome.runtime.onInstalled.addListener(function () {
  chrome.notifications.create(
    {
      type:"basic",
      title:"Welcome",
      message:"Thank you for installing!",
      iconUrl:"./images/get_started128.png"
    }
  );
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: { hostEquals: 'meet.google.com' }
      })
      ],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});