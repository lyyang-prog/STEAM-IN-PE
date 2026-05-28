// 替換成你在 Teachable Machine 導出的模型連結 (記得最後要加斜槓 /)
const URL = "https://teachablemachine.withgoogle.com/models/bIbkK6h2o/"; 

let model, webcam, ctx, labelContainer, maxPredictions;
let count = 0;
let lastStatus = "down"; // 狀態追蹤：down 或 up

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // 1. 加載模型
    document.getElementById("status").innerText = "模型加載中...";
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // 2. 設置攝像頭
    const size = 400; // 畫布大小
    const flip = true; // 是否鏡像
    webcam = new tmPose.Webcam(size, size, flip); 
    await webcam.setup(); 
    await webcam.play();
    document.getElementById("status").innerText = "偵測中...";

    // 3. 設置畫布 (Canvas)
    const canvas = document.getElementById("canvas");
    canvas.width = size; canvas.height = size;
    ctx = canvas.getContext("2d");

    // 開始預測循環
    window.requestAnimationFrame(loop);
}

async function loop(timestamp) {
    webcam.update(); // 更新攝像頭畫面
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // 預測當前姿勢
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // 假設你在 TM 裡第一個類別是 Hand Down，第二個是 Hand Up
    const probDown = prediction[0].probability.toFixed(2);
    const probUp = prediction[1].probability.toFixed(2);

    // 更新顯示文字 (Debug 用)
    document.getElementById("label-container").innerText = 
        `向下: ${probDown} | 向上: ${probUp}`;

    // --- 核心計數邏輯 (State Machine) ---
    if (probUp > 0.85 && lastStatus === "down") {
        count++; // 次數加 1
        lastStatus = "up"; // 切換狀態
        document.getElementById("score-display").innerText = "分數：" + count;
        
        // UX 小細節：成功時震動提示 (如果手機支持)
        if (navigator.vibrate) navigator.vibrate(50);
    } 
    else if (probDown > 0.85) {
        lastStatus = "down"; // 只有回到 Down 狀態，才能進行下一次計數
    }

    // 繪製骨架到 Canvas 上
    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}