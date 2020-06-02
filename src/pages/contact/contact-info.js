app.controller("UserInfoController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "ChatUserService", "$Modal", "CacheService", "TapService", "RPCObserver", function($scope, ApiService, DataService, UtilsService, Loading, ChatUserService, $Modal, CacheService, TapService, RPCObserver) {
	//当前登录用户
	var loginUser = CacheService.get('user');

	$scope.loginUser = loginUser;
	$scope.Loaded = false;
	//用户id
	$scope.userid = query("userid");
	//人员跳转查看页面 传入参数控制是否显示右上角更多
	$scope.type = query("type");
	//要加入的企业id
	$scope.compid = query("compid");
	//是详情还是添加
	$scope.source = query("source") || false;
	//用户信息
	$scope.user = {};
	init();

	//初始化
	function init() {
		Loading.show();
		setTimeout(function() {
			var url = ApiService.Api50 + "/api/v1/User/GetUserInfo?userId=" + $scope.userid;
			DataService.get(url).then(function(res) {
				if(res) {
					$scope.user = res;
					$scope.Loaded = true;
				}
				Loading.hide();
			})
		}, 300);
	}
	//弹窗
	$scope.tap = function(key) {
		switch(key) {
			case 'edit':
				UtilsService.openWindow({
					id: "personal-edit.html",
					url: "../work/personal-edit.html?userid=" + $scope.userid
				});
				break;
			case 'del':
				//删除
				mui.confirm("确认删除吗？", function(e) {
					if(e.index == 0) {
						var url = ApiService.Api50 + "/api/v1/User/DelUser?userId=" + $scope.userid;
						DataService.get(url).then(function(res) {
							RpcClient.invoke("org.html", "RPC_OrgDelectInfo", {
								"state": "del",
								"id": $scope.userid
							});
							//联系人页面刷新
							RpcClient.invoke("contactWind", "RPC_ContactOrgRefresh");
							mui.back();
						});
					}
				});
				break;
			case 'changephone':
				UtilsService.openWindow({
					id: "personal-changephone.html",
					url: "../mine/personal-changephone.html"
				});
				break;
			case 'tel':
				plus.device.dial($scope.user.Phone, false);
				break;
			default:
				break;
		}
	};
	$scope.gotoComp = function(compid) {
		TapService.openCoInfo(compid);
	}

	//加好友
	$scope.addFriend = function(userid) {
		UtilsService.openWindow({
			id: 'addRes.html',
			url: 'addRes.html?userid=' + $scope.userid + "&RealName=" + encodeURI($scope.user.ViewName),
			extras: {
				callback: 'saveResourceCB'
			}
		});
	}
	$scope.addComp = function() {
		if(!$scope.user.CompID) {
			mui.confirm("当前联系人不属于任何企业，确定要添加为企业联系人吗？", "提示", ["取消", "确定"], function(e) {
				if(e.index == 1) {
					addFriend("1");
				}
			});
		} else {
			addFriend("1");
		}
	};
	$scope.addPersonal = function() {
		addFriend("2");
	};
	//添加联系人 1企业、2个人
	function addFriend(type) {
		$scope.addType = type;
		//先判断所属企业是否在资源内
		if($scope.user.CompID) {
			var url_ = ApiService.Api50 + "/api/v1/Comp/GetAuthCompInfo?compId=" + $scope.user.CompID;
			DataService.get(url_).then(function(res) {
				if(res) {
					$scope.IsMyRes = res.IsMyRes;
					if(!res.IsMyRes) {
						//不再则提示
						mui.confirm("当前联系人所属企业不在资源里，是否先将企业加为资源？", "提示", ["取消", "确定"], function(e) {
							if(e.index == 1) {
								//跳转加为资源
								UtilsService.openWindow({
									id: 'addRes.html',
									url: '../complib/addRes.html?compId=' + $scope.user.CompID,
									extras: {
										callback: 'saveCallBack'
									}
								});
							}
						});
					} else {
						//走接口complib-index.html
						var url = ApiService.Api50 + "/api/v1/Comp/SaveLinkman";
						var _data = {
							"LinkUserID": $scope.userid,
							"LinkType": type,
							"LinkCompID": $scope.compid
						};
						DataService.post(url, _data).then(function(res) {
							mui.toast("添加成功！");
							//刷新联系人页面service.html
							RpcClient.invoke("service.html-sub3", "RPC_RefreshFriends", type);
							mui.back();
						}, function(res) {});
					}
				}
				Loading.hide();
			})
		} else {
			//走接口complib-index.html
			var url = ApiService.Api50 + "/api/v1/Comp/SaveLinkman";
			var _data = {
				"LinkUserID": $scope.userid,
				"LinkType": type,
				"LinkCompID": $scope.compid
			};
			DataService.post(url, _data).then(function(res) {
				mui.toast("添加成功！");
				//刷新联系人页面service.html
				RpcClient.invoke("service.html-sub3", "RPC_RefreshFriends", type);
				mui.back();
			}, function(res) {});
		}

		//		if($scope.user.CompID && ) {
		//			//不再则提示
		//			mui.confirm("当前联系人所属企业不在资源里，是否先将企业加为资源？", "提示", ["取消", "确定"], function(e) {
		//				if(e.index == 1) {
		//					//跳转加为资源
		//					UtilsService.openWindow({
		//						id: 'addRes.html',
		//						url: '../complib/addRes.html?compId=' + $scope.user.CompID,
		//						extras: {
		//							callback: 'saveCallBack'
		//						}
		//					});
		//				}
		//			});
		//		} else {
		//			//走接口complib-index.html
		//			var url = ApiService.Api50 + "/api/v1/Comp/SaveLinkman";
		//			var _data = {
		//				"LinkUserID": $scope.userid,
		//				"LinkType": type,
		//				"LinkCompID": $scope.compid
		//			};
		//			DataService.post(url, _data).then(function(res) {
		//				mui.toast("添加成功！");
		//				//刷新联系人页面service.html
		//				RpcClient.invoke("service.html-sub3", "RPC_RefreshFriends", type);
		//				mui.back();
		//			}, function(res) {});
		//		}
	};
	window.saveCallBack = function(res) {
		//走接口complib-index.html
		var url = ApiService.Api50 + "/api/v1/Comp/SaveLinkman";
		var _data = {
			"LinkUserID": $scope.userid,
			"LinkType": $scope.addType,
			"LinkCompID": $scope.user.CompID
		};
		DataService.post(url, _data).then(function(res) {
			mui.toast("添加成功！");
			//刷新联系人页面service.html
			RpcClient.invoke("service.html-sub3", "RPC_RefreshFriends", $scope.addType);
			mui.back();
		}, function(res) {});
	}
	//删除好友
	$scope.delFriend = function(userid) {
		mui.confirm("确定要删除此资源吗", "确认", ["取消", "确定"], function(res) {
			if(res.index == 1) {
				Loading.show();
				var url = ApiService.Api50 + "/api/v1/Resource/ResourceDel?resourceId=" + $scope.user.ResID;
				DataService.post(url).then(function(res) {
					if(res) {
						$scope.user.ResID = "";
						//$scope.user.GroupID = "";
						$scope.user.GroupName = "";
						$scope.user.RemarkName = "";

						RpcClient.invoke("sourceWind", "RPC_RefreshResource", $scope.user.GroupID);
						RpcClient.invoke("compWind", "RPC_RefreshResource", "-1");
						RpcClient.invoke("friendWind", "RPC_RefreshResource", "-9");

						//组织机构页面刷新
						RpcClient.invoke("org.html", "RPC_RefreshUserInfo");
						//联系人页面刷新
						RpcClient.invoke("contactWind", "RPC_ContactOrgRefresh");
						RpcClient.invoke("search-user.html", "RPC_SearchUserListRefresh");
						RpcClient.invoke("search-resource.html", "RPC_SearchUserListRefresh");

						//刷新搜索页面
						RpcClient.invoke("search.html", "RPC_SearchListRefresh");
						//刷新联系人搜索页面
						RpcClient.invoke("contact-search.html", "RPC_SearchUserListRefresh");

						var viewName = $scope.user.UserName || $scope.user.RealName || $scope.user.Mdt;

						$scope.loginUser.CompID == $scope.user.CompID && $scope.loginUser.CompID > 0 && (viewName = $scope.user.RealName || $scope.user.UserName || $scope.user.Mdt);

						//刷新 聊天页面以及消息页面的昵称
						RPCObserver.broadcast('refresh_chat_viewName', {
							UserID: $scope.userid,
							RemarkName: viewName
						});

						//删除需要获取原始名称
						init();
					}
					Loading.hide();
				})
			}
		})
		event.stopPropagation();
		return false;
	}

	//发消息
	$scope.sendMsg = function(userid, userName, hasLogo, compId) {
		ChatUserService.tap({
			chatId: userid,
			chatName: userName,
			hasLogo: hasLogo,
			chatCompId: compId
		});
	};
	//详情分享
	$scope.goMatFaultShare = function(type) {
		UtilsService.openWindow({
			needLogin: true,
			id: "contact-select.html",
			url: "../common/contact-select.html?action=select&must=true&multiselect=true&hideself=true",
			extras: {
				selectObj: [],
				callback: 'shareEqu'
			}
		});
	};
	$scope.doMatFaultShare = function(sltUsers) {
		var obj = {
			id: $scope.user.UserID,
			img: ApiService.Pic + '/dXNlci9sb2dv_' + $scope.user.UserID + '_100x100.png',
			title: $scope.user.UserName || $scope.user.Mdt,
			desc: $scope.user.CompID > 0 ? (($scope.user.CompName || "") + " " + ($scope.user.OrgName || "")) : ($scope.user.Phone || "")
		}
		//	UtilsService.shareMsg(obj, sltUsers).then(function () {

		var userNames = [];
		sltUsers.forEach(function(user) {

			userNames.push(user.ViewName);

			ChatUserService.send({
				chatId: user.UserID,
				chatName: user.ViewName,
				chatCompId: user.EquipmentID,
				hasLogo: loginUser.ULogoIsExist,
				chatLogo: user.ULogoIsExist,
				type: 7,
				content: {
					eventName: "user-card",
					logo: ApiService.Pic + '/dXNlci9sb2dv_' + $scope.user.UserID + '_100x100.png',
					title: $scope.user.UserName || $scope.user.Mdt,
					desc: $scope.user.CompID > 0 ? (($scope.user.CompName || "") + " " + ($scope.user.OrgName || "")) : ($scope.user.Phone || ""),
					params: [$scope.user.UserID, $scope.user.ULogoIsExist]

				}

			})

			mui.toast("成功分享给：" + userNames.join("，"));

		})

		//});
	};
	window.shareEqu = function(sltObjs) {
		$scope.doMatFaultShare(angular.copy(sltObjs));
	};
	$scope.editRemark = function() {
		UtilsService.openWindow({
			id: 'editRemark.html',
			url: 'editRemark.html?RemarkName=' + $scope.user.RemarkName + '&ResID=' + $scope.user.ResID + "&UserID=" + $scope.userid,
			extras: {
				callback: 'saveRemark'
			}
		});
	}

	$scope.editGroup = function() {
		UtilsService.openWindow({
			id: 'select-resPacket.html',
			url: '../contact/select-resPacket.html?type=2',
			extras: {
				selectObj: {
					id: $scope.user.GroupID,
					name: $scope.user.GroupName
				},
				callback: 'saveGroupCB'
			}
		});
	}

	$scope.saveGroup = function() {
		var url = ApiService.Api50 + "/api/v1/Resource/ResourceUpdateGroup?resourceId=" + $scope.user.ResID + "&groupId=" + $scope.user.GroupID;
		DataService.post(url).then(function(res) {
			RpcClient.invoke("sourceWind", "RPC_RefreshResource", $scope.user.GroupID);
			RpcClient.invoke("compWind", "RPC_RefreshResource", $scope.user.GroupID);
			RpcClient.invoke("friendWind", "RPC_RefreshResource", $scope.user.GroupID);
		});
	}
	//rpc 刷新页面信息
	RpcServer.expose("RPC_PersonInfoRefresh", function() {
		init();
	});
}]);

function saveResourceCB(res) {
	var appElement = document.querySelector('[ng-controller=UserInfoController]');
	var $scope = angular.element(appElement).scope();
	$scope.user.ResID = res.ResID;
	$scope.user.GroupID = res.GroupID;
	$scope.user.GroupName = res.GroupName;
	if(res.RemarkName != '') {
		$scope.user.RemarkName = res.RemarkName;
		$scope.user.ViewName = res.RemarkName;
	}
	$scope.$apply();
	mui.toast("添加资源成功！");
	RpcClient.invoke("org.html", "RPC_RefreshUserInfo");
	RpcClient.invoke("sourceWind", "RPC_RefreshResource", $scope.user.GroupID);
	RpcClient.invoke("compWind", "RPC_RefreshResource", $scope.user.GroupID);
	RpcClient.invoke("friendWind", "RPC_RefreshResource", $scope.user.GroupID);
	RpcClient.invoke("contactWind", "RPC_ContactOrgRefresh");
	//刷新搜索页面
	RpcClient.invoke("search-user.html", "RPC_SearchUserListRefresh");
	RpcClient.invoke("search-resource.html", "RPC_SearchUserListRefresh");

	RpcClient.invoke("search.html", "RPC_SearchListRefresh");
	//刷新联系人搜索页面
	RpcClient.invoke("contact-search.html", "RPC_SearchUserListRefresh");
}

function saveRemark(res) {
	var appElement = document.querySelector('[ng-controller=UserInfoController]');
	var $scope = angular.element(appElement).scope();
	$scope.user.RemarkName = res;
	if(res != '') $scope.user.ViewName = res;
	$scope.$apply();
	RpcClient.invoke("sourceWind", "RPC_RefreshResource", $scope.user.GroupID);
	RpcClient.invoke("compWind", "RPC_RefreshResource", $scope.user.GroupID);
	RpcClient.invoke("friendWind", "RPC_RefreshResource", $scope.user.GroupID);
	//联系人页面刷新
	RpcClient.invoke("contactWind", "RPC_ContactOrgRefresh");

	//组织架构页面刷新
	RpcClient.invoke("org.html", "RPC_RefreshUserInfo");
	RpcClient.invoke("search-user.html", "RPC_SearchUserListRefresh");
	RpcClient.invoke("search-resource.html", "RPC_SearchUserListRefresh");

	//刷新搜索页面
	RpcClient.invoke("search.html", "RPC_SearchListRefresh");
	//刷新联系人搜索页面
	RpcClient.invoke("contact-search.html", "RPC_SearchUserListRefresh");
}

function saveGroupCB(res) {
	var appElement = document.querySelector('[ng-controller=UserInfoController]');
	var $scope = angular.element(appElement).scope();
	$scope.user.GroupID = res.id;
	$scope.user.GroupName = res.groupname;
	$scope.saveGroup();
	$scope.$apply();
	RpcClient.invoke("friendWind", "RPC_RefreshResource", "-1");

}
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});