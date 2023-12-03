
window.addEventListener("beforeunload", () => {
  chrome.storage.sync.set({ setting1: false }, () => {
    console.log("Checkbox state reset to false on page reload");
  });
});
let setting1CheckboxState = false; // Initialize the checkbox state

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.from === "settings" && message.query === "text_blocking") {
    // Read data from Chrome storage
    chrome.storage.sync.get({ setting1: false }, (data) => {
      setting1CheckboxState = data.setting1; // Update the checkbox state

      console.log("Received message from background script:", message);
      console.log("Setting1 Checkbox State from Chrome Storage:", setting1CheckboxState);
      // Update content blocking based on the checkbox state
      updateContentBlocking();
    });
  }
});

// Function to update content blocking based on the checkbox state
function updateContentBlocking() {
  // Check if text blocking should be enabled
  if (setting1CheckboxState === true) {
    // Enable content blocking logic
    enableContentBlocking();
  } else{
    disableContentBlocking()
  }
}

// Function to enable content blocking logic
function enableContentBlocking() {
  // Add your content blocking logic here
    // Read data from Chrome storage
    chrome.storage.sync.get({ setting1: false }, (data) => {
      // console.log("Received message from background script:", message);
      console.log("Setting1 Checkbox State from Chrome Storage:", data.setting1);
  let cachedTerms = [];
  const elementsWithTextContentToSearch = "a, p, h1, h2, h3, h4, h5, h6";
  const containerElements = "span, div, li, th, td, dt, dd";
  
  // Check if text blocking should be enabled
  if (data.setting1===true) {
    // Every time a page is loaded, check our spoil terms and block,
    // after making sure settings allow blocking on this page.
    chrome.storage.sync.get(null, (result) => {
      // Don't manipulate the page if the user hasn't entered any terms
      if (!result.spoilerterms) {
        return;
      }
      enableMutationObserver();
      cachedTerms = result.spoilerterms;
      blockSpoilerContent(document, result.spoilerterms, "***");
    });
  }
  function blockSpoilerContent(rootNode, spoilerTerms, blockText) {
    // Search innerHTML elements first
    let nodes = rootNode.querySelectorAll(elementsWithTextContentToSearch)
    replacenodesWithMatchingText(nodes, spoilerTerms, blockText);
  
    // Now find any container elements that have just text inside them
    nodes = findContainersWithTextInside(rootNode);
    if (nodes && nodes.length !== 0) {
      replacenodesWithMatchingText(nodes, spoilerTerms, blockText);
    }
  }
  
  
  function pluralize(word) {
    if (word.endsWith('s')) {
      return word + 'es'; // Example: word ends with "s" -> cats -> cates
    } else {
      return word + 's'; // Example: word doesn't end with "s" -> cat -> cats
    }
  }
  
  function compareForSpoiler(node, spoilerTerm) {
    // Implement your logic for comparing node's content with spoilerTerm
    // This function should return true if the content matches, false otherwise
    // Example:
    return node.textContent.toLowerCase().includes(spoilerTerm.toLowerCase());
  }
  
  
  
  function checkIfWordsMatchHyphenated(node, spoilerTerm) {
    const words = spoilerTerm.split(' ');
    const hyphenatedTerm = words.join('-');
    
    if (compareForSpoiler(node, hyphenatedTerm)) {
      return hyphenatedTerm;
    }
    
    return null;
  }
  
  function replacenodesWithMatchingText(nodes, spoilerTerms, replaceString) {
    nodes = Array.from(nodes);
    nodes.reverse();
    for (const node of nodes) {
      for (const spoilerTerm of spoilerTerms) {
        const matchedTerm = checkIfWordsMatchHyphenated(node, spoilerTerm);
        if (matchedTerm) {
          if (!node.parentNode || node.parentNode.nodeName === "BODY") {
            // ignore top-most node in DOM to avoid stomping entire DOM
            // see issue #16 for more info
            continue;
          }
          const originalText = node.textContent;
          const spoilerVariations = [
            matchedTerm,
            pluralize(matchedTerm),
            ...matchedTerm.split(' ')
          ];
          const spoilerRegex = new RegExp(`\\b(?:${spoilerVariations.join('|')})\\b`, "ig");
          const newText = originalText.replace(spoilerRegex, replaceString);
          if (originalText !== newText) {
            node.className += " hidden-spoiler";
            node.innerHTML = newText;
            blurNearestChildrenImages(node);
          }
        }
      }
    }
  }
  
  
  
  function compareForSpoiler(nodeToCheck, spoilerTerm) {
    const regex = new RegExp(spoilerTerm, "i");
    return regex.test(nodeToCheck.textContent);
  }
  
  function blurNearestChildrenImages(nodeToCheck) {
    // Traverse up a level and look for images, keep going until either
    // an image is found or the top of the DOM is reached.
    // This has a known side effect of blurring ALL images on the page
    // if an early spoiler is found, but ideally will catch the nearest images
    let nextParent = nodeToCheck;
    let childImages;
    const maxIterations = 3;
    let iterationCount = 0;
    do {
      nextParent = nextParent.parentNode;
      if (nextParent && nextParent.nodeName !== "BODY") {
        childImages = nextParent.parentNode.querySelectorAll('img');
      }
      iterationCount++;
    } while (nextParent && childImages.length === 0 && iterationCount < maxIterations)
  
  
  }
  
  function findContainersWithTextInside(targetNode) {
    const containerNodes = targetNode.querySelectorAll(containerElements);
    const emptyNodes = [];
    for (const containerNode of containerNodes) {
      const containerChildren = containerNode.childNodes;
      for (const containerChild of containerChildren) {
        if (containerChild.textContent) {
          emptyNodes.push(containerChild.parentNode);
        }
      }
    }
    return emptyNodes;
  }
  
  
  
  function enableMutationObserver() {
    // Detecting changed content using Mutation Observers
    //
    // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver?redirectlocale=en-US&redirectslug=DOM%2FMutationObserver
    // https://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  
    const observer = new MutationObserver((mutations, observer) => {
      // fired when a mutation occurs
      // console.log(mutations, observer);
      for (const mutation of mutations) {
        blockSpoilerContent(mutation.target, cachedTerms, "***");
      }
    });
  
    // configuration of the observer:
    const config = { attributes: true, subtree: true }
    // turn on the observer...unfortunately we target the entire document
    observer.observe(document, config);
    // disconnecting likely won't work since we need to continuously watch
    // observer.disconnect();
  }


}
      // You can send a response back to the background script if necessary
      // sendResponse({ response: "Message received successfully" });
    );
  console.log("Content blocking is enabled");
}
 function disableContentBlocking() {
  chrome.runtime.sendMessage({ reloadTab: true });
 }

