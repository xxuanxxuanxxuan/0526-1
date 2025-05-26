var captureGraphics;
var capture_width = 640;
var capture_height = 480;
var span = 5;
var radioElement;
let faceMesh, handpose;
let faces = [];
let hands = [];
let circlePosition = { x: 0, y: 0 }; // 圓圈位置
let gesture = ""; // 手勢辨識結果

function preload() {
  // Initialize FaceMesh and Handpose models
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
  handpose = ml5.handpose({ flipHorizontal: true });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO); // 啟動攝影機
  capture.size(capture_width, capture_height); // 設定畫面大小
  captureGraphics = createGraphics(capture_width, capture_height);
  captureGraphics.translate(capture_width, 0);
  captureGraphics.scale(-1, 1);
  capture.hide();

  // ---選鈕的面---
  radioElement = createRadio();
  radioElement.position(width / 2 - 300, 20);
  radioElement.option("方塊");
  radioElement.option("圓圈");
  radioElement.option("亮度");
  radioElement.option("紅底");
  radioElement.option("文字");
  radioElement.style("color", "#fff");
  radioElement.style("font-size", "50px");

  // Start detecting faces and hands
  faceMesh.detectStart(capture, gotFaces);
  handpose.on("predict", gotHands);
  handpose.start(capture);
}

function gotFaces(results) {
  faces = results;
}

function gotHands(results) {
  hands = results;
  if (hands.length > 0) {
    const landmarks = hands[0].landmarks;
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];

    // 判斷剪刀石頭布
    if (dist(thumbTip[0], thumbTip[1], indexTip[0], indexTip[1]) < 30) {
      gesture = "石頭";
    } else if (dist(indexTip[0], indexTip[1], middleTip[0], middleTip[1]) > 50) {
      gesture = "剪刀";
    } else {
      gesture = "布";
    }
  }
}

function draw() {
  background(220);
  noStroke();
  span = 5 + map(mouseX, 0, width, 0, 20);

  // Draw video and apply effects
  push();
  translate(width / 2 - capture_width / 2, height / 2 - capture_height / 2);
  captureGraphics.image(capture, 0, 0);
  for (var x = 0; x < captureGraphics.width; x = x + span) {
    for (var y = 0; y < captureGraphics.height; y = y + span) {
      var pixel = captureGraphics.get(x, y);
      fill(pixel);
      if (radioElement.value() == "方塊" || radioElement.value() == "") {
        rect(x, y, span);
      }
      if (radioElement.value() == "圓圈") {
        ellipse(x, y, span);
      }
      if (radioElement.value() == "亮度") {
        bk = (pixel[0] + pixel[1] + pixel[2]) / 3;
        fill(bk);
        ellipse(x, y, span * map(bk, 0, 255, 0, 1.2));
      }
      if (radioElement.value() == "紅底") {
        colorMode(HSB);
        fill(pixel[0], 80, 80);
        push();
        translate(x, y);
        rotate(pixel[0] / 100);
        rectMode(CENTER);
        rect(0, 0, span * 0.6);
        fill(0);
        ellipse(0, 0, 10);
        pop();
      }
      if (radioElement.value() == "文字") {
        const density = "Ñ@#W$9876543210?!abc;:+=-,._ ";
        let txt = "一二三四五田雷電龕龘";
        bk = (pixel[0] + pixel[1] + pixel[2]) / 3;
        let bkId = int(map(bk, 0, 255, 9, 0));
        textSize(span);
        textStyle(BOLD);
        text(txt[bkId], x, y);
      }
    }
  }
  pop();

  // Draw face keypoints and circle
  if (faces.length > 0) {
    let face = faces[0];
    let nose = face.keypoints.find((kp) => kp.name === "nose");
    if (nose) {
      circlePosition.x =
        nose.x * capture_width + width / 2 - capture_width / 2;
      circlePosition.y =
        nose.y * capture_height + height / 2 - capture_height / 2;
    }

    // 根據手勢移動圓圈
    if (gesture === "剪刀") {
      let forehead = face.keypoints.find((kp) => kp.name === "forehead");
      if (forehead) {
        circlePosition.x =
          forehead.x * capture_width + width / 2 - capture_width / 2;
        circlePosition.y =
          forehead.y * capture_height + height / 2 - capture_height / 2;
      }
    } else if (gesture === "石頭") {
      let leftEye = face.keypoints.find((kp) => kp.name === "leftEye");
      if (leftEye) {
        circlePosition.x =
          leftEye.x * capture_width + width / 2 - capture_width / 2;
        circlePosition.y =
          leftEye.y * capture_height + height / 2 - capture_height / 2;
      }
    } else if (gesture === "布") {
      let leftCheek = face.keypoints.find((kp) => kp.name === "leftCheek");
      if (leftCheek) {
        circlePosition.x =
          leftCheek.x * capture_width + width / 2 - capture_width / 2;
        circlePosition.y =
          leftCheek.y * capture_height + height / 2 - capture_height / 2;
      }
    }

    // 畫出圓圈
    fill(255, 0, 0);
    noStroke();
    ellipse(circlePosition.x, circlePosition.y, 50, 50);
  }

  // 顯示手勢辨識結果
  fill(0);
  textSize(32);
  text(`手勢: ${gesture}`, 10, height - 20);
}

function mousePressed() {
  // Log detected face and hand data to the console
  console.log("Faces:", faces);
  console.log("Hands:", hands);
}