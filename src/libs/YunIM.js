(function () {
	window.YunIM = window.YunIM || {
		_appid: MdConfig.TestMode == 1 ? '8a216da85d158d1b015d72709d732519' : 'aaf98f894fd44d15014fded15bf50b3d', //应用ID:正式：aaf98f894fd44d15014fded15bf50b3d 测试：8a216da85d158d1b015d72709d732519
		_appToken: MdConfig.TestMode == 1 ? 'e363491394dcec4380cb44531fdfb91f' : 'aaa6fb2f9fe985968597ff33ff1d7a6b', //开发Token 正式：aaa6fb2f9fe985968597ff33ff1d7a6b 测试：e363491394dcec4380cb44531fdfb91f
		_onUnitAccount: 'KF10089', // 多渠道客服帐号，目前只支持1个
		_3rdServer: 'http://imslb.yuntongxun.com:8999/2016-08-15/Corp/yuntongxun/inner/authen/', // 3rdServer，主要用来虚拟用户服务器获取SIG

		/** 以下不要动，不需要改动 */
		_timeoutkey: null,
		_username: null,
		_user_account: null, //用户登录账号
		_contact_type_c: 'C', // 代表联系人
		_contact_type_g: 'G', // 代表群组
		_contact_type_m: 'M', // 代表多渠道客服
		_onMsgNotifyReceiveListener: null,
		_onMsgReceiveListener: null,
		_onDeskMsgReceiveListener: null,
		_noticeReceiveListener: null,
		_onConnectStateChangeLisenter: null,
		_onCallMsgListener: null,
		_isMcm_active: false,
		_local_historyver: 0,
		_msgId: null, // 消息ID，查看图片时有用
		_pre_range: null, // pre的光标监控对象
		_pre_range_num: 0, // 计数，记录pre中当前光标位置，以childNodes为单位
		_fireMessage: 'fireMessage',
		_serverNo: 'XTOZ',
		_baiduMap: null,
		_loginType: 1, //登录类型: 1账号登录，3voip账号密码登录
		_Notification: null,
		_extopts: [], // 新建一个数组存放@的人
		_transfer: 12,
		_isNewSDK: false,
		_msgBack :25,
		/**
		 * 初始化SDK
		 * @return {[type]} [description]
		 */
		init: function () {
			if (typeof RL_YTX == "undefined") {
				return 0;
			}
			return RL_YTX.init(YunIM._appid);
		},

		/**
		 * 执行登录操作
		 */
		Do_Login: function (isApply) {
			if (YunIM.isKicked) return;
			var timestamp = YunIM._getTimeStamp();
			var sig = hex_md5(YunIM._appid + user.UserID + timestamp + YunIM._appToken);
			YunIM.isBreak=false;

			//设置为手机端登录
			//RL_YTX.setMobileLogin();
			//关闭日志输出
			RL_YTX.setLogClose();

			//dom.im.loading(isApply);

			YunIM.EV_login(sig, timestamp);
		},
		SilenceGroup: [],
		isBreak: false,
		isCloseTip: true,
		isKicked: false,
		checkState: "",
		reConnect: "",
		msgLists:[],
		/**
		 * 登录事件
		 * @param {String} sig          [description]
		 * @param {DateTime} timestamp    [description]
		 */
		EV_login: function (sig, timestamp) {

			var loginBuilder = new RL_YTX.LoginBuilder();
			loginBuilder.setType(YunIM._loginType);
			loginBuilder.setUserName(user.UserID + '');
			loginBuilder.setSig(sig);
			loginBuilder.setTimestamp(timestamp);

			RL_YTX.login(loginBuilder, function (obj) {
					YunIM.EV_checkState();

					//dom.im.hideLoading(true);
					YunIM._username = user.UserName || user.RealName || user.Mdt; //"显示的中文名称";
					YunIM._user_account = user.UserID;
					//设置当前登录用户的昵称
					var userInfo = new RL_YTX.UploadPersonInfoBuilder();
					userInfo.setNickName(user.UserName || user.RealName || user.Mdt);
					userInfo.setSex(user.Sex || "1");
					RL_YTX.uploadPersonInfo(userInfo);

					//注册PUSH监听
					YunIM._onMsgReceiveListener = RL_YTX.onMsgReceiveListener(
						function (obj) {
							YunIM.EV_onMsgReceiveListener(obj);
						});

					//群组通知
					YunIM._noticeReceiveListener = RL_YTX.onNoticeReceiveListener(
						function (obj) {
							YunIM.EV_noticeReceiveListener(obj);
						});
					//服务器连接状态变更监听
					YunIM._onConnectStateChangeLisenter = RL_YTX.onConnectStateChangeLisenter(
						function (obj) {
							// console.log("状态：" + obj.code)
							switch (obj.code) {
								case 1: //断开连接
									break;
								case 2: //重连中
									break;
								case 3: //重连成功
									break;
								case 4: //被踢下线
									var btnArray = ['退出', '重新登录'];
									var date = new Date().Format("HH:mm");

									YunIM.isKicked = true;
									YunIM.EV_logout();

									//如果被踢掉 应该不发通讯以及停止心跳
									dom.service.Rpc_stopHeart();
									plus.nativeUI.confirm('你的账号于' + date + '在另外一个终端登录。如非本人操作，则密码可能已泄露，建议前往 http://www.maidiyun.com/ 修改密码。', function (e) {
										if (e.index == 1) {
											dom.service.refresh();
											YunIM.isKicked = false;
											//YunIM.Do_Login(YunIM._user_account);
										} else {
											YunIM.isKicked = false;
											RpcClient.invoke("message.html", "RPC_Logout");
											//返回首页
											mui.openWindow({
												id: "tab.html"
											});
										}
									}, "下线通知", btnArray);

									// mui.confirm('你的账号于' + date + '在另外一个终端登录。如非本人操作，则密码可能已泄露，建议前往 http://www.maidiyun.com/ 修改密码。', '下线通知', btnArray, function (e) {
									// 	if (e.index == 1) {
									// 		dom.service.refresh();
									// 		//YunIM.Do_Login(YunIM._user_account);
									// 	} else {
									// 		RpcClient.invoke("message.html", "RPC_Logout");
									// 		//返回首页
									// 		mui.openWindow({
									// 			id: "tab.html"
									// 		});
									// 	}
									// });
									break;
								case 5: //被服务器踢掉
									//curData.load("reload");
									dom.im.Do_Login(true);
									break;
								default:
									// alert(obj.code)
									break;
							};
						},
						function () {
							//登录失败之后重新登录
							YunIM.Do_Login(true);
						});

					
				},
				function (obj) {
					YunIM.isCloseTip = false;
					setTimeout(function () {
						YunIM.Do_Login(true);
					}, 1000);
				});

			setTimeout(function () {
				if (YunIM.isCloseTip) {
					//dom.im.hideLoading(true);
				}
			}, 1000);
		},

		/**
		 * 登出事件
		 */
		EV_logout: function () {
			// 销毁PUSH监听
			YunIM._onMsgReceiveListener = null;
			// 服务器连接状态变更时的监听
			YunIM._onConnectStateChangeLisenter = null;

			YunIM._noticeReceiveListener = null;

			//清空数量
			YunIM.NoReadCount = 0;

			clearInterval(YunIM.checkState);
			clearInterval(YunIM.reConnect);

			try {
				RL_YTX.logout(function () {}, function (obj) {});
			} catch (e) {}
		},

		EV_getUserState: function (callback) {
			var builder = new RL_YTX.GetUserStateBuilder(user.UserID + '', false);
			RL_YTX.getUserState(builder, function (obj) {
				callback(obj);
			}, function (err) {

			});
		},
		EV_checkState: function () {
			if (YunIM.checkState || YunIM.isKicked) {
				clearInterval(YunIM.checkState);
			}

			if (YunIM.isKicked) {
				return;
			}

			//每分钟检查一次 当前用户是否在线
			YunIM.checkState = setInterval(function () {
				YunIM.EV_getUserState(function (obj) {
					if (obj.state != 1 && obj.device != (mui.os.android ? 1 : 2)) {
						try {
							//curData.load("reload");
							dom.im.Do_Login(true);
						} catch (e) {}
					}
				});
			}, 60000);
		},

		EV_msgBack: function (msg) {
			var builder = new RL_YTX.MsgBackBuilder();
			builder.setMsgId(msg.msgId);
			RL_YTX.msgBack(builder, function (res) {
				RpcClient.invoke(msg.vId, msg.vBack, msg);
			}, function (e) {
				mui.alert("消息撤回失败！");
			});
		},

		/**
		 * 消息处理中
		 */
		IsRunning: false,

		/**
		 * 消息队列
		 */
		MsgList: [],

		/**
		 * 事件 push消息监听器，被动接收消息
		 * @param {[type]} obj [description]
		 */
		EV_onMsgReceiveListener: function (obj) {
			//登录之后十秒之内的消息不接受
			//var _date = (new Date()).getTime();
			//var view = plus.webview.getWebviewById("chat-" + obj.msgSender)
			//console.log("相隔时间：" + (_date - dom.properties.loginTime))
			// console.log("收到内容:" + JSON.stringify(obj));
			
			if (obj.msgDateCreated < dom.properties.loginTime || YunIM.isBreak) {
				return;
			}
			if(YunIM.msgLists.indexOf(obj.msgId)>=0)
			{
				return;
			}
			else{
				YunIM.msgLists.push(obj.msgId);
			}

			if (!YunIM.IsRunning) {
				YunIM.IsRunning = true;
				if (YunIM.MsgList.length == 0) {
					YunIM.dealwithMsg(obj);
				} else {
					YunIM.MsgList.push(obj);
					try {
						YunIM.dealwithMsg();
					} catch (e) {}

				}
			} else {
				YunIM.MsgList.push(obj);;
			}
		},
		IsRunNotice: false,
		NoticeList: [],
		/**
		 * 群组通知
		 */
		EV_noticeReceiveListener: function (obj) {
			//  console.log("群组通知：" + JSON.stringify(obj))
			var createDate = obj.msgId.split('|')[0];
			if (createDate < dom.properties.loginTime) {
				return;
			}
			if(YunIM.msgLists.indexOf(obj.msgId)>=0)
			{
				return;
			}
			else{
				YunIM.msgLists.push(obj.msgId);
			}
			if (!YunIM.IsRunNotice) {
				YunIM.IsRunNotice = true;
				if (YunIM.NoticeList.length == 0) {
					YunIM.dealwithNotice(obj);
				} else {
					YunIM.NoticeList.push(obj);
					try {
						YunIM.dealwithNotice();
					} catch (e) {}

				}
			} else {
				YunIM.NoticeList.push(obj);;
			}
		},
		dealwithNotice: function (obj) {
			if (!obj) {
				obj = YunIM.NoticeList[0];
				YunIM.NoticeList.splice(0, 1);
			}

			//刷新群组
			dom.im.Rpc_RefGroup(obj);

			if (YunIM.NoticeList.length > 0) {
				YunIM.dealwithNotice();
			} else {
				YunIM.IsRunNotice = false;
			}
		},
		dealwithMsg: function (obj) {
			if (!obj) {
				obj = YunIM.MsgList[0];
				YunIM.MsgList.splice(0, 1);
			}
			console.info(obj);
			
			if(obj.msgType == YunIM._msgBack && obj.msgSender!=user.UserID)
			{
				var domain = JSON.parse(obj.msgDomain);
				var view = plus.webview.getWebviewById("chat-" + obj.msgSender);
				if(domain.groupid)
				{
					view = plus.webview.getWebviewById("chat-group-" + domain.groupid);
				}
				if(view)
				{
					RpcClient.invoke(view.id,"RPC_MsgBackCall",{
						msgId:domain.dateCreated+'|'+domain.version,
						msgClientNo:domain.msgId,
						SendID:obj.msgSender
					});
				}
				else
				{
					RpcClient.invoke("message.html","RPC_MsgBackCall",{
						MsgID:domain.dateCreated,
						Version:domain.version,
						MsgID2:domain.msgId.split('|')[0],
						Version2:domain.msgId.split('|')[1],
						OppoID:domain.groupid?domain.groupid:obj.msgSender,
						SendID:obj.msgSender
					});
				}
			}
			//console.log("接收到的消息：" + JSON.stringify(obj));
			//console.log("内容："+obj.msgContent)
			if (obj.msgContent && obj.msgContent.indexOf('[0,[[1,"#WITHDRAW_MSGID_')<0) {
				
				//定义回调消息体
				var jsonCnt = JSON.parse(obj.msgContent);

				

				//过滤掉老版迈迪通的消息
				if (angular.isArray(jsonCnt)) {
					//判断是不是群组消息
					var b_isGroupMsg = ('g' == obj.msgReceiver.substr(0, 1));

					if (b_isGroupMsg) {
						//处理群消息
						YunIM.dealGroup(obj, jsonCnt);
					} else {
						//处理个人消息
						YunIM.dealSingle(obj, jsonCnt);
					}
				}
			}

			//继续处理下一条消息
			if (YunIM.MsgList.length > 0) {
				try {
					YunIM.dealwithMsg();
				} catch (error) {
					
				}
			} else {
				YunIM.IsRunning = false;
			}
		},
		/**处理群消息 */
		dealGroup: function (obj, jsonCnt) {
			var chattime = new Date(parseInt(obj.msgDateCreated));
			var domain = obj.msgDomain ? JSON.parse(obj.msgDomain) : {
				reName: "",
				GroupName: ""
			};

			var returnObj = {
				isGroup: true,
				SendID: parseInt(obj.msgSender),
				GroupName: domain.GroupName,
				GroupCode: obj.msgReceiver,
				SendTime: chattime.Format("yyyy-MM-dd HH:mm:ss"),
				MsgId: obj.msgId,
				Content: obj.msgContent,
				SendState: 2,
				SendName: domain.reName,
				MsgType: jsonCnt[0],
				isSync: parseInt(obj.msgSender) == user.UserID,
				IsSilence: YunIM.SilenceGroup.indexOf(obj.msgReceiver) >= 0 ? 1 : 0
			};

			//判断群组 是否打开
			var view = plus.webview.getWebviewById("chat-group-" + returnObj.GroupCode);

			if (view && view.isVisible()) {
				YunIM.EV_msgRead(obj.version);
			} else if (returnObj.SendID != user.UserID && returnObj.IsSilence == 0 && !returnObj.isSync) {
				YunIM.createLocalMessage(returnObj.GroupName, obj.msgContent);
			}

			//如果在后台运行，则播放声音
			if (YunIM.IsBackgroundRun && !returnObj.isSync && returnObj.IsSilence == 0) {
				YunIM.Play_MsgSound();
			}

			try {
				if (mui.os.android) {
					//激活各个子页的消息接收服务
					dom.im.RPC_ReceiveMessage(returnObj);
				} else {
					//苹果兼容角标问题
					setTimeout(function () {
						dom.im.RPC_ReceiveMessage(returnObj);
					}, 300);
				}
			} catch (e) {}
		},
		/**处理个人消息 */
		dealSingle: function (obj, jsonCnt) {
			//过滤掉群通知。
			if (obj.msgContent.indexOf("[4,") != 0) {
				var chattime = new Date(parseInt(obj.msgDateCreated));
				var domain = obj.msgDomain ? JSON.parse(obj.msgDomain) : {
					reName: "",
					hasLogo: false,
					compId: 0
				};
				var returnObj = {
					isGroup: false,
					SendID: parseInt(obj.msgSender),
					ReceiveID: parseInt(obj.msgReceiver),
					ReceiveCompID: domain.compId,
					ReceiveName: obj.ReceiveName,
					ULogoIsExist: domain.hasLogo,
					SendName: domain.reName || obj.senderNickName || obj.msgSenderNick,
					SendTime: chattime.Format("yyyy-MM-dd HH:mm:ss"),
					SendState: 2,
					MsgId: obj.msgId,
					Content: obj.msgContent,
					MsgType: jsonCnt[0],
					isSync: parseInt(obj.msgSender) == user.UserID,
				};

				//returnObj.msgid = UUID();
				//如果聊天窗口没有打开，推送到通知栏
				var view = plus.webview.getWebviewById("chat-" + returnObj.SendID);
				var sysView = plus.webview.getWebviewById("message-list.html");
				var isLocalPush = true;
				if (returnObj.SendID != user.UserID) {
					var sendName = "";
					if (obj.msgContent.indexOf("[1,") == 0) //系统消息
					{
						sysView && sysView.openType == 1 && (isLocalPush = false) && (YunIM.EV_msgRead(obj.version));
						sendName = "系统消息";
						returnObj.MsgType = 1;
					} else if (obj.msgContent.indexOf("[2,") == 0) //工作通知
					{
						sysView && sysView.openType == 2 && (isLocalPush = false) && (YunIM.EV_msgRead(obj.version));
						sendName = "工作通知";
						returnObj.MsgType = 2;
					} else if (obj.msgContent.indexOf("[3,") == 0) //设计圈
					{
						sysView && sysView.openType == 3 && (isLocalPush = false) && (YunIM.EV_msgRead(obj.version));
						sendName = "设计圈";
						returnObj.MsgType = 3;
					} else if (obj.msgContent.indexOf("[4,") == 0) //群通知
					{
						sendName = "群通知";
					} else {
						returnObj.MsgType = 0;
						sendName = returnObj.SendName;

						if (view && view.isVisible() && returnObj.SendID != user.UserID) {
							YunIM.EV_msgRead(obj.version);
							isLocalPush = false;
						}
					}
				}

				isLocalPush && !returnObj.isSync && (YunIM.createLocalMessage(sendName, obj.msgContent));

				if (YunIM.IsBackgroundRun && !returnObj.issend) { //如果在后台运行，则播放声音
					YunIM.Play_MsgSound();
				}

				try {
					//激活各个子页的消息接收服务
					dom.im.RPC_ReceiveMessage(returnObj);
				} catch (e) {}
			}
		},

		/**
		 * 创建本地通知
		 * @param {Object} chatusername
		 * @param {Object} contentType
		 * @param {Object} content
		 */
		createLocalMessage: function (chatusername, content) {
			//YunIM.NoReadCount += 1;
			clearTimeout(YunIM.NoticeID);
			if (mui.os.android) {
				plus.push.clear();
			} else {
				plus.Push.clearAllLocalNotificationsIniOS();
			}

			YunIM.NoticeID = setTimeout(function () {
				//plus.Push.setBadgeNumber(0);

				var text = chatusername + "：" + transMessage.trans(content, 2);
				text = text.replace(/<div>/g, "").replace(/<\/div>/g, "")
				if (YunIM.NoReadCount > 1) {
					if (mui.os.android) {
						// plus.push.createMessage(text, "openRecentMsg", {
						// 	title: YunIM.NoReadCount + " 条新消息"
						// });
						plus.Push.addLocalNotification("mdt", text, YunIM.NoReadCount + " 条新消息");
					} else {
						//	plus.push.createMessage("您已收到 " + YunIM.NoReadCount + " 条新消息")
						plus.Push.addLocalNotificationIniOS(0, "您已收到 " + YunIM.NoReadCount + " 条新消息", 0, YunIM.NoticeID, {});
					}
				} else {
					if (mui.os.android) {
						// plus.push.createMessage(text, "openRecentMsg", {
						// 	title: "1 条新消息"
						// });

						plus.Push.addLocalNotification("mdt", text, "1 条新消息");
					} else {
						plus.Push.addLocalNotificationIniOS(0, text, 0, YunIM.NoticeID, {});
					}
				}

			}, 500);
		},

		/**
		 * 推送到通知栏的标识符
		 */
		NoticeID: 0,
		/**
		 * 未读消息数量
		 */
		NoReadCount: 0,
		/**
		 * 程序是否在后台运行
		 */
		IsBackgroundRun: false,

		/**
		 * 发送消息
		 * @param {Object} receiver 接收人
		 * @param {Object} receiverName 接收人姓名 || 迈迪通号
		 * @param {Object} msgtext 消息内容
		 * @param {Object} msgtype 消息类型：1文本 2工单 3链接 4产品 20图文 30纯图 31语音 32文件 33视频 
		 * @param {Object} callback 回调函数：其中sendState：0创建消息 1发送失败 2发送成功
		 * @param {Object} uploadMethod 上传图片、语音等内容的方法
		 * @param {Object} isread 发给对方的消息是未读状态，还是默认已经已读
		 */
		EV_saveMsg: function (input, finish) {
			//定义消息结构
			var msgpack = {
				MT: input.msgtype || 1,
				CT: input.msgtext || "",
				IR: input.isread || 0
			};

			//保存并发送消息
			saveChatContent(input.receiver, input.receiverName, new Date(), msgpack, 1, 1, '', function (tx, result, resultType) {
				if (resultType == 1 && finish) {
					finish({
						msgid: result.insertId,
						chatuser: input.receiver,
						chattime: new Date(),
						chattext: input.msgtext,
						msgtype: input.msgtype,
						issend: true,
						isread: 0,
						sendstate: 0
					});
				} else {
					mui.toast("消息存储失败！" + result);
				}
			});
		},

		/**
		 * 重新发送消息
		 * @param {Object} msgid 需要重新发送的消息的编号
		 */
		EV_sendMsg: function (msg, isGroup) {

			//定义消息结构
			var obj = new RL_YTX.MsgBuilder();
			obj.setText(msg.Content);
			obj.setType(1);
			obj.setReceiver(msg.ReceiveID + '');
			var domain;
			isGroup && (domain = JSON.stringify({
				reName: msg.RemarkName,
				GroupName: msg.GroupName
			}));
			!isGroup && (domain = JSON.stringify({
				hasLogo: msg.chatLogo,
				reName: msg.RemarkName,
				compId: msg.ReceiveCompID
			}));
			obj.setDomain(domain);
			msg.isSync = true;
			RL_YTX.sendMsg(obj, function (e) {
				//更改消息时间
				msg.SendTime = new Date().Format("yyyy-MM-dd HH:mm:ss");
				msg.SendState = 2; //发送成功
				msg.msgClientNo = e.msgClientNo.replace('|', '-');
				if(msg.Content.indexOf('[0,[[1,"#WITHDRAW_MSGID_')<0)
				{
					!msg.IsNotice && (dom.im.RPC_ReceiveMessage(msg));
				}
				
			}, function (e) {
				//如果失败的原因是需要重新登录
				if (e.code == 170003 || e.code == "174002") {
					YunIM.Do_Login(true);
				}
				//重发2次
				YunIM.EV_autoResendMsg(1, msg, obj);
			});
		},

		/**
		 * 失败后自动重发消息
		 * @param {Object} obj
		 */
		EV_autoResendMsg: function (times, msg, obj) {
			if (times > 2) {
				msg.SendState = 1;
				!msg.IsNotice && (dom.im.RPC_ReceiveMessage(msg))
				return;
			}
			setTimeout(function () {
				RL_YTX.sendMsg(obj, function (e) {
					msg.SendState = 2;
					msg.SendTime = new Date().Format("yyyy-MM-dd HH:mm:ss");
					!msg.IsNotice && (dom.im.RPC_ReceiveMessage(msg))
				}, function (e) {
					//如果失败的原因是需要重新登录
					if (e.code == 170003) {
						YunIM.Do_Login(true);
					}
					//失败继续重发
					YunIM.EV_autoResendMsg(times + 1, msg, obj);
				});
			}, 800);
		},
		readVersion: "",
		/**
		 * 设置消息已读
		 * **/
		EV_msgRead: function (version) {
			YunIM.readVersion = version;
			var msgReadBuilder = new RL_YTX.MsgReadBuilder();
			msgReadBuilder.setVersion(version);
			RL_YTX.msgRead(msgReadBuilder, function (e) {}, function (e) {
				YunIM.EV_msgRead(YunIM.readVersion)
			});
		},
		/**
		 * 获取当前时间戳 YYYYMMddHHmmss
		 * @return {[type]} [description]
		 */
		_getTimeStamp: function () {
			var now = new Date();
			var timestamp = now.getFullYear() + '' + ((now.getMonth() + 1) >= 10 ? "" + (now.getMonth() + 1) : "0" + (now.getMonth() + 1)) + (now.getDate() >= 10 ? now.getDate() : "0" + now.getDate()) + (now.getHours() >= 10 ? now.getHours() : "0" + now.getHours()) + (now.getMinutes() >= 10 ? now.getMinutes() : "0" + now.getMinutes()) + (now.getSeconds() >= 10 ? now.getSeconds() : "0" + now.getSeconds());
			return timestamp;
		},

		/**
		 * 播放消息接收声音
		 */
		Play_MsgSound: function () {
			plus.audio.createPlayer("wav/msg.wav").play();
		}
	};
})();