app.controller("RepairViewController", ["$scope", "$filter", "ApiService", "DataService", "UtilsService", "Loading", "ChatUserService", "RPCObserver", "ShareLogService", "CacheService", function($scope, $filter, ApiService, DataService, UtilsService, Loading, ChatUserService, RPCObserver, ShareLogService, CacheService) {
	//上传音频
	$scope.audio = {
		"FileGuid": "",
		"FileName": "",
		"FileExt": "",
		"FilePath": "",
		"FileSize": 0,
		"FileType": 0
	};
	//发消息
	var curUser = CacheService.get("user");
	$scope.CurUserID = curUser.UserID;
	$scope.sendMsg = function(userid, userName, hasLogo, compId) {
		ChatUserService.tap({
			chatId: userid,
			chatName: userName,
			hasLogo: hasLogo,
			chatCompId: compId
		});
	};
	$scope.repairId = query("id");
	var logid = query("logid") || 0;
	$scope.videoList = []; //上传视频
	$scope.imageList = []; //上传图片
	$scope.users = ""; //抄送人员
	Loading.show();
	getEqRepairRecords();

	logid && ShareLogService.add(logid, 2);

	//无网络或请求失败重试,或已删除
	$scope.retryModal = {
		msg: "设备维修",
		retry: getEqRepairRecords,
		state: ''
	}

	//底部状态
	$scope.bar = [{
			text: '工作报告',
			fn: function() {
				UtilsService.openWindow({
					needLogin: true,
					id: 'state-mark.html',
					url: '../common/state-mark.html',
					extras: {
						ID: $scope.repairInfo.EqWordOrderFailureID,
						key: "eq-fault",
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
			fn: function() {
				$scope.partReplace();
			}
		}
	];
	if(!$filter("hasAuth")(['Q9'])) {
		$scope.bar.splice(1, 1)
	};

	function getEqRepairRecords() {
		var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetEqRepairRecords?repairId=" + $scope.repairId;
		logid && (url += '&logid=' + logid);
		DataService.get(url).then(function(res) {
			$scope.retryModal.state = '';
			Loading.hide();
			$scope.isLoad = true;
			if(res) {
				$scope.repairInfo = res;
				$scope.users = res.SendUsers; //抄送人员
			}
		}, function(error) {
			$scope.retryModal.state = error.State;
		})
	}

	$scope.tap = function(type, id) {
		$scope.$broadcast("stop_audio");
		switch(type) {
			//故障内容
			case "faultInfo":
				UtilsService.openWindow({
					needLogin: true,
					id: "fault-info.html",
					url: "fault-info.html?id=" + id
				});
				break;
				//故障设备
			case "equDetails":
				UtilsService.openWindow({
					needLogin: true,
					id: "equ-details.html",
					url: "equ-details.html?equid=" + id
				});
				break;
				//配件更换详情
			case "partInfo":
				UtilsService.openWindow({
					needLogin: true,
					id: "part-info.html",
					url: "part-info.html?id=" + id
				});
				break;
			default:
				break;
		}
	}
	$scope.partReplace = function() {
		UtilsService.openWindow({
			needLogin: true,
			id: "part-edit.html",
			url: "part-edit.html?id=0",
			extras: {
				mainData: {
					"EqRepairID": $scope.repairId,
					"EqWordOrderFailureID": $scope.repairInfo.EqWordOrderFailureID,
					"EquipmentID": $scope.repairInfo.EquipmentID,
					"EqIdentifier": $scope.repairInfo.EqIdentifier
				}
			}
		});
		//		UtilsService.openWindow({
		//			needLogin: true,
		//			id: "part-replacement.html",
		//			url: "part-replacement.html?faultid=" + $scope.repairInfo.EqWordOrderFailureID + "&equid=" + $scope.repairInfo.EquipmentID + "&repairid=" + $scope.repairId,
		//			extras: {
		//				addEquRecord: {
		//					ID: $scope.repairInfo.EqWordOrderFailureID,
		//					EquipmentID: $scope.repairInfo.EquipmentID,
		//					EqIdentifier: $scope.repairInfo.EqIdentifier,
		//					EqName: $scope.repairInfo.EqName,
		//					SkuName: $scope.repairInfo.SkuName,
		//					IsHasAudio: $scope.repairInfo.FaultIsHasAudio,
		//					AudioLength: $scope.repairInfo.FaultAudioLength,
		//					FaultDescription: $scope.repairInfo.FaultDescription,
		//					RepairIsHasAudio: $scope.repairInfo.IsHasAudio,
		//					RepairAudioLength: $scope.repairInfo.AudioLength,
		//					RepairDescription: $scope.repairInfo.RepairDescription,
		//					RepairCreateDate: $scope.repairInfo.CreateDate
		//				}
		//			}
		//		});
	}

	$scope.edit = function() {
		$scope.$broadcast("stop_audio");
		mui('#popover').popover('toggle');
		UtilsService.openWindow({
			needLogin: true,
			id: 'equ-repair.html',
			url: '../eqmentlib/equ-repair.html?id=' + $scope.repairId
		});
	};
	$scope.delectMain = function() {
		$scope.$broadcast("stop_audio");
		mui.confirm("确认删除吗？", function(e) {
			if(e.index == 0) {
				var url = ApiService.Api50 + "/api/v1/MatWorkOrder/DeleteMatRepairRecords?repairId=" + query("id");
				DataService.get(url).then(function(res) {
					RPCObserver.broadcast('refresh_equ_repair_list');
					RPCObserver.broadcast('refresh_equ_fault_repair');
					RpcClient.invoke("equ-repairList.html", "RPC_EquRepairListRefresh", {
						"state": "del",
						"id": query("id")
					});
					//刷新 设备详情 的维修
					RPCObserver.broadcast('refresh_equ_info_repair');
					RPCObserver.broadcast('refresh_equ_info_pact');
					//刷新扫码设备详情
					RpcClient.invoke("prod-info.html", "Rpc_refWorks");
					mui('#popover').popover('hide');
					mui.back();
				}, function(error) {
					mui('#popover').popover('hide');
				});
			} else {
				mui('#popover').popover('hide');
			}
		});
	}

	//刷新 rpc注册
	RPCObserver.on('refresh_equ_repair_info', 'equRepairViewRefresh');
	window.equRepairViewRefresh = getEqRepairRecords;

	//配件更换 删除 的rpc
	RpcServer.expose("RPC_FaultDelectPactInfo", function(params) {
		if(params.state == "del") {
			var index = $scope.repairInfo.RepairParts.findIndex(function(item) {
				return item.ID == params.id;
			})
			if(index >= 0) {
				getEqRepairRecords();
			}
		}
	});
	//刷新关闭popover
	RPCObserver.on('close_popover', 'close_popover');
	window.close_popover = function() {
		mui('#popover').popover('hide');
	};
	//详情分享
	$scope.goRepairShare = function(type) {
		UtilsService.openWindow({
			needLogin: true,
			id: "contact-select.html",
			url: "../common/contact-select.html?action=select&must=true&multiselect=true&type=org&hideself=true",
			extras: {
				selectObj: [],
				callback: 'shareEqu'
			}
		});
	};

	$scope.doRepairShare = function(sltUsers) {
		var obj = {
			id: $scope.repairId,
			img: ApiService.Down + "/chat/equ-repair.png",
			title: "设备维修",
			desc: $filter("formatDeviceRepairInfo")($scope.repairInfo.IsHasAudio, $scope.repairInfo.AudioLength, $scope.repairInfo.RepairDescription),
		}
		UtilsService.shareMsg(obj, sltUsers).then(function() {
			var userNames = [];
			sltUsers.forEach(function(user) {

				userNames.push(user.ViewName);

				ChatUserService.send({
					chatId: user.UserID,
					chatName: user.ViewName,
					chatCompId: user.EquipmentID,
					hasLogo: curUser.ULogoIsExist,
					chatLogo: user.ULogoIsExist,
					type: 7,
					content: {
						eventName: "equ-repair",
						logo: ApiService.Down + "/chat/equ-repair.png",
						title: "设备维修",
						desc: $filter("formatDeviceRepairInfo")($scope.repairInfo.IsHasAudio, $scope.repairInfo.AudioLength, $scope.repairInfo.RepairDescription),
						params: [$scope.repairId]
					}
				});
			})

			mui.toast("成功分享给：" + userNames.join("，"));
		});
	}
}]);

function shareEqu(sltObjs) {
	var appElement = document.querySelector('[ng-controller=RepairViewController]');
	var $scope = angular.element(appElement).scope();
	$scope.doRepairShare(angular.copy(sltObjs));
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});