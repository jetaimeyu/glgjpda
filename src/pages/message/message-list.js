var params = {
	type: query("type"),
	init: function () {
		this.renderTitle();
	},
	renderTitle: function () {
		var title = "";
		switch (this.type) {
			case "1":
				title = "系统通知";
				break;
			case "2":
				title = "工作通知";
				break;
			case "3":
				title = "设计圈";
				break;
			case "4":
				title = "群通知";
				break;
		}

		mui("header .mui-pull-left")[0].innerText = title;
	}
};

params.init();

var dom = {
	properties: {
		ApiService: "",
		DataService: "",
		UtilsService: "",
		scope: "",
		apiHost: ""
	},
	init: function () {
		this.content.init();
		this.service.ReceiveNessage();
	},
	service: {
		ReadMessage: function () {
			RpcClient.invoke("message.html", 'RPC_ReadSysMsg', parseInt(params.type));
		},
		//接收消息
		ReceiveNessage: function () {
			RpcServer.expose("RPC_ReceiveMessage", function (data) {
				var scope = dom.properties.scope;
				var msg = data.data;
				var type = data.type;
				if (type == "3") {
					setTimeout(function () {
						curData.chatData.qaIds = [0, 0, 0];
						scope.chatData.msgList=[];
						curData.chatData.curId=0;
						angular.element(dom.content.msgList).html("");
						dom.content.scrollToBottom();
						curData.chatData.loadQA();
					}, 2000);
					return;
				}
				if (type == params.type && scope.chatData.msgList.length > 0) {

					var _msgList = scope.chatData.msgList;

					var pre = _msgList.length > 0 ? new Date(_msgList[_msgList.length - 1].SendTime.replace(/-/g, "/")).getTime() : 0;
					var element = curData.chatData.getListHtml(pre, [msg], 1);

					dom.properties.scope.chatData.msgList.push(msg);

					angular.element(dom.content.msgList).append(element[0]);

					setTimeout(function () {
						dom.content.scrollToBottom();
					}, 200);
				}
			});
		}
	},
	content: {
		msgList: document.querySelector("#msg-repeat"),
		dom: document.querySelector("#chat_body"),
		init: function () {
			this.bodyDrag();
			this.event.init();
		},
		bodyDrag: function () {
			document.querySelector("#chat_body").addEventListener("drag", function () {
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
		scrollToBottom: function () {
			mui("#chat_body").scroll().reLayout();
			mui("#chat_body").scroll().scrollToBottom(1);
		},
		event: {
			init: function () {
				this.tap();
			},
			tap: function () {
				mui("#chat_body").on("tap", ".content-event", function () {
					var itemDom = this.querySelector(".ev-item");
					transEvent.trigger(7, {
						name: itemDom.getAttribute("data-name"),
						params: itemDom.getAttribute("data-params"),
						curId: dom.properties.scope.chatData.UserID
					});
				});
			}
		}
	}
};

var curData = {
	chatData: {
		isLoadding: false,
		canDragLoad: false,
		isDragLoading: false,
		count: 10,
		curId: 0,
		qaIds: [0, 0, 0],//对应QaNoticeType[1,2,3]
		loadding: document.querySelector("#content-loadding"),
		load: function () {
			var _this = this;
			var scope = dom.properties.scope;

			if (params.type == "3") {
				_this.loadQA();
				return;
			}

			var url = dom.properties.apiHost + "/api/v1/Message/SysMsgRecord_Pull?sort=1&msgType=" + params.type + "&pageSize=" + _this.count + "&curId=" + _this.curId;

			_this.isLoadding = true;
			_this.loadding.style.display = "block";

			dom.properties.DataService.get(url).then(function (data) {

				scope.chatData.msgList = data.Data.concat(scope.chatData.msgList);

				//判断是否能向上拉取
				_this.canDragLoad = data.NextID > 0;;
				var offsetTop = 0,
					scrollTop = 0;
				if (_this.curId) {
					var topDom = document.querySelector("#msg-item-" + _this.curId);
					if (topDom) {
						offsetTop = topDom.offsetTop;
						scrollTop = mui("#chat_body").scroll().y
					}
				}

				var elements = _this.getListHtml(0, data.Data, 1);
				_this.loadding.style.display = "none";

				//插入html
				for (var i = elements.length - 1; i >= 0; i--) {
					var _preDom = document.querySelector(".msg-item");


					if (_preDom && i == elements.length - 1) {
						var _time = elements[i][0].getAttribute("data-time");
						var _preTime = _preDom.getAttribute("data-time");
						if (_time - _preTime < 60 * 10000) {
							_preDom.querySelector(".time-split").style.display = "none";
						}
					}

					angular.element(dom.content.msgList).prepend(elements[i]);
				}

				//				elements.forEach(function(_item) {
				//					angular.element(dom.content.msgList).prepend(_item);
				//				});

				if (_this.curId) {
					var topDom = document.querySelector("#msg-item-" + _this.curId);
					if (topDom) {
						mui("#chat_body").scroll().reLayout();
						mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
						mui('#chat_body').scroll().scrollTo(0, -(topDom.offsetTop - offsetTop + scrollTop + 20), 0);
					}
				} else {
					dom.content.scrollToBottom();
					//设置已读
					dom.service.ReadMessage();
				}
				//设置下次拉去的开始ID
				_this.curId = scope.chatData.msgList.length > 0 ? scope.chatData.msgList[0].ID : 0;
				_this.isDragLoading = _this.isLoadding = false;
			}, function () {
				curData.chatData.loadding.style.display = "none";
				dom.properties.scope.chatData.isNetWork=false;
			});
		},
		loadQA: function () {
			var _this = this;
			var scope = dom.properties.scope;

			var url = dom.properties.apiHost + "/api/v1/QA/QusListNotice?pageSize=" + _this.count;

			_this.isLoadding = true;
			_this.loadding.style.display = "block";

			dom.properties.DataService.post(url, _this.qaIds).then(function (data) {

				var _datas = [];

				for (var i = 0; i < data.length; i++) {
					data[i].Datas.forEach(function (_item) {

						var desc = "";

						switch (_item.QaNoticeType) {
							case 1:
								(_item.Type == 2) && (desc = _item.UserName + '回答了您的问题' + _item.Title);
								(_item.Type != 2) && (desc = _item.UserName + '回复了您的帖子' + _item.Title);
								break;
							case 2:
								desc = _item.UserName + '在您的答案中评论' + _item.Title
								break;
							case 3:
								desc = _item.UserName + '回复了您的评论' + _item.Title
								break;
						}


						var content = {
							eventName: "question",
							logo: dom.properties.ApiService.Down + "/chat/question.png",
							title: "设计圈",
							desc: desc,
							params: [_item.QID]
						};

						var _content = JSON.stringify([0, transMessage.getContent(content, 7)]);

						_item.Content = _content;
						_item.MsgID = _item.AID;
						_item.ID = _item.AID;
						_item.SendTime = _item.NoticeTime;
						_item.QaNoticeType == 1 && (_this.qaIds[0] = _item.AID);
						_item.QaNoticeType != 1 && (_this.qaIds[_item.QaNoticeType - 1] = _item.CID);

						_datas.splice(0, 0, _item);
					});
				}

				scope.chatData.msgList = _datas.concat(scope.chatData.msgList);

				//判断是否能向上拉取
				_this.canDragLoad = _datas.length == _this.count;
				var offsetTop = 0,
					scrollTop = 0;
				if (_this.curId) {
					var topDom = document.querySelector("#msg-item-" + _this.curId);
					if (topDom) {
						offsetTop = topDom.offsetTop;
						scrollTop = mui("#chat_body").scroll().y
					}
				}

				var elements = _this.getListHtml(0, _datas, 1);
				_this.loadding.style.display = "none";

				//插入html
				for (var i = elements.length - 1; i >= 0; i--) {
					var _preDom = document.querySelector(".msg-item");


					if (_preDom && i == elements.length - 1) {
						var _time = elements[i][0].getAttribute("data-time");
						var _preTime = _preDom.getAttribute("data-time");
						if (_time - _preTime < 60 * 10000) {
							_preDom.querySelector(".time-split").style.display = "none";
						}
					}

					angular.element(dom.content.msgList).prepend(elements[i]);
				}

				//				elements.forEach(function(_item) {
				//					angular.element(dom.content.msgList).prepend(_item);
				//				});

				if (_this.curId) {
					var topDom = document.querySelector("#msg-item-" + _this.curId);
					if (topDom) {
						mui("#chat_body").scroll().reLayout();
						mui("#chat_body .mui-scroll")[0].style.transitionDuration = "0ms";
						mui('#chat_body').scroll().scrollTo(0, -(topDom.offsetTop - offsetTop + scrollTop + 20), 0);
					}
				} else {
					dom.content.scrollToBottom();
					//设置已读
					dom.service.ReadMessage();
				}
				//设置下次拉去的开始ID
				_this.curId = scope.chatData.msgList.length > 0 ? scope.chatData.msgList[0].ID : 0;
				_this.isDragLoading = _this.isLoadding = false;
			}, function () {
				curData.chatData.loadding.style.display = "none"
				dom.properties.scope.chatData.isNetWork=false;
			});

		},
		loadPrePage: function () {
			var _this = this;
			setTimeout(function () {
				_this.load()
			}, 100)
		},
		getPhoto: function () {
			var _photo;
			var type = dom.properties.scope.chatData.type;
			if (type == 2) {
				_photo = angular.element("<img class='msg-user-img' src='../../images/work_notice.png' />");

			} else if (type == 1) {
				_photo = angular.element("<img class='msg-user-img' src='../../images/system_messages.png' />");
			} else if (type == 3) {

				_photo = angular.element("<img class='msg-user-img' src='../../images/Q&A.png' />");
			}

			return _photo;
		},
		getListHtml: function (prev, data, sortType) {
			var _Photo = this.getPhoto();
			var scope = dom.properties.scope;
			var _length = data.length;
			var elements = data.map(function (_message, _index) {
				var is_self = _message.SendID == scope.chatData.UserID;

				var timestamp = new Date(_message.SendTime.replace(/-/g, "/")).getTime();
				var message = angular.element("<div class='msg-item' data-time='" + timestamp + "'>")
					.addClass(is_self ? "msg-item-self" : "msg-item-chat")
					.attr("id", 'msg-item-' + (_message.MsgID || _message.ID));
				var _tiem = sortType == 1 ? (timestamp - prev) : (prev - timestamp);
				if (prev == 0 || _tiem > 60 * 1000) {
					var time_split = angular.element("<div class='time-split' id='dv-time-" + timestamp + "'>").html("<span>" + scope.event.getDate(_message.SendTime) + "</span>");
					message.append(time_split);
				}

				prev = timestamp;

				message.append(_Photo.clone());
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
						"data-id": _message.MsgID || _message.ID
					});
					template.html('<img src="../../images/Emotion/' + (_message.SendState === 0 ? "loadding.gif" : "reSend.png") + '"/>');
					content.append(template);
				}
				var content_text = angular.element('<div class="msg-content-inner">').addClass(_type === "[4," ? "msg-content-image" : "");
				try {
					content_text.html(scope.event.transContent(_message.Content, is_self));
				} catch (e) { }
				content.append(content_text);
				content.append(angular.element('<div class="msg-content-angle"></div>'));
				message.append(content);

				return message;
			});

			return elements;
		}
	}
};

app.controller("MessageListController", ["$scope", "$sce", "ApiService", "DataService", "UtilsService", "CacheService", "Loading", function ($scope, $sce, ApiService, DataService, UtilsService, CacheService, Loading) {

	dom.properties.scope = $scope;
	dom.properties.ApiService = ApiService;
	dom.properties.DataService = DataService;
	dom.properties.UtilsService = UtilsService;
	dom.properties.apiHost = ApiService.Api50;

	$scope.chatData = {
		msgList: [],
		type: params.type,
		isNetWork: true
	};

	$scope.event = {
		//是否显示时间，两次发送时间相隔五分钟才显示时间
		isShowTime: function (idx) {
			if (idx == 0) {
				return true;
			} else {

				var time = $scope.chatData.msgList[idx - 1].SendTime;
				var cTime = $scope.chatData.msgList[idx].SendTime;

				var mixTime = new Date(cTime).getTime() - new Date(time).getTime(); //时间差的毫秒数

				if (mixTime > (1000 * 60 * 1)) {
					return true;
				} else {
					return false;
				}
			}
		},
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
			 
			$scope.chatData.isNetWork && (curData.chatData.load());
			 
		}
	};

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

	mui('#chat_body').scroll({
		indicators: false,
		deceleration: 0.0005 //flick 减速系数，系数越大，滚动速度越慢，滚动距离越小，默认值0.0006
	});

	var user = CacheService.get("user");
	user && ($scope.chatData.UserID = user.UserID) && ($scope.chatData.UserName = (user.UserName || user.RealName || user.Mdt)) && ($scope.chatData.UserLogo = user.ULogoIsExist);

	dom.init();
	 
		$scope.chatData.isNetWork = isNetWorkCanUse();
 

	 
		$scope.chatData.isNetWork && (curData.chatData.load());
 
}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});