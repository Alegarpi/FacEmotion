// HTML Video. Will be the webcam
const video = document.getElementById("video");

// Adds webcam to video element
function startVideo() {
  navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);
  navigator.getUserMedia(
    {video: {}},
    stream => video.srcObject = stream,
    err => console.log(err)
  );
};
// Canvas that goes on top of the video. Drawing rectangles on this canvas.
const videoCanvas = document.getElementById("video-canvas");

// Face detector used to get faces in the video frame
const FACE_DETECTOR_MODEL = faceDetection.SupportedModels.MediaPipeFaceDetector;

// Loading MobileNet model used for Transfer Learning.
const model = ml5.featureExtractor('MobileNet');
const no_mask_model = ml5.featureExtractor('MobileNet',{numbLabel:3});
const mask_model = ml5.featureExtractor('MobileNet',{numbLabel:3});

// Choosing image classification
let mask_Model = model.classification();
let no_mask_Emotion_Model = no_mask_model.classification();
let mask_Emotion_Model = mask_model.classification();
// Creating face detector config
let detector;
const detectorConfig = {
  runtime: 'mediapipe',
  maxFaces: 10,
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection',
                // or 'base/node_modules/@mediapipe/face_detection' in npm.
};
// Waiting all the models to be loaded to start the video
Promise.all([detector = await faceDetection.createDetector(FACE_DETECTOR_MODEL, detectorConfig), 
  mask_Model.load("./model/model.json", () => console.log("Modelo diferencia cargado")),
  no_mask_Emotion_Model.load("./NoMaskEmotionModel/model.json", () => console.log("Modelo sin mascara cargado")),
  mask_Emotion_Model.load("./MaskEmotionModel/model.json", () => console.log("Modelo con mascara cargado"))]).then(startVideo);

// Face text element, used to see the values.
const face1 = document.getElementById("face1");
const face2 = document.getElementById("face2");
const face3 = document.getElementById("face3");
const face4 = document.getElementById("face4");
const faceTexts = [face1,face2,face3,face4];

video.addEventListener('play', () => {
  // Canvas used to cut the faces on the video
  let mCanvas = document.getElementById("mask-canvas");
  let gCanvas = document.getElementById("gray-canvas");
  mCanvas.width = 128;
  mCanvas.height = 128;
  gCanvas.width = 224;
  gCanvas.height = 224;
  let faces = [];
  let colors = ["red","yellow","green","blue"];

  setInterval(async () => {
    // Making the video canvas the same size as the video
    videoCanvas.height = video.clientHeight;
    videoCanvas.width = video.clientWidth;
    videoCanvas.getContext("2d").lineWidth = 5;
    // Used to resize video relative coords and sizes
    let resize = {
      x: video.clientWidth / video.videoWidth ,
      y:  video.clientHeight / video.videoHeight,
    }
    try {
      // Face detector, returns an array with all faces information
      faces = await detector.estimateFaces(video, {flipHorizontal: false});
    } catch (error) {
      console.log(error);
    }
    let hasMask;
    // Cleaning rectangles
    videoCanvas.getContext("2d").clearRect(0,0,videoCanvas.width,videoCanvas.height);
    if (faces.length != 0) {
      for (let i = 0; i < 4; i++){
        if (i >= faces.length) {
          faceTexts[i].textContent = "No face detected!\n.";
          continue;
        }
        // Top left corner of the face
        const x = faces[i].box.xMin;
        const y = faces[i].box.yMin;
        let text
        // "Boxing" the face in the video
        videoCanvas.getContext("2d").strokeStyle = colors[i];
        videoCanvas.getContext("2d").beginPath();
        videoCanvas.getContext("2d").rect(resize.x * x, resize.y * y,
          resize.x * faces[i].box.width, resize.y * faces[i].box.height);
        videoCanvas.getContext("2d").stroke();
        // Cutting faces from the video
        let mCanvasContext = mCanvas.getContext("2d");
        let gCanvasContext = gCanvas.getContext("2d");
        mCanvasContext.clearRect(0,0,mCanvas.width,mCanvas.height);
        mCanvasContext.drawImage(video, x, y,faces[i].box.width,faces[i].box.height,
            0, 0,mCanvas.width,mCanvas.height);
        gCanvasContext.clearRect(0,0,224,224);
        gCanvasContext.drawImage(video, x, y,faces[i].box.width,faces[i].box.height,
            0, 0,224,224);
        // When the face image is loaded, classify it
        let img = new Image();
        img.src = mCanvas.toDataURL('image/png',1);
        img.onload = async () => {
          await mask_Model.classify(img, (e,r) => {
            if (e)
              console.log(e);
            else {
              let label = "With mask"
              if (r[0].label == "without_mask") {
                label = "Without mask";
              }
              text = label + "  " + Math.round(r[0].confidence * 10000) / 10000;
              hasMask = r[0].label;
            }
          });
          // Check if the previous model has classifies as mask or wihtout mask, then classify emotion
          let img2 = new Image();
          img2.src = gCanvas.toDataURL('image/png',1); // gray image
          if (hasMask == "without_mask") {
            img2.onload = async () => {
              await no_mask_Emotion_Model.classify(img2, (e,x) => {
                if (e)
                  console.log(e);
                else {
                  faceTexts[i].textContent = text + "\n" + x[0].label + "  " +
                        Math.round(x[0].confidence * 10000) / 10000;
                }
              });
            }
          } else {
            img2.onload = async () => {
              await mask_Emotion_Model.classify(img2, (e,x) => {
                if (e)
                  console.log(e);
                else {
                  faceTexts[i].textContent = text + "\n" + x[0].label + "  " +
                        Math.round(x[0].confidence * 10000) / 10000;
                }
              });
            }
          }
        };
      }
    } else {
      face1.textContent = "No face detected!\n.";
      face2.textContent = "No face detected!\n.";
      face3.textContent = "No face detected!\n.";
      face4.textContent = "No face detected!\n.";
    }
  }, 100);
});