chrome.runtime.onMessage.addListener((message,sender)=>{

  if (message.from === "settings" && message.query === "inject_side_bar"){
 
// inject the timer page 
let mainDiv =  document.createElement("div")
mainDiv.setAttribute("id","MindCuecontainer")
mainDiv.innerHTML=`
<div id="mySidebar" class="Msidebar">
<div id = "backArrow">
    <a href="#"><span id="MindCueMaterial-icons">
      arrow_circle_right
    </span></a>
</div>

<div id="MainCont">
<div id="cover"> 
</div>
  <div id="mainform">
        <div id="BrowsingHeader">
          <h2>Browsing <p>in Session</p></h2>
        </div>
  <div id="Timerbox">
      <h2 id="Timer">
      Time Remaining
      </h2>
      <div id="app">
      </div>
    </div>
  </div>
      <div>
      <div id="pickTab">

    </div>
      <div id="modifyTimer">
      <button class="ModifyButtons" id= "pauseButton" type="submit">Pause</button>
       </div>
</div>

<div id="main">
  <h2</h2>
</div>

`
// append to dom
document.body.appendChild(mainDiv)

// the cover image //
// const CoverDiv = document.getElementById("cover")
// let CoverImage = document.createElement("img")
// let CoverImageURL = chrome.runtime.getURL("./images/coverBackground.png")

// CoverImage.src = CoverImageURL

// CoverDiv.appendChild(CoverImage)


var mini = true;

let icon = document.getElementById("mySidebar")
icon.addEventListener("mouseover",toggleMySideBar)
icon.addEventListener("mouseout",toggleMySideBar)

function toggleMySideBar() {
  if (mini) {
    console.log("opening sidebar");
    document.getElementById("mySidebar").style.width = "380px";
    mini = false;
  } else {
    console.log("closing sidebar");
    document.getElementById("mySidebar").style.width = "85px";
    mini = true;
  }
  
}
let startrecordingdiv = document.getElementById("pickTab")
startrecordingdiv.innerHTML= `

<button id="toggleButton">Pick a Tab</button>

`
const toggleButton = document.getElementById("toggleButton");
toggleButton.addEventListener("click", () => {
  startRecordingAndTimer();
});



// timerrr

const FULL_DASH_ARRAY = 283;
const WARNING_THRESHOLD = 10;
const ALERT_THRESHOLD = 5;

const COLOR_CODES = {
  info: {
    color: "green"
  },
  warning: {
    color: "orange",
    threshold: WARNING_THRESHOLD
  },
  alert: {
    color: "red",
    threshold: ALERT_THRESHOLD
  }
};

const TIME_LIMIT = 600; // 1 hour and 1 minute in seconds
let timePassed = 0;
let timeLeft = TIME_LIMIT;
let timerInterval = null;
let remainingPathColor = COLOR_CODES.info.color;

document.getElementById("app").innerHTML = `
<div class="base-timer">
  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g class="base-timer__circle">
      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
      <path
        id="base-timer-path-remaining"
        stroke-dasharray="283"
        class="base-timer__path-remaining ${remainingPathColor}"
        d="
          M 50, 50
          m -45, 0
          a 45,45 0 1,0 90,0
          a 45,45 0 1,0 -90,0
        "
      ></path>
    </g>
  </svg>
  <span id="base-timer-label" class="base-timer__label">${formatTime(
  TIME_LIMIT
)}</span>

</div>
`;


// TIMER LOGIC
//  startTimer()

function onTimesUp() {
  clearInterval(timerInterval);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timePassed = timePassed += 1;
    timeLeft = TIME_LIMIT - timePassed;
    document.getElementById("base-timer-label").innerHTML = formatTime(
      timeLeft
    );
    setCircleDasharray();
    setRemainingPathColor(timeLeft);

    if (timeLeft === 0) {
      onTimesUp();
    }
  }, 1000);
}


function formatTime(time) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return formattedTime;
}


