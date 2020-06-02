var MIN_SOUND_TIME = 800; //最少录音时长
var recorder = null; //录音对象
var startTimestamp = null; //开始时间
var stopTimestamp = null; //结束时间
var audioLength = 0; //录音时长
var currentfile = null; //当前播放文件路径

var isCreatedEle = false; //是否已经创建录音节点
var soundAlert; //录音弹出框
var audioTips; //录音弹出框提示

var player = null;
var lastAudioId = null;
var lastPlayer = null;
var lastEle = null;
var audioDir = "_doc/audio/";
var timeoutid = 0;

//打开录音
mui("body").on("hold", ".voice-record", function() {
	var This = this;

	startRecordAudio(function(audioLength, audioFile) {
		var voice = This.parentElement.querySelector(".voice");
		if(voice.getAttribute("file")) {
			plus.nativeUI.confirm("确认要覆盖之前的录音吗？", function(e) {
				if(e.index == 0) {
					voice.setAttribute("file", audioFile);
					eval("recordSuccessed(" + audioLength + ",'" + audioFile + "')");
				}
			}, "录音", ["确认覆盖", "取消"]);
		} else {
			voice.setAttribute("file", audioFile);
			eval("recordSuccessed(" + audioLength + ",'" + audioFile + "')");
		}
	});
});
//结束录音
mui("body").on("release", ".voice-record", function() {
	stopRecordAudio();
});
/**
 * 开始录音
 * @param {Object} callbackFun 录音完毕后的回调
 */
function startRecordAudio(callbackFun) {
	// 获取当前设备的录音对象
	recorder = plus.audio.getRecorder();
	if(recorder == null) {
		mui.toast("录音对象未获取");
		return;
	}

	//创建录音效果
	if(isCreatedEle == false) {
		createRecordWindow();
		isCreatedEle = true;
	}
	//弹出显示录音
	soundAlert.style.display = 'block';
	soundAlert.style.opacity = 1;

	//记录开始时间
	startTimestamp = (new Date()).getTime();

	//超时自动停止
	timeoutid = setTimeout(function() {
		mui.toast("最长只能录制60秒！");
		stopRecordAudio();
	}, 60000);

	//录音设置
	recorder.record({
		format: "amr",
		filename: audioDir
	}, function(path) {
		//录音成功
		stopTimestamp = (new Date()).getTime();
		audioLength = Math.ceil((stopTimestamp - startTimestamp) / 1000);
		currentfile = path.replace(audioDir, "");
		if(audioLength > 60) {
			audioLength = 60;
		}
		return callbackFun(audioLength, currentfile);
	}, function(e) {
		//录音失败
		mui.toast("录音出现异常: " + e.message);
	});
}

//停止录音
function stopRecordAudio() {
	clearTimeout(timeoutid);
	//移除录音效果
	hideRecordWindow();
	//停止录音
	recorder.stop();
}

//创建弹出窗口
function createRecordWindow() {
	var divRecord = document.createElement("div");
	divRecord.setAttribute("id", "sound-alert");
	divRecord.setAttribute("class", "rprogress");

	var divChedule = document.createElement("div");
	divChedule.setAttribute("class", "rschedule");
	divRecord.appendChild(divChedule);

	var divSigh = document.createElement("div");
	divSigh.setAttribute("class", "r-sigh");
	divSigh.innerHTML = "!";
	divRecord.appendChild(divSigh);

	var divSigh = document.createElement("div");
	divSigh.setAttribute("id", "audio-tips");
	divSigh.setAttribute("class", "rsalert");
	divSigh.innerHTML = "正在录音，请讲话";
	divRecord.appendChild(divSigh);

	document.body.appendChild(divRecord);

	soundAlert = document.getElementById("sound-alert"); //录音弹出框
	audioTips = document.getElementById("audio-tips"); //录音弹出框提示
}

//移除录音效果窗口
function hideRecordWindow() {
	if(!soundAlert) {
		return;
	}
	soundAlert.style.opacity = 0;
	soundAlert.style.display = "none";
}

//录音后点击播放录音
mui("body").on("tap", ".voice", function() {
	var img = this.querySelector("img");
	//判断当前点击的是否正在播放
	if(img.classList.contains("isplay")) {
		stopAudio(img);
	} else {
		//寻找，有无其他语音正在播放
		var imgOld = document.body.querySelector(".voice img.isplay");
		if(imgOld) {
			stopAudio(imgOld);
		}
		//播放当前点击语音
		play(this, img);
	}
	return false;
});

//播放当前
function play(This, img) {
	var isdefult = This.getAttribute("IsDefault");
	var audioFileName = This.getAttribute("file");
	var audioFile = audioDir + audioFileName;
	if(isdefult == 0) {
		audioFile = audioDir + audioFileName.split("/").pop();
	}
	//标记为播放
	img.src = "../../images/voice-play.gif";
	img.classList.add("isplay");
	//文件是否存在，存在则直接播放
	plus.io.resolveLocalFileSystemURL(audioFile, function(e) {
		playAudio(img, audioFile);
	}, function(e) {
		stopAudio(img);
		//从网上下载到本地，并播放
		var audioUrl = MdAppUrl.Api45 + "/api/v1.0/" + audioFileName;
		if(isdefult == 0) {
			audioUrl = audioFileName;
		}
		downloadFile(audioUrl, audioFile, function(d, status) {
			//下载成功后，也要判断，是否在下载的时候用户播放了其他的语音
			if(status == 200 && img.classList.contains("isplay")) {
				playAudio(img, audioFile);
			} else {
				stopAudio(img);
			}
		});
	});
}

//播放本地语音文件
function playAudio(img, localFile) {
	player = plus.audio.createPlayer(localFile);
	player.play(function() {
		stopAudio(img, true);
	}, function() {
		stopAudio(img, true);
	})
}
//停止播放指定语音
function stopAudio(img, isautostop) {
	if(player && !isautostop) {
		player.stop();
	}
	img.src = "../../images/voice.png";
	img.classList.remove("isplay");
}