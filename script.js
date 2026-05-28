// 替換成你在 Teachable Machine 導出的模型連結 (記得最後要加斜槓 /)
const URL = "https://teachablemachine.withgoogle.com/models/bIbkK6h2o/"; 

// 1. 替換成你的 Teachable Machine 模型連結 (確保結尾有斜槓 /)
const URL = "https://teachablemachine.withgoogle.com/models/bIbkK6h2o/";

let model, webcam, ctx, labelContainer, maxPredictions;
let count = 0;
let lastStatus = "down"; // 狀態追蹤

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 2. 設定攝像頭參數
        const size = 400;
        const flip = true; 
        webcam = new tmPose.Webcam(size, size, flip); 
        
        // 3. 請求相機權限 (這步 iPad 會跳出視窗)
        await webcam.setup(); 
        await webcam.play();
        
        statusDiv.innerText = "相機已就緒，正在加載模型...";

        // 4. 加載 AI 模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 5. 設定畫布
        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");

        statusDiv.innerText = "偵測中... 請開始動作！";
        window.requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        statusDiv.innerText = "錯誤: 無法開啟相機或載入模型。";
    }
}

async function loop(timestamp) {
    webcam.update(); // 更新相機畫面
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // 執行預測
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // 繪製骨架點
    if (pose) {
        drawPose(pose);
    }

    // 核心計數邏輯 (假設標籤 0 是 Down, 標籤 1 是 Up)
    // 如果你的標籤順序不同，請交換 prediction[0] 和 [1]
    if (prediction[1].probability > 0.85 && lastStatus === "down") {
        count++;
        lastStatus = "up";
        document.getElementById("score-display").innerText = "分數：" + count;
    } else if (prediction[0].probability > 0.85) {
        lastStatus = "down";
    }

    // 顯示即時預測百分比
    const labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = prediction[1].className + ": " + (prediction[1].probability * 100).toFixed(0) + "%";
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // 繪製關鍵點
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