function setRemainingPathColor(timeLeft) {
  const { alert, warning, info } = COLOR_CODES;
  if (timeLeft <= alert.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(warning.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(alert.color);
  } else if (timeLeft <= warning.threshold) {
    document
      .getElementById("base-timer-path-remaining")
      .classList.remove(info.color);
    document
      .getElementById("base-timer-path-remaining")
      .classList.add(warning.color);
  }
}

function calculateTimeFraction() {
  const rawTimeFraction = timeLeft / TIME_LIMIT;
  return rawTimeFraction;
}

function setCircleDasharray() {
  const circleDasharray = `${(
    calculateTimeFraction() * FULL_DASH_ARRAY
  ).toFixed(0)} ${FULL_DASH_ARRAY}`;
  document
    .getElementById("base-timer-path-remaining")
    .setAttribute("stroke-dasharray", circleDasharray);
}
const pauseButton = document.getElementById("pauseButton");
const stopButton = document.getElementById("stopButton");

// Add event listeners to the buttons
pauseButton.addEventListener("click", pauseTimer);
stopButton.addEventListener("click", stopTimer);

let isPaused = false;

function pauseTimer() {
  if (isPaused) {
    // Resume timer
    startTimer();
    isPaused = false;
    pauseButton.textContent = "Pause";
  } else {
    // Pause timer
    clearInterval(timerInterval);
    isPaused = true;
    pauseButton.textContent = "Resume";
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timePassed = 0;
  timeLeft = TIME_LIMIT;
  setCircleDasharray();
  setRemainingPathColor(timeLeft);
  document.getElementById("base-timer-label").innerHTML = formatTime(
    timeLeft
  );
  isPaused = false;
}

let stream;
let recorder;
let isRecording = false;
let chunks = [];


async function startRecordingAndTimer() {
  console.log("test the recording")
  if (isRecording) {
      try {
          // Start recording
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          recorder = new MediaRecorder(stream);
          toggleButton.textContent = "Stop Recording";

          recorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  chunks.push(event.data);
              }
          };

          recorder.onstop = () => {
              // Combine all the recorded chunks into a single blob
              const blob = new Blob(chunks, { type: "video/webm" });

              // Create a video element to preview the recording
              const videoElement = document.createElement('video');
              videoElement.controls = true;
              document.body.appendChild(videoElement);
              videoElement.src = URL.createObjectURL(blob);

              // Reset the UI
              toggleButton.textContent = "Start Recording";
          };

          recorder.start();
          isRecording = true;

          // Start the timer
          startTimer();
      } catch (error) {
          console.error("Error starting recording:", error);
      }
  } else {
      // Stop recording
      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      isRecording = false;
      toggleButton.textContent = "Start Recording";

      // Stop the timer
      stopTimer();
  }
  
}

  }
})


