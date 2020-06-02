app.controller("GroupInfoController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "ChatUserService", "$Modal", "CacheService", "TapService", function($scope, ApiService, DataService, UtilsService, Loading, ChatUserService, $Modal, CacheService, TapService) {
	$scope.domData = {
		GroupName: "",
		GroupCode: "",
		GroupInfo: "",
		GroupUsers: "",
		UserID: "",
		MemberName: "",
		QuitBtnTxt: "退出该群"
	};

	//屏蔽类型

	$scope.repeats = {
		0: '否',
		1: '是',
	};

	var repeats = [{
		id: 0,
		title: "否"
	}, {
		id: 1,
		title: "是"
	}];

	var user = CacheService.get("user", true);
	$scope.domData.UserID = user.data.UserID;

	//获取参数
	var cur = plus.webview.currentWebview();
	$scope.domData.GroupName = cur.GroupName;
	$scope.domData.GroupCode = cur.GroupCode;

	$scope.event = {
		personInfo: function(userId) {
			var url = "../contact/personal-info.html?userid=" + userId;
			var id = "personal-info.html";

			if(userId == $scope.domData.UserID) {
				url = "../mine/personal-information.html";
				id = "personal-information.htm";
			}

			UtilsService.openWindow({
				needLogin: true,
				id: id,
				url: url
			});
		},
		openGroupManage: function() {
			var url = "group-user-list.html";
			UtilsService.openWindow({
				needLogin: true,
				id: "group-user-list.html",
				url: url,
				extras: {
					GroupCode: $scope.domData.GroupCode,
					GroupID: $scope.domData.GroupInfo.ID,
					MyRole: $scope.domData.GroupInfo.MyRole,
					GroupUsers: $scope.domData.GroupUsers
				}
			});
		},
		openRecord: function() {
			var url = "chat-group-record.html";
			UtilsService.openWindow({
				needLogin: true,
				id: "chat-group-record.html",
				url: url,
				extras: {
					GroupCode: $scope.domData.GroupCode,
					GroupName: $scope.domData.GroupName
				}
			});
		},
		openMemberView: function() {
			var url = "chat-group-memberName.html";
			UtilsService.openWindow({
				needLogin: true,
				id: "chat-group-memberName.html",
				url: url,
				extras: {
					needLogin: true,
					GroupID: $scope.domData.GroupInfo.ID,
					UserID: $scope.domData.UserID,
					MemberName: $scope.domData.MemberName,
					GroupCode: $scope.domData.GroupCode
				}
			});
		},
		//屏蔽群消息
		/*ShieldMessage: function() {
			UtilsService.actionSheet("消息免打扰", repeats).then(function(res) {
				if(res.id == $scope.domData.GroupInfo.IsSilence) {
					return
				} else {
					var url = ApiService.Api50 + "/api/v1/Message/SilenceGroup?groupId=" + $scope.domData.GroupInfo.ID + '&isSilence=' + res.id;
					DataService.post(url).then(function(result) {
						$scope.domData.GroupInfo.IsSilence = res.id;
						$scope.domData.GroupInfo.IsSilence == 0 ? $scope.IsSilence = '否' : $scope.IsSilence = '是';
						RpcClient.invoke("message.html", "Rpc_GroupSilence", {
							GroupCode: $scope.domData.GroupCode,
							IsSilence: $scope.domData.GroupInfo.IsSilence
						});
					}, function(err) {

					})
				}

			});
		},*/
		isQuitClick: false,
		quit: function() {
			if($scope.event.isQuitClick) return;
			mui.confirm('是否' + $scope.domData.QuitBtnTxt + "?", "提示", ['是', '否'], function(e) {
				if(e.index == 0) {
					$scope.event.isQuitClick = true;
					//MyRole :  0创建者 1 管理员 2 普通成员
					curData.quitGroup();
				}
			});

		},
		// 邀请  添加群成员
		selectMember: function() {
			event && event.stopPropagation();
			UtilsService.openWindow({
				needLogin: true,
				id: "contact-select.html",
				url: "../common/contact-select.html?action=select&multiselect=true&must=true",
				extras: {
					selectObj: [],
					bannedUsers: $scope.domData.GroupUsers,
					callback: "selectWorkUserCallback"
				}
			})
		},
		// 选择人员之后调用
		saveAddMember: function(allUsers) {
			// 获取所有userid
			var userids = []
			allUsers.forEach(function(user) {
				userids.push(user.UserID)
			});
			Loading.show()
			var mebUrl = ApiService.Api50 + "/api/v1/Message/GroupMemberAdd_Manage?groupId=" + $scope.domData.GroupInfo.ID;
			DataService.post(mebUrl, userids).then(function(result) {
				Loading.hide()
				if(result.failUserIds && result.failUserIds.length === 0) {
					// 赋值
					// $scope.domData.GroupUsers = allUsers;

					//$scope.domData.GroupUsers = $scope.domData.GroupUsers.concat(allUsers)

					curData.getGroupInfo();

					// 跳转到聊天页面
					mui.toast("邀请成功！")
				} else {
					mui.alert("邀请失败，以下人员：" + result.failUserNames.join() + "不能被添加入群")
				}

			}, function(err) {
				Loading.hide()
				// mui.alert("邀请失败，错误信息：" + err)
			})
		},
		openGroupQrCode:function(){
			UtilsService.openWindow({
				needLogin: true,
				id: "group-qrcode.html",
				url: "group-qrcode.html",
				extras: {
					groupInfo:$scope.domData.GroupInfo
				}
			})
		}
	};
	
	var curData = {
		//获取群详情
		getGroupInfo: function(callback) {
			var url = ApiService.Api50 + "/api/v1/Message/GroupInfo?groupCode=" + $scope.domData.GroupCode;

			DataService.get(url).then(function(data) {
				if(data) {
					$scope.domData.GroupInfo = data;
					$scope.domData.GroupInfo.IsSilence == 0 ? $scope.IsSilence = '否' : $scope.IsSilence = '是';
					$scope.domData.GroupUsers = data.Members.filter(function(_item) {
						_item.ViewName = _item.MemberName ? _item.MemberName : _item.ViewName;
						return true;
					});

					var curUser = data.Members.filter(function(_item) {
						return _item.UserID == $scope.domData.UserID;
					})[0];

					$scope.domData.MemberName = curUser.MemberName || curUser.ViewName;

					data.MyRole == 0 && ($scope.domData.QuitBtnTxt = "解散该群");

					typeof callback == "function" && callback();
				}
			});
		},

		//解散群组
		quitGroup: function() {
			//是创建者则解散该群 不是创建者则退出该群
			var url = ApiService.Api50 + "/api/v1/Message/GroupDel?groupId=" + $scope.domData.GroupInfo.ID;
			if($scope.domData.GroupInfo.MyRole != 0) {
				url = ApiService.Api50 + "/api/v1/Message/GroupMemberDel_Self?groupId=" + $scope.domData.GroupInfo.ID;
			}

			DataService.post(url).then(function(res) {
				if($scope.domData.GroupInfo.MyRole != 0) {
					//解散群组成功
					RpcClient.invoke("message.html", "RPC_QuitGroup", {
						GroupCode: $scope.domData.GroupCode,
						Message: "您已经退出" + $scope.domData.GroupName
					});
				}

				mui.back();
			}, function(res) {
				$scope.event.isQuitClick = false;
				mui.toast("操作失败！错误：" + res.ErrorMessage);
			});
		}
	};

	var service = {
		init: function() {
			this.Rpc_refreshMemberName();
			this.Rpc_refreshGroup();
		},
		Rpc_refreshMemberName: function() {
			RpcServer.expose("Rpc_refreshMemberName", function(_data) {
				var curUser = $scope.domData.GroupUsers.find(function(_item) {
					if(_item.UserID == _data.UserID) {
						_item.ViewName = _item.MemberName = _data.MemberName;
					}

					return _item.UserID == $scope.domData.UserID;
				});

				$scope.domData.MemberName = curUser.MemberName || curUser.ViewName;

				$scope.$apply();
			});
		},
		Rpc_refreshGroup: function() {
			RpcServer.expose("Rpc_refreshGroup", function(_data) {
				curData.getGroupInfo(function() {
					var view = plus.webview.getWebviewById("group-user-list.html");
					view && view.GroupCode == $scope.domData.GroupCode && (RpcClient.invoke(view.id, "Rpc_refreshGroup", $scope.domData.GroupUsers))
				});
			});
		}
	};

	service.init();
	curData.getGroupInfo();
	mui.init({
		swipeBack: true //启用右滑关闭功能
	});
	document.getElementById("mySwitch").addEventListener("toggle", function(event) {
		if(event.detail.isActive) {
			
			var url = ApiService.Api50 + "/api/v1/Message/SilenceGroup?groupId=" + $scope.domData.GroupInfo.ID + '&isSilence=1';
					DataService.post(url).then(function(result) {
						mui.toast("已设置免打扰");
						$scope.domData.GroupInfo.IsSilence=1;
						RpcClient.invoke("message.html", "Rpc_GroupSilence", {
							GroupCode: $scope.domData.GroupCode,
							IsSilence: $scope.domData.GroupInfo.IsSilence
						});
					}, function(err) {

					})
		} else {
			
			var url = ApiService.Api50 + "/api/v1/Message/SilenceGroup?groupId=" + $scope.domData.GroupInfo.ID + '&isSilence=0';
					DataService.post(url).then(function(result) {
						mui.toast("已取消免打扰");
						$scope.domData.GroupInfo.IsSilence=0;
						RpcClient.invoke("message.html", "Rpc_GroupSilence", {
							GroupCode: $scope.domData.GroupCode,
							IsSilence: $scope.domData.GroupInfo.IsSilence
						});
					}, function(err) {

					})
		}
	});
	

}]);

//选择人员后回调
function selectWorkUserCallback(arr) {
	if(arr.length === 0) return
	var appElement = document.querySelector('[ng-controller=GroupInfoController]');
	var $scope = angular.element(appElement).scope();
	//var allUsers = $scope.domData.GroupUsers.concat(arr)
	$scope.event.saveAddMember(arr)
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});