/**
 * mui对象
 * **/
var muiObj = {
	init: function () {
		mui.init({
			gestureConfig: {
				tap: true, //默认为true
				doubletap: true, //默认为false
				longtap: true, //默认为false
				swipe: true, //默认为true
				drag: true, //默认为true
				hold: true, //默认为false，不监听
				release: true //默认为false，不监听
			}
		});

		//mui.previewImage();

		dom.properties.imageViewer = new mui.ImageViewer('.chat-item-img', {
			dbl: false
		});

		mui('#chat_body').scroll({
			indicators: false,
			deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
		});

		dom.init();
	},
	plusReady: function () {
		dom.webView.init();
	}
};

var dom = {
	//页面属性
	properties: {
		scope: "",
		ApiService: "",
		CacheService: "",
		DataService: "",
		UtilsService: "",
		faceView: "",
		exptionView: "",
		Loading: "",
		BillService: "",
		filter: "",
		apiHost: "",
		ChatUserService: ""
	},
	init: function () {
		this.event.init();
		// this.searchBox.init();
		this.content.init();
	},
	searchBox: {
		dom: document.querySelector(".search-box"),
		init: function () {
			this.event();
		},
		event: function () {
			mui(".search-box")
				.on("tap", ".search-placeholder", function () {
					//					this.parentElement.classList.add("is-searching");
					//					setTimeout(function() {
					//
					//					})
					//					this.parentElement.querySelector("input").focus();

					dom.properties.UtilsService.openWindow({
						id: "chat-record-search.html",
						url: "chat-record-search.html",
						extras: {
							chatID: dom.properties.scope.chatData.chatID,
							chatName: dom.properties.scope.chatData.chatName,
							chatCompID: dom.properties.scope.chatData.chatCompID,
							chatLogo: dom.properties.scope.chatData.chatLogo
						}
					});

				})
				.on("tap", ".search-body .mui-icon-search", function () {
					var input = this.parentElement.querySelector("input");
					var value = input.value.replace(/(^\s+)|(\s+$)/g, "");
					if (!value) {
						mui.toast(input.getAttribute("placeholder") || "请输入关键字");
						return;
					}
					var method = this.getAttribute("method");
					if (method) {
						this.parentElement.querySelector("input").blur();
						window[method] && window[method](value);
					}
				}).on("tap", ".search-body .mui-icon-clear", function () {

					this.parentElement.querySelector("input").value = "";
					var method = this.getAttribute("method");

					if (method) {
						this.parentElement.querySelector("input").blur();
						window[method] && window[method]();
					}
				});

			mui(".search-box").on("input", "input", function () {
				var value = this.value.replace(/(^\s+)|(\s+$)/g, "");
				if (value) {
					this.parentElement.querySelector(".mui-icon-clear").style.display = "block";
				} else {
					this.parentElement.querySelector(".mui-icon-clear").style.display = "none";
				}
			});

			mui.each(document.querySelectorAll(".search-box input"), function () {
				this.addEventListener("blur", function () {
					if (!this.value.replace(/(^\s+)|(\s+$)/g, "")) {
						this.parentElement.parentElement.classList.remove("is-searching");
					}
				});
			});
		}
	},
	msg: {
		activeData: null,
		selectData: function (id) {
			this.activeData = dom.properties.scope.chatData.msgList.filter(function (item) {
				return (item.MsgID + "-" + item.Version) == id;
			})[0];
		},
		chooseForwardUser: function () {
			dom.properties.UtilsService.openWindow({
				id: "contact-select.html",
				url: "../common/contact-select.html?action=select&multiselect=false&isGroup=true",
				extras: {
					selectObj: [],
					callback: "forwardback"
				}
			});
		},
	},
	content: {
		backHtml: "<div class='msg-item-tips'><p>对方已撤回消息</p></div>",
		backHtmlSlef: "<div class='msg-item-tips'><p>您已撤回消息</p></div>",
		msgList: document.querySelector("#msg-repeat"),
		dom: document.querySelector("#chat_body"),
		scrollToBottom: function () {

			mui("#chat_body").scroll().reLayout();
			setTimeout(function () {
				//
				mui("#chat_body").scroll().scrollToBottom(50);
				//dom.content.dom.scrollTop = dom.content.dom.scrollHeight;
			}, 100);
		},
		init: function () {
			this.btn_rensend.init();
			this.voice.init();
			this.itemEvent.init();
			this.tap();
			this.drag();
			this.initForwardUserBack();
		},
		initForwardUserBack: function () {
			window.forwardback = function (res) {
				res.forEach(function (user) {
					var type = dom.msg.activeData.RealType;
					var content = JSON.parse(dom.msg.activeData.Content);
					if (type == undefined) {
						type = content[1][0][0];
					}
					if (user.GroupCode) {
						dom.properties.ChatUserService.sendGroup({
							GroupCode: user.UserID,
							GroupName: user.ViewName,
							GroupID: user.GroupID,
							content: "",
							type: type
						}, JSON.stringify(content));
					} else {
						dom.properties.ChatUserService.send({
							chatId: user.UserID,
							chatName: user.ViewName,
							chatCompId: user.CompID,
							hasLogo: dom.properties.scope.chatData.UserLogo,
							chatLogo: user.ULogoIsExist,
							type: type
						}, JSON.stringify(content));
					}
				});
			}
		},

		tap: function () {

			mui(".mui-scroll-wrapper").on("tap", ".msg-user-img", function (e) {
				var id = this.getAttribute("data-user");

				var viewUrl = "../mine/personal-information.html",
					viewId = "personal-information.html";

				if (!this.classList.contains("mui-right")) {
					viewUrl = "../contact/personal-info.html?userid=" + id;
					viewId = "personal-info.html";
				}

				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: viewId,
					url: viewUrl
				});

				e.stopPropagation();

			});
		},
		drag: function () {
			document.querySelector("#chat_body").addEventListener("drag", function () {
				var _this = curData.chatData;
				var _scrollY = mui("#chat_body").scroll().y;
				var _deltaY = event.detail.deltaY;
				var _maxScrollY = mui("#chat_body").scroll().maxScrollY;
				if (_this.isDragLoading) {
					return;
				}

				if (_scrollY >= 0 && _deltaY > 70) {
					if (dom.content.dom.scrollTop <= 0 && !_this.isLoadding && _this.canDragLoad) {
						_this.isLoadding = true;
						_this.isLoaddingBT = false;
					}
				} else if (_scrollY < _maxScrollY && _deltaY < -30 && !_this.isLoaddingBT && _this.canDragLoadBT) {
					_this.isLoadding = false;
					_this.isLoaddingBT = true;
				}
			});

			document.querySelector("#chat_body").addEventListener("dragend", function (event) {
				var _this = curData.chatData;
				if (_this.isDragLoading) {
					return;
				}

				if (_this.isLoadding) {
					_this.loadPrePage();
				} else if (_this.isLoaddingBT) {
					_this.loadNextPage();
				}
			});
		},
		btn_rensend: {
			init: function () {
				this.tap();
			},
			tap: function () {
				mui(".mui-scroll-wrapper").on("tap", ".resend", function () {
					var type = this.getAttribute("data-type");
					var idx = this.getAttribute("data-idx");

					var msgItem = dom.properties.scope.chatData.msgList[idx];
					msgItem.SendTime = new Date().Format("yyyy-MM-dd HH:mm:ss");

					if (!isNetWorkCanUse()) {
						msgItem.SendState = 1;
						mui.toast("无可用网络！");
					} else {
						msgItem.SendState = 0;
					}

					dom.properties.scope.$apply();

					switch (type) {
						case "4":
							var content = JSON.parse(msgItem.Content);
							dom.msg.sendFile(msgItem.UpLoadCallBack || content[1][0][1], msgItem.MsgID, msgItem.IsUpload, "photo");
							break;
						case "6":
							var content = JSON.parse(msgItem.Content);
							dom.msg.sendFile(msgItem.UpLoadCallBack || content[1][0][1], msgItem.MsgID, msgItem.IsUpload, "voice");
							break;
						case "1":
						case "7":
							dom.webView.service.sendMsg(msgItem);
							break;
					}
				});
			}
		},
		voice: {
			init: function () {
				this.domEvent();
			},
			curPlay: {
				dom: "",
				obj: ""
			},
			domEvent: function () {
				mui(".mui-scroll-wrapper").on("tap", ".content-voice", function () {
					var file = this.querySelector(".voice-item").getAttribute("data-file");
					var isPlay = true;
					//播放语音是否与本次点击是否相同

					(dom.content.voice.curPlay.dom && dom.content.voice.curPlay.dom.getAttribute("data-file") == file) && (isPlay = false);
					dom.content.voice.curPlay.obj && (dom.content.voice.curPlay.obj.stop());
					dom.content.voice.curPlay.dom && dom.content.voice.setDomStopPlay();

					if (isPlay) {
						dom.content.voice.curPlay.dom = this.querySelector(".voice-item");

						dom.content.voice.checkLocal(file);
					}
				});
			},
			setDomPlay: function () {
				var isSend = dom.content.voice.curPlay.dom.getAttribute("data-isSend");
				if (isSend == "true") {
					dom.content.voice.curPlay.dom.querySelector("img").setAttribute("src", "../../images/voice-record_r.gif");
				} else {
					dom.content.voice.curPlay.dom.querySelector("img").setAttribute("src", "../../images/voice-play.gif");
				}

			},
			setDomStopPlay: function () {
				if (dom.content.voice.curPlay.dom) {
					var isSend = dom.content.voice.curPlay.dom.getAttribute("data-isSend");

					if (isSend == "true") {
						dom.content.voice.curPlay.dom.querySelector("img").setAttribute("src", "../../images/voice-record_r.png");
					} else {
						dom.content.voice.curPlay.dom.querySelector("img").setAttribute("src", "../../images/voice.png");
					}

					dom.content.voice.curPlay.dom = "";
					dom.content.voice.curPlay.obj = "";
				}
			},
			checkLocal: function (file) {
				var dirName = "";
				var fileName = file;
				if (!fileName.startsWith("_doc")) {
					fileName = file.substr(file.length - 36);
					dirName = "_doc/audio/_downloads/";
				}

				plus.io.resolveLocalFileSystemURL(dirName + fileName, function () {
					dom.content.voice.toPlay(dirName + fileName)
				}, function () {
					//下载文件
					dom.properties.UtilsService.downLoadAudio(encodeURI(file), "_downloads/" + fileName).then(function () {
						dom.content.voice.toPlay(dirName + fileName);
					}, function () {
						mui.toast("下载语音文件失败！");
						dom.content.voice.setDomStopPlay();
					});
				});
			},
			toPlay: function (fileName) {
				dom.content.voice.curPlay.obj = plus.audio.createPlayer(fileName);

				dom.content.voice.setDomPlay();

				dom.content.voice.curPlay.obj.play(function () {
					dom.content.voice.setDomStopPlay();
				}, function () {
					mui.toast("播放语音失败！");
					dom.content.voice.setDomStopPlay();
				});
			}
		},
		itemEvent: {
			init: function () {
				this.domEvent();
			},
			domEvent: function () {
				mui(".mui-scroll-wrapper").on("tap", ".content-event", function () {
					var _this = this;
					var itemDom = this.querySelector(".ev-item");
					if (itemDom.getAttribute("data-name") == "mddrive") {
						var msgId = _this.parentNode.parentNode.id.replace("msg-item-", "");

						dom.msg.selectData(msgId);

						if (itemDom.querySelector(".attach-isdown").getAttribute("data-value") == "false") {
							document.querySelector("#ac-down").style.display = "block";
							var names = itemDom.getAttribute("data-params").split(',')[0].split('.');
							if (offcieView.indexOf('.' + names[names.length - 1]) >= 0 || videoView.indexOf('.' + names[names.length - 1]) >= 0 || imgView.indexOf('.' + names[names.length - 1]) >= 0) {
								document.querySelector("#ac-view").style.display = "block";
							}

						} else {
							document.querySelector("#ac-open").style.display = "block";
						}

						if (!_this.parentNode.parentNode.classList.contains("msg-item-self")) {
							document.querySelector("#ac-todrive").style.display = "block";
						}

						mui('#sheet1').popover('toggle');
					} else {
						transEvent.trigger(7, {
							name: itemDom.getAttribute("data-name"),
							params: itemDom.getAttribute("data-params"),
							curId: dom.properties.scope.chatData.UserID
						});
					}
				}).on("tap", ".content-attach", function () {
					var id = this.parentNode.parentNode.id.replace("msg-item-", "");

					var itemDom = this.querySelector(".attach-item");
					if (itemDom) {
						var dataFile = itemDom.getAttribute("data-file");

						if (dataFile.indexOf("NW") >= 0) {
							mui.toast("请在迈迪设计宝查看！");
							return;
						}

						var fileName = itemDom.querySelector(".attach-title").innerHTML;

						var filePath = dataFile.split("\\");
						filePath = filePath[filePath.length - 1].split(".")[0]

						var isDown = itemDom.querySelector("span.attach-isdown");
						dom.content.downLoadFile(fileName, filePath, dataFile, isDown, id)
					} else {
						itemDom = this.querySelector(".svideo-item");
						if (itemDom) {
							var dataFile = itemDom.getAttribute("data-file");
							if (!dataFile.startsWith("file:")) {
								dataFile = dom.properties.ApiService.Api50 + "/api/v1/File/DownLoadFile?filePath=" + dataFile;
							}
							dom.properties.UtilsService.playVideo("", dataFile);
						}
					}
					e.preventDefault();
					e.stopPropagation();
				}).on("longtap", ".msg-item", function (e) {
					e.preventDefault();
					e.stopPropagation();
					var _this = this;
					var msgId = this.id.replace("msg-item-", "");

					if (_this.querySelector(".msg-item-tips")) {
						return;
					}

					dom.msg.selectData(msgId);

					var type = this.getAttribute("data-type");

					switch (type) {
						case "1":
						case "2":
						case "3":
							document.querySelector("#ac-copy").style.display = "block";
							break;
						case "4":
							if (_this.querySelector(".imageview-native").getAttribute("src").indexOf("file:") >= 0 || _this.querySelector(".imageview-native").getAttribute("src").indexOf("MsgFile") > 0 || _this.querySelector(".imageview-native").getAttribute("src").indexOf("MdtFile") > 0 || _this.querySelector(".imageview-native").getAttribute("src").indexOf("MdDrive") > 0) {
								document.querySelector("#ac-todrive").style.display = "block";
							}
							break;
						case "7":
							var itemDom = _this.querySelector(".ev-item");
							if (itemDom.getAttribute("data-name") == "mddrive") {
								if (itemDom.querySelector(".attach-isdown").getAttribute("data-value") == "false") {
									document.querySelector("#ac-down").style.display = "block";
									var names = itemDom.getAttribute("data-params").split(',')[0].split('.');
									if (offcieView.indexOf('.' + names[names.length - 1]) >= 0 || videoView.indexOf('.' + names[names.length - 1]) >= 0 || imgView.indexOf('.' + names[names.length - 1]) >= 0) {
										document.querySelector("#ac-view").style.display = "block";
									}

								} else {
									document.querySelector("#ac-open").style.display = "block";
								}
								if (!_this.classList.contains("msg-item-self")) {
									document.querySelector("#ac-todrive").style.display = "block";
								}
							}
							break;
						case "5":
							var itemDom = _this.querySelector(".attach-item");
							if(itemDom)
							{
								if (_this.querySelector(".attach-isdown").getAttribute("data-value") == "false") {
									document.querySelector("#ac-down").style.display = "block";
	
									var names = itemDom.getAttribute("data-file").split('.');
									if (offcieView.indexOf('.' + names[names.length - 1]) >= 0 || videoView.indexOf('.' + names[names.length - 1]) >= 0 || imgView.indexOf('.' + names[names.length - 1]) >= 0) {
										document.querySelector("#ac-view").style.display = "block";
									}
								} else {
									document.querySelector("#ac-open").style.display = "block";
								}
								document.querySelector("#ac-todrive").style.display = "block";
							}
					
							break;
					}

					mui('#sheet1').popover('toggle');
				});

				document.querySelector("#ac-view").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');
					var content = JSON.parse(dom.msg.activeData.Content)[1][0];
					var fileName = "";
					var fileUrl = "";
					if (content[0] == 5) {
						var fileExt = content[1].split('.');
						fileExt = '.' + fileExt[fileExt.length - 1];
						fileName = content[1];
						fileUrl = dom.properties.ApiService.Down + ('/' + content[3].replace(/\\/g, "/"));
					} else if (content[0] == 7) {
						var fileExt = content[3].split('.');
						fileExt = '.' + fileExt[fileExt.length - 1];
						fileName = content[3];
						fileUrl = dom.properties.ApiService.Down + content[5][0];
					}

					var url = "yun-file-view.html";
					if (videoView.indexOf(fileExt) >= 0) {

						if (plus.os.name == "Android") {
							plus.Push.playVideo(fileUrl, fileName)
							return;
						} else {
							url = "yun-video-view.html";
						}
					} else if (fileExt.toLowerCase() == ".pdf") {
						url = "yun-file-pdf.html";
					} else if (imgView.indexOf(fileExt.toLowerCase()) >= 0) {
						plus.nativeUI.previewImage([fileUrl], {
							loop: true
						});

						return;
					}
					dom.properties.UtilsService.openWindow({
						url: url,
						id: "yun-view.html",
						extras: {
							data: {
								FileName: fileName,
								FileUrl: fileUrl
							}
						}
					});
				});
				document.querySelector("#ac-open").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');

					var content = JSON.parse(dom.msg.activeData.Content);
					var isDown = document.querySelector("#msg-item-" + (dom.msg.activeData.ID || dom.msg.activeData.MsgID) + " span.attach-isdown");

					if (content[1][0][0] == 7) {
						dom.content.downLoadFile(content[1][0][3], content[1][0][5][2], content[1][0][5][0], isDown, (dom.msg.activeData.ID || dom.msg.activeData.MsgID));
					} else {
						var dataFile = content[1][0][3];
						if (dataFile.indexOf("NW") >= 0) {
							mui.toast("请在迈迪设计宝查看！");
							return;
						}
						var filePath = dataFile.split("\\");
						filePath = filePath[filePath.length - 1].split(".")[0]
						dom.content.downLoadFile(content[1][0][1], filePath, dataFile, isDown, (dom.msg.activeData.ID || dom.msg.activeData.MsgID));
					}


				});
				document.querySelector("#ac-down").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');

					var content = JSON.parse(dom.msg.activeData.Content);
					var isDown = document.querySelector("#msg-item-" + (dom.msg.activeData.ID || dom.msg.activeData.MsgID) + " span.attach-isdown");
					if (content[1][0][0] == 7) {
						var fileName = content[1][0][3];
						var dataFile = content[1][0][5][0]
						dom.content.downLoadFile(fileName, content[1][0][5][2], dataFile, isDown, (dom.msg.activeData.ID || dom.msg.activeData.MsgID));
					} else {
						var dataFile = content[1][0][3];
						if (dataFile.indexOf("NW") >= 0) {
							mui.toast("请在迈迪设计宝查看！");
							return;
						}
						var filePath = dataFile.split("\\");
						filePath = filePath[filePath.length - 1].split(".")[0]
						dom.content.downLoadFile(content[1][0][1], filePath, dataFile, isDown, (dom.msg.activeData.ID || dom.msg.activeData.MsgID));
					}
				});

				document.querySelector("#ac-forward").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');

					if (!dom.msg.activeData.ID && dom.msg.activeData.SendState != 2) {
						mui.toast("消息发送成功后才能转发!");
						return;
					}

					dom.msg.chooseForwardUser();
				});

				document.querySelector("#ac-copy").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');
					// 添加 copy 内容
					document.addEventListener('copy', function copy(e) {
						var msg = document.querySelector("#msg-item-" + (dom.msg.activeData.ID || dom.msg.activeData.MsgID) + " .msg-content-inner");
						var _msg = "";
						for (index in msg.childNodes) {
							var item = msg.childNodes[index];
							if (item.nodeType == 3) {
								_msg += item.textContent;
							} else if (item.nodeType == 1) {
								if (item.nodeName == "SPAN" || item.nodeName == "DIV" || item.nodeName == "P") {
									_msg += item.innerText;
								} else if (item.nodeName == "IMG") {
									if (item.getAttribute("value")) {
										_msg += item.getAttribute("value");
									} else {
										_msg += "[图片]";
									}
								}

							}
						}

						e.clipboardData.setData('text/plain', _msg);
						e.preventDefault();
					})
					// 执行 copy 命令
					document.execCommand('copy');
					// 移除绑定事件
					document.removeEventListener('copy', 'copy');

				})

				window.moveToBack = function (res) {
					var dirData = JSON.parse(res);

					var content = JSON.parse(dom.msg.activeData.Content)[1][0];
					var attachId = "";
					var fileGuid = "";
					var fileName = "";
					if (content[0] == 5) {
						fileName = content[1];
						fileGuid = '/' + (content[3].replace(/\\/g, "/"));
					} else if (content[0] == 7) {
						attachId = content[5][2];
					} else if (content[0] == 4) {
						if (content[1].startsWith("http")) {
							fileGuid = (content[1].replace(dom.properties.ApiService.Down, ""));

							fileGuid = fileGuid.replace('https://mdbox.maidiyun.com/50/api/v1/File/DownLoadPic?filePath=', "")
							fileGuid = fileGuid.replace('http://mdbox.maidiyun.com/50/api/v1/File/DownLoadPic?filePath=', "")

							if (fileGuid.indexOf('&') > 0) {
								fileGuid = fileGuid.split('&')[0];
							}

							fileGuid = fileGuid.replace(/\\/g, "/");
							if (!fileGuid.startsWith('/')) {
								fileGuid = '/' + fileGuid;
							}

							var fileNames = fileGuid.split('/');
							fileName = fileNames[fileNames.length - 1];
							var _fileName = fileName.split('.');
							fileName = fileName.replace('.' + _fileName[_fileName.length - 1], "");
							if (content[1].indexOf("MdDrive") > 0) {
								attachId = fileName;
								fileName = "";
								fileGuid = "";
							}
						} else {
							fileGuid = '/' + (content[1].replace(/\\/g, "/"));
							var fileNames = content[1].split('\\');
							fileName = fileNames[fileNames.length - 1];
							var _fileName = fileName.split('.');
							fileName = fileName.replace('.' + _fileName[_fileName.length - 1], "");
						}
					}

					transMessage.saveToDrive(attachId, fileGuid, fileName, dirData.ID);

				}

				document.querySelector("#ac-todrive").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');

					dom.properties.UtilsService.openWindow({
						url: "../mine/yun-file-chooeDir.html",
						id: "yun-file-chooeDir.html",
						extras: {
							callback: "moveToBack",
						}
					});


				});

				document.querySelector("#sheet1").addEventListener('webkitTransitionEnd', function () {
					if (this.style.display == "none") {
						dom.content.hideAc();
					}
				});

				function transEmotion(text) {

					var matchs = text.match(/[\[][\u4e00-\u9fa5A-Za-z0-9]{1,10}[\]]/g);
					if (!matchs || matchs.length == 0) {
						return text;
					} else {
						for (var i = 0; i < matchs.length; i++) {
							var img = '<img style="margin-right:0px;" src="../../images/Emotion/' + emotionData[matchs[i]] + '.gif" value="' + matchs[i] + '" class="chatFace">';

							var reg = new RegExp('\\[' + matchs[i].substring(1, matchs[i].length - 1) + '\\]', "g");
							text = text.replace(img, matchs[i]);
						}
						return text;
					}
				};
			}
		},
		hideAc: function () {
			document.querySelector("#ac-view").style.display = "none";
			document.querySelector("#ac-copy").style.display = "none";
			document.querySelector("#ac-open").style.display = "none";
			document.querySelector("#ac-down").style.display = "none";
			document.querySelector("#ac-todrive").style.display = "none";
			document.querySelector("#ac-qrcode").style.display = "none";
		},
		downLoadFile: function (fileName, filePath, dataFile, isDown, msgId) {
			var dirName = "_doc/downloads/" + filePath + "/";
			var isNetWork = isNetWorkCanUse();

			if (dataFile.startsWith("file://")) {
				dirName = "";
				fileName = dataFile;
			}

			if (isDown.getAttribute("data-value") == "down") {
				return;
			}
			if (isDown.getAttribute("data-value") == "true") {
				plus.io.resolveLocalFileSystemURL(dirName + fileName, function (entry) {
					plus.runtime.openFile(dirName + fileName, {
						top: 10,
						left: 10,
						width: 200,
						height: 200
					}, function (e) {
						mui.toast("无法打开此文件！");
					});
				}, function () {
					isDown.setAttribute("data-value", "false");
					isDown.innerText = "已删除";
				});
			} else {
				if (!isNetWork) {
					mui.toast("当前无可用网络！");
					return;
				}

				isDown.innerText = "下载中"
				isDown.setAttribute("data-value", "down");

				dom.properties.UtilsService.downLoadFile(encodeURI(dataFile), dirName + fileName, "msg-item-" + msgId).then(function () {
					isDown.innerText = "已下载"
					isDown.setAttribute("data-value", "true");
				}, function () {
					isDown.innerText = "失败";
					isDown.setAttribute("data-value", "false");
				});
			}
		}
	},
	event: {
		init: function () {
			this.bodyDrag();
			this.bodyDragEnd();
		},
		//按住拖拽事件
		bodyDrag: function () {
			document.querySelector("body").addEventListener("drag", function (event) {

				if (event.detail.deltaY > 70) {
					if (dom.content.dom.scrollTop <= 0 && !curData.chatData.isLoadding && curData.chatData.canDragLoad) {
						curData.chatData.loadding.style.display = "block"
						curData.chatData.isLoadding = true;
					}
				}
			}, false)
		},
		bodyDragEnd: function () {
			document.querySelector("body").addEventListener("dragend", function (event) {
				if (curData.chatData.isLoadding) {
					curData.chatData.loadPrePage();
				}
			});
		}
	},
	webView: {
		cur: "",
		init: function () {
			this.cur = plus.webview.currentWebview();

			//初始化参数
			this.initParams();
		},
		initParams: function () {
			dom.properties.scope.chatData.chatID = this.cur.chatId;
			dom.properties.scope.chatData.chatName = this.cur.chatName;
			dom.properties.scope.chatData.chatLogo = this.cur.hasLogo;
			dom.properties.scope.chatData.chatCompID = this.cur.chatCompId;
		}
	}

};

app.controller("chatRecordController", ["$scope", "$sce", "ApiService", "DataService", "CacheService", "UtilsService", "Loading", "BillService", "$filter", "ChatUserService", function ($scope, $sce, ApiService, DataService, CacheService, UtilsService, Loading, BillService, $filter, ChatUserService) {

	//聊天对象
	$scope.chatData = {
		UserID: "",
		UserName: "",
		chatID: "",
		chatName: "",
		chatCompID: "",
		msgList: [],
		searchList: [],
		chatLogo: false,
		UserLogo: false,
		isNetWork: true,
		search: {
			text: "",
			deleteSearch: function () {
				this.text = "";
			}
		}
	};

	dom.properties.scope = $scope;
	dom.properties.ApiService = ApiService;
	dom.properties.CacheService = CacheService;
	dom.properties.UtilsService = UtilsService;
	dom.properties.DataService = DataService;
	dom.properties.Loading = Loading;
	dom.properties.BillService = BillService;
	dom.properties.ChatUserService = ChatUserService;
	dom.properties.filter = $filter;

	dom.properties.apiHost = ApiService.Api50;

	$scope.event = {
		//是否显示时间，两次发送时间相隔五分钟才显示时间
		isShowTime: function (idx) {
			if (idx == 0) {
				return true;
			} else {

				var time = $scope.chatData.msgList[idx - 1].SendTime;
				var cTime = $scope.chatData.msgList[idx].SendTime;

				var mixTime = new Date(cTime).getTime() - new Date(time).getTime(); //时间差的毫秒数

				if (mixTime > (1000 * 60 * 5)) {
					return true;
				} else {
					return false;
				}
			}
		},
		getDate: function (date) {
			return GetDate(date, true, true, "yyyy-MM-dd")
		},
		//将发送的内容转换为显示的内容
		transContent: function (content, isSend) {
			var text = transMessage.trans(content, "", isSend);
			return $sce.trustAsHtml(text);
		},
		reload: function () {
			$scope.chatData.isNetWork = isNetWorkCanUse();
			$scope.chatData.isNetWork && (curData.chatData.load());
		},
		doSearch: function () {

			if (/\s+/g.test($scope.chatData.search.text)) {
				mui.toast("请输入关键字！");
				return;
			}

			curData.chatData.search.init();
		},
		search: function () {
			dom.properties.UtilsService.openWindow({
				id: "chat-record-search.html",
				url: "chat-record-search.html",
				extras: {
					chatID: dom.properties.scope.chatData.chatID,
					chatName: dom.properties.scope.chatData.chatName,
					chatCompID: dom.properties.scope.chatData.chatCompID,
					chatLogo: dom.properties.scope.chatData.chatLogo
				}
			});
		}
	};

	muiObj.init();

	var user = dom.properties.CacheService.get("user");
	user && ($scope.chatData.UserID = user.UserID) && ($scope.chatData.UserName = (user.UserName || user.RealName || user.Mdt)) && ($scope.chatData.UserLogo = user.ULogoIsExist);

	muiObj.plusReady();

	$scope.chatData.isNetWork = isNetWorkCanUse();

	$scope.chatData.isNetWork && (curData.chatData.load());
}]);

/**
 * 数据对象
 * **/
var curData = {
	chatData: {
		isLoadding: false,
		canDragLoad: false,
		loadding: document.querySelector("#content-loadding"),
		loaddingBT: document.querySelector("#content-loadding-bt"),
		isLoaddingBT: false,
		canDragLoadBT: false,
		isDragLoading: false,
		count: 10,
		curId: "",
		nextId: 0,
		preId: 0,
		load: function () {
			var _this = this;
			var scope = dom.properties.scope;
			var userId = dom.properties.scope.chatData.chatID;

			var loadType = "pre";

			var url = dom.properties.apiHost + "/api/v1/Message/MsgRecord_Pull?oppoId=" + userId + "&pageSize=" + _this.count + "&curId=" + _this.preId + "&pullType=1";

			// else
			if (_this.canDragLoadBT && _this.nextId && _this.isLoaddingBT) {
				url = dom.properties.apiHost + "/api/v1/Message/MsgRecord_Pull?oppoId=" + userId + "&pageSize=" + _this.count + "&curId=" + (_this.nextId - 1) + "&pullType=2";
				loadType = "next";
			}

			_this.isDragLoading = true;
			if (loadType == "pre") {
				_this.loadding.style.display = "block";
				_this.loaddingBT.style.display = "none";
			} else {
				_this.loadding.style.display = "none";
				_this.loaddingBT.style.display = "block";
			}

			dom.properties.DataService.get(url).then(function (data) {
				loadType == "pre" && (scope.chatData.msgList = data.Data.concat(scope.chatData.msgList)) && (_this.canDragLoad = data.NextID > 0);
				loadType == "next" && (scope.chatData.msgList = scope.chatData.msgList.concat(data.Data)) && (_this.canDragLoadBT = data.NextID > 0);

				var offsetTop = 0,
					scrollTop = 0;
				if (loadType == "pre") {
					if (_this.preId) {
						var topDom = document.querySelector("#msg-item-" + _this.preId);
						if (topDom) {
							offsetTop = topDom.offsetTop;
							scrollTop = mui("#chat_body").scroll().y
						}
					}

					_this.loadding.style.display = "none";
				} else if (loadType == "next") {
					if (_this.nextId) {
						var topDom = document.querySelector("#msg-item-" + _this.nextId);
						if (topDom) {
							offsetTop = topDom.offsetTop;
							scrollTop = mui("#chat_body").scroll().y
						}
					}

					_this.loaddingBT.style.display = "none";
				}

				var elements = _this.getListHtml(0, data.Data);

				if (loadType == "pre") {
					for (var i = elements.length - 1; i >= 0; i--) {

						var _preDom = document.querySelector(".msg-item");


						if (_preDom && i == elements.length - 1) {
							var _time = elements[i][0].getAttribute("data-time");
							var _preTime = _preDom.getAttribute("data-time");
							if (_time - _preTime < 60 * 10000) {
								_preDom.querySelector(".time-split").style.display = "none";
							}
						}


						angular.element(dom.content.msgList).prepend(elements[i])
					}
				} else if (loadType == "next") {
					elements.forEach(function (_item) {
						angular.element(dom.content.msgList).append(_item);
					});
				}

				setTimeout(function () {
					//dom.properties.imageViewer.findAllImage();
					previewImages();
				}, 200);

				if (loadType == "pre") {
					if (_this.preId) {
						var topDom = document.querySelector("#msg-item-" + _this.preId);
						if (topDom) {
							mui("#chat_body").scroll().reLayout();
							mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
							mui('#chat_body').scroll().scrollTo(0, -(topDom.offsetTop - offsetTop + scrollTop + 20), 0);
						}
					} else {
						setTimeout(function () {
							dom.content.scrollToBottom();
						}, 150);
					}
					_this.isDragLoading = _this.isLoadding = false;
				} else if (loadType == "next") {
					if (_this.nextId) {

						if (scope.chatData.msgList[0].length > 0 && _this.nextId == scope.chatData.msgList[0].ID) {
							var topDom = document.querySelector("#msg-item-" + _this.nextId);
							if (topDom) {
								mui("#chat_body").scroll().reLayout();
								mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
								mui('#chat_body').scroll().scrollTo(0, -(topDom.offsetTop - offsetTop + 20), 0);
							}
						} else {
							mui("#chat_body").scroll().reLayout();
							mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
							mui('#chat_body').scroll().scrollTo(0, (scrollTop - 20), 0);
						}
					}
					_this.isDragLoading = _this.isLoaddingBT = false;
				}

				//设置下次拉去的开始ID
				_this.nextId = scope.chatData.msgList.length > 0 ? scope.chatData.msgList[scope.chatData.msgList.length - 1].ID : 0;
				//设置下次拉去的开始ID
				_this.preId = scope.chatData.msgList.length > 0 ? scope.chatData.msgList[0].ID : 0;

				_this.isDragLoading = false;
			}, function () {
				loadType == "pre" && (_this.isLoadding = false) && (_this.loadding.style.display = "none");
				loadType == "next" && (_this.isLoaddingBT = false) && (_this.loaddingBT.style.display = "none");

				dom.properties.scope.chatData.isNetWork = false;
			});
		},
		loadPrePage: function () {
			var _this = this;
			setTimeout(function () {
				_this.load();
			}, 100)
		},
		loadByMsgId: function (msgId) {
			var _this = this;
			var _dom = document.querySelector("#msg-item-" + msgId);

			if (_dom) {
				if (_dom.offsetTop > (mui("#chat_body").scroll().scrollerHeight - mui("#chat_body").scroll().wrapperHeight)) {
					mui('#chat_body').scroll().scrollToBottom();
				} else {
					mui('#chat_body').scroll().scrollTo(0, -_dom.offsetTop, 0);
				}
			} else {
				dom.properties.scope.chatData.msgList = [];

				angular.element(dom.content.msgList).html("");

				_this.preId = 0;
				_this.nextId = msgId;
				_this.canDragLoadBT = true;
				_this.isLoaddingBT = true;

				setTimeout(function () {
					_this.load();
				}, 100)
			}
		},
		loadNextPage: function () {
			var _this = this;

			setTimeout(function () {
				_this.load();
			}, 100)
		},
		userPhoto: function (_self) {
			var scope = dom.properties.scope;
			var filter = dom.properties.filter;

			var _photo = angular.element("<div class='msg-user-img'>").addClass(_self && "mui-right" || "");
			_photo.attr("data-user", scope.chatData[_self ? "UserID" : "chatID"]);
			if ((scope.chatData[_self ? "UserLogo" : "chatLogo"] || "false") !== "false") {
				_photo.css("background-image", "url(" + filter("getUserLogo")(scope.chatData[_self ? "UserID" : "chatID"], 50, 0) + ")");
			} else {
				_photo.addClass("md-userCustomLogo");
				_photo.html(filter("getUserCustomLogo")(scope.chatData[_self ? "UserName" : "chatName"]));
			}
			return _photo;
		},
		getListHtml: function (prev, data) {
			var _selfPhoto = this.userPhoto(true);
			var _otherPhoto = this.userPhoto();
			var scope = dom.properties.scope;

			var elements = data.map(function (_message) {
				var is_self = _message.SendID == scope.chatData.UserID;
				var timestamp = new Date(_message.SendTime.replace(/-/g, "/")).getTime();
				var content = JSON.parse(_message.Content);
				var type = content[1][0][0];
				if (content[1].length > 1) {
					type = 1;
				}
				var message = angular.element("<div class='msg-item' data-type='" + type + "'  data-time='" + timestamp + "'>")
					.addClass(is_self ? "msg-item-self" : "msg-item-chat");
				if (_message.Version && _message.ID) {
					message.attr("msgClientNo", _message.MsgID + '-' + _message.Version)
						.attr("id", 'msg-item-' + _message.MsgID + '-' + _message.Version);
				} else {
					message.attr("msgClientNo", _message.MsgID)
						.attr("id", 'msg-item-' + _message.MsgID);
				}
				if (timestamp - prev > 60 * 1000) {

					var time_split = angular.element("<div class='time-split'>").html("<span>" + scope.event.getDate(_message.SendTime) + "</span>");
					message.append(time_split);
				}
				prev = timestamp;
				var _content = angular.element("<div class='msg-item-body'>");

				if (_message.ID && _message.MsgType == 25) {
					_content.append((is_self ? dom.content.backHtmlSlef : dom.content.backHtml));
				} else {
					message.append((is_self ? _selfPhoto : _otherPhoto).clone());
					var _type = _message.Content.substr(4, 3);
					var content_class = ({
						"[6,": "content-voice",
						"[7,": "content-event",
						"[5,": "content-attach"
					})[_type];
					var content = angular.element("<div class='msg-content'>").addClass(content_class);
					if (_message.SendState < 2) {
						var template = angular.element('<div class="content-exp resend">');
						template.attr({
							"id": 'content-exp-' + _message.MsgID,
							"data-state": _message.SendState,
							"data-type": _message.RealType,
							"data-id": _message.MsgID
						});
						template.html('<img src="../../images/Emotion/' + (_message.SendState === 0 ? "loadding.gif" : "reSend.png") + '"/>');
						content.append(template);
					}
					var content_text = angular.element('<div class="msg-content-inner">').addClass(_type === "[4," ? "msg-content-image" : "");
					try {
						content_text.html(scope.event.transContent(_message.Content, is_self));
					} catch (e) {}
					content.append(content_text);
					content.append(angular.element('<div class="msg-content-angle"></div>'));
					_content.append(content);
				}
				message.append(_content);

				return message;
			});

			return elements;
		}
	}
};

/**
 * 初始化
 * **/
mui.plusReady(function () {
	setTimeout(function () {
		angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	}, 50)
});