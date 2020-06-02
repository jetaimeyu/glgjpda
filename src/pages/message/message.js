/**
 * 页面对象以及事件
 * **/
var dom = {
	properties: {
		scope: "",
		ApiService: "",
		AuthService: "",
		DataService: "",
		CacheService: "",
		UtilsService: "",
		Loading: "",
		$filter: "",
		ChatUserService: "",
		loginTime: "",
		RPCObserver: "",
		$q: "",
		isOpenDefault: true,
		apiHost: "",
		IsNew: false,
		loadType: ""
	},
	noLoginDom: document.querySelector("#noLogin"),
	pullrefresh: document.querySelector("#pullrefresh"),
	loading: document.querySelector(".load-message"),
	init: function () {
		this.webView.init();

		//初始化聊天列表
		this.msgList.init();

		//初始化方法
		this.method.init();

		//初始化service
		this.service.init();

	},
	webView: {
		cur: "",
		init: function () {
			this.cur = plus.webview.currentWebview();
		}
	},
	method: {
		init: function () {
			this.loadUserData();
		},
		loadUserData: function (userInfo, isOut) {

			//如果是有值 可能是切换账户
			if (dom.properties.scope.domData.UserInfo.UserID) {
				dom.im.event.LogOut();
			}

			if (!userInfo && !isOut) {
				userInfo = dom.properties.CacheService.get("user");
			}

			if (userInfo) {
				dom.properties.scope.domData.UserInfo = userInfo;
				user = userInfo;
				curData.page = 1;
				curData.load("reload");
			}
		}
	},
	im: {
		obj: "",
		sysArray: [2, 1, 3],
		init: function () {

			dom.im.Do_Login();

			dom.service.Rpc_startHeart();

			this.event.init();
		},
		Do_Login: function (isApply) {
			dom.properties.scope.domData.State = isNetWorkCanUse() ? (dom.properties.loadType != "reload" ? 0 : 3) : 1;
			isApply && (dom.properties.scope.$apply());
			if (dom.properties.scope.domData.State == 1)
				return;

			//只要是重新登录就 重新初始化 并且记录登陆时间
			dom.properties.isLogin = true;
			dom.im.obj = YunIM.init();

			if (dom.im.obj.code == 200 && dom.properties.scope.domData.UserInfo.UserID) {
				YunIM.Do_Login(isApply);
				//如果是新用户 第一次登录只是注册到云通讯，执行第二次登录
				if (dom.properties.IsNew) {
					setTimeout(function () {
						YunIM.Do_Login(isApply);
					}, 1000);
				}
			}
		},
		loading: function (isApply) {
			if (dom.properties.loadType != "reload") {
				dom.properties.scope.domData.State = 0;
				isApply && (dom.properties.scope.$apply());
			}
		},
		hideLoading: function (isApply) {
			dom.properties.scope.domData.State = 9;
			isApply && (dom.properties.scope.$apply());
			dom.properties.loadType = "";
		},
		//接收消息
		RPC_ReceiveMessage: function (msg) {

			if(msg.SendState==1)
			{
				var view;
				if(msg.isGroup)
				{
					view = plus.webview.getWebviewById("chat-group-" + msg.GroupCode);
				}
				else{
					view = plus.webview.getWebviewById("chat-" + msg.ReceiveID)
				}
				if(view)
				{
					RpcClient.invoke(view.id, "RPC_ReceiveMessage", msg);
				}
			}else
			{
				if (msg.isGroup) {
					dom.im.dealGroup(msg);
				} else {
					dom.im.dealSingle(msg);
				}
			}
		},
		dealGroup: function (msg) {
			var chatView = plus.webview.getWebviewById("chat-group-" + msg.GroupCode);

			var noreadCount = 1;

			if (chatView) {
				RpcClient.invoke(chatView.id, "RPC_ReceiveMessage", msg);
			}

			if (chatView && chatView.isVisible()) {
				noreadCount = 0;
			}

			msg.UnReadCount = 1;
			this.checkMsgListGroup(msg, chatView && chatView.isVisible(), true, !chatView);

			// if (noreadCount > 0 && msg.SendID != user.UserID && !msg.IsSilence) {
			// 	YunIM.NoReadCount += noreadCount;
			// 	dom.service.Rpc_NoReadCount();
			// }
		},
		dealSingle: function (msg) {
			var noreadCount = 1;

			if (msg.SendState == 2 && msg.MsgType == 0) { //普通聊天
				var chatView;

				msg.SendID == user.UserID && (chatView = plus.webview.getWebviewById("chat-" + msg.ReceiveID));
				msg.ReceiveID == user.UserID && (chatView = plus.webview.getWebviewById("chat-" + msg.SendID));

				if (chatView) {
					RpcClient.invoke(chatView.id, "RPC_ReceiveMessage", msg);
				}
				if (chatView && chatView.isVisible()) {
					noreadCount = 0;
				}

				msg.UnReadCount = noreadCount;
				this.checkMsgList(msg, chatView && chatView.isVisible(), true, !chatView);

			} else if (msg.SendState == 2 && this.sysArray.indexOf(msg.MsgType) >= 0) { //系统消息
				var sysChatView = plus.webview.getWebviewById("message-list.html");

				noreadCount = sysChatView ? sysChatView.openType == msg.MsgType ? 0 : 1 : 1;
				this.checkMsgListSys({
					Content: msg.Content,
					MsgType: msg.MsgType,
					SendTime: msg.SendTime,
					UnReadCount: noreadCount,
					ChatType: "Sys"
				}, true);

				if (noreadCount == 0) {
					RpcClient.invoke(sysChatView.id, "RPC_ReceiveMessage", {
						data: msg,
						type: msg.MsgType
					});
				}
			}

			// if (noreadCount > 0 && msg.SendID != user.UserID) {
			// 	YunIM.NoReadCount += noreadCount;
			// 	dom.service.Rpc_NoReadCount();
			// }
		},
		//检查系统消息
		checkMsgListSys: function (msg, isApply) {
			if (this.sysArray.indexOf(msg.MsgType) < 0) {
				return;
			}

			var idx = -1;
			var noreadCount = msg.UnReadCount;
			dom.properties.scope.domData.msgList.filter(function (item, _idx) {
				item.MsgType == msg.MsgType && (idx = _idx);
			});
			if (idx >= 0) {
				dom.properties.scope.domData.msgList[idx].Content = msg.Content;
				dom.properties.scope.domData.msgList[idx].SendTime = typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties
					.$filter("dateFormat")(msg.SendTime, "yyyy-MM-dd HH:mm");

				isApply && (dom.properties.scope.domData.msgList[idx].UnReadCount += msg.UnReadCount);
				!isApply && (dom.properties.scope.domData.msgList[idx].UnReadCount = msg.UnReadCount);
			} else {
				dom.properties.scope.domData.msgList.splice(0, 0, {
					ChatType: 'Sys',
					Content: msg.Content,
					SendTime: typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties.$filter("dateFormat")(msg.SendTime,
						"yyyy-MM-dd HH:mm"),
					MsgType: msg.MsgType,
					UnReadCount: msg.UnReadCount,
				})
			}

			//if (!isApply) {
			YunIM.NoReadCount += noreadCount;
			dom.service.Rpc_NoReadCount();
			//}

			if (isApply != false) {

				var content = JSON.parse(msg.Content);

				if (content[0] == 1 && content[1][0][0] == 7 && (content[1][0][1] == "anti-fake" || content[1][0][1] == "fleeing-goods")) {
					dom.service.Rpc_refWork(content[1][0][1]);
				}

				dom.properties.scope.$apply();
			}
		},
		checkMsgListGroup: function (msg, isOpen, isApply, isPreload) {
			var _this = this;
			var idx = -1;
			dom.properties.scope.domData.msgList.filter(function (item, _idx) {
				item.GroupCode == msg.GroupCode && (idx = _idx);
			});

			var MsgID = "";
			var Version = "";
			if (!msg.Version) {
				if (msg.msgClientNo) {
					msg.msgClientNo = msg.msgClientNo.replace('|', '-');
					MsgID = msg.msgClientNo.split('-')[0];
					Version = msg.msgClientNo.split('-')[1];
				} else if (msg.MsgId) {
					msg.MsgId = msg.MsgId.replace('|', '-');

					MsgID = msg.MsgId.split('-')[0];
					Version = msg.MsgId.split('-')[1];
				}
			} else {
				MsgID = msg.MsgID;
				Version = msg.Version;
			}

			var unreadCount = (isOpen || msg.isSync) ? 0 : msg.UnReadCount;
			var _preLoadData = {};
			if (idx >= 0) {
				dom.properties.scope.domData.msgList[idx].GroupName = msg.GroupName;
				dom.properties.scope.domData.msgList[idx].SendName = msg.SendName;
				dom.properties.scope.domData.msgList[idx].Content = msg.Content;
				dom.properties.scope.domData.msgList[idx].SendID = msg.SendID;
				dom.properties.scope.domData.msgList[idx].MsgType2 = msg.MsgType2 || 0;
				dom.properties.scope.domData.msgList[idx].Version = Version;
				dom.properties.scope.domData.msgList[idx].MsgID = MsgID;
				dom.properties.scope.domData.msgList[idx].SendTime = typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties
					.$filter("dateFormat")(msg.SendTime, "yyyy-MM-dd HH:mm");
				dom.properties.scope.domData.msgList[idx].IsSilence = msg.IsSilence;

				isApply && (dom.properties.scope.domData.msgList[idx].UnReadCount += unreadCount);
				!isApply && (dom.properties.scope.domData.msgList[idx].UnReadCount = unreadCount);
			} else {
				var data = {
					ChatType: 'Group',
					GroupName: msg.GroupName,
					GroupCode: msg.GroupCode,
					Content: msg.Content,
					SendName: msg.SendName,
					SendTime: typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties.$filter("dateFormat")(msg.SendTime,
						"yyyy-MM-dd HH:mm"),
					MsgType: msg.MsgType,
					UnReadCount: unreadCount,
					IsSilence: msg.IsSilence,
					MsgType2: msg.MsgType2,
					Version: Version,
					MsgID: MsgID,
					SendID: msg.SendID
				};
				dom.properties.scope.domData.msgList.splice(0, 0, data);

			}

			//if (!isApply) {
			YunIM.NoReadCount += msg.IsSilence ? 0 : unreadCount;
			dom.service.Rpc_NoReadCount();
			//}

			if (isApply != false) {
				dom.properties.scope.$apply();
			}
		},
		//检查普通聊天消息
		checkMsgList: function (msg, isOpen, isApply, isPreload) {
			var _this = this;
			var idx = -1;
			var noreadCount = 0;
			dom.properties.scope.domData.msgList.filter(function (item, _idx) {
				item.OppoID == ((msg.SendID || msg.OppoID) == dom.properties.scope.domData.UserInfo.UserID ? (msg.ReceiveID ||
					msg.OppoID) : (msg.SendID || msg.OppoID)) && (idx = _idx);
			});

			var MsgID = "";
			var Version = "";
			if (!msg.Version) {
				if (msg.msgClientNo) {
					msg.msgClientNo = msg.msgClientNo.replace('|', '-');
					MsgID = msg.msgClientNo.split('-')[0];
					Version = msg.msgClientNo.split('-')[1];
				} else if (msg.MsgId) {
					msg.MsgId = msg.MsgId.replace('|', '-');

					MsgID = msg.MsgId.split('-')[0];
					Version = msg.MsgId.split('-')[1];
				}
			} else {
				MsgID = msg.MsgID;
				Version = msg.Version;
			}

			var unreadCount = (!msg.isSync && !isOpen) ? msg.UnReadCount : 0;
			var _preLoadData = {};
			if (idx >= 0) {
				dom.properties.scope.domData.msgList[idx].MsgID = MsgID;
				dom.properties.scope.domData.msgList[idx].SendID = msg.SendID;
				dom.properties.scope.domData.msgList[idx].Version = Version;
				dom.properties.scope.domData.msgList[idx].MsgType2 = msg.MsgType2 || 0;
				dom.properties.scope.domData.msgList[idx].Content = msg.Content;
				dom.properties.scope.domData.msgList[idx].SendTime = typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties
					.$filter("dateFormat")(msg.SendTime, "yyyy-MM-dd HH:mm");
				dom.properties.scope.domData.msgList[idx].ULogoIsExist = msg.ULogoIsExist;

				isApply && (dom.properties.scope.domData.msgList[idx].UnReadCount += unreadCount);
				!isApply && (dom.properties.scope.domData.msgList[idx].UnReadCount = unreadCount);

				(!dom.properties.scope.domData.msgList[idx].OppoName && msg.SendName) && (dom.properties.scope.domData.msgList[idx].OppoName = msg.SendName);
				!isApply && (dom.properties.scope.domData.msgList[idx].OppoName = msg.OppoID ? msg.OppoName : (msg.SendID == dom
					.properties.scope.domData.UserInfo.UserID ? (msg.ReceiveName || msg.OppoName) : msg.SendName));
			} else {
				if (msg.isSync) {
					curData.getReamrkName(msg, !msg.SendID ? msg.OppoID : (msg.SendID == dom.properties.scope.domData.UserInfo.UserID ?
						(msg.ReceiveID || msg.OppoID) : msg.SendID), function (msg, oppName) {

						var data = {
							ChatType: 'Person',
							OppoID: msg.OppoID ? msg.OppoID : (msg.SendID == dom.properties.scope.domData.UserInfo.UserID ? (msg.ReceiveID ||
								msg.OppoID) : msg.SendID),
							OppoName: oppName,
							OppoCompID: msg.ReceiveCompID || msg.OppoCompID,
							Content: msg.Content,
							SendTime: typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties.$filter("dateFormat")(msg.SendTime,
								"yyyy-MM-dd HH:mm"),
							MsgType2: msg.MsgType2 || 0,
							MsgType: msg.MsgType,
							ULogoIsExist: msg.ULogoIsExist,
							UnReadCount: 0,
							MsgID: MsgID,
							Version: Version,
							SendID: msg.SendID
						};

						dom.properties.scope.domData.msgList.splice(0, 0, data);
					});
				} else {
					var obj = {
						ChatType: 'Person',
						OppoID: msg.OppoID ? msg.OppoID : (msg.SendID == dom.properties.scope.domData.UserInfo.UserID ? (msg.ReceiveID ||
							msg.OppoID) : msg.SendID),
						OppoName: msg.OppoID ? msg.OppoName : (msg.SendID == dom.properties.scope.domData.UserInfo.UserID ? (msg.ReceiveName ||
							msg.OppoName) : msg.SendName),
						OppoCompID: msg.ReceiveCompID || msg.OppoCompID,
						Content: msg.Content,
						SendTime: typeof (msg.SendTime) == "string" ? msg.SendTime : dom.properties.$filter("dateFormat")(msg.SendTime,
							"yyyy-MM-dd HH:mm"),
						MsgType2: msg.MsgType2 || 0,
						MsgType: msg.MsgType,
						ULogoIsExist: msg.ULogoIsExist,
						UnReadCount: unreadCount,
						MsgID: MsgID,
						SendID: msg.SendID,
						Version: Version
					};

					dom.properties.scope.domData.msgList.splice(0, 0, obj);
				}
			}

			noreadCount += parseInt(unreadCount);

			//if (!isApply) {
			YunIM.NoReadCount += noreadCount;
			dom.service.Rpc_NoReadCount();
			//}

			if (isApply != false) {

				//如果是待我处理中的数据 需要刷新工作台中 待我处理的角标
				if (msg.SendID && msg.SendID != dom.properties.scope.domData.UserInfo.UserID) {
					var content = JSON.parse(msg.Content);

					if (content[0] == 0 && content[1][0][0] == 7 && (content[1][0][1] == "equ-fault" || content[1][0][1] == "fault") &&
						content[1][0][5].length > 2 && content[1][0][5][2] == 1) {
						dom.service.Rpc_refWork(content[1][0][1]);
					}

					if (content[0] == 0 && content[1][0][0] == 7 && (content[1][0][1] == "repair-log") && content[1][0][5].length >
						1 && dom.properties.scope.domData.UserInfo.CompID > 0) {
						dom.service.Rpc_refLog();
					}
				}

				dom.properties.scope.$apply();
			}
		},
		//预加载聊天窗口
		preLoadChat: function (data, type) {
			// if (mui.os.android) {
			// 	switch (type) {
			// 		case 1: //单聊
			// 			setTimeout(function () {
			// 				var view = plus.webview.getWebviewById("chat-" + data.chatId);
			// 				if (view) {
			// 					view.close("none");
			// 				}
			// 				RpcClient.invoke("webView.html", "RPC_pre_single_chat", data)
			// 			}, 0);

			// 			break;
			// 		case 2: //群聊
			// 			setTimeout(function () {
			// 				var view = plus.webview.getWebviewById("chat-group-" + data.GroupCode);
			// 				if (view) {
			// 					view.close("none");
			// 				}
			// 				RpcClient.invoke("webView.html", "RPC_pre_group_chat", data)
			// 			}, 0);
			// 			break;
			// 		case 3: //系统消息
			// 			break;
			// 	}
			// }
		},
		event: {
			init: function () {
				this.netChange();
			},
			//切换网络的时候自动登录下
			netChange: function () {
				document.addEventListener("netchange", function () {
					//curData.page = 1;
					//为保险起见 切换网络的时候链接一下
					//curData.load("reload", true);
					dom.im.Do_Login(true);
				});
			},
			LogOut: function () {
				//退出云通讯
				YunIM.EV_logout();
			}
		},
		//刷新群组
		Rpc_RefGroup: function (obj) {
			switch (obj.auditType) {
				case "4": //解散群
					var message = obj.groupName + "已解散";
					if (obj.admin == dom.properties.scope.domData.UserInfo.UserID) {
						message = "您已解散" + obj.groupName;
					}
					dom.im.quitGroup(obj.groupId, message);
					break;
				case "5": //用户退出群组
				case "6": //踢出用户
					//判断群组聊天是否打开
					var view = plus.webview.getWebviewById("chat-group-" + obj.groupId);
					if (obj.member == dom.properties.scope.domData.UserInfo.UserID) {
						dom.im.quitGroup(obj.groupId);
					}
					dom.im.groupTips(obj, 0);
					break;
				case "7": //加入群组
				case "2": //加入群组
				case "8": //加入群组
					if (!obj.member) {
						var _data = dom.properties.scope.domData;
						obj.member = _data.UserInfo.UserID;
						obj.memberName = _data.UserInfo.UserName || _data.UserInfo.RealName || _data.UserInfo.Mdt;
					}

					dom.service.Rpc_ResGroups();

					dom.im.groupTips(obj, 1);

					break;
				case "9": //修改群组信息
					break;
			}
		},
		quitGroup: function (groupId, message) {
			var view = plus.webview.getWebviewById("chat-group-" + groupId);
			view && (view.close("none"));

			view = plus.webview.getWebviewById("group-info.html");
			view && view.GroupCode == groupId && ((view.close("none")));

			view = plus.webview.getWebviewById("group-user-list.html");
			view && view.GroupCode == groupId && ((view.close("none")));

			view = plus.webview.getWebviewById("chat-group-record.html");
			view && view.GroupCode == groupId && ((view.close("none")));

			message && (plus.nativeUI.toast(message));

			var _dom = document.querySelector("#msg-" + groupId);
			_dom && (dom.event.deleteGroup(_dom));

			dom.service.Rpc_ResGroups();
		},
		groupTips: function (obj, type) {
			var view = plus.webview.getWebviewById("chat-group-" + obj.groupId);
			view && (dom.service.Rpc_RefGroup({
				GroupCode: obj.groupId,
				UserID: obj.member,
				MemberName: obj.memberName,
				Type: type
			}));

			//刷新群人员
			var view = plus.webview.getWebviewById("group-info.html");
			view && view.GroupCode == obj.groupId && (RpcClient.invoke(view.id, "Rpc_refreshGroup"));
		}

	},
	readMsg: function (oppoId) {
		var msg = document.querySelector("#msg-" + oppoId);

		if (msg) {

			var id = msg.getAttribute("data-oid");

			var idx = -1;
			var UnReadCount = 0;
			dom.properties.scope.domData.msgList.filter(function (_item, _index) {
				if ((_item.OppoID || _item.GroupCode) == id) {
					idx = _index;
					UnReadCount += _item.IsSilence ? 0 : parseInt(_item.UnReadCount);
				}
			});

			YunIM.NoReadCount -= UnReadCount;

			dom.properties.scope.domData.msgList[idx].UnReadCount = 0;
			dom.properties.scope.$apply();

			dom.service.Rpc_NoReadCount();
		}
	},
	service: {
		init: function () {
			this.RPC_Login();
			this.RPC_Logout();
			this.RPC_SendMsg();
			this.RPC_ReadMsg();
			this.Rpc_ReadSys();
			this.RPC_Pause();
			this.RPC_Resume();
			this.RPC_QuitGroup();
			this.Rpc_RefChatViewName();
			this.Rpc_GroupSilence();
			this.RPC_BackMsg();
			this.RPC_MsgBackCall();

		},
		RPC_Login: function (userInfo) {
			RpcServer.expose("RPC_Login", function (userInfo) {
				//刷新相关页面
				RpcClient.invoke("tab.html", "RPC_RefreshLogin", userInfo);
				RpcClient.invoke("my.html", "RPC_RefreshLogin", userInfo);
				RpcClient.invoke("work.html", "RPC_RefreshLogin", userInfo);
				RpcClient.invoke("ing-all.html-sub6", "RPC_RefreshLogin", userInfo);
				RpcClient.invoke("index.html", "RPC_RefreshLogin", userInfo);

				//RpcClient.invoke("contactWind", "RPC_ReloadCurListData");
				RpcClient.invoke("sourceWind", "RPC_RefreshResource", "-1");
				RpcClient.invoke("compWind", "RPC_RefreshResource", "-1");
				RpcClient.invoke("friendWind", "RPC_RefreshResource", "-1");
				RpcClient.invoke("contact.html", "RPC_RefreshLogin", userInfo);
				RpcClient.invoke("webView.html", "RPC_RefreshLogin");
				dom.properties.IsNew = userInfo.IsNew ? true : false;
				dom.service.refresh(true);
			});
		},
		refresh: function (isApply) {
			dom.properties.isOpenDefault = false;
			dom.properties.scope.domData.State = isNetWorkCanUse() ? 0 : 1;

			dom.properties.isLogin = true;

			if (isApply)
				dom.properties.scope.$apply();

			if (dom.properties.scope.domData.State != 1) {
				dom.properties.scope.event.initMsg();
				dom.loading.style.display = "block";
				dom.method.init();
			}
		},
		RPC_Logout: function () {
			RpcServer.expose("RPC_Logout", function () {
				dom.im.event.LogOut();

				//退出本地登录
				dom.properties.CacheService.remove('user');
				dom.properties.scope.domData.userInfo = "";

				dom.method.loadUserData(null, true);

				dom.properties.RPCObserver.broadcast('close_popover');
				RpcClient.invoke("debug-list.html", "RPC_ActionSheetClose");

				//关闭所有需要登录的窗口
				var views = plus.webview.all();
				var index = views.length;

				while (index--) {
					if (views[index].needLogin || views[index].needlogin) {
						views[index].close("none");
					}
				}

				dom.properties.UtilsService.clearWindow();

				//打开登录页面
				mui.openWindow({
					id: "login.html"
				})
				//刷新相关页面
				RpcClient.invoke("tab.html", "RPC_RefreshLogin", null);
				RpcClient.invoke("my.html", "RPC_RefreshLogin", null);
				RpcClient.invoke("contact.html", "RPC_RefreshLogin", null);
				dom.service.Rpc_stopHeart();
			});
		},
		RPC_SendMsg: function () {
			RpcServer.expose("RPC_SendMsg", function (msg) {
				YunIM.EV_sendMsg(msg, false);
			});
			RpcServer.expose("RPC_SendGroupMsg", function (msg) {
				YunIM.EV_sendMsg(msg, true);
			});
			RpcServer.expose("RPC_SendNotice", function (msg) {
				YunIM.EV_sendMsg(msg, true);
			});
		},
		RPC_ReadMsg: function () {
			RpcServer.expose("RPC_ReadMsg", function (oppoId, version) {
				dom.readMsg(oppoId);
			});
		},
		Rpc_ReadSys: function () {
			RpcServer.expose("RPC_ReadSysMsg", function (type) {

				var idx = -1;
				var UnReadCount = 0;
				dom.properties.scope.domData.msgList.filter(function (_item, _index) {
					if (_item.ChatType == 'Sys' && _item.MsgType == type) {
						idx = _index;
						UnReadCount += parseInt(_item.UnReadCount);
					}
				});

				YunIM.NoReadCount -= UnReadCount;

				dom.properties.scope.domData.msgList[idx].UnReadCount = 0;
				dom.properties.scope.$apply();

				dom.service.Rpc_NoReadCount();
			});
		},
		Rpc_NoReadCount: function () {
			RpcClient.invoke("tab.html", "RPC_NoreadCount", YunIM.NoReadCount);
		},
		Rpc_stopHeart: function () {
			RpcClient.invoke("tab.html", "RPC_StopHeart");
		},
		Rpc_startHeart: function () {
			RpcClient.invoke("tab.html", "RPC_StartHeart");
		},
		Rpc_refWork: function (_value) {
			RpcClient.invoke("work.html", "RPC_RefToDo");
			RpcClient.invoke("tab.html", "RPC_RefToDo");
			//刷新待办页签未读
			RpcClient.invoke("msg-list.html", 'RPC_UnreadRefreshForChat');
			//刷新待办列表
			dom.properties.RPCObserver.broadcast('refresh_msg_all_list', _value);
		},
		RPC_YunImLogin: function () {
			RpcServer.expose("RPC_YunImLogin", function () {
				dom.im.Do_Login(true);
			});
		},
		RPC_Pause: function () {
			RpcServer.expose("RPC_Pause", function () {
				YunIM.IsBackgroundRun = true;
			});
		},
		RPC_Resume: function () {
			RpcServer.expose("RPC_Resume", function () {
				YunIM.IsBackgroundRun = false;
				//reloadMessage("reload", true);
				dom.im.Do_Login(true);
			});
		},
		Rpc_refLog: function () {
			if (dom.properties.$filter("hasMenuAuth")("tygn", "rcgz")) {
				RpcClient.invoke("work.html", "RPC_RefToDoWorkLog");
				RpcClient.invoke("tab.html", "RPC_RefToDoWorkLog");
			}
		},
		//刷新群组 data{GroupName:,GroupCode:,UserID:,Type:1新增 0删除}
		Rpc_RefGroup: function (data) {
			RpcClient.invoke("chat-group-" + data.GroupCode, "Rpc_RefGroup", data)
		},
		//刷新联系人中的群聊
		Rpc_ResGroups: function () {
			dom.properties.RPCObserver.broadcast('refresh_chat_group_list');
		},
		RPC_QuitGroup: function () {
			RpcServer.expose("RPC_QuitGroup", function (data) {
				dom.im.quitGroup(data.GroupCode, data.Message);
			});
		},
		Rpc_RefChatViewName: function () {
			dom.properties.RPCObserver.on('refresh_chat_viewName', 'refresh_chat_viewName');
			window.refresh_chat_viewName = function (_data) {
				var chatData = dom.properties.scope.domData.msgList.find(function (_item) {
					return _item.OppoID == _data.UserID;
				});

				chatData && (chatData.OppoName = _data.RemarkName);

				dom.properties.scope.$apply();
			};
		},
		Rpc_GroupSilence: function () {
			RpcServer.expose("Rpc_GroupSilence", function (_data) {
				if (_data.IsSilence == 1 && YunIM.SilenceGroup.indexOf(_data.GroupCode) < 0) {
					YunIM.SilenceGroup.push(_data.GroupCode)
				} else if (_data.IsSilence == 0 && YunIM.SilenceGroup.indexOf(_data.GroupCode) >= 0) {
					YunIM.SilenceGroup.splice(YunIM.SilenceGroup.indexOf(_data.GroupCode), 1)
				}
			});
		},
		RPC_BackMsg: function () {
			RpcServer.expose("RPC_BackMsg", function (msg) {
				YunIM.EV_msgBack(msg);
			});
		},
		RPC_MsgBackCall: function () {
			RpcServer.expose("RPC_MsgBackCall", function (msg) {

				var idx = -1;
				var noreadCount = 0;
				dom.properties.scope.domData.msgList.filter(function (item, _idx) {
					(item.OppoID || item.GroupCode) == msg.OppoID && (idx = _idx);
				});

				if (idx >= 0 && ((dom.properties.scope.domData.msgList[idx].MsgID == msg.MsgID && dom.properties.scope.domData.msgList[idx].Version == msg.Version) || (dom.properties.scope.domData.msgList[idx].MsgID == msg.MsgID2 && dom.properties.scope.domData.msgList[idx].Version == msg.Version2))) {
					dom.properties.scope.domData.msgList[idx].MsgType2 = 25;
					dom.properties.scope.$apply();
				}
			});
			RpcServer.expose("RPC_BackCall", function (msg) {

			});
		},
	},
	//聊天用户
	msgList: {
		backHtml: "对方已撤回消息",
		backHtmlSelf: "您已撤回消息",
		dom: mui("#pullrefresh"),
		init: function () {
			this.event.init();
		},
		isSelected: false,
		event: {
			init: function () {
				this.tap();
			},
			//点击事件
			tap: function () {
				window.addEventListener("touchstart", function (event) {
					dom.msgList.isSelected = document.querySelector("#pullrefresh").querySelector(".mui-selected");
				});

				//点击打开聊天窗口
				dom.msgList.dom.on("tap", "li .mui-slider-handle", function (_event) {
					var selected = document.querySelector("#pullrefresh").querySelector(".mui-selected");
					if (selected) {
						mui.swipeoutClose(selected);
						return;
					} else {
						if (dom.msgList.isSelected) {
							return;
						}
					}

					var _dom = this.parentNode;
					var type = _dom.getAttribute("data-type");
					switch (type) {
						case "Group": //群聊天
							dom.event.openGroupChat(_dom);
							break;
						case "0": //普通聊天
							dom.event.openchat(_dom);
							break;
						case "1": //系统消息
							dom.event.openWindow({
								id: "message-list.html",
								url: "message-list.html?type=1",
								extras: {
									openType: 1,
									needLogin: true
								}
							});
							break;
						case "2": //工作通知
							dom.event.openWindow({
								id: "message-list.html",
								url: "message-list.html?type=2",
								extras: {
									openType: 2,
									needLogin: true
								}
							});
							break;
						case "3": //设计圈
							dom.event.openWindow({
								id: "message-list.html",
								url: "message-list.html?type=3",
								extras: {
									openType: 3,
									needLogin: true
								}
							});
							break;
						case "4": //群通知
							break;
					}

				});

				dom.msgList.dom.on("tap", "li .btn-delete", function () {
					var _this = this;
					plus.nativeUI.confirm('您确定删除?', function (e) {
						if (e.index == 1) {
							var _dom = _this.parentNode.parentNode;
							if (_dom.getAttribute("data-type") == "Group") {
								dom.event.deleteGroup(_dom);
							} else {
								dom.event.delete(_dom);
							}
						} else {

						}
					}, "提示", ['取消', '确定']);

				});
				dom.msgList.dom.on("tap", "li .btn-trip", function () {
					var _dom = this.parentNode.parentNode;
					dom.properties.UtilsService.openWindow({
						id: "template.html?key=tripMap",
						url: "../map/template.html?key=tripMap&userId=" + _dom.getAttribute("data-oid")
					});

					var selected = document.querySelector("#pullrefresh").querySelector(".mui-selected");
					if (selected) {
						mui.swipeoutClose(selected);
					}
				});
			}
		}
	},
	event: {
		//打开聊天窗口
		openchat: function (_dom) {
			var data = {
				chatId: _dom.getAttribute("data-oid"),
				chatName: _dom.getAttribute("data-name"),
				hasLogo: _dom.getAttribute("data-logo"),
				chatCompId: _dom.getAttribute("data-compId"),
				needLogin: true
			};

			dom.properties.ChatUserService.tap(data);
			setTimeout(function () {
				dom.readMsg(data.chatId);
			}, 500);
		},
		openGroupChat: function (_dom) {
			var data = {
				GroupCode: _dom.getAttribute("data-oid"),
				GroupName: _dom.getAttribute("data-name"),
				needLogin: true
			};

			dom.properties.ChatUserService.tapGroup(data);
			setTimeout(function () {
				dom.readMsg(data.GroupCode);
			}, 500);
		},
		openWindow: function (options) {
			dom.properties.UtilsService.openWindow({
				needLogin: true,
				id: options.id,
				url: options.url,
				extras: options.extras
			});
		},
		//删除群聊天
		deleteGroup: function (_dom) {
			var id = _dom.getAttribute("data-oid");

			var idx = -1;
			var UnReadCount = 0;
			dom.properties.scope.domData.msgList.filter(function (_item, _index) {
				if (_item.GroupCode == id) {
					idx = _index;
					UnReadCount += _item.IsSilence ? 0 : parseInt(_item.UnReadCount);
				}
			});

			curData.closeGroup(id, function () {
				dom.properties.scope.domData.msgList.splice(idx, 1);
				//dom.properties.scope.$apply();
				YunIM.NoReadCount -= UnReadCount;
				dom.service.Rpc_NoReadCount();
				var view = plus.webview.getWebviewById("chat-group-" + id);
				if (view) {
					view.close("none");
				}

				dom.properties.scope.domData.draft[id] = false;

			});
		},
		//删除最近联系人
		delete: function (_dom) {
			var id = parseInt(_dom.getAttribute("data-oid"));

			var idx = -1;
			var UnReadCount = 0;
			dom.properties.scope.domData.msgList.filter(function (_item, _index) {
				if (_item.OppoID == id) {
					idx = _index;
					UnReadCount += parseInt(_item.UnReadCount);
				}
			});

			curData.close(id, function () {
				dom.properties.scope.domData.msgList.splice(idx, 1);
				//dom.properties.scope.$apply();
				YunIM.NoReadCount -= UnReadCount;
				dom.service.Rpc_NoReadCount();

				var view = plus.webview.getWebviewById("chat-" + id);
				if (view) {
					view.close("none");
				}

				dom.properties.scope.domData.draft[id] = false;

			});
		}
	}
};

var curData = {
	page: 1,
	size: 15,
	load: function (type, isApply) {
		var _this = this;
		dom.properties.scope.domData.State = isNetWorkCanUse() ? (dom.properties.loadType != "reload" ? 0 : 3) : 1;
		isApply && (dom.properties.scope.$apply());

		if (_this.page == 1) {
			YunIM.NoReadCount = 0;
			YunIM.isBreak = true;

		}

		if (dom.properties.scope.domData.State == 1) {
			//document.querySelector(".state_reload").style.display = "none";
			dom.loading.style.display = "none";
			return;
		}

		if (type == "reload") {
			//document.querySelector(".state_reload").style.display = "block";
		}

		dom.properties.loadType = type;

		curData.getSilenceGroup();


		!type && (dom.properties.scope.event.initMsg()) && (dom.im.loading());

		var url = dom.properties.apiHost + "/api/v1/Message/MsgCurList?clientType=2&pageSize=" + _this.size + "&pageIndex=" + _this.page;

		dom.properties.DataService.get(url).then(function (data) {
			dom.loading.style.display = "none";
			//document.querySelector(".state_reload").style.display = "none";

			
			if (type == "down") {
				dom.properties.scope.domData.msgList = [];
			}

			dom.pullrefresh.style.display = "block";

			if (_this.page == 1) {
				YunIM.NoReadCount = 0;
				dom.properties.loginTime = new Date().getTime();
				YunIM.msgLists=[];
			}
			data.Result.forEach(function (_item) {
				if (_item.ChatType == 'Person') {
					dom.im.checkMsgList(_item, false, false);

					var view = plus.webview.getWebviewById("chat-" + _item.OppoID);
					if (view) {
						// if (type == "reload") {
						// 	view.evalJS("reloadNoRead()");
						// }
						// else{
						// 	view.evalJS("reload()");
						// }
						setTimeout(function(){
							view.close("none");
						});
					}

				} else if (_item.ChatType == "Sys") {
					dom.im.checkMsgListSys(_item, false, false);
				} else if (_item.ChatType == "Group") {
					dom.im.checkMsgListGroup(_item, false, false);

					var view = plus.webview.getWebviewById("chat-group-" + _item.GroupCode);
					if (view) {
						// if (type == "reload") {
						// 	view.evalJS("reloadNoRead()");
						// }
						// else{
						// 	view.evalJS("reload()");
						// }
						setTimeout(function(){
							view.close("none");
						});
					}
				}
			});


			if (mui("#pullrefresh").pullRefresh()) {
				setTimeout(function () {
					if (type && type != "up") {
						mui('#pullrefresh').pullRefresh().refresh(true);
					}
					if (type == "down") {
						mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
					} else if (type == "up") {
						mui('#pullrefresh').pullRefresh().endPullupToRefresh(data.Result < _this.size);
					}
				})
			}

			dom.properties.scope.isLoad = true;
			if (_this.page == 1) {
				dom.im.init();
			}

		}, function () {
			dom.loading.style.display = "none";
			mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
			dom.properties.scope.domData.State = 1;
			//document.querySelector(".state_reload").style.display = "none";
		});
	},
	//获取群静音列表
	getSilenceGroup: function () {
		var properties = dom.properties;
		var url = properties.apiHost + "/api/v1/Message/SilenceGroup_List";

		properties.DataService.get(url).then(function (_data) {
			YunIM.SilenceGroup = _data;
		});
	},
	close: function (oppoId, callback) {

		var url = dom.properties.apiHost + "/api/v1/Message/MsgCurSingleClose?oppoId=" + oppoId + "&clientType=2";

		dom.properties.DataService.post(url, {}).then(function (data) {
			if (typeof callback == "function") {
				callback();
			}
		}, function () {
			mui.toast("删除最近联系人失败！")
		});
	},
	closeGroup: function (groupCode, callback) {
		var url = dom.properties.apiHost + "/api/v1/Message/MsgCurGroupClose?groupCode=" + groupCode + "&clientType=2";

		dom.properties.DataService.post(url, {}).then(function (data) {
			if (typeof callback == "function") {
				callback();
			}
		}, function () {
			mui.toast("删除最近联系人失败！")
		});
	},
	getReamrkName: function (msg, oppId, callback) {
		var url = dom.properties.apiHost + "/api/v1/user/GetAuthUserInfo?userId=" + oppId;

		dom.properties.DataService.get(url).then(function (data) {
			if (data) {
				callback(msg, data.RemarkName || data.ViewName)
			}
		}, function () {
			dom.properties.scope.domData.State = isNetWorkCanUse() ? (dom.properties.loadType != "reload" ? 0 : 3) : 1;
		});
	},
	pullrefreshDown: function () {
		curData.page = 1;
		curData.load("down");
	},
	pullrefreshUp: function () {
		curData.page++;
		curData.load("up");
	}
};

window.reloadMessage = curData.load;
window.ImLogin = dom.im.Do_Login;

/**
 * 初始化angular
 * **/
app.controller("MessageController", ["$scope", "$sce", "ApiService", "AuthService", "DataService", "CacheService",
	"UtilsService", "Loading", "$filter", "ChatUserService", "RPCObserver", "$q",
	function ($scope, $sce, ApiService, AuthService, DataService, CacheService, UtilsService, Loading, $filter,
		ChatUserService, RPCObserver, $q) {

		//页面data
		$scope.domData = {
			UserInfo: {},
			msgList: [],
			isNetWork: true,
			Api50: "",
			draft: {},
			State: 0,
			isLoad: false
		};
		dom.properties.scope = $scope;
		dom.properties.ApiService = ApiService;
		dom.properties.AuthService = AuthService;
		dom.properties.DataService = DataService;
		dom.properties.CacheService = CacheService;
		dom.properties.UtilsService = UtilsService;
		dom.properties.Loading = Loading;
		dom.properties.$filter = $filter;
		dom.properties.ChatUserService = ChatUserService;
		dom.properties.RPCObserver = RPCObserver;
		dom.properties.$q = $q;

		dom.properties.apiHost = ApiService.Api50

		$scope.domData.Api50 = dom.properties.apiHost;

		RpcServer.expose("RPC_Draft", function (data) {
			$scope.domData.draft[data.ID] = data.isDraft ? true : false;
			$scope.$apply();
		});

		setTimeout(function () {
			mui.init({
				pullRefresh: {
					container: '#pullrefresh',
					down: {
						callback: curData.pullrefreshDown
					},
					up: {
						callback: curData.pullrefreshUp
					}
				}
			});

		})

		$scope.event = {
			transContent: function (item, sendName) {
				var html = "";
				if (item.MsgType2 == 25) {
					html = $sce.trustAsHtml(item.SendID == dom.properties.scope.domData.UserInfo.UserID ? dom.msgList.backHtmlSelf : sendName ? "<span class='mui-ellipsis' style='max-width:100px;display:inline-block;float:left;'>" + sendName + "</span>" + ": 已撤回消息" : dom.msgList.backHtml);
				} else {
					var text = transMessage.trans(item.Content, 3);
					html = $sce.trustAsHtml(sendName ?
						"<span class='mui-ellipsis' style='max-width:100px;display:inline-block;float:left;'>" + sendName + "</span>" +
						"：" + text : text);
				}
				return html;
			},
			getDate: function (date) {
				return GetDate(date, true, true, "yyyy-MM-dd", true)
			},
			reload: function () {
				dom.service.refresh();
			},
			initMsg: function () {
				$scope.domData.isLoad = false;
				$scope.domData.msgList = [];
				// $scope.domData.msgList = [{
				// 	UnReadCount: 0,
				// 	Content: '[2,[1,"暂无"]]',
				// 	SendTime: "",
				// 	ChatType: "Sys",
				// 	MsgType: "2"
				// }, {
				// 	UnReadCount: 0,
				// 	Content: '[1,[1,"暂无"]]',
				// 	SendTime: "",
				// 	ChatType: "Sys",
				// 	MsgType: "1"
				// }]
			}
		}

		$scope.domData.State = isNetWorkCanUse() ? 0 : 1;

		if ($scope.domData.State == 1) {
			dom.loading.style.display = "none";
		}

		$scope.event.initMsg();

		//初始化dom
		dom.init();
	}
]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});