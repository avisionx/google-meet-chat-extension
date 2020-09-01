// Set notif btn active
var mActive = true;

// Selectors for different elements
const selectors = {
  ariaLive: '[aria-live=polite]:not([aria-atomic])',
  chatBalloon: '.NSvDmb',
  actionButtons: '[data-tooltip][data-is-muted]',
  participantId: '[data-initial-participant-id]',
  topButtons: '[data-tooltip][data-tab-id]'
};

// Functions to get elements
const getAriaLive = () => { return document.querySelector(selectors.ariaLive); }; // When chat area open
const getBalloonChat = () => { return document.querySelector(selectors.chatBalloon); }; // When chat closed uses baloon
const getTopButtons = () => { return document.querySelectorAll(selectors.topButtons); };
const getParticipantId = () => { return document.querySelector(selectors.participantId); };
const getActionButtons = () => {
  let b = document.querySelector(selectors.actionButtons);
  return b ? b.parentNode.parentNode.parentNode.parentNode : null;
};

// Initiate
initialConfig()

// Wait for meeting to start
function initialConfig() {
  setTimeout(() => { getParticipantId() ? initialize() : initialConfig() }, 1000);
}

function initialize() {
  // Watch balloon msgs
  configClosedChatObserver();

  // Listen button click on top bar to toggle opened chat box
  getTopButtons().forEach(el => {
    el.addEventListener('click', () => {
      configOpenedChatObserver();
    })
  })

  // Add toggle button in bottom bar
  addToggler();
}

// Add toggle switch element to on/off notifications
function addToggler() {
  // Check for shadowDom
  if (!document.body.createShadowRoot) {
    
    // Add tempDiv to bottom bar
    let bottomBar = getActionButtons().parentElement;
    let temp = document.createElement('div');
    temp.id = 'host';
    let bt = bottomBar.childNodes[2].prepend(temp);

    // Create button inside
    let elShadow = document.querySelector("#host").attachShadow({ mode: 'closed' });
    let el = document.createElement('div');
    el.innerHTML = `
      <style>
        .switch {
          position: relative;
          display: inline-block;
          width: 58px;
          height: 30px;
        }
        .switch input { 
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          -webkit-transition: .4s;
          transition: .4s;
        }
        .slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 24px;
          left: 4px;
          bottom: 3px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: #2196F3;
        }
        input:focus + .slider {
          box-shadow: 0 0 1px #2196F3;
        }
        input:checked + .slider:before {
          -webkit-transform: translateX(26px);
          -ms-transform: translateX(26px);
          transform: translateX(26px);
        }
        .slider.round {
          border-radius: 34px;
        }
        .slider.round:before {
          border-radius: 50%;
        }
        .tooltip {
          position: relative;
          display: inline-block;
        }
        .tooltip .tooltiptext {
          visibility: hidden;
          width: auto;
          bottom: 100%;
          background-color: black;
          color: #fff;
          text-align: center;
          padding: 5px;
          transform: translateX(-50%);
          margin-bottom: 5px;
          left: 50%;
          border-radius: 6px;
          position: absolute;
          z-index: 1;
        }
        .tooltip:hover .tooltiptext {
          visibility: visible;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-content: center;
        }
        .container .btn {
          display: flex;
          justify-content: center;
        }
        .text {
          color: #3c4043;
          font-family: 'Google Sans',Roboto,Arial,sans-serif;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 5px;
        }
      </style>
      <div class="container">
        <label class="text">Notifications</label>
        <div class="btn">
          <label class="switch tooltip">
            <input type="checkbox" id="ck-notif" name="notif-chk" checked>
            <span class="slider round"></span>
            <span class="tooltiptext">Make sure notifications<br> are enabled on your computer</span>
          </label>
        </div>
      </div>`;
    
    // Add btn to dom
    elShadow.prepend(el);

    // Listener to toggle btn, clears notif as well
    elShadow.querySelector("#ck-notif").addEventListener('change', () => {
      mActive = !mActive;
      if (!mActive) {
        chrome.runtime.sendMessage({
          type: "clean"
        });
      }
    });
  }
}

// Observer to get messages from aria-live when chat is opened
function configOpenedChatObserver() {
  if (getAriaLive()) {
    let callback = (mutationRecord, observer) => {
      if (mutationRecord.length == 1) {
        let messageElement = mutationRecord[mutationRecord.length - 1].addedNodes[0];
        if (messageElement && mActive) {
          if (messageElement.dataset.senderName) {
            senderName = messageElement.dataset.senderName;
            message_text = messageElement.lastChild.innerText;
          } else {
            senderName = messageElement.parentElement.parentNode.dataset.senderName;
            message_text = messageElement.innerText;
          }
          showNotification(senderName, message_text);
        }
      }
    };
    const observer = new MutationObserver(callback);
    const config = {
      childList: true,
      subtree: true
    };
    observer.observe(getAriaLive(), config);
  }
}

// Observer to get messages from aria-live when chat is closed
function configClosedChatObserver() {
  function callback(mutationRecord, observer) {
    let messageElement = mutationRecord[mutationRecord.length - 1].addedNodes[0];
    if (messageElement && mActive) {
      let sender = messageElement.querySelector('.UgDTGe');
      let message = messageElement.querySelector('.xtO4Tc');
      showNotification(sender.innerText, message.innerText);
    }
  }
  const observer = new MutationObserver(callback);
  const config = {
    childList: true,
    subtree: true
  };
  observer.observe(getBalloonChat(), config);
}

// Send msg with notif tag to backgroud.js
function showNotification(sender, message) {
  var notifData = {
    type: "basic",
    title: sender,
    iconUrl: './images/get_started128.png',
    message: message,
    silent: true,
    priority: 2
  };
  chrome.runtime.sendMessage({
    type: "notification",
    notifData: notifData
  }, function () {});
}