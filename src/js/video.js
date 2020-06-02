/**
 * 视频录制
 */
var VideoComponent = (function() {
	var VideoFun = function(config) {};
	/**
	 * 摄像（现场录制）
	 * @param {Object} list 存放视频的数组
	 */
	var videoCapture = function(list) {
		setTimeout(function() {
			plus.nativeUI.toast("视频拍摄长度请控制在20秒以内", {
				duration: "long",
				verticalAlign: "top"
			});
		}, 500);
		var cmr = plus.camera.getCamera();
		var res = cmr.supportedVideoResolutions[0];
		var fmt = cmr.supportedVideoFormats[0];
		cmr.startVideoCapture(function(path) {
				list.push({
					src: path,
					Vtime: ""
				});
				path = plus.io.convertLocalFileSystemURL(path).replace('file://', '');
				var videolist = document.querySelectorAll("video");
				if(videolist.length > 0) {
					videolist[videolist.length - 1].setAttribute("src", path);
				}
				setVideoTime(list);
			},
			function(error) {}, {
				resolution: res,
				format: fmt
			}
		);
	};
	/**
	 * android预览视频兼容性处理
	 * @param {Object} path 视频路径
	 * @param {Object} isLocal 本地还是网络 true本地，false网络
	 */
	var androidScanVideo = function(path, isLocal) {
		if(isLocal) {
			plus.runtime.openFile(path);
			return;
		}
		//网络视频
		var Intent = plus.android.importClass("android.content.Intent");
		var Uri = plus.android.importClass("android.net.Uri");
		var main = plus.android.runtimeMainActivity();
		var intent = new Intent(Intent.ACTION_VIEW);
		var uri = Uri.parse(path);
		intent.setDataAndType(uri, "video/*");
		main.startActivity(intent);
	};
	/**
	 * 新增视频的长度
	 * @param {Object} list 存放视频的数组
	 */
	var setVideoTime = function(list) {
		var i = setInterval(function() {
			var videolist = document.querySelectorAll("video");
			var curvideo = videolist.length > 0 ? videolist[videolist.length - 1] : '';
			// 这里注意, 必须判断视频的 readyState。
			// 如果有可能没加载完，则获取到的视频时长信息是不正确的。
			if(curvideo && curvideo.readyState > 0) {
				if(curvideo.duration == Infinity) {
					return;
				}
				// 计算,10进制，以及取模
				var minutes = parseInt(curvideo.duration / 60, 10);
				var seconds = Math.round(curvideo.duration % 60);
				minutes = minutes < 10 ? '0' + minutes : minutes;
				seconds = seconds < 10 ? '0' + seconds : seconds;
				list[list.length - 1].Vtime = minutes + ":" + seconds;
				// 将循环定时器清除
				clearInterval(i);
			}
		}, 200);
	};
	/**
	 * 从相册选择视频(多选兼容性不好，目前设置为单选)
	 * @param {Object} callback
	 */
	var pickVideo = function(callback, multiple) {
		plus.gallery.pick(function(path) {
			// 获取原始文件大小
			plus.io.resolveLocalFileSystemURL(path, function(entry) {
				// 限制上传视频文件大小不能超过50M
				entry.file(function(file) {
					var fsize = file.size / Math.pow(2, 20);
					if(fsize > 30) {
						mui.alert("所选视频文件大小不能超过30M");
					} else {
						if(typeof callback == "function") {
							callback(path);
						}
					}
				});
			}, function(e) {
				//console.log("解析文件错误: " + e.message);
				if(typeof callback == "function") {
					callback(false);
				}
			});
		}, function(e) {
			if(typeof callback == "function") {
				callback(false);
			}
		}, {
			filter: "video",
			multiple: false,
			system: false
		});
	};
	/**
	 * 网络视频的长度
	 * @param {Object} obj 当前视频信息
	 * @param {Object} index 第几个视频
	 */
	VideoFun.prototype.setVideoTime = function(list, obj, index) {
		var i = setInterval(function() {
			var videolist = document.querySelectorAll("video");
			var curvideo = videolist.length > 0 ? videolist[index] : '';
			// 这里注意, 必须判断视频的 readyState。
			// 如果有可能没加载完，则获取到的视频时长信息是不正确的。
			if(curvideo && curvideo.readyState > 0) {
				if(curvideo.duration == Infinity) {
					return;
				}
				// 计算,10进制，以及取模
				var minutes = parseInt(curvideo.duration / 60, 10);
				var seconds = Math.round(curvideo.duration % 60);
				minutes = minutes < 10 ? '0' + minutes : minutes;
				seconds = seconds < 10 ? '0' + seconds : seconds;
				obj.Vtime = minutes + ":" + seconds;
				list.splice(index, 1, obj);
				// 将循环定时器清除
				clearInterval(i);
			}
		}, 200);
	};
	/**
	 * 预览视频
	 * @param {Object} _that 点击响应事件的元素this
	 * @param {Object} isLocal 本地还是网络 true本地，false网络
	 */
	VideoFun.prototype.scanVideo = function(index, isLocal, that) {
		var v = document.getElementsByTagName('video')[index];
		var scale = 0.1;
		if(mui.os.android) {
			if(v.webkitRequestFullScreen && typeof(v.webkitRequestFullScreen) == "function") {
				v.webkitRequestFullScreen();
				v.addEventListener('playing', function() {
					if(that && that.style.padding == "") {
						//视频缩略图
						var canvas = document.createElement("canvas");
						canvas.width = v.videoWidth * scale;
						canvas.height = v.videoHeight * scale;
						canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
						that.src = canvas.toDataURL("image/png");
						that.style.padding = 0;
					}
				}, true);
				v.addEventListener('ended', function() {
					v.webkitExitFullScreen();
				}, true);
			} else {
				//这里针对低版本android做全屏播放兼容性处理
				androidScanVideo(v.getAttribute("src"), isLocal);
			}
		} else {
			v.play();
			v.addEventListener('playing', function() {
				if(that && that.style.padding == "") {
					//视频缩略图
					var canvas = document.createElement("canvas");
					canvas.width = v.videoWidth * scale;
					canvas.height = v.videoHeight * scale;
					canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
					that.src = canvas.toDataURL("image/png");
					that.style.padding = 0;
				}
			}, true);
		}
	};
	/**
	 * 退出全屏时android端视频的播放与暂停
	 * @param {Object} el  video标签
	 */
	VideoFun.prototype.OutFullscreen = function(el) {
		if(mui.os.android) {
			if(el.clientWidth == 1) {
				el.pause();
				//console.log("暂停");
			} else {
				if(el.paused) {
					el.play();
					//console.log("播放");
				}
			}
		}
	};
	/**
	 * 选择视频底部弹出 ：现场录制、从手机选择视频
	 * @param {Object} list 存放视频的数组
	 */
	VideoFun.prototype.selectVideo = function(list) {
		plus.nativeUI.actionSheet({
			title: "添加视频",
			cancel: "取消",
			buttons: [{
				title: "现场录制"
			}, {
				title: "从手机选择视频"
			}]
		}, function(e) {
			if(e.index == 1) { //现场录制
				videoCapture(list);
			} else if(e.index == 2) { //从手机选择视频
				pickVideo(function(path) {
					if(!path) {
						return;
					}
					list.push({
						src: path,
						Vtime: ""
					});
					path = plus.io.convertLocalFileSystemURL(path).replace('file://', '');
					var videolist = document.querySelectorAll("video");
					if(videolist.length > 0) {
						videolist[videolist.length - 1].setAttribute("src", path);
					}
					setVideoTime(list);
				});
			}
		});
	};
	/**
	 * 删除视频
	 * @param {Object} that点击响应事件的元素this
	 * @param {Object} list存放视频的数组
	 */
	VideoFun.prototype.delVideo = function(index, list) {
		list.splice(index, 1);
	};

	return VideoFun;
})();