mActive = true

const texts = {
  enable: "Notifications", enableMsg: "Make sure notifications<br> are enabled on your computer"
}

const selectors = {
  ariaLive: '[aria-live=polite]:not([aria-atomic])',
  chatBalloon: '.NSvDmb',
  actionButtons: '[data-tooltip][data-is-muted]',
  participantId: '[data-initial-participant-id]',
  topButtons: '[data-tooltip][data-tab-id]'
};

const getAriaLive = () => { return document.querySelector(selectors.ariaLive) }; //Open chat area-live
const getBalloonChat = () => { return document.querySelector(selectors.chatBalloon) }; //Closed chat area-live (baon)
const getTopButtons = () => { return document.querySelectorAll(selectors.topButtons) };
const getParticipantId = () => { return document.querySelector(selectors.participantId) };
const getActionButtons = () => {
  let b = document.querySelector(selectors.actionButtons)
  return b ? b.parentNode.parentNode.parentNode.parentNode : null
};


initialConfig()

//Wait meeting start
function initialConfig() {

  setTimeout(() => { getParticipantId() ? initialize() : initialConfig() }, 1000);
}


function initialize() {

  //Observer balloon messages.
  configClosedChatObserver();

  //Listen top meet buttons for start observer of opened chat messages.
  getTopButtons().forEach(el => {
    el.addEventListener('click', () => {
      configOpenedChatObserver()
    })
  })

  //Switch element on bottom bar (on/off).
  createOption();
}

//Switch create element to on/off notifications, and append to meet bar.
function createOption() {
  //check if ShadowDOM
  if (!document.body.createShadowRoot) {
    //Add switch (shadowDOM Webcomponent to avoid other css/extensions interference) to bottom bar
    let bottomBar = getActionButtons().parentElement;
    let temp = document.createElement('div')
    temp.id = 'host'
    bt = bottomBar.childNodes[2].prepend(temp);

    elShadow = document.querySelector("#host").attachShadow({ mode: 'closed' });

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
      
      /* Rounded sliders */
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
        <label class="text">${texts.enable}</label>
        <div class="btn">
          <label class="switch tooltip">
            <input type="checkbox" id="ck-notif" name="notif-chk" checked>
            <span class="slider round"></span>
            <span class="tooltiptext">${texts.enableMsg}</span>
          </label>
        </div>
      </div>
      `
      elShadow.insertBefore(el, elShadow.children[0]);

    /*
    Event when switch 'change'
    The state is inverted. A message is sent to the bottom to clear the list of notifications
    */
    elShadow.querySelector("#ck-notif").addEventListener('change', () => {
      mActive = !mActive
      if (!mActive) {
        chrome.runtime.sendMessage({
          type: "clean"
        })
      }
    })
  }
}



//Observer to get messages (sender name, message text) from aria-live, when te chat is opened and the notifications state is on
function configOpenedChatObserver() {
  if (getAriaLive()) {
    let callback = (mutationRecord, observer) => {
      if (mutationRecord.length == 1) {
        let messageElement = mutationRecord[mutationRecord.length - 1].addedNodes[0];
        if (messageElement && mActive) {
          if (messageElement.dataset.senderName) {
            senderName = messageElement.dataset.senderName
            message_text = messageElement.lastChild.innerText
          } else {
            senderName = messageElement.parentElement.parentNode.dataset.senderName
            message_text = messageElement.innerText
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


/*Observer to to get messages (sender name, message text) from aria-live of balloon*/
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


//Send to backgroung the sender name and the message to background
function showNotification(sender, message) {

  var opt = {
    type: "basic",
    title: sender,
    iconUrl: './images/get_started128.png',
    message: message,
    silent: true,
    priority: 2
  };

  chrome.runtime.sendMessage({
    type: "notification",
    opt: opt
  }, function () { });


}