// Content Script

// Function to start screen recording
let stream;
let recorder;
const chunks = [];
let isRecording = false;

async function startRecording() {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      // Combine all the recorded chunks into a single blob
      const blob = new Blob(chunks, { type: "video/webm" });

      // Create a video element to preview the recording
      const videoElement = document.createElement('video');
      videoElement.controls = true;
      document.body.appendChild(videoElement);
      videoElement.src = URL.createObjectURL(blob);

      console.log("Recording stopped.");
    };

    recorder.start();
    isRecording = true;

    console.log("Recording started.");
  } catch (error) {
    console.error("Error starting recording:", error);
  }
}

// Function to stop screen recording
function stopRecording() {
  if (isRecording) {
    recorder.stop();
    stream.getTracks().forEach((track) => track.stop());
    isRecording = false;
    console.log("Recording stopped.");
    
    // Request permission to save the recorded file
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = "screen-recording.webm";
    anchor.click();
  }
}

// Add "Start Recording" and "Stop Recording" buttons
const startRecordingButton = document.createElement('button');
startRecordingButton.textContent = "Start Recording";
// startRecordingButton.addEventListener("click", startRecording);

// const stopRecordingButton = document.createElement('button');
// stopRecordingButton.textContent = "Stop Recording";
// stopRecordingButton.addEventListener("click", stopRecording);

const buttonContainer = document.createElement('div');
// buttonContainer.appendChild(startRecordingButton);
// buttonContainer.appendChild(stopRecordingButton);

document.body.appendChild(buttonContainer);


// ML THINGS

const video = document.querySelector("video");
const worker = new Worker("../ObjectDetector/worker.js")
let boxes = [];
let interval
let busy = false

video.addEventListener("play", () => {
    console.log("Video play event fired");
    const canvas = document.querySelector("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const context = canvas.getContext("2d");
    interval = setInterval(() => {
        context.drawImage(video,0,0);
        draw_boxes(canvas, boxes);
        const input = prepare_input(canvas);
        if (!busy) {
            worker.postMessage(input);
            busy = true;
        }
    },30)
});


function processImage() {
    const canvas = document.querySelector("canvas");
    canvas.width = extraImage.width;
    canvas.height = extraImage.height;
    const context = canvas.getContext("2d");
    context.drawImage(extraImage,0,0);
    draw_boxes(canvas, boxes);
    const input = prepare_input(canvas);
    if (!busy) {
        worker.postMessage(input);
        busy = true;
    }
}

const extraImage = document.getElementById("extraImage");
window.addEventListener("beforeunload", processImage);


worker.onmessage = (event) => {
    const output = event.data;
    const canvas = document.querySelector("canvas");
    boxes =  process_output(output, canvas.width, canvas.height);
    busy = false;
};

video.addEventListener("pause", () => {
    clearInterval(interval);
});

// const playBtn = document.getElementById("play");
// const pauseBtn = document.getElementById("pause");
startRecordingButton.addEventListener("click", () => {
    video.play();
});
pauseBtn.addEventListener("click", () => {
    video.pause();
});

function prepare_input(img) {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0, 640, 640);
    const data = context.getImageData(0,0,640,640).data;
    const red = [], green = [], blue = [];
    for (let index=0;index<data.length;index+=4) {
        red.push(data[index]/255);
        green.push(data[index+1]/255);
        blue.push(data[index+2]/255);
    }
    return [...red, ...green, ...blue];
}

function process_output(output, img_width, img_height) {
    let boxes = [];
    for (let index=0;index<8400;index++) {
        const [class_id,prob] = [...Array(yolo_classes.length).keys()]
            .map(col => [col, output[8400*(col+4)+index]])
            .reduce((accum, item) => item[1]>accum[1] ? item : accum,[0,0]);
        if (prob < 0.5) {
            continue;
        }
        const label = yolo_classes[class_id];
        const xc = output[index];
        const yc = output[8400+index];
        const w = output[2*8400+index];
        const h = output[3*8400+index];
        const x1 = (xc-w/2)/640*img_width;
        const y1 = (yc-h/2)/640*img_height;
        const x2 = (xc+w/2)/640*img_width;
        const y2 = (yc+h/2)/640*img_height;
        boxes.push([x1,y1,x2,y2,label,prob]);
    }
    boxes = boxes.sort((box1,box2) => box2[5]-box1[5])
    const result = [];
    while (boxes.length>0) {
        result.push(boxes[0]);
        boxes = boxes.filter(box => iou(boxes[0],box)<0.7 || boxes[0][4] !== box[4]);
    }
    return result;
}

function iou(box1,box2) {
    return intersection(box1,box2)/union(box1,box2);
}

function union(box1,box2) {
    const [box1_x1,box1_y1,box1_x2,box1_y2] = box1;
    const [box2_x1,box2_y1,box2_x2,box2_y2] = box2;
    const box1_area = (box1_x2-box1_x1)*(box1_y2-box1_y1)
    const box2_area = (box2_x2-box2_x1)*(box2_y2-box2_y1)
    return box1_area + box2_area - intersection(box1,box2)
}

function intersection(box1,box2) {
    const [box1_x1,box1_y1,box1_x2,box1_y2] = box1;
    const [box2_x1,box2_y1,box2_x2,box2_y2] = box2;
    const x1 = Math.max(box1_x1,box2_x1);
    const y1 = Math.max(box1_y1,box2_y1);
    const x2 = Math.min(box1_x2,box2_x2);
    const y2 = Math.min(box1_y2,box2_y2);
    return (x2-x1)*(y2-y1)
}
function myalert() {
    Swal.fire({
    title:'<html> \
    <span class="title-class">Wait a minute!</span> <br> \
    <span class="title-class2">The following content may contain material you are not comfortable with</span>\
    </html>',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: '<html><span class="skip-button-text">Skip the scene</span></html>',
    denyButtonText: `<html><span class="skip-button-text">Dismiss</span></html>`,
    cancelButtonText:'<html><span class="skip-button-text">Play Audio Only</span></html>',
    showClass:{
      popup: 'pop-up-class',
      container: 'container-class',
    }
    })
}
function draw_boxes(canvas,boxes) {
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#00FF00";
    ctx.lineWidth = 3;
    ctx.font = "18px serif";
    boxes.forEach(([x1,y1,x2,y2,label]) => {
        ctx.strokeRect(x1,y1,x2-x1,y2-y1);
        ctx.fillStyle = "#00ff00";
        const width = ctx.measureText(label).width;
        ctx.fillRect(x1,y1,width+10,25);
        ctx.fillStyle = "#000000";
        ctx.fillText(label, x1, y1+18);
         // Check if the label is "dog" and trigger an alert
         if (label === "cat") {
            // You can customize the alert message here
           video.pause()
            myalert()
        }
    });
}

const yolo_classes = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse',
    'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase',
    'frisbee', 'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard',
    'surfboard', 'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch', 'potted plant',
    'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone', 'microwave', 'oven',
    'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
];



// let cachedTerms = [];
// const elementsWithTextContentToSearch = "a, p, h1, h2, h3, h4, h5, h6";
// const containerElements = "span, div, li, th, td, dt, dd";

// // Check if text blocking should be enabled
// if (true) {
//   // Every time a page is loaded, check our spoil terms and block,
//   // after making sure settings allow blocking on this page.
//   chrome.storage.sync.get(null, (result) => {
//     // Don't manipulate the page if the user hasn't entered any terms
//     if (!result.spoilerterms) {
//       return;
//     }
//     enableMutationObserver();
//     cachedTerms = result.spoilerterms;
//     blockSpoilerContent(document, result.spoilerterms, "***");
//   });
// }
// function blockSpoilerContent(rootNode, spoilerTerms, blockText) {
//   // Search innerHTML elements first
//   let nodes = rootNode.querySelectorAll(elementsWithTextContentToSearch)
//   replacenodesWithMatchingText(nodes, spoilerTerms, blockText);

//   // Now find any container elements that have just text inside them
//   nodes = findContainersWithTextInside(rootNode);
//   if (nodes && nodes.length !== 0) {
//     replacenodesWithMatchingText(nodes, spoilerTerms, blockText);
//   }
// }


// function pluralize(word) {
//   if (word.endsWith('s')) {
//     return word + 'es'; // Example: word ends with "s" -> cats -> cates
//   } else {
//     return word + 's'; // Example: word doesn't end with "s" -> cat -> cats
//   }
// }

// function compareForSpoiler(node, spoilerTerm) {
//   // Implement your logic for comparing node's content with spoilerTerm
//   // This function should return true if the content matches, false otherwise
//   // Example:
//   return node.textContent.toLowerCase().includes(spoilerTerm.toLowerCase());
// }



// function checkIfWordsMatchHyphenated(node, spoilerTerm) {
//   const words = spoilerTerm.split(' ');
//   const hyphenatedTerm = words.join('-');
  
//   if (compareForSpoiler(node, hyphenatedTerm)) {
//     return hyphenatedTerm;
//   }
  
//   return null;
// }

// function replacenodesWithMatchingText(nodes, spoilerTerms, replaceString) {
//   nodes = Array.from(nodes);
//   nodes.reverse();
//   for (const node of nodes) {
//     for (const spoilerTerm of spoilerTerms) {
//       const matchedTerm = checkIfWordsMatchHyphenated(node, spoilerTerm);
//       if (matchedTerm) {
//         if (!node.parentNode || node.parentNode.nodeName === "BODY") {
//           // ignore top-most node in DOM to avoid stomping entire DOM
//           // see issue #16 for more info
//           continue;
//         }
//         const originalText = node.textContent;
//         const spoilerVariations = [
//           matchedTerm,
//           pluralize(matchedTerm),
//           ...matchedTerm.split(' ')
//         ];
//         const spoilerRegex = new RegExp(`\\b(?:${spoilerVariations.join('|')})\\b`, "ig");
//         const newText = originalText.replace(spoilerRegex, replaceString);
//         if (originalText !== newText) {
//           node.className += " hidden-spoiler";
//           node.innerHTML = newText;
//           blurNearestChildrenImages(node);
//         }
//       }
//     }
//   }
// }



// function compareForSpoiler(nodeToCheck, spoilerTerm) {
//   const regex = new RegExp(spoilerTerm, "i");
//   return regex.test(nodeToCheck.textContent);
// }

// function blurNearestChildrenImages(nodeToCheck) {
//   // Traverse up a level and look for images, keep going until either
//   // an image is found or the top of the DOM is reached.
//   // This has a known side effect of blurring ALL images on the page
//   // if an early spoiler is found, but ideally will catch the nearest images
//   let nextParent = nodeToCheck;
//   let childImages;
//   const maxIterations = 3;
//   let iterationCount = 0;
//   do {
//     nextParent = nextParent.parentNode;
//     if (nextParent && nextParent.nodeName !== "BODY") {
//       childImages = nextParent.parentNode.querySelectorAll('img');
//     }
//     iterationCount++;
//   } while (nextParent && childImages.length === 0 && iterationCount < maxIterations)


// }

// function findContainersWithTextInside(targetNode) {
//   const containerNodes = targetNode.querySelectorAll(containerElements);
//   const emptyNodes = [];
//   for (const containerNode of containerNodes) {
//     const containerChildren = containerNode.childNodes;
//     for (const containerChild of containerChildren) {
//       if (containerChild.textContent) {
//         emptyNodes.push(containerChild.parentNode);
//       }
//     }
//   }
//   return emptyNodes;
// }



// function enableMutationObserver() {
//   // Detecting changed content using Mutation Observers
//   //
//   // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver?redirectlocale=en-US&redirectslug=DOM%2FMutationObserver
//   // https://hacks.mozilla.org/2012/05/dom-mutationobserver-reacting-to-dom-changes-without-killing-browser-performance/
//   MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

//   const observer = new MutationObserver((mutations, observer) => {
//     // fired when a mutation occurs
//     // console.log(mutations, observer);
//     for (const mutation of mutations) {
//       blockSpoilerContent(mutation.target, cachedTerms, "***");
//     }
//   });

//   // configuration of the observer:
//   const config = { attributes: true, subtree: true }
//   // turn on the observer...unfortunately we target the entire document
//   observer.observe(document, config);
//   // disconnecting likely won't work since we need to continuously watch
//   // observer.disconnect();
// }