/**
 * mui对象
 * **/
var muiObj = {
	init: function () {
		mui.init({
			gestureConfig: {
				tap: true, //默认为true
				doubletap: false, //默认为false
				longtap: true, //默认为false
				swipe: true, //默认为true
				drag: true, //默认为true
				hold: true, //默认为false，不监听
				release: true //默认为false，不监听
			},
			beforeback: function () {
				var resultStr = dom.footer.input.getHtml();
				var isDraft = false;
				if (resultStr && resultStr != "<br>") {
					isDraft = true;
				} else {
					isDraft = false;
				}
				RpcClient.invoke("message.html", "RPC_Draft", {
					ID: dom.properties.scope.chatData.chatID,
					isDraft: isDraft
				})

				plus.webview.currentWebview().hide("slide-out-right");
				return false;
			}
		});

	},
	plusReady: function () {
		var isShow = false;
		// mui.previewImage("", function () {
		//     if (dom.subView.properties.isShow) {
		//         dom.subView.face.hide();
		//         isShow = true;
		//     }
		//     dom.footer.input.blur();
		// }, function () {
		//     if (isShow) {
		//         dom.subView.face.show();
		//         isShow = false;
		//     }
		// });

		//		dom.properties.imageViewer = new mui.ImageViewer('.chat-item-img', {
		//			dbl: false
		//		});
		mui('#chat_body').scroll({
			indicators: false,
			deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
		});

		dom.init();

		dom.webView.init();
	}
};

//打开内部链接地址
function loadInnerUrl(url, data) {
	var winid = url.substring(url.lastIndexOf('/') + 1, url.indexOf('?'));
	var innerWs = openWindow(url, data || {}, winid, true);
}


//打开外部链接地址
function loadOtherUrl(url) {
	getSiteNameByDomain(url);
}

//获取外部网站名称
function getSiteNameByDomain(_url) {
	var urlReg = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
	var urls = urlReg.exec(_url);
	var url = "https://www.sojson.com/api/beian/" + urls[0];
	getAjaxData(url, function (reData) {
		var innerWs = openWindow('../scan/template.html', {
			author: reData.sitename,
			title: '分享',
			url: _url
		});
	});
};


/**
 * angular 对象
 * **/

app.controller("chatController", ["$scope", "$sce", "ApiService", "DataService", "CacheService", "UtilsService",
	"Loading", "BillService", "$filter", "TapService", "RPCObserver", "ChatUserService",
	function ($scope, $sce, ApiService, DataService, CacheService, UtilsService, Loading, BillService, $filter,
		TapService, RPCObserver, ChatUserService) {

		//聊天对象
		$scope.chatData = {
			UserID: "",
			CompID: 0,
			UserName: "",
			chatID: "",
			chatName: "",
			chatRemarkName: "",
			chatCompID: "",
			msgList: [],
			chatLogo: false,
			UserLogo: false,
			isNetWork: true,
			imageViewer: "",
			ShowType: 2,
			isShown: false,
			curUser: "",
			isAndroid: (plus.os.name == 'Android')
		};

		dom.properties.scope = $scope;
		dom.properties.ApiService = ApiService;
		dom.properties.CacheService = CacheService;
		dom.properties.UtilsService = UtilsService;
		dom.properties.DataService = DataService;
		dom.properties.Loading = Loading;
		dom.properties.BillService = BillService;
		dom.properties.filter = $filter;
		dom.properties.TapService = TapService;
		dom.properties.apiHost = ApiService.Api50;
		dom.properties.RPCObserver = RPCObserver;
		dom.properties.ChatUserService = ChatUserService;

		$scope.event = {
			getDate: function (date) {
				return GetDate(date, true, true, "yy-MM-dd")
			},
			//将发送的内容转换为显示的内容
			transContent: function (content, isSend) {
				var text = transMessage.trans(content, "", isSend);
				return $sce.trustAsHtml(text);
			},
			reload: function () {
				$scope.chatData.isNetWork = isNetWorkCanUse();
				$scope.chatData.isNetWork && (curData.chatData.reload());
			}
		};

		muiObj.init();

		var user = dom.properties.CacheService.get("user");
		$scope.chatData.curUser = user;
		user && ($scope.chatData.UserID = user.UserID) && ($scope.chatData.UserName = (user.UserName || user.RealName ||
			user.Mdt)) && ($scope.chatData.UserLogo = user.ULogoIsExist);
		user && ($scope.chatData.CompID = user.CompID);

		//muiObj.plusReady();

		dom.webView.initParams();

		$scope.chatData.isNetWork = isNetWorkCanUse();

		$scope.chatData.isNetWork && (curData.chatData.reload());

		dom.webView.cur.addEventListener("show", function () {
			if (!$scope.chatData.isShown) {
				muiObj.plusReady();
				$scope.chatData.isShown = true;
			}
			curData.chatData.setRead();
		});

		if (dom.properties.isInit) {
			muiObj.plusReady();
			$scope.chatData.isShown = true;
		}
	}
]);

/**
 * 页面对象
 * **/
var dom = {
	//页面属性
	properties: {
		scope: "",
		ApiService: "",
		CacheService: "",
		ChatUserService: "",
		DataService: "",
		UtilsService: "",
		TapService: "",
		faceView: "",
		exptionView: "",
		Loading: "",
		BillService: "",
		filter: "",
		win_height: "",
		cur_height: "",
		imageViewer: "",
		apiHost: "",
		RPCObserver: "",
		isBackGroud: false,
		isInit: query("isInit")
	},
	init: function () {

		//初始化body
		this.body.init();

		//初始化 footer
		this.footer.init();

		//初始化页面事件
		this.event.init();

		this.content.init();

		this.subView.init();
	},
	body: {
		dom: document.querySelector(".body_content"),
		init: function () {

			dom.properties.win_height = window.innerHeight - 1;
			dom.properties.cur_height = window.innerHeight - 1;

			dom.body.dom.style.height = dom.properties.cur_height + "px";
			dom.footer.dom.style.bottom = "0px";

			this.event.init();
		},
		event: {
			init: function () {
				this.resize();
			},
			resize: function () {
				window.addEventListener("resize", function () {
					dom.properties.cur_height = (window.innerHeight - 1);

					if (dom.subView.properties.isTap) {
						if (dom.subView.properties.isShow) {
							// dom.footer.dom.style.bottom = dom.subView.properties.height + "px";
						}

						return;
					}

					dom.body.dom.style.height = (dom.properties.cur_height - 1) + "px";

					// dom.footer.dom.style.bottom = "0px";

					setTimeout(function () {
						if (dom.subView.properties.isShow) {
							dom.subView.hide(false);
						}
					}, 200)

					if (dom.footer.input.properties.isBottom != false && !dom.properties.isBackGroud) {
						dom.content.scrollToBottom();
					}
				});
			}
		}
	},
	//页面事件
	event: {
		init: function () {
			this.btn_More.init();
			this.pause();
			this.resume();
		},
		btn_More: {
			init: function () {
				this.tap();
			},
			tap: function () {
				document.querySelector("#btn_more").addEventListener("tap", function () {
					dom.webView.more.show();
				});
			}
		},
		//应用切换到后台
		pause: function () {
			document.addEventListener("pause", function () {
				dom.properties.isBackGroud = true;
				//应用切换到后台的时候停止播放语音
				dom.content.voice.curPlay.obj && (dom.content.voice.curPlay.obj.stop());
				dom.content.voice.curPlay.dom && dom.content.voice.setDomStopPlay();
			}, false);
		},
		resume: function () {
			document.addEventListener("resume", function () {
				setTimeout(function () {
					dom.properties.isBackGroud = false;
				}, 500);
			});
		}
	},
	webView: {
		cur: null,
		old_back: "",
		init: function () {

			//设置背景颜色

			this.cur.setStyle({
				background: "#EFEFEF",
				bottom: "0px",
				top: "0px"
			});

			this.old_back = mui.back;

			mui.back = function () {
				var imgView = false;

				if (dom.properties.imageViewer.isActive) {
					// previewImage.closePreview()
					mui.trigger(dom.properties.imageViewer.closeButton, "tap");
				} else if (dom.subView.properties.isShow) {
					dom.subView.hide(true);
				} else if (dom.keyborder.isKeyBoard()) {
					dom.footer.input.blur();
				} else {
					dom.keyborder.notShow();
					dom.webView.old_back();
				}
			};

			//设置键盘弹出样式
			this.inputModel();

			this.more.init();
		},
		//设置键盘弹出样式
		inputModel: function () {
			this.cur.setStyle({
				softinputMode: "adjustResize"
			});
		},
		//初始化参数
		initParams: function () {
			this.cur = plus.webview.currentWebview();

			dom.properties.scope.chatData.chatID = this.cur.chatId;
			dom.properties.scope.chatData.chatName = this.cur.chatName;
			dom.properties.scope.chatData.chatLogo = this.cur.hasLogo;
			dom.properties.scope.chatData.chatCompID = this.cur.chatCompId;

			curData.chatData.getUserInfo(this.cur.chatId, function (res) {
				dom.properties.scope.chatData.chatCompID = res.CompID;
			});

			//初始化服务
			this.service.init();
		},
		more: {
			properties: {
				path: "../menus/menu-chat.html",
				id: "chat-menu.html",
			},
			obj: "",
			init: function () {
				this.properties.id = this.properties.id + dom.properties.scope.chatData.chatID;
				this.obj = plus.webview.getWebviewById(this.properties.id);
				if (!this.obj) {
					var styles = {
						background: 'transparent',
						zindex: 1000,
					};

					this.obj = plus.webview.create(this.properties.path, this.properties.id, styles, {
						chatId: dom.properties.scope.chatData.chatID,
						chatCompId: dom.properties.scope.chatData.chatCompID,
						chatLogo: dom.properties.scope.chatData.chatLogo,
						chatName: dom.properties.scope.chatData.chatName,
						needLogin: true
					});
				}
			},
			show: function () {
				this.obj.show("fade-in");
			}
		},
		//初始化服务
		service: {
			init: function () {
				this.RPC_ReceiveMessage();
				this.Rpc_RefChatViewName();
				this.RPC_MsgBack();
				this.RPC_MsgBackCall();
			},
			RPC_ReceiveMessage: function () {
				RpcServer.expose("RPC_ReceiveMessage", function (msg) {

					if (!msg.MsgID) {
						msg.MsgID = msg.MsgId.replace('|', '-');
						msg.msgClientNo = msg.MsgId.replace('|', '-');
					}
					//如果类型是发送则是回执
					if (msg.SendID == dom.properties.scope.chatData.UserID) {

						//找到dom
						var _dom = document.querySelector("#msg-item-" + msg.MsgID);
						if (!_dom && msg.msgClientNo) {
							_dom = document.querySelector("#msg-item-" + msg.msgClientNo.replace('|', '-'));
						}
						if (_dom) {
							var _idx = dom.properties.scope.chatData.msgList.findIndex(function (_item) {
								return (_item.ID || _item.MsgID) == (msg.MsgID || msg.ID)
							});

							dom.properties.scope.chatData.msgList[_idx].SendState = msg.SendState;
							dom.properties.scope.chatData.msgList[_idx].SendTime = msg.SendTime;

							if (msg.SendState == 2) {
								dom.properties.scope.chatData.msgList[_idx].msgClientNo = msg.msgClientNo;
								dom.properties.scope.chatData.msgList[_idx].MsgID = msg.msgClientNo;
								_dom.setAttribute("id", "msg-item-" + msg.msgClientNo);

								//发送成功直接删除掉loading
								angular.element(_dom.querySelector(".resend")).remove();
								_dom.setAttribute("msgClientNo", msg.msgClientNo);
							} else {
								//发送失败
								_dom.querySelector(".resend img").setAttribute("src", "../../images/Emotion/reSend.png");
								angular.element(_dom.querySelector(".resend")).attr("data-state", msg.SendState);
							}
						} else {
							if (msg.msgClientNo) {
								msg.MsgID = msg.msgClientNo.replace('|', '-');
							}
							dom.msg.push(msg);
						}
					} else {
						dom.msg.push(msg);

						curData.chatData.noReadLoad = msg.SendTime;
					}
				});
			},
			sendMsg: function (msg) {
				RpcClient.invoke("message.html", 'RPC_SendMsg', msg);
			},
			ReadMessage: function () {
				RpcClient.invoke("message.html", 'RPC_ReadMsg', dom.properties.scope.chatData.chatID);
			},
			Rpc_RefChatViewName: function () {
				dom.properties.RPCObserver.on('refresh_chat_viewName', 'refresh_chat_viewName');
				window.refresh_chat_viewName = function (_data) {

					var chatData = dom.properties.scope.chatData;
					if (chatData.chatID == _data.UserID) {
						chatData.chatName = _data.RemarkName;
						dom.properties.scope.$apply();
					}
				};
			},
			RPC_MsgBack: function () {
				RpcServer.expose("RPC_MsgBack", function (msg) {
					curData.backMsg(msg);
				});
			},
			RPC_MsgBackCall: function () {
				RpcServer.expose("RPC_MsgBackCall", function (msg) {
					curData.backMsg(msg);
				});
			}
		},
		chooseUser: {
			_callback: "",
			callback: function (data) {
				this._callback(data[0]);
			},
			open: function (back) {
				this._callback = back;
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "contact-select.html",
					url: "../common/contact-select.html?action=select&multiselect=false&must=true",
					extras: {
						selectObj: [],
						callback: "dom.webView.chooseUser.callback"
					}
				});
			}
		},
		fault: {
			_callback: "",
			callback: function (data) {
				this._callback(data);
			},
			open: function (back) {
				this._callback = back;
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "mat-fault-list.html",
					url: "../aftersale/mat-fault-list.html?action=select&must=true&title=客户工单",
					extras: {
						selectObj: {},
						callback: "dom.webView.fault.callback"
					}
				});
			}
		},
		equFault: {
			_callback: "",
			callback: function (data) {
				this._callback(data);
			},
			open: function (back) {
				this._callback = back;
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "fault-list.html",
					url: "../eqmentlib/fault-list.html?action=select&must=true&title=设备工单",
					extras: {
						selectObj: {},
						callback: "dom.webView.equFault.callback"
					}
				});
			}
		},
		custom: {
			_callback: "",
			callback: function (data) {
				this._callback(data)
			},
			open: function (back) {
				this._callback = back;
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "customer-search.html",
					url: "../search/customer-search.html?action=select&must=true",
					extras: {
						selectObj: {},
						callback: "dom.webView.custom.callback"
					}
				});
			}
		},
		supplier: {
			_callback: "",
			callback: function (data) {
				this._callback(data)
			},
			open: function (back) {
				this._callback = back;
				dom.properties.UtilsService.openWindow({
					needLogin: true,
					id: "comp-select.html",
					url: "../eqmentlib/comp-select.html?must=true",
					extras: {
						selectObj: {},
						callback: "dom.webView.supplier.callback"
					}
				});
			}
		}
	},

	subView: {
		properties: {
			height: 200,
			isShow: false,
			isTap: false
		},
		dom: document.querySelector(".sub-view"),
		autoShow: function (type) {
			var _scope = dom.properties.scope;
			var _this = this;

			if (_this.properties.isShow && _scope.chatData.ShowType == type) {
				dom.footer.input.focus();
			} else {
				_this.properties.isShow = true;

				_scope.chatData.ShowType = type;
				_scope.$apply();

				_this.show();
			}
		},
		show: function () {

			var _this = this;
			var _scope = dom.properties.scope;
			_this.properties.isShow = true;
			setTimeout(function () {
				_this.properties.isShow = true;
			}, 200);

			if (_scope.chatData.ShowType == 1) {
				dom.footer.btnFace.domImg.style.backgroundImage = "url(../../images/Emotion/keyboard-gray.png)";
				setTimeout(function () {
					dom.footer.btnFace.domImg.style.backgroundImage = "url(../../images/Emotion/keyboard-gray.png)";
				}, 200);
				dom.footer.btnSend.show();
			} else if (_scope.chatData.ShowType == 2) {
				dom.footer.btnFace.domImg.style.backgroundImage = "url(../../images/Emotion/icon-face-gray.png)";
				setTimeout(function () {
					dom.footer.btnFace.domImg.style.backgroundImage = "url(../../images/Emotion/icon-face-gray.png)";
				}, 200);
			}

			dom.footer.btnVoice.hide();

			var height = dom.properties.win_height - _this.properties.height;

			dom.body.dom.style.height = height + "px";
			if (dom.properties.win_height == dom.properties.cur_height) {
				// dom.footer.dom.style.bottom = (_this.properties.height) + "px";
				dom.content.scrollToBottom();
			}
		},
		hide: function (isChange) {
			this.properties.isShow = false;

			dom.footer.btnFace.domImg.style.backgroundImage = "url(../../images/Emotion/icon-face-gray.png)";

			var height = dom.properties.win_height;
			if (isChange != false) {
				var _height = dom.body.dom.style.height;
				if (_height != (height + "px")) {
					dom.body.dom.style.height = height + "px";
					// dom.footer.dom.style.bottom = "0px";
					if (mui("#chat_body").scroll().y == mui("#chat_body").scroll().maxScrollY) {
						dom.content.scrollToBottom();
					}
				}
			}
		},
		init: function () {
			this.face.init();
			this.exption.init();

			this.dom.style.height = this.properties.height + "px";
			this.dom.style.top = (dom.properties.win_height - this.properties.height) + "px";

			//初始化表情按钮
			dom.footer.btnFace.init();

			//初始化扩展按钮
			dom.footer.btnExption.init();
		},
		face: {
			data: emotionData,
			lineNum: 7,
			screenNum: 5,
			init: function () {
				var _this = this;
				var names = Object.getOwnPropertyNames(_this.data);
				var counts = Math.ceil(names.length / (_this.lineNum * _this.screenNum));

				var faceData = emotionData;

				var slide_Indicators = [];
				var slide_Items = [];

				for (var i = 1; i <= counts; i++) {
					var activeClass = "";
					if (i == 1) {
						activeClass = "mui-active";
					}
					slide_Indicators.push('<div class="mui-indicator ' + activeClass + '"></div>')
				}

				mui(".face-view .mui-slider-indicator")[0].innerHTML = slide_Indicators.join("");

				var i = 0;
				for (var name in this.data) {
					if (i == 0 || i == 35 || i == 70) {
						slide_Items.push('<div class="mui-slider-item">');
					}

					if ((i == 0 || i % 7 == 0) && (i - 1) != 0) {
						slide_Items.push("<div class='face-row'>")
					}

					var imgBack = "../../images/Emotion/Thumb/" + _this.data[name] + ".png";
					slide_Items.push("<div class='face-item needsclick' data-name='" + name + "' data-value='" + _this.data[name] +
						"'><div style='background-image:url(" + imgBack + ")'>&nbsp;</div></div>");

					if (i == names.length - 1) {

						slide_Items.push("<div class='face-item needsclick'><div>&nbsp;</div></div>");
						slide_Items.push("<div class='face-item needsclick'><div>&nbsp;</div></div>");
						slide_Items.push("<div class='face-item needsclick'><div>&nbsp;</div></div>");
						slide_Items.push("<div class='face-item needsclick'><div>&nbsp;</div></div>");
					}

					if (i != 0 && (i + 1) % 7 == 0) {
						slide_Items.push("</div>")
					}

					if (i == 34 || i == 69 || i == names.length - 1) {
						slide_Items.push('</div>')
					}
					i++;
				}

				mui(".face-view  .mui-slider-group")[0].innerHTML = slide_Items.join("");

				this.tap();

				this.slier();
			},
			tap: function () {

				mui(".face-view").on("tap", ".face-item", function () {
					var name = this.getAttribute("data-name");
					var value = this.getAttribute("data-value");

					if (name && value) {
						var img = "<img  src='../../images/Emotion/" + value + ".gif' value='" + name + "' class='chatFace'/>";

						dom.footer.input.dom.innerHTML = (dom.footer.input.dom.innerHTML += img);
						mui.trigger(dom.footer.input.dom, 'input', null);
						setTimeout(function () {
							dom.footer.input.scorllBottom();
						}, 50);
					}
				});
			},
			slier: function () {
				mui(".face-view.mui-slider").slider().gotoItem(0, 0);
				document.querySelector('.face-view.mui-slider').addEventListener('slide', function (event) {});
			}
		},
		exption: {
			init: function () {
				this.tap();
				this.initChooseFile();
				this.initMdDrive();
				this.initForwardUserBack();
			},
			initChooseFile: function () {
				if (plus.os.name == 'Android') {
					window.receiveFiles = function (event) {
						if (plus.os.name == 'Android') {
							var files = event.arguments;

							files.forEach(function (item) {
								dom.msg.send(5, {
									fileName: item.mFileName,
									filePath: "file://" + item.mFilePath,
									fileSize: ""
								});
							});
						}
					};
					document.addEventListener("push.receiveFiles", receiveFiles, false);
				}
			},
			initMdDrive: function () {
				window.yunback = function (reses) {

					reses.forEach(function (res) {

						if (imgView.indexOf(res.FileExt) >= 0) {
							dom.msg.send(4, dom.properties.ApiService.Down + res.FilePath);
						} else {
							var imgKey = transMessage.getImgKey(res.FileExt);

							var content = {
								eventName: "mddrive",
								logo: dom.properties.ApiService.Down + '/chat/' + imgKey + '.png',
								title: res.FileName + res.FileExt,
								desc: "",
								params: [res.FilePath, getFileSize(res.FileSize), res.FileGuid]
							};

							dom.msg.send(7, content);
						}

					});
				};
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
			writeLog: function (type, id, content) {
				dom.msg.send(7, content);
			},
			tap: function () {
				mui(".exption-view").on("tap", "li.mui-media", function (e) {
					dom.keyborder.notShow();
					var type = this.getAttribute("data-type");

					if (!isNetWorkCanUse()) {
						mui.toast("当前无可用网络！");
						return;
					}
					switch (type) {
						case "file":
							plus.Push.onBrowse();
							// dom.msg.send(5, {
							// 		fileName:"10-28号，滕州展会展示屏内容.docx",
							// 		filePath:"file:///storage/emulated/0/tencent/QQfile_recv/10-28号，滕州展会展示屏内容.docx",
							// 		fileSize:""
							// 	});
							break;
						case "yunFile":
							dom.properties.UtilsService.openWindow({
								id: "yun-file-header.html",
								url: "yun-file-header.html",
								extras: {
									callback: "yunback"
								}
							});
							break;
						case "photo":
							if (mui.os.ios) {
								dom.properties.UtilsService.chooseImage(true, 10, false, true).then(function (file) {
									file.forEach(function (item) {
										//console.log(item.FileSize)
										dom.msg.send(4, item.FilePath);
									});
								}, function () {});
							} else {
								plus.Push.chooseImage(function (file) {
									file = JSON.parse(file);
									file.forEach(function (item) {
										//console.log(item.FileSize)
										if (!item.startsWith("file://")) {
											item = "file://" + item;
										}
										dom.msg.send(4, item);
									});
								});
							}
							break;
						case "card":
							dom.webView.chooseUser.open(function (_data) {
								//console.log(JSON.stringify(_data))

								curData.chatData.getUserInfo(_data.UserID, function (res) {
									var content = {
										eventName: "user-card",
										logo: dom.properties.ApiService.Pic + '/dXNlci9sb2dv_' + res.UserID + '_100x100.png',
										title: res.UserName || res.Mdt,
										desc: res.CompID > 0 ? ((res.CompName || "") + " " + (res.OrgName || "")) : (res.Phone || ""),
										params: [res.UserID, res.ULogoIsExist]
									};

									dom.msg.send(7, content);
								});

							});
							break;
						case "fault":
							dom.webView.fault.open(function (_data) {
								var desc = _data.AudioLength > 0 ? "[" + _data.AudioLength + "秒语音描述]" + _data.Description : _data.Description;

								var content = {
									eventName: "fault",
									logo: dom.properties.ApiService.Down + "/chat/fault.png",
									title: "故障工单",
									desc: desc,
									params: [_data.ID]
								};
								dom.subView.exption.writeLog("fault", _data.ID, content);
							});
							break;
						case "equ-fault":
							dom.webView.equFault.open(function (_data) {
								var desc = _data.AudioLength > 0 ? "[" + _data.AudioLength + "秒语音描述]" + _data.FaultDescription : _data.FaultDescription;
								var content = {
									eventName: "equ-fault",
									logo: dom.properties.ApiService.Down + "/chat/equ-fault.png",
									title: "设备故障",
									desc: desc,
									params: [_data.ID]
								};
								dom.subView.exption.writeLog("eq-fault", _data.ID, content);

								//dom.msg.send(7, content);
							});
							break;
						case "custom":
							dom.webView.custom.open(function (_data) {
								if (!_data.ID) {
									return;
								}
								var content = {
									eventName: "custom",
									logo: dom.properties.ApiService.Down + "/chat/custom.png",
									title: _data.CustomerName || "",
									desc: _data.Province || "",
									params: [_data.ID || ""]
								};
								dom.msg.send(7, content);

							});
							break;
						case "supplier":
							dom.webView.supplier.open(function (_data) {
								if (!_data.id) {
									return;
								}
								var content = {
									eventName: "supplier",
									logo: dom.properties.ApiService.Down + "/chat/supplier.png",
									title: _data.suppliername || "",
									desc: _data.province || "",
									params: [_data.id || "", _data.sourcecompid || ""]
								};

								dom.msg.send(7, content);
							});
							break;
						case "svideo":
							dom.properties.UtilsService.recordVideo().then(function (res) {
								dom.msg.send(5, {
									fileName: "迈迪短视频",
									filePath: res.FilePath,
									fileSize: "",
									fileType: res.FileType
								});
							})
							break;
						default:
							mui.toast("敬请期待呦~~~");
							break;
					}

				});
			}
		}
	},
	//键盘对象
	keyborder: {
		isShow: true,
		notShow: function () {
			this.isShow = false;
			setTimeout(function () {
				this.isShow = true;
			}, 200);
		},
		show: function () {
			if (!this.isKeyBoard() && this.isShow) {
				if (mui.os.ios) {
					var webView = plus.webview.currentWebview().nativeInstanceObject();
					webView.plusCallMethod({
						"setKeyboardDisplayRequiresUserAction": false
					});
				} else {
					var Context = plus.android.importClass("android.content.Context");
					var InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
					var main = plus.android.runtimeMainActivity();
					var imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);
					imm.toggleSoftInput(0, InputMethodManager.SHOW_FORCED);
				}
			}
		},
		isKeyBoard: function () {
			var current_height = (window.innerHeight - 1);
			return dom.properties.win_height > current_height;
		},
		hide: function () {
			if (this.isKeyBoard()) {
				if (mui.os.android) {
					var main = plus.android.runtimeMainActivity();
					var Context = plus.android.importClass("android.content.Context");
					var InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
					var imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);
					imm.toggleSoftInput(0, InputMethodManager.HIDE_NOT_ALWAYS);
				} else {
					document.activeElement.blur();
				}
			}
		}
	},
	msg: {
		send: function (type, content) {
			var packData = {
				userId: dom.properties.scope.chatData.UserID,
				userName: dom.properties.scope.chatData.UserName,
				chatId: dom.properties.scope.chatData.chatID,
				chatName: dom.properties.scope.chatData.chatName,
				chatCompId: dom.properties.scope.chatData.chatCompID,
				hasLogo: dom.properties.scope.chatData.UserLogo,
				chatLogo: dom.properties.scope.chatData.chatLogo,
				reName: dom.properties.scope.chatData.chatRemarkName,
				content: content,
				type: type
			};

			var obj = transMessage.packSimple(packData);

			if (!isNetWorkCanUse()) {
				obj.SendState = 1;
				mui.toast("无可用网络！");
			}

			this.push(obj);

			switch (type) {
				case 6:
					dom.msg.sendFile(content.file, obj.MsgID, false, "voice");
					break;
				case 5:
					dom.msg.sendFile(content.filePath, obj.MsgID, false, content.fileType == 3 ? "svideo" : "attachment");
					break;
				case 4:
					if (content.startsWith("http")) {
						dom.webView.service.sendMsg(obj);
					} else {
						dom.msg.sendFile(content, obj.MsgID, false, "photo");
					}
					break;
				case 1:
				case 7:
					dom.webView.service.sendMsg(obj);
					break;
			}

		},
		push: function (msg) {

			if (document.querySelector("#msg-item-" + msg.MsgID)) {
				return;
			}

			var _msgList = dom.properties.scope.chatData.msgList;

			var pre = _msgList.length > 0 ? new Date(_msgList[_msgList.length - 1].SendTime.replace(/-/g, "/")).getTime() : 0;
			var element = curData.chatData.getListHtml(pre, [msg], 1);

			dom.properties.scope.chatData.msgList.push(msg);

			angular.element(dom.content.msgList).append(element[0]);
			dom.content.scrollToBottom();

			setTimeout(function () {
				// dom.content.viewImage();
				//dom.properties.imageViewer.findAllImage();

				previewImages();
				dom.content.scrollToBottom();
			}, 200);
		},
		sendFile: function (file, msgId, isUpload, fileType) {
			if (isUpload) {
				this.sendFileToService(msgId, file, fileType);
			} else {

				var uploadType = 0;
				switch (fileType) {
					case "photo":
						uploadType = 1;
						break;
					case "voice":
						uploadType = 2;
						break;
					case "attachment":
						uploadType = 4;
						break;
					case "svideo":
						uploadType = 3;
						break;
				}
				//1 图片
				//2语音
				//3视频
				//4附件
				var data = {
					fileType: uploadType,
					localFile: file,
					funcKey: "MsgFile",
					tempId: msgId,
					domId: "msg-item-" + msgId
				};

				dom.properties.UtilsService.uploadFile(data).then(function (res) {
					var result = res.responseText;
					typeof (result) == "string" && (result = JSON.parse(result));

					var extParams = "";
					if (fileType == "photo") {
						extParams = {
							Width: result.Data[0].Width,
							Height: result.Data[0].Height
						};
					} else if (fileType == "attachment") {
						extParams = (result.Data[0].FileSize / 1000).toFixed(2) + "KB";
					}
					var content = result.Data[0].FilePath;

					dom.msg.sendFileToService(res.tempId, content, fileType, extParams)
				}, function (res) {
					var result = res.responseText;
					typeof (result) == "string" && (result = JSON.parse(result));


					var msgItemDom = document.querySelector("#msg-item-" + res.tempId);

					if (msgItemDom) {
						//var idx = msgItemDom.getAttribute("data-idx");

						var idx = dom.properties.scope.chatData.msgList.findIndex(function (_item) {
							return (_item.MsgID || _item.ID) == res.tempId;
						});

						dom.properties.scope.chatData.msgList[idx].SendState = 1;

						document.querySelector("#content-exp-" + res.tempId).setAttribute("data-state", 1);

						msgItemDom.querySelector(".resend img").setAttribute("src", "../../images/Emotion/reSend.png");
					}

					mui.toast("发送失败：" + result.ErrorMessage);
				});
			}

		},
		sendFileToService: function (id, content, fileType, extParams) {
			var msgItemDom = document.querySelector("#msg-item-" + id);

			if (msgItemDom) {

				var msgItem = dom.properties.scope.chatData.msgList.find(function (_item) {
					return (_item.MsgID || _item.ID) == id;
				});

				msgItem.IsUpload = true;
				msgItem.UpLoadCallBack = content;
				var contentItem = JSON.parse(msgItem.Content);
				if (fileType == "attachment" || fileType == "svideo") {
					contentItem[1][0][2] = extParams;
					contentItem[1][0][3] = msgItem.UpLoadCallBack;
					if (fileType == "attachment") {
						document.querySelector("#msg-item-" + msgItem.MsgID + " .attach-desc span").innerText = extParams;
					} else if (fileType == "svideo") {
						contentItem[1][0][4] = [3];
					}
				} else {
					contentItem[1][0][1] = msgItem.UpLoadCallBack;
				}
				if (fileType == "photo" && extParams && contentItem[1][0].length != 4) {
					contentItem[1][0][2] = extParams.Width;
					contentItem[1][0][3] = extParams.Height;
				}

				var sendData = {
					MsgID: msgItem.MsgID,
					ReceiveID: msgItem.ReceiveID,
					ReceiveName: msgItem.ReceiveName,
					SendName: msgItem.SendName,
					SendTime: msgItem.SendTime,
					SendID: msgItem.SendID,
					ULogoIsExist: msgItem.ULogoIsExist,
					RemarkName: msgItem.RemarkName,
					SendState: 0,
					Content: JSON.stringify(contentItem),
					MsgType: 0
				};

				msgItem.Content = JSON.stringify(contentItem);

				dom.webView.service.sendMsg(sendData);
			}
		},
		activeQrCode: "",
		activeData: null,
		selectData: function (id) {
			this.activeData = dom.properties.scope.chatData.msgList.filter(function (item) {
				return (item.ID || item.MsgID) == id || (item.MsgID || item.ID) == id || (item.MsgID + '-' + item.Version) == id;
			})[0];
		},
		chooseForwardUser: function () {
			dom.properties.UtilsService.openWindow({
				id: "contact-select.html",
				url: "../common/contact-select.html?action=select&multiselect=true&isGroup=true",
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
		images: [],
		msgList: document.querySelector("#msg-repeat"),
		dom: document.querySelector("#chat_body"),
		init: function () {
			this.btn_rensend.init();
			this.voice.init();
			this.itemEvent.init();
			this.tap();
			this.drag();

			//previewImages();
		},
		autoFooter: function () {
			var height = dom.footer.dom.style.offsetHeight;
			this.dom.style.bottom = height + "px";
		},
		scrollToBottom: function () {
			mui("#chat_body").scroll().reLayout();
			mui("#chat_body").scroll().scrollToBottom(1);

			var links = document.querySelectorAll(".msg-content-inner *[src]");
			for (var i in links) {
				if (links[i].tagName == "IFRAME") {
					links[i].setAttribute("src", "");
				}
			}
		},
		tap: function () {
			document.querySelector(".mui-scroll-wrapper").addEventListener("tap", function () {
				dom.subView.hide();
				dom.footer.input.blur("", false);
				dom.footer.btnSend.show();

			});
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

				e.preventDefault();
				e.stopPropagation();

			});
		},
		drag: function () {
			document.querySelector("#chat_body").addEventListener("drag", function () {

				dom.footer.input.blur("", false);
				dom.subView.hide();

				if (mui("#chat_body").scroll().y >= 0 && event.detail.deltaY > 70) {
					var _this = curData.chatData;

					if (dom.content.dom.scrollTop <= 0 && !_this.isLoadding && _this.canDragLoad) {
						_this.loadding.style.display = "block";
						_this.isDragLoading = true;
					}
				}
			});

			document.querySelector("#chat_body").addEventListener("dragend", function (event) {
				var _this = curData.chatData;
				if (!_this.isLoadding && _this.isDragLoading) {
					_this.loadPrePage();
				}
			});
		},
		btn_rensend: {
			init: function () {
				this.tap();
			},
			tap: function () {
				mui(".mui-scroll-wrapper").on("tap", ".resend", function (event) {
					event.stopPropagation();
					var _state = this.getAttribute("data-state");
					if (_state != 1) {
						return;
					}
					var type = this.getAttribute("data-type");

					var _id = this.getAttribute("data-id");

					var msgItem = dom.properties.scope.chatData.msgList.find(function (_item) {
						return (_item.MsgID || _item.ID) == _id;
					});
					msgItem.SendTime = new Date().Format("yyyy-MM-dd HH:mm:ss");

					if (!isNetWorkCanUse()) {
						msgItem.SendState = 1;
						this.setAttribute("data-state", 1);
						mui.toast("无可用网络！");
					} else {

						document.querySelector("#msg-item-" + _id)

						this.setAttribute("data-state", '0');
						this.querySelector("img").setAttribute("src", "../../images/Emotion/loadding.gif");
						msgItem.SendState = 0;
					}

					//dom.properties.scope.$apply();

					switch (type) {
						case "4":
							var content = JSON.parse(msgItem.Content);
							dom.msg.sendFile(msgItem.UpLoadCallBack || content[1][0][1], msgItem.MsgID, msgItem.IsUpload, "photo");
							break;
						case "6":
							var content = JSON.parse(msgItem.Content);
							dom.msg.sendFile(msgItem.UpLoadCallBack || content[1][0][1], msgItem.MsgID, msgItem.IsUpload, "voice");
							break;
						case "5":
							var content = JSON.parse(msgItem.Content);
							dom.msg.sendFile(msgItem.UpLoadCallBack || content[1][0][3], msgItem.MsgID, msgItem.IsUpload, !content[1][0][4] ? "attachment" : content[1][0][4][0] == 3 ? "svideo" : "attachment");
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
					var isNetWork = isNetWorkCanUse();
					if (!isNetWork) {
						mui.toast("当前无可用网络！");
						return;
					}
					var file = this.querySelector(".voice-item").getAttribute("data-file");
					var isPlay = true;
					//播放语音是否与本次点击是否相同

					(dom.content.voice.curPlay.dom && dom.content.voice.curPlay.dom.getAttribute("data-file") == file) && (isPlay =
						false);
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
				mui(".mui-scroll-wrapper").on("tap", ".content-event", function (e) {
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

					e.preventDefault();
					e.stopPropagation();
				}).on("tap", ".content-attach", function (e) {
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
								dataFile = dom.properties.ApiService.Down + "/" + dataFile;
							}
							dom.properties.UtilsService.playVideo("", dataFile);
						}
					}
					e.preventDefault();
					e.stopPropagation();
				}).on("tap", ".chat-item-img", function () {
					// var obj = {
					//     urls: dom.content.images,
					//     current: this.getAttribute("data-preview-src")
					// };
					// previewImage.start(obj);

					//					var _images = document.querySelectorAll(".chat-item-img");
					//					
					//					
					//					for(var i=0;i<_images.length;i++)
					//					{
					//						
					//					}
					//					
					//					var images =_images.map(function(img) {
					//						return img.getAttribute("data-preview-src");
					//					});
					//					
					//					var _index  = images.indexOf(this.getAttribute("data-preview-src"));
					//					
					//					plus.nativeUI.previewImage(images, {
					//						current: _index,
					//						loop: true,
					//						indicator: 'number'
					//					});
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
							plus.Push.isQRCode(function (e) {
								if (e) {
									dom.msg.activeQrCode = e;
									document.querySelector("#ac-qrcode").style.display = "block";
								}
							}, _this.querySelector(".imageview-native").getAttribute("src"))
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
							if (itemDom) {
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
					if (_this.classList.contains("msg-item-self") && new Date().addMinutes(-2).getTime() < _this.getAttribute("data-time")) {
						document.querySelector("#ac-withdraw").style.display = "block";
					}

					mui('#sheet1').popover('toggle');
				});

				//验证扫码规则
				var m_url = 'http://m.maidiyun.com';
				var m_url_1 = 'https://m.maidiyun.com';
				var m_url_2 = "http://md9.vc";
				var my_url = 'http://m.my3dparts.com';

				document.querySelector("#ac-qrcode").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');
					var codeValue = dom.msg.activeQrCode;
					if (codeValue) {
						if (codeValue.match(/^http(|s):\/\//g)) {
							//如果是带有m.maidiyun.com或m.my3dparts.com标识的网址，说明是迈迪的专有码
							if (codeValue.indexOf(m_url) >= 0 || codeValue.indexOf(m_url_1) >= 0 || codeValue.indexOf(my_url) >= 0 || codeValue.indexOf(m_url_2) >= 0) {
								var params = codeValue.split('?');
								if (params.length > 1) {
									var codeValue = params[1];
									//验证是否是工业商城
									if (codeValue.indexOf("mdt=") == 0 && codeValue.length == 12) {
										if (dom.properties.scope.chatData.curUser.Token) {
											loadInnerUrl(MdAppUrl.Mobile + "/shop.html?isMdt=true&isMdtLogin=true&mdt=" + codeValue.split('=')[1]);
										} else {
											loadInnerUrl(MdAppUrl.Mobile + "/shop.html?isMdt=true&isMdtLogin=false&mdt=" + codeValue.split('=')[1]);
										}
										return;
									}
									checkMdCode(codeValue);
									return;
								}
							}
							loadOtherUrl(codeValue)
						} else { //不带网址的码，需要验证是不是迈迪国标通用物联码，不是的仅显示
							checkMdCode(codeValue);
						}
					}
				});

				function checkMdCode(code) {
					if (code.indexOf('MDU') == 0) {
						//打开加用户好友的页面
						loadInnerUrl("../contact/personal-info.html?userid=" + code.substr(3));
					}else if (code.indexOf('MDGP') == 0) {
						loadInnerUrl("group-info-code.html?groupcode=" + code.substr(4));
					}
				}

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

					var msgId = (dom.msg.activeData.ID ? dom.msg.activeData.MsgID + "-" + dom.msg.activeData.Version : dom.msg.activeData.MsgID);
					var content = JSON.parse(dom.msg.activeData.Content);
					var isDown = document.querySelector("#msg-item-" + msgId + " span.attach-isdown");

					if (content[1][0][0] == 7) {
						dom.content.downLoadFile(content[1][0][3], content[1][0][5][2], content[1][0][5][0], isDown, msgId);
					} else {
						var dataFile = content[1][0][3];
						if (dataFile.indexOf("NW") >= 0) {
							mui.toast("请在迈迪设计宝查看！");
							return;
						}
						var filePath = dataFile.split("\\");
						filePath = filePath[filePath.length - 1].split(".")[0]
						dom.content.downLoadFile(content[1][0][1], filePath, dataFile, isDown, msgId);
					}


				});
				document.querySelector("#ac-down").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');
					var msgId = (dom.msg.activeData.ID ? dom.msg.activeData.MsgID + "-" + dom.msg.activeData.Version : dom.msg.activeData.MsgID);
					var content = JSON.parse(dom.msg.activeData.Content);
					var isDown = document.querySelector("#msg-item-" + msgId + " span.attach-isdown");
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

				document.querySelector("#ac-withdraw").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');

					if (!dom.msg.activeData.ID && dom.msg.activeData.SendState != 2) {
						mui.toast("消息发送成功后才能转发!");
						return;
					}

					if ((new Date().addMinutes(-2).getTime() > new Date(dom.msg.activeData.SendTime).getTime())) {
						mui.alert("发送时间超过五分钟不能撤回!");
						return;
					}
					var backData = {
						vId: dom.webView.cur.id,
						vBack: "RPC_MsgBack"
					};
					if (dom.msg.activeData.msgClientNo) {
						backData.msgId = dom.msg.activeData.msgClientNo.replace('-', '|');
					} else {
						backData.msgId = dom.msg.activeData.MsgID + '|' + dom.msg.activeData.Version;
					}
					RpcClient.invoke("message.html", 'RPC_BackMsg', backData);
				});

				document.querySelector("#ac-copy").addEventListener("tap", function () {
					mui('#sheet1').popover('toggle');
					var msgId = (dom.msg.activeData.ID ? dom.msg.activeData.MsgID + "-" + dom.msg.activeData.Version : dom.msg.activeData.MsgID);
					// 添加 copy 内容
					document.addEventListener('copy', function copy(e) {
						var msg = document.querySelector("#msg-item-" + msgId + " .msg-content-inner");
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
					// document.removeEventListener('copy', 'copy');

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
			document.querySelector("#ac-withdraw").style.display = "none";
			document.querySelector("#ac-qrcode").style.display = "none";
		},
		downLoadFile: function (fileName, filePath, dataFile, isDown, msgId) {
			var dirName = "_doc/downloads/" + filePath + "/";
			var isNetWork = isNetWorkCanUse();

			if (dataFile.startsWith("file://")) {
				dirName = "";
				fileName = dataFile;
			}

			fileName = fileName.replace(/\'/g, "\\'")

			if (isDown.getAttribute("data-value") == "down") {
				return;
			}
			if (isDown.getAttribute("data-value") == "true") {
				plus.io.resolveLocalFileSystemURL(dirName + (fileName), function (entry) {
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
		},
		viewImage: function () {
			dom.content.images = [];

			angular.forEach(mui(".chat-item-img"), function (_item) {
				dom.content.images.push(_item.getAttribute("data-preview-src"));
			});

		}
	},
	//底部输入框对象
	footer: {
		dom: document.querySelector("footer"),
		//获取底部footer的padding值
		padding: function () {
			return 8;
		},
		init: function () {
			//初始化语音
			this.voice.init();

			//初始化输入框
			this.input.init();

			//发送按钮初始化
			this.btnSend.init();

			//按住说话
			this.btnVoice.init();
		},
		autoHeight: function () {
			var height = dom.footer.input.dom.offsetHeight + dom.footer.padding();

			if (height > 100) {
				dom.footer.dom.style.height = '100px';
			} else {
				dom.footer.dom.style.height = (height + dom.footer.padding()) + 'px';
			}
		},
		voice: {
			dom: document.querySelector("footer #msg-type"),
			domBtn: document.querySelector("footer #msg-type .chat-voice"),
			type: 0,
			init: function () {
				this.tap();
			},
			tap: function () {
				this.dom.addEventListener("tap", function () {
					var isNetWork = isNetWorkCanUse();
					if (!isNetWork) {
						mui.toast("当前无可用网络！");
						return;
					}

					if (dom.footer.voice.type == 0) {
						//						var isCan = checkPermission("RECORD");
						//						if(!isCan) {
						//							return;
						//						}
						dom.footer.btnVoice.show();
					} else {
						dom.footer.btnVoice.hide(true);
					}
				});
			}
		},
		//语音按钮... 按住说话
		btnVoice: {
			properties: {
				recorder: null,
				recordCancel: "",
				//是否正在录音
				isRecord: false,
				audio_tips: document.getElementById("audio_tips"),
				startTimestamp: "",
				stopTimestamp: "",
				stopTimer: "",
				endTimer: "",
				releaseStop: false,
				MIN_SOUND_TIME: 800,
				MAX_SOUND_TIME: 60000
			},
			boxSoundAlert: document.querySelector('#sound-alert'),
			setSoundAlertVisable: function (show) {
				if (show) {
					dom.footer.btnVoice.boxSoundAlert.style.display = 'block';
					dom.footer.btnVoice.boxSoundAlert.style.opacity = 1;
				} else {
					dom.footer.btnVoice.boxSoundAlert.style.opacity = 0;
					//fadeOut 完成再真正隐藏
					setTimeout(function () {
						dom.footer.btnVoice.boxSoundAlert.style.display = 'none';

					}, 200);
				}
			},
			//测试录音，判断您是否需要语音权限
			testVoice: function () {
				this.properties.recorder.record({
					format: "amr",
					filename: "_doc/audio/"
				}, function (path) {}, function (e) {});

				setTimeout(function () {
					dom.footer.btnVoice.properties.recorder.stop();
				}, 50);
			},
			dom: document.querySelector("footer #msg-sound"),
			show: function () {
				dom.subView.hide();
				dom.footer.btnSend.hide();

				//this.testVoice();

				dom.footer.input.blur(function () {
					dom.footer.voice.domBtn.style.backgroundImage = "url(../../images/Emotion/keyboard-gray.png)";
					dom.footer.voice.type = 1;
					dom.footer.btnVoice.dom.style.display = "block";
					dom.footer.dom.style.height = "44px";
					dom.footer.input.dom.style.display = "none";
				});
			},
			hide: function (isFocus) {
				dom.footer.voice.type = 0;
				dom.footer.voice.domBtn.style.backgroundImage = "url(../../images/Emotion/icon-voice-gray.png)";
				this.dom.style.display = "none";

				dom.footer.input.dom.style.display = "block";
				dom.footer.autoHeight();
				if (isFocus) {
					dom.footer.input.focus();
				}
			},
			init: function () {

				this.hold();

				this.touchstart();

				this.release();

				this.bodyDrag();

			},
			hold: function () {
				this.dom.addEventListener("hold", function (event) {

					var isCan = checkPermission("RECORD");
					if (!isCan) {
						return;
					}
					dom.footer.btnVoice.dom.classList.add("selected");
					dom.footer.btnVoice.properties.recorder = plus.audio.getRecorder();
					dom.footer.btnVoice.properties.recordCancel = false;
					if (dom.footer.btnVoice.properties.stopTimer) clearTimeout(dom.footer.btnVoice.properties.stopTimer);
					dom.footer.btnVoice.properties.audio_tips.innerHTML = "手指上划，取消发送";
					dom.footer.btnVoice.boxSoundAlert.classList.remove('rprogress-sigh');
					dom.footer.btnVoice.setSoundAlertVisable(true);

					dom.footer.btnVoice.properties.startTimestamp = (new Date()).getTime();
					//超过60秒自动结束
					dom.footer.btnVoice.properties.endTimer = setTimeout(function () {
						dom.footer.btnVoice.properties.releaseStop = true;
						dom.footer.btnVoice.properties.stopTimestamp = (new Date()).getTime();

						if (Math.ceil((dom.footer.btnVoice.properties.stopTimestamp - dom.footer.btnVoice.properties.startTimestamp) /
								1000) < 60) {
							dom.footer.btnVoice.properties.stopTimestamp = new Date().setSeconds(20);
						}

						dom.footer.btnVoice.properties.audio_tips.innerHTML = "录音不能超过60秒";
						dom.footer.btnVoice.boxSoundAlert.classList.add('rprogress-sigh');
						dom.footer.btnVoice.properties.recordCancel = false;
						dom.footer.btnVoice.properties.recorder.stop();
					}, 60000);

					dom.footer.btnVoice.properties.releaseStop = false;

					dom.footer.btnVoice.properties.recorder.record({
						format: "amr",
						filename: "_doc/audio/"
					}, function (path) {

						clearTimeout(dom.footer.btnVoice.properties.endTimer);

						if (dom.footer.btnVoice.properties.recordCancel) return;
						var second = Math.ceil((dom.footer.btnVoice.properties.stopTimestamp - dom.footer.btnVoice.properties.startTimestamp) /
							1000);

						if (second <= 0) return;
						var voiceData = {
							file: path,
							time: second > 60 ? 60 : second
						};

						dom.msg.send(6, voiceData)

					}, function (e) {
						clearTimeout(dom.footer.btnVoice.properties.endTimer);

					});

				}, false);
			},
			touchstart: function () {
				this.dom.addEventListener("touchstart", function (e) {
					e.preventDefault();
				});
			},
			//结束事件
			release: function () {
				this.dom.addEventListener("release", function (event) {
					dom.footer.btnVoice.dom.classList.remove("selected");
					if (dom.footer.btnVoice.properties.audio_tips.classList.contains("cancel")) {
						dom.footer.btnVoice.properties.audio_tips.classList.remove("cancel");
						dom.footer.btnVoice.properties.audio_tips.innerHTML = "手指上划，取消发送";
					}
					if (!dom.footer.btnVoice.properties.releaseStop) {
						dom.footer.btnVoice.properties.stopTimestamp = (new Date()).getTime();
					}
					if (dom.footer.btnVoice.properties.stopTimestamp - dom.footer.btnVoice.properties.startTimestamp < dom.footer.btnVoice
						.properties.MIN_SOUND_TIME) {
						dom.footer.btnVoice.properties.audio_tips.innerHTML = "录音时间太短";
						dom.footer.btnVoice.boxSoundAlert.classList.add('rprogress-sigh');
						dom.footer.btnVoice.properties.recordCancel = true;
						dom.footer.btnVoice.properties.stopTimer = setTimeout(function () {
							dom.footer.btnVoice.setSoundAlertVisable(false);
						}, 3000);
						clearTimeout(dom.footer.btnVoice.properties.endTimer);
					} else if (dom.footer.btnVoice.properties.stopTimestamp - dom.footer.btnVoice.properties.startTimestamp > (dom
							.footer.btnVoice.properties.MAX_SOUND_TIME + 5000)) {
						dom.footer.btnVoice.properties.audio_tips.innerHTML = "录音不能超过60秒";
						dom.footer.btnVoice.boxSoundAlert.classList.add('rprogress-sigh');
						dom.footer.btnVoice.properties.recordCancel = true;
						dom.footer.btnVoice.properties.stopTimer = setTimeout(function () {
							dom.footer.btnVoice.setSoundAlertVisable(false);
						}, 3000);
						clearTimeout(dom.footer.btnVoice.properties.endTimer);
					} else {
						if (dom.footer.btnVoice.properties.releaseStop) {
							dom.footer.btnVoice.properties.stopTimer = setTimeout(function () {
								dom.footer.btnVoice.setSoundAlertVisable(false);
							}, 3000);
						} else {
							dom.footer.btnVoice.setSoundAlertVisable(false);
						}
					}
					clearTimeout(dom.footer.btnVoice.properties.endTimer);
					if (!dom.footer.btnVoice.properties.releaseStop) {
						dom.footer.btnVoice.properties.recorder.stop();
					}
				}, false);
			},
			//按住拖拽事件
			bodyDrag: function () {
				document.querySelector("body").addEventListener("drag", function (event) {
					//判断语音是否是出现的

					if (Math.abs(event.detail.deltaY) > 50) {
						if (!dom.footer.btnVoice.properties.recordCancel) {
							dom.footer.btnVoice.properties.recordCancel = true;
							if (!dom.footer.btnVoice.properties.audio_tips.classList.contains("cancel")) {
								dom.footer.btnVoice.properties.audio_tips.classList.add("cancel");
							}
							dom.footer.btnVoice.properties.audio_tips.innerHTML = "松开手指，取消发送";
						}
					} else {
						if (dom.footer.btnVoice.properties.recordCancel) {
							dom.footer.btnVoice.properties.recordCancel = false;
							if (dom.footer.btnVoice.properties.audio_tips.classList.contains("cancel")) {
								dom.footer.btnVoice.properties.audio_tips.classList.remove("cancel");
							}
							dom.footer.btnVoice.properties.audio_tips.innerHTML = "手指上划，取消发送";
						}
					}

				}, false)
			}
		},
		//输入框
		input: {
			preDom: document.querySelector("#text-pre"),
			dom: document.querySelector("footer #chat-msg-text"),
			properties: {
				isFocus: false,
				isBottom: true
			},
			init: function () {
				this.preDom.style.width = (this.dom.offsetWidth) + "px";

				this.onInput();

				this.onFocus();

				this.onBlur();

				this.onPaste();
			},
			getHtml: function () {
				var resultStr = dom.footer.input.dom.innerHTML; //去掉空格
				//resultStr = resultStr.replace(/[ ]/g, ""); //去掉空格
				//resultStr = resultStr.replace(/[\r\n]/g, ""); //去掉回车换行
				//resultStr = resultStr.replace(/<br>/ig, "");
				//				resultStr = resultStr.replace(/<div><\/div>/ig, "");
				return resultStr;
			},
			getSendHtml: function () {
				return this.getHtml();
				//return dom.footer.input.dom.innerHTML.replace(new RegExp('\n', 'gm'), '<br/>');
			},
			clearHtml: function () {
				this.dom.innerHTML = '';
				mui.trigger(this.dom, 'input', null);
			},
			scorllBottom: function () {
				dom.footer.input.dom.scrollTop = dom.footer.input.dom.scrollHeight;
			},
			onPaste: function () {
				this.dom.addEventListener("paste", function () {

				});
			},
			//输入事件
			onInput: function () {
				this.dom.addEventListener("input", function (event) {
					var _html = dom.footer.input.dom.innerHTML.replace(new RegExp('\n', 'gm'), '\n-') || '';

					dom.footer.input.preDom.innerHTML = _html;

					dom.footer.btnSend.show();

					setTimeout(function () {
						dom.footer.autoHeight();
						dom.content.autoFooter();
						dom.footer.input.scorllBottom();
					}, 50);

				});
			},
			onFocus: function () {
				this.dom.addEventListener("focus", function () {
					dom.footer.input.focusEvent();
				});
			},
			focusEvent: function () {
				dom.subView.properties.isTap = false;
				dom.footer.input.properties.isFocus = true;

				dom.footer.btnSend.show();

				dom.footer.input.keepLastIndex();

				if (!dom.keyborder.isKeyBoard()) {
					dom.keyborder.show()
				}
			},
			onBlur: function () {
				this.dom.addEventListener("blur", function () {
					dom.footer.input.properties.isFocus = false;
					setTimeout(function () {
						if (dom.keyborder.isKeyBoard()) {
							dom.keyborder.hide()
						}
					}, 300)
				});
			},
			tap: function () {
				//this.focus();
				mui.trigger(dom.footer.input.dom, "focus");
			},
			//光标移动到最后
			keepLastIndex: function () {
				var obj = this.dom;
				if (window.getSelection) { //ie11 10 9 ff safari
					obj.focus(); //解决ff不获取焦点无法定位问题
					var range = window.getSelection(); //创建range
					try {
						range.selectAllChildren(obj); //range 选择obj下所有子内容
						range.collapseToEnd(); //光标移至最后
					} catch (e) {
						//TODO handle the exception
					}
				} else if (document.selection) { //ie10 9 8 7 6 5
					var range = document.selection.createRange(); //创建选择对象
					//var range = document.body.createTextRange();
					range.moveToElementText(obj); //range定位到obj
					range.collapse(false); //光标移至最后
					range.select();
				}
			},
			//失去焦点
			blur: function (callback, isBottom) {
				this.properties.isBottom = isBottom;
				document.activeElement.blur();
				dom.footer.input.dom.blur();
				dom.content.dom.focus();
				setTimeout(function () {
					setTimeout(function () {
						if (typeof callback == "function") {
							callback()
						}
					}, 50);
				}, 50);

				setTimeout(function () {
					dom.footer.input.properties.isBottom = true;
				}, 300);
			},
			//获得焦点
			focus: function () {
				if (mui.os.ios) {
					mui.trigger(dom.footer.input.dom, "focus");
				} else {
					//dom.footer.input.dom.focus()
					setTimeout(function () {
						dom.footer.input.dom.focus();
					}, 50);
				}
			},
			autoFocus: function () {
				if ((dom.subView.properties.isShow == false)) {
					dom.footer.input.focus();
				}
			}
		},
		//发送按钮
		btnSend: {
			dom: document.querySelector("footer #send-msg"),
			show: function () {
				var resultStr = dom.footer.input.getHtml();
				if (resultStr && resultStr != "<br>") {
					this.dom.style.display = "block";
				} else {
					this.dom.style.display = "none";
				}
			},
			hide: function () {
				this.dom.style.display = "none";
			},
			init: function () {
				this.touchstart();
				this.touchMove();
				this.tap();
			},
			//解决长按“发送”按钮，导致键盘关闭的问题；
			touchMove: function () {
				this.dom.addEventListener('touchmove', function (event) {
					dom.footer.input.autoFocus();
					event.preventDefault();
					event.stopPropagation();
				}, false);
			},
			touchstart: function () {
				this.dom.addEventListener("touchstart", function (event) {
					dom.footer.input.autoFocus();

					event.preventDefault();
					event.stopPropagation();

					if (mui.os.ios) {
						dom.footer.input.dom.innerHTML = dom.footer.input.dom.innerHTML;
					}

					var resultStr = dom.footer.input.getSendHtml();

					if (!resultStr) {
						return;
					}

					var contents = transMessage.getContent(dom.footer.input.getSendHtml(), 1)

					var strs = "";
					contents.forEach(function (_item) {
						strs += _item[1];
					});

					if (strs.length > 500) {
						mui.toast("您发送的内容过长！");
						return;
					}

					dom.msg.send(1, resultStr);

					dom.footer.input.clearHtml();
				}, false);
			},

			//点击发送事件
			tap: function () {
				this.dom.addEventListener("tap", function (event) {

				}, false);
			}
		},
		//表情按钮
		btnFace: {
			dom: document.querySelector("footer #emoji"),
			domImg: document.querySelector("footer #emoji .emotion"),
			init: function () {
				this.event.init();
			},
			event: {
				init: function () {
					this.tap();
				},
				tap: function () {
					dom.footer.btnFace.dom.addEventListener("tap", function () {
						dom.subView.properties.isTap = true;
						dom.subView.autoShow(1);
					});
				}
			}
		},
		//扩展信息按钮
		btnExption: {
			dom: document.querySelector("footer #exption"),
			domImg: document.querySelector("footer #exption .exption"),
			init: function () {
				this.event.init();
			},
			event: {
				init: function () {
					this.tap();
				},
				tap: function () {
					dom.footer.btnExption.dom.addEventListener("tap", function () {
						dom.subView.properties.isTap = true;
						dom.subView.autoShow(2);
					});
				}
			}
		}
	}
};

/**
 * 数据对象
 * **/
var curData = {
	chatData: {
		isLoadding: false,
		canDragLoad: false,
		isDragLoading: false,
		count: 10,
		curId: 0,
		noReadLoad: null,
		loadding: document.querySelector("#content-loadding"),
		load: function () {

			var _this = this;
			var scope = dom.properties.scope;
			var userId = dom.properties.scope.chatData.chatID;

			_this.isLoadding = true;
			_this.loadding.style.display = "block";

			url = dom.properties.apiHost + "/api/v1/Message/MsgRecord_Pull?oppoId=" + userId + "&pageSize=" + this.count +
				"&curId=" + this.curId + "&pullType=1&isRead=1";

			dom.properties.DataService.get(url).then(function (data) {
				scope.chatData.msgList = data.Data.concat(scope.chatData.msgList);
				if (scope.chatData.msgList.length > 0) {
					curData.chatData.noReadLoad = scope.chatData.msgList[scope.chatData.msgList.length - 1].SendTime;
				}

				//判断是否能向上拉取
				_this.canDragLoad = data.NextID > 0;
				var offsetTop = 0,
					scrollTop = 0;
				if (_this.curId) {
					var topDom = document.querySelector("#msg-item-" + _this.curId);
					if (topDom) {
						offsetTop = topDom.offsetTop;
						scrollTop = mui("#chat_body").scroll().y
					}
				}
				var elements = _this.getListHtml(0, data.Data, 2);
				_this.loadding.style.display = "none";

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

				if (_this.curId) {
					var topDom = document.querySelector("#msg-item-" + _this.curId);
					if (topDom) {
						mui("#chat_body").scroll().reLayout();
						mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
						mui('#chat_body').scroll().scrollTo(0, -(topDom.offsetTop - offsetTop + scrollTop + 20), 0);
					}
				} else {
					setTimeout(function () {
						dom.content.scrollToBottom();
					}, 380);

					//设置已读
					//dom.webView.service.ReadMessage();
				}

				setTimeout(function () {

					// dom.content.viewImage();
					//dom.properties.imageViewer.findAllImage();

					previewImages();
				}, 200);
				//设置下次拉去的开始ID
				_this.curId = scope.chatData.msgList.length > 0 ? scope.chatData.msgList[0].ID : 0;
				_this.isDragLoading = _this.isLoadding = false;
			}, function (res) {
				$scope.chatData.isNetWork = isNetWorkCanUse();
				if ($scope.chatData.isNetWork) {
					$scope.chatData.isNetWork = false;
					mui.toast("加载消息失败:" + res.ErrorMessage);
				}
			});
		},
		setRead: function () {
			var userId = dom.properties.scope.chatData.chatID;
			var url = dom.properties.apiHost + "/api/v1/Message/MsgRecord_Read?oppoId=" + userId;
			dom.properties.DataService.get(url).then(function () {
				dom.webView.service.ReadMessage();
			}, function () {});
		},
		loadPrePage: function () {
			var _this = this;
			setTimeout(function () {
				_this.load();
			}, 100);
		},
		getReamrkName: function () {
			var url = dom.properties.ApiService.Api50 + "/api/v1/Resource/MyViewNameInOppo?oppoId=" + dom.properties.scope.chatData
				.chatID;

			dom.properties.DataService.get(url).then(function (data) {
				if (data) {
					dom.properties.scope.chatData.chatRemarkName = data;
					curData.chatData.load();
				}
			}, function (res) {
				$scope.chatData.isNetWork = isNetWorkCanUse();
				if ($scope.chatData.isNetWork) {
					curData.chatData.getReamrkName();
				}
			});
		},
		userPhoto: function (_self) {
			var scope = dom.properties.scope;
			var filter = dom.properties.filter;

			var _photo = angular.element("<div class='msg-user-img'>").addClass(_self && "mui-right" || "");
			_photo.attr("data-user", scope.chatData[_self ? "UserID" : "chatID"]);
			if ((scope.chatData[_self ? "UserLogo" : "chatLogo"] || "false") !== "false") {
				_photo.css("background-image", "url(" + filter("getUserLogo2")(scope.chatData[_self ? "UserID" : "chatID"], 100, 100) +
					")");
			} else {
				_photo.addClass("md-userCustomLogo");
				_photo.html(filter("getUserCustomLogo")(scope.chatData[_self ? "UserName" : "chatName"]));
			}
			return _photo;
		},
		getListHtml: function (prev, data, sortType) {
			var _selfPhoto = this.userPhoto(true);
			var _otherPhoto = this.userPhoto();
			var scope = dom.properties.scope;

			var elements = data.map(function (_message, _index) {
				var is_self = _message.SendID == scope.chatData.UserID;
				var content = JSON.parse(_message.Content);
				var type = content[1][0][0];
				if (content[1].length > 1) {
					type = 1;
				}
				var timestamp = new Date(_message.SendTime.replace(/-/g, "/")).getTime();
				var message = angular.element("<div class='msg-item' data-type='" + type + "'  data-time='" + timestamp + "'>")
					.addClass(is_self ? "msg-item-self" : "msg-item-chat");

				if (_message.ID) {
					message.attr("msgClientNo", _message.MsgID + '-' + _message.Version)
						.attr("id", 'msg-item-' + _message.MsgID + '-' + _message.Version);
				} else {
					message.attr("msgClientNo", _message.MsgID)
						.attr("id", 'msg-item-' + _message.MsgID);
				}

				if (timestamp - prev > 60 * 1000) {
					var time_split = angular.element("<div class='time-split'>").html("<span>" + scope.event.getDate(_message.SendTime) +
						"</span>");
					message.append(time_split);
				}
				prev = timestamp;

				var _content = angular.element("<div class='msg-item-body'>");

				if (_message.ID && _message.MsgType == 25) {
					_content.append((is_self ? dom.content.backHtmlSlef : dom.content.backHtml));
				} else {
					_content.append((is_self ? _selfPhoto : _otherPhoto).clone());
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
						template.html('<img src="../../images/Emotion/' + (_message.SendState === 0 ? "loadding.gif" : "reSend.png") +
							'"/>');
						content.append(template);
					}
					var content_text = angular.element('<div class="msg-content-inner">').addClass(_type === "[4," ?
						"msg-content-image" : "");
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
		},
		getUserInfo: function (userId, callback) {
			var _properties = dom.properties;
			var _scope = _properties.scope;
			var url = _properties.ApiService.Api50 + "/api/v1/user/GetUserInfo?userId=" + userId;
			_properties.DataService.get(url).then(function (res) {
				typeof callback == "function" && (callback(res));
			});
		},
		reload: function () {
			curData.chatData.curId = 0;
			angular.element(dom.content.msgList).empty();
			if (dom.properties.scope.chatData.chatCompID == "" || dom.properties.scope.chatData.chatCompID == undefined) {
				curData.chatData.getUserInfo(dom.properties.scope.chatData.chatID, function (res) {
					dom.properties.scope.chatData.chatCompID = res.CompID;
				});
			}
			curData.chatData.getReamrkName();
		},
		reloadNoRead: function () {

			var _this = this;
			var scope = dom.properties.scope;
			var userId = dom.properties.scope.chatData.chatID;
			var _msgList = dom.properties.scope.chatData.msgList;
			url = dom.properties.apiHost + "/api/v1/Message/MsgRecord_NoRead?oppoId=" + userId + "&pullType=1&sendTime=" + curData.chatData.noReadLoad;

			dom.properties.DataService.get(url).then(function (data) {
				data.Data.forEach(function (item) {
					if (!document.querySelector("#msg-item-" + item.MsgID + "-" + item.Version)) {
						dom.msg.push(item);
					}
				});

				data.Back.forEach(function (item) {
					var _dom = document.querySelector("#msg-item-" + item.MsgID + "-" + item.Version);

					if (_dom) {
						if (_dom.classList.contains("msg-item-self")) {
							_dom.querySelector(".msg-item-body").innerHTML = dom.content.backHtmlSlef;
						} else {
							_dom.querySelector(".msg-item-body").innerHTML = dom.content.backHtml;
						}
					}
				});

				curData.chatData.noReadLoad = scope.chatData.msgList[scope.chatData.msgList.length - 1].SendTime;

				if ((data.Data.length > 0 || data.Back.length > 0) && dom.webView.cur.isVisible()) {
					curData.chatData.setRead();
				}

				setTimeout(function () {
					dom.content.scrollToBottom();
				}, 380);

				setTimeout(function () {
					previewImages();
				}, 200);

			}, function () {
				$scope.chatData.isNetWork = isNetWorkCanUse();
				if ($scope.chatData.isNetWork) {
					$scope.chatData.isNetWork = false;
					curData.chatData.reloadNoRead();
				}
			});
		}
	},
	backMsg: function (msg) {
		console.info(msg);
		var clientNos = msg.msgId.split('|');
		if (msg.msgClientNo) {
			RpcClient.invoke("message.html", "RPC_MsgBackCall", {
				MsgID: clientNos[0],
				Version: clientNos[1],
				MsgID2: msg.msgClientNo.split('|')[0],
				Version2: msg.msgClientNo.split('|')[1],
				OppoID: dom.properties.scope.chatData.chatID
			})

			var _dom = document.querySelector(".msg-item[msgclientno='" + ((clientNos[0] + "-" + clientNos[1])) + "'] .msg-item-body");
			if (!_dom) {
				clientNos = msg.msgClientNo.split('|');
				_dom = document.querySelector(".msg-item[msgclientno='" + ((clientNos[0] + "-" + clientNos[1])) + "'] .msg-item-body");
			}
			_dom.innerHTML = dom.content.backHtml;

		} else {
			var url = dom.properties.ApiService.Api50 + "/api/v1/Message/RevokeMsg?msgId=" + clientNos[0] + "&version=" + clientNos[1] + "&groupid=";
			dom.properties.DataService.get(url).then(function () {
				document.querySelector(".msg-item[msgclientno='" + ((clientNos[0] + "-" + clientNos[1])) + "'] .msg-item-body").innerHTML = dom.content.backHtmlSlef;
				RpcClient.invoke("message.html", "RPC_MsgBackCall", {
					MsgID: clientNos[0],
					Version: clientNos[1],
					OppoID: dom.properties.scope.chatData.chatID
				});

				var packData = {
					userId: dom.properties.scope.chatData.UserID,
					userName: dom.properties.scope.chatData.UserName,
					chatId: dom.properties.scope.chatData.chatID,
					chatName: dom.properties.scope.chatData.chatName,
					chatCompId: dom.properties.scope.chatData.chatCompID,
					hasLogo: dom.properties.scope.chatData.UserLogo,
					chatLogo: dom.properties.scope.chatData.chatLogo,
					reName: dom.properties.scope.chatData.chatRemarkName,
					content: "",
					type: 1
				};

				var _msg = transMessage.packSimple(packData, '[0,[[1,"#WITHDRAW_MSGID_' + clientNos[0] + '|' + clientNos[1] + '"]]]');

				RpcClient.invoke("message.html", 'RPC_SendMsg', _msg);
			}, function () {
				document.querySelector(".msg-item[msgclientno='" + ((clientNos[0] + "-" + clientNos[1])) + "'] .msg-item-body").innerHTML = dom.content.backHtmlSlef;
			})
		}
	}
};

window.reload = curData.chatData.reload;
window.reloadNoRead = curData.chatData.reloadNoRead;

/**
 * 消息对象
 * **/
var msg = {};

/**
 * 初始化
 * **/
mui.plusReady(function () {
	setTimeout(function () {
		angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	}, 50)
});