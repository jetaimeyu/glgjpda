app.controller("RepairViewController", ["$scope", "$filter", "ApiService", "DataService", "UtilsService", "Loading", "ChatUserService", "RPCObserver", "ShareLogService", "CacheService", function ($scope, $filter, ApiService, DataService, UtilsService, Loading, ChatUserService, RPCObserver, ShareLogService, CacheService) {
	//上传音频
	$scope.audio = {
		"FileGuid": "",
		"FileName": "",
		"FileExt": "",
		"FilePath": "",
		"FileSize": 0,
		"FileType": 0
	};
	var curUser = CacheService.get("user");
	$scope.repairInfo = {
		'ArriveDate': ""
	}
	//发消息
	$scope.CurUserID = curUser.UserID;
	$scope.sendMsg = function (userid, userName, hasLogo, compId) {
		ChatUserService.tap({
			chatId: userid,
			chatName: userName,
			hasLogo: hasLogo,
			chatCompId: compId
		});
	};
	//景津定制
	$scope.ISJJComp = curUser.CompID == 266;
	$scope.repairId = query("id");
	//无网络或请求失败重试,或已删除
	$scope.retryModal = {
		msg: "故障维修",
		retry: init,
		state: ''
	}
	var logid = query("logid") || 0;
	$scope.users = ""; //抄送人员
	$scope.videoList = []; //上传视频
	$scope.imageList = []; //上传图片

	$scope.exist = false;
	//底部状态
	$scope.bar = [{
		text: '工作报告',
		fn: function () {
			UtilsService.openWindow({
				needLogin: true,
				id: 'state-mark.html',
				url: '../common/state-mark.html',
				extras: {
					ID: $scope.repairInfo.MatWordOrderFailureID,
					key: "fault",
					do: "report",
					RepairID: $scope.repairId,
					IsHasAudio: $scope.repairInfo.IsHasAudio,
					AudioLength: $scope.repairInfo.AudioLength,
					RepairDescription: $scope.repairInfo.RepairDescription
				}
			});
		}
	},
	{
		text: '配件更换',
		fn: function () {
			$scope.partReplace();
		}
	}
	];
	$scope.ISJJComp && $scope.bar.push({
		text: '工单下载',
		fn: function () {
			downloadOrder();
		}
	})

	if (!$filter("hasAuth")(['Q25'])) {
		$scope.bar.splice(1, 1)
	}
	$scope.repairUsers = "";
	$scope.fileName = "";
	init();

	function init () {
		Loading.show();
		getEqRepairRecords();
		LocalFileExist();
		logid && ShareLogService.add(logid, 6);
	}

	var serverPath = ApiService.Api50 + "/api/v1/MatWorkOrder/ExportRepairExcel?matRepairId=" + $scope.repairId;
	var localPath = "_doc/RepairOrder/" + $scope.repairInfo.CustomerName + $scope.repairInfo.SkuName + $scope.repairUsers + $filter("formatDate")($scope.repairInfo.LeaveDate) + ".pdf";
	//下载文件
	function downloadOrder () {
		mui.toast("正在下载...");
		Loading.show();
		downloadFile(serverPath, localPath, function (localfile, status) {
			Loading.hide();
			if (status == 200) {
				mui.toast("下载成功");
				plus.io.resolveLocalFileSystemURL(localPath, function (entry) {
					$scope.exist = true;
					$scope.$apply();
					plus.runtime.openFile(localPath, {
						top: 10,
						left: 10,
						width: 200,
						height: 200
					}, function (e) {
						mui.toast("无法打开此文件！");
					});
				}, function () {
					$scope.exist = false;
					$scope.$apply();
				});
			} else {
				mui.toast("下载失败");
			}
		})
	}

	//打开文件
	$scope.openFile = function () {
		plus.io.resolveLocalFileSystemURL(localPath, function (entry) {
			plus.runtime.openFile(localPath, {
				top: 10,
				left: 10,
				width: 200,
				height: 200
			}, function (e) {
				mui.toast("无法打开此文件！");
			});
		}, function () { });
	}

	function LocalFileExist () {
		plus.io.resolveLocalFileSystemURL(localPath, function (entry) {
			$scope.exist = true;
			$scope.$apply();
		}, function () {
			$scope.exist = false;
			$scope.$apply();
		});
	}

	function getEqRepairRecords () {
		var url = ApiService.Api52 + "/api/v1/MatWorkOrder/GetMatRepairRecords?repairId=" + $scope.repairId;
		logid && (url += '&logid=' + logid);
		DataService.get(url).then(function (res) {
			$scope.retryModal.state = '';
			Loading.hide();
			$scope.isLoad = true;
			if (res) {
				$scope.repairInfo = res;
				if (res.ArriveDate && res.LeaveDate) {
					$scope.repairInfo.ArriveDate = res.ArriveDate.slice(0, 16)
					$scope.repairInfo.LeaveDate = res.LeaveDate.slice(0, 16)
				}

				$scope.repairUsers = $scope.repairInfo.RepairUsers.map(function (item) {
					return item.RealName || item.Name;
				}).join(',');
				$scope.users = res.SendUsers; //抄送人员
				$scope.fileName = $scope.repairInfo.CustomerName + $scope.repairInfo.SkuName + $scope.repairUsers + $filter("formatDate")($scope.repairInfo.LeaveDate) + "维修";
				localPath = "_doc/RepairOrder/" + $scope.fileName + ".pdf";
			}
		}, function (error) {
			$scope.retryModal.state = error.State;
		})
	}

	$scope.tap = function (type, id) {
		$scope.$broadcast("stop_audio");
		switch (type) {
			//故障内容
			case "faultInfo":
				UtilsService.openWindow({
					needLogin: true,
					id: "mat-fault-info.html",
					url: "mat-fault-info.html?id=" + id
				});
				break;
			//配件更换详情
			case "partInfo":
				UtilsService.openWindow({
					needLogin: true,
					id: "mat-part-info.html",
					url: "mat-part-info.html?id=" + id
				});
				break;
			//产品详情
			case "prodinfos":
				if (id && $scope.repairInfo.MDCode) {
					UtilsService.openWindow({
						needLogin: true,
						id: 'prodinfo-head.html',
						url: '../problib/prodinfo-head.html?prodId=' + id + "&SkuID=" + $scope.repairInfo.SkuID + "&MdCode=" + $scope.repairInfo.MDCode
					});
				} else {
					mui.toast("暂无故障设备信息");
				}
				break;
			default:
				break;
		}
	}
	//跳转配件更换
	$scope.partReplace = function () {
		UtilsService.openWindow({
			needLogin: true,
			id: "mat-part-edit.html",
			url: "mat-part-edit.html?id=0",
			extras: {
				mainData: {
					"MatRepairID": $scope.repairId,
					"MatWordOrderFailureID": $scope.repairInfo.MatWordOrderFailureID,
				}
			}
		});

		//		UtilsService.openWindow({
		//			needLogin: true,
		//			id: "mat-part-replacement.html",
		//			url: "mat-part-replacement.html?faultid=" + $scope.repairInfo.MatWordOrderFailureID + "&matid=" + $scope.repairInfo.ProdID + "&repairid=" + $scope.repairId,
		//			extras: {
		//				addMatRecord: {
		//					ID: $scope.repairInfo.MatWordOrderFailureID,
		//					ProdID: $scope.repairInfo.ProdID,
		//					ProdInnerCode: $scope.repairInfo.ProdInnerCode,
		//					ProdName: $scope.repairInfo.ProdName,
		//					SkuName: $scope.repairInfo.SkuName,
		//					IsHasAudio: $scope.repairInfo.FaultIsHasAudio,
		//					AudioLength: $scope.repairInfo.FaultAudioLength,
		//					Description: $scope.repairInfo.Description,
		//					RepairIsHasAudio: $scope.repairInfo.IsHasAudio,
		//					RepairAudioLength: $scope.repairInfo.AudioLength,
		//					RepairDescription: $scope.repairInfo.RepairDescription,
		//					RepairCreateDate: $scope.repairInfo.CreateDate
		//				}
		//			}
		//		});
	}
	$scope.edit = function () {
		mui('#popover').popover('toggle');
		$scope.$broadcast("stop_audio");
		UtilsService.openWindow({
			needLogin: true,
			id: 'mat-repair.html',
			url: 'mat-repair.html?id=' + $scope.repairId
		});
	};
	$scope.delectMain = function () {
		$scope.$broadcast("stop_audio");
		mui.confirm("确认删除吗？", function (e) {
			if (e.index == 0) {
				var url = ApiService.Api50 + "/api/v1/MatWorkOrder/DeleteMatRepairRecords?repairId=" + query("id");
				DataService.get(url).then(function (res) {
					//刷新 维修列表
					RPCObserver.broadcast('refresh_mat_repair_list');
					//刷新客户详情-合计 列表
					RPCObserver.broadcast("refresh_my_sxun");
					RpcClient.invoke("mat-fault-info.html", "RPC_FaultInfoListRefresh", {
						"state": "del",
						"id": query("id")
					});
					RpcClient.invoke("equ-repairList.html", "RPC_EquRepairListRefresh", {
						"state": "del",
						"id": query("id")
					});
					RpcClient.invoke("equ-details.html", "RPC_EquRepairRefresh");
					//刷新维修统计
					RpcClient.invoke("repair-statistics.html", "RefreshPage", {
						"state": "del",
						"id": query("id")
					});
					RpcClient.invoke("fault-trend.html", "RefreshPage");
					RpcClient.invoke("evalStatistics.html", "RefreshPage");
					// 客户信息刷新
					RpcClient.invoke("customer-info.html", "RPC_BillViewRefresh", "customer");

					var msgListView = plus.webview.getWebviewById("msg-list.html");

					if (msgListView) {
						RpcClient.invoke("msg-list.html", "RPC_UnreadRefreshForChat");
						RPCObserver.broadcast('refresh_msg_all_list');
					} else {
						RpcClient.invoke("work.html", "RefTodoCount");
					}

					mui('#popover').popover('hide');
					mui.back();
				}, function (error) {
					error.State == 2 && mui.toast(error.Data);
					mui('#popover').popover('hide');
				});
			} else {
				mui('#popover').popover('hide');
			}
		});
	}
	//刷新
	RPCObserver.on("RPC_RepairViewRefresh", "repairViewRefresh");
	window.repairViewRefresh = getEqRepairRecords;

	//配件更换 删除 的rpc
	RpcServer.expose("RPC_FaultDelectPactInfo", function (params) {
		if (params.state == "del") {
			var index = $scope.repairInfo.RepairParts.findIndex(function (item) {
				return item.ID == params.id;
			})
			if (index >= 0) {
				getEqRepairRecords();
			}
		}
	})
	//配件更换 修改 的rpc
	RpcServer.expose("RPC_FaultMaintenancePactInfo", function (params) {
		if (params.state == "main") {
			getEqRepairRecords();
		}
	});
	//刷新关闭popover
	RPCObserver.on('close_popover', 'close_popover');
	window.close_popover = function () {
		mui('#popover').popover('hide');
	};
	//详情分享
	$scope.goMatRepairShare = function (type) {
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

	$scope.doMatRepairShare = function (sltUsers) {
		var obj = {
			id: $scope.repairInfo.ID,
			img: ApiService.Down + "/chat/repair.png",
			title: "故障维修",
			desc: $filter("formatRepairInfo")($scope.repairInfo.IsHasAudio, $scope.repairInfo.AudioLength, $scope.repairInfo.RepairDescription),
			params: [$scope.repairInfo.repairId]
		}
		UtilsService.shareMsg(obj, sltUsers).then(function () {
			var userNames = [];
			sltUsers.forEach(function (user) {

				userNames.push(user.ViewName);

				ChatUserService.send({
					chatId: user.UserID,
					chatName: user.ViewName,
					chatCompId: user.CompID,
					hasLogo: curUser.ULogoIsExist,
					chatLogo: user.ULogoIsExist,
					type: 7,
					content: {
						eventName: "repair",
						logo: ApiService.Down + "/chat/repair.png",
						title: "故障维修",
						desc: $filter("formatRepairInfo")($scope.repairInfo.IsHasAudio, $scope.repairInfo.AudioLength, $scope.repairInfo.RepairDescription),
						params: [$scope.repairInfo.ID]
					}
				});
			})

			mui.toast("成功分享给：" + userNames.join("，"));
			RPCObserver.broadcast('refresh_mat_repair_list');
		});
	}
}]);
app.filter("formatDate", ["$filter", function ($filter) {
	return function (date) {
		if (!date) {
			return "";
		}
		return date.substr(0, 10);
	};
}]);

function shareEqu (sltObjs) {
	var appElement = document.querySelector('[ng-controller=RepairViewController]');
	var $scope = angular.element(appElement).scope();
	$scope.doMatRepairShare(angular.copy(sltObjs));
}
mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});