app.controller("RepairEditController", ["$scope", "ApiService", "DataService", "UtilsService", "AuthService", "Loading", "$Modal", "$q", "$timeout", "ChatUserService", "$filter", "RPCObserver", "CacheService", function($scope, ApiService, DataService, UtilsService, AuthService, Loading, $Modal, $q, $timeout, ChatUserService, $filter, RPCObserver, CacheService) {
	$scope.process = {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [{
			Text: "上传语音文件", //0未执行 1执行中 2完成 3失败
			State: 0,
			RetryMethod: uploadAudio
		}, {
			Text: "上传图片",
			State: 0,
			RetryMethod: uploadImgs
		}, {
			Text: "上传视频",
			State: 0,
			RetryMethod: uploadVideos
		}, {
			Text: "保存维修内容",
			State: 0,
			RetryMethod: submitData
		}, {
			Text: "通知抄送人",
			State: 0,
			RetryMethod: sendMsg
		}]
	};
	var curUser = CacheService.get("user");
	$scope.repairId = query("id") || 0;
	$scope.RepairDescription = ""; //维修内容
	$scope.RepairResult = ""; //维修结果
	$scope.UserID = []; //人员ID
	$scope.userName = []; //人员姓名
	$scope.Maplat = ""; //纬度
	$scope.Maplng = ""; //经度
	$scope.address = ""; //详细地址
	$scope.province = ""; //省
	$scope.city = ""; //市
	$scope.district = ""; //区
	$scope.street = ""; //街道
	$scope.poiName = ""; //具体地址
	$scope.EqJane="";
	//维修人员
	$scope.repairUsers = [];
	$scope.partListData = []; //配件list
	//抄送人
	$scope.sendUsers = [];
	var sendUserIDs = [];
	//故障
	$scope.faultInfo = {
		//故障设备
		content: {},
		//故障归类
		classes: {}
	}

	$scope.faultInfo.classes = {
		ID: 0,
		Name: ""
	}
	$scope.url = ApiService.Api50 + "/api/v1/Equipment/GetEqFailureTypeList?keyWords=";

	$scope.customSelectOptions = {
		model: $scope.faultInfo.classes,
		idField: 'ID',
		nameField: 'Name',
		selectfn: function() {
			$scope.tap('faultClass');
		}
	};
	//无网络或请求失败重试
	$scope.retryModal = {
		msg: "设备维修",
		retry: init,
		state: ""
	}
	//初始化
	init();

	//	UtilsService.backConfirm().then(function() {
	//		console.log("继续编辑");
	//	})

	function init() {
		if($scope.repairId) {
			Loading.show();
			//根据id获取维修信息
			getEqRepairRecords();
		} else {
			$scope.isLoad = true;
			$scope.equRecord = plus.webview.currentWebview().addEquRecord; //接收设备信息
			$scope.equRecord && ($scope.faultInfo.content = {
				EquipmentID: $scope.equRecord.EquipmentID,
				EqIdentifier: $scope.equRecord.EqIdentifier,
				EqName: $scope.equRecord.EqName,
				SkuName: $scope.equRecord.SkuName,
				ID: $scope.equRecord.ID, //故障id
				IsHasAudio: $scope.equRecord.IsHasAudio,
				AudioLength: $scope.equRecord.AudioLength,
				FaultDescription: $scope.equRecord.FaultDescription
			});

			$scope.EqFaultType = plus.webview.currentWebview().addEqFaultType; //故障类型
			if($scope.EqFaultType != undefined) {
				$scope.faultInfo.classes.ID = $scope.EqFaultType.EqFaultTypeID
				$scope.faultInfo.classes.Name = $scope.EqFaultType.EqFaultTypeName
			}

			//设备人员选择
			AuthService.getAuth().then(function(res) {
				var user = {
					UserID: res.UserID,
					ViewName: $filter("getViewName")(res.UserName, res.RealName, res.Mdt),
					CompID: res.CompID,
					ULogoIsExist: res.ULogoIsExist
				};
				//$scope.sendUsers.push(user);
				$scope.repairUsers.push(user);
			});
			//位置定位
			UtilsService.getLocation(true).then(function(location) {
				$scope.Maplat = location.lat; //纬度
				$scope.Maplng = location.lng; //经度
				$scope.address = location.address; //详细地址
				$scope.province = location.province; //省
				$scope.city = location.city; //市
				$scope.district = location.district; //区
				$scope.street = location.street; //街道
			});
			UtilsService.getDefaultRecipient().then(function(res) {
				if(res) {
					$scope.sendUsers.push(res);
				}
			});
		}
	};

	//上传音频
	$scope.audio = {};
	$scope.videoList = []; //上传视频
	$scope.imageList = []; //上传图片

	var postData = {
		"ImgAttach": null,
		"ArmAttach": null,
		"VideoAttach": null
	}

	//根据id获取维修信息
	function getEqRepairRecords() {
		var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetEqRepairRecords?repairId=" + $scope.repairId;
		DataService.get(url).then(function(res) {
			$scope.retryModal.state = "";
			$scope.isLoad = true;
			Loading.hide();
			if(res) {
				$scope.repairId = res.ID;
				//设备
				$scope.faultInfo.content = {
					EquipmentID: res.EquipmentID,
					EqIdentifier: res.EqIdentifier,
					EqName: res.EqName,
					SkuName: res.SkuName,
					ID: res.EqWordOrderFailureID, //故障id
					IsHasAudio: res.FaultIsHasAudio,
					AudioLength: res.FaultAudioLength,
					FaultDescription: res.FaultDescription
				}

				$scope.RepairDescription = res.RepairDescription;
				$scope.RepairResult = res.RepairResult;

				//维修人员
				$scope.repairUsers = [];
				res.RepairUsers.forEach(function(user) {
					$scope.repairUsers.push({
						"UserID": user.ID,
						"ViewName": user.Name,
						"CompID": user.CompID,
						"ULogoIsExist": user.ULogoIsExist
					})
				})
				//抄送人
				$scope.sendUsers = [];
				res.SendUsers.forEach(function(user) {
					$scope.sendUsers.push({
						"UserID": user.ID,
						"ViewName": user.Name,
						"CompID": user.CompID,
						"ULogoIsExist": user.ULogoIsExist
					})
				})
				sendUserIDs = [];
				sendUserIDs = res.SendUsers.map(function(user) {
					return user.ID
				});
				//语音
				$scope.audio = res.ArmAttach || {};
				//照片
				res.ImgAttach.forEach(function(item) {
					item.State = 1;
				});
				$scope.imageList = res.ImgAttach;
				//视频
				res.VideoAttach.forEach(function(item) {
					item.State = 1;
				});
				$scope.videoList = res.VideoAttach;
				//地址
				$scope.province = res.Province;
				$scope.city = res.City;
				$scope.district = res.District;
				$scope.street = res.Street;
				$scope.address = res.Address;
				$scope.Maplng = res.MapLng;
				$scope.Maplat = res.MapLat;
				//配件
				$scope.partListData = res.RepairParts;
				//归类
				$scope.faultInfo.classes.ID = res.EqFaultTypeID;
				$scope.faultInfo.classes.Name = res.EqFaultTypeName;
			}
		}, function() {
			$scope.retryModal.state = true;
		})
	}

	$scope.tap = function(key) {
		document.activeElement.blur();
		$scope.$broadcast("stop_audio");
		switch(key) {
			//选择维修人员
			case 'selectUser':
				UtilsService.openWindow({
					needLogin: true,
					id: "contact-select.html",
					url: "../common/contact-select.html?action=select&multiselect=true&must=true&type=org",
					extras: {
						selectObj: $scope.repairUsers,
						callback: "selectUserCallback"
					}
				});
				break;
				//选择故障内容
			case 'faultSelect':
				var equ = plus.webview.currentWebview().addEquRecord;
				var extras = {
					selectObj: $scope.faultInfo.content,
					callback: "faultSelectCallback"
				}
				var url = "fault-list.html?action=select&must=true";
				if(equ) {
					extras.addEquRecord = {
						EquipmentID: $scope.equRecord.EquipmentID,
						EqIdentifier: $scope.equRecord.EqIdentifier,
						EqName: $scope.equRecord.EqName,
						SkuName: $scope.equRecord.SkuName,
					};
					url += "&equid=" + equ.EquipmentID;
				}
				UtilsService.openWindow({
					needLogin: true,
					id: "fault-list.html",
					url: url,
					extras: extras
				});
				break;
				//选择故障内容
			case 'faultDetail':
				UtilsService.openWindow({
					needLogin: true,
					id: "fault-info.html",
					url: "fault-info.html?id=" + $scope.faultInfo.content.ID || 0,
					extras: {
						selectObj: $scope.faultInfo.content,
						callback: "faultSelectCallback"
					}
				});
				break;
				//选择故障归类
			case 'faultClass':
				UtilsService.openWindow({
					needLogin: true,
					id: "fault-class.html",
					url: "fault-class.html",
					extras: {
						selectObj: {
							"id": $scope.faultInfo.classes.ID,
							"name": $scope.faultInfo.classes.Name,
						},
						callback: "faultClassCallback"
					}
				});
				break;
				//选择故障设备
			case 'equDetails':
				UtilsService.openWindow({
					needLogin: true,
					id: "equ-details.html",
					url: "equ-details.html?equid=" + $scope.faultInfo.content.EquipmentID
				});
				break;
				//新增更换配件
			case 'part':
				UtilsService.openWindow({
					needLogin: true,
					id: 'part-edit.html',
					url: 'part-edit.html?id=0'
				});
				break;
				//选择抄送人
			case 'selectCopyingUser':
				UtilsService.openWindow({
					needLogin: true,
					id: "contact-select.html",
					url: "../common/contact-select.html?action=select&multiselect=true&type=org",
					extras: {
						selectObj: $scope.sendUsers,
						callback: "selectCopyingUserCallback"
					}
				});
				break;
			case 'faultEdit':
				var _extras = {};
				query("fromeqdels") && (_extras = {
					addEquRecord: {
						EquipmentID: $scope.faultInfo.content.EquipmentID,
						EqIdentifier: $scope.faultInfo.content.EqIdentifier,
						EqName: $scope.faultInfo.content.EqName,
						SkuName: $scope.faultInfo.content.SkuName
					}
				})

				_extras.callback = "addFaultCallback";
				UtilsService.openWindow({
					needLogin: true,
					id: "fault-edit.html",
					url: "fault-edit.html",
					extras: _extras
				});
				break;
		}
	}

	window.addFaultCallback = function(obj) {
		$scope.faultInfo.content = obj;
		$scope.faultInfo.classes.ID = obj.EqFaultTypeID;
		$scope.faultInfo.classes.Name = obj.EqFaultTypeName;
		$scope.EqJane=obj.EqJane;
		$scope.$apply();
	};

	//避免重复点击
	var isSubmitting = false;
	//保存
	$scope.save = function() {
		document.activeElement.blur();
		$scope.$broadcast("stop_audio");
		//验证填字符长度
		if(!$scope.faultInfo.content.ID) {
			mui.toast("请选择设备故障！");
			return;
		}
		if(!checkLengthUtil.check()) {
			return false;
		}
		if($scope.RepairDescription.trim() == "") {
			mui.toast("请输入维修内容！");
			return;
		}

		if($scope.repairUsers.length == 0) {
			mui.toast("请选择维修人员！");
			return;
		}
		if($scope.RepairResult.trim() == "") {
			mui.toast("请输入维修结果！");
			return;
		}

		if(isSubmitting) return;
		//开始上传
		isSubmitting = true;
		if(postData.ImgAttach == null) {
			postData.ImgAttach = $scope.imageList.filter(function(item) {
				return item.ID > 0;
			}).map(function(item) {
				return {
					ID: item.ID,
					FileGuid: item.FileGuid,
					FileName: item.FileName,
					FileExt: item.FileExt,
					FilePath: item.FilePath,
					FileSize: item.FileSize,
					FileType: item.FileType
				}
			})
		}
		if(postData.VideoAttach == null) {
			postData.VideoAttach = $scope.videoList.filter(function(item) {
				return item.ID > 0;
			}).map(function(item) {
				return {
					ID: item.ID,
					FileGuid: item.FileGuid,
					FileName: item.FileName,
					FileExt: item.FileExt,
					FilePath: item.FilePath,
					FileSize: item.FileSize,
					FileType: item.FileType
				}
			})
		}
		UtilsService.submitModal($scope.process, function() {
			isSubmitting = false;
			mui.back();
		}, function() {
			isSubmitting = false;
			postData.ImgAttach = null;
			postData.VideoAttach = null;
			$scope.process.SaveState = 0;
			$scope.process.ProcessList.forEach(function(item) {
				item.State = 0;
			})
			getEqRepairRecords();
		}, function() {
			isSubmitting = false;
			$scope.process.SaveState = 0;
			$scope.process.ProcessList.forEach(function(item) {
				item.State = 0;
			})
			postData.ImgAttach = [];
			$scope.imageList.forEach(function(item) {
				item.State = 0;
			})
			postData.VideoAttach = [];
			$scope.videoList.forEach(function(item) {
				item.State = 0;
			})
		});
		//开始附件上传(语音-图片-视频)
		uploadAudio();
	};

	//上传语音
	function uploadAudio() {
		if($scope.audio && $scope.audio.FileSize && !$scope.audio.FileGuid) {
			$scope.process.ProcessList[0].State = 1;
			UtilsService.uploadFileBill($scope.audio.FilePath, 2).then(function(res) {
				if(res != null) {
					res.FileSize = $scope.audio.FileSize;
					res.FileType = 2;
					postData.ArmAttach = res;
				}
				$scope.process.ProcessList[0].State = (res == null ? 3 : 2);
				//上传图片
				uploadImgs();
			})
		} else {
			if($scope.audio && $scope.audio.FileGuid) {
				postData.ArmAttach = $scope.audio;
			}
			$scope.process.ProcessList[0].State = 2;
			//上传图片
			uploadImgs();
		}
	}
	//上传图片
	function uploadImgs() {
		if([0, 3].indexOf($scope.process.ProcessList[1].State) >= 0) {
			$scope.process.ProcessList[1].State = 1;
			var imgs = $scope.imageList.filter(function(img) {
				return img.State == 0;
			});
			if(imgs.length > 0) {
				var promises = imgs.map(function(img) {
					return UtilsService.uploadFileBill(img.FilePath, 1);
				});
				$q.all(promises).then(function(res) {
					var flag = true;
					res.forEach(function(img, index) {
						if(img == null) {
							flag = false;
						} else {
							imgs[index].State = 1;
							img.FileSize = imgs[index].FileSize;
							img.FileType = 1;
							postData.ImgAttach.push(img);
						}
					});
					$scope.process.ProcessList[1].State = flag ? 2 : 3;
					//上传视频
					uploadVideos();
				});
			} else {
				$scope.process.ProcessList[1].State = 2;
				//上传视频
				uploadVideos();
			}
		} else {
			uploadVideos();
		}
	}
	//上传视频
	function uploadVideos() {
		if([0, 3].indexOf($scope.process.ProcessList[2].State) >= 0) {
			$scope.process.ProcessList[2].State = 1;
			var videos = $scope.videoList.filter(function(video) {
				return video.State == 0;
			});
			if(videos.length > 0) {
				var promises = videos.map(function(video) {
					return UtilsService.uploadFileBill(video.FilePath, 3);
				});
				$q.all(promises).then(function(res) {
					var flag = true;
					res.forEach(function(video, index) {
						if(video == null) {
							flag = false;
						} else {
							videos[index].State = 1;
							video.FileSize = videos[index].FileSize;
							video.FileType = 3;
							postData.VideoAttach.push(video);
						}
					});
					$scope.process.ProcessList[2].State = flag ? 2 : 3;
					//提交
					submitData();
				});
			} else {
				$scope.process.ProcessList[2].State = 2;
				//提交
				submitData();
			}
		} else {
			submitData();
		}
	}

	//上传维修详情
	function submitData() {
		if($scope.process.ProcessList[0].State == 2 && $scope.process.ProcessList[1].State == 2 && $scope.process.ProcessList[2].State == 2) {
			$scope.process.ProcessList[3].State = 1;
			postData.ID = $scope.repairId;
			postData.MatWordOrderFailureID = $scope.faultInfo.content.ID;
			postData.RepairDescription = $scope.RepairDescription;
			postData.RepairResult = $scope.RepairResult;
			postData.RepairUsers = $scope.repairUsers.map(function(item) {
				return item.UserID;
			}).join('/');;
			postData.IsHasAudio = $scope.audio && $scope.audio.FileSize > 0 ? 1 : 0;
			postData.AudioLength = ($scope.audio && $scope.audio.FileSize) || 0;
			postData.Province = $scope.province;
			postData.City = $scope.city;
			postData.District = $scope.district;
			postData.Street = $scope.street;
			postData.Address = $scope.address;
			postData.MapLng = $scope.Maplng;
			postData.MapLat = $scope.Maplat;
			postData.RepairParts = $scope.partListData;
			postData.MatFaultTypeID = $scope.faultInfo.classes.ID || 0;
			postData.MatFaultTypeName = $scope.faultInfo.classes.Name;
			postData.SendUsers = $scope.sendUsers.map(function(item) {
				return item.UserID;
			}).join('/');

			var url = ApiService.Api50 + "/api/v1/MatWorkOrder/SaveMatRepairRecords";
			DataService.post(url, postData).then(function(res) {
				if(res) {
					if(postData.ID == 0) {
						var url = ApiService.Api50 + '/api/v1/Common/SaveShare';
						var sharePostData = {
							"DataFrom": shareLog.fault,
							"DataID": res,
							"Operate": "故障维修",
							"Content": "故障维修",
							"SendUsers": $scope.repairUsers.map(function(item) {
								return item.UserID;
							}).join('/'),
							ActionType: 0
						}
						DataService.post(url, sharePostData).then(function(res) {

						});
					}
					$scope.process.ProcessList[3].State = 2;
					//rpc刷新
					rpc();
					$scope.repairId = res;
					//发送消息
					sendMsg(postData);
					$timeout(function() {
						$scope.process.SaveState = 1;
					}, 800);
				}
			}, function(res) {
				$scope.process.ProcessList[3].State = 3;
			});
		}
	}

	//给抄送人发送消息
	function sendMsg(postData) {
		if($scope.process.ProcessList[0].State == 2 && $scope.process.ProcessList[1].State == 2 && $scope.process.ProcessList[2].State == 2 && $scope.process.ProcessList[3].State == 2) {
			$scope.process.ProcessList[4].State = 2;
			$scope.sendUsers.filter(function(user) {
				return sendUserIDs.indexOf(user.UserID) < 0
			}).forEach(function(user) {
				ChatUserService.send({
					chatId: user.UserID,
					chatName: user.ViewName,
					chatCompId: user.CompID,
					hasLogo: curUser.ULogoIsExist,
					chatLogo: user.ULogoIsExist,
					type: 7,
					content: {
						eventName: "equ-repair",
						logo: ApiService.Down + "/chat/equ-repair.png",
						title: "设备维修",
						desc: $filter("formatDeviceRepairInfo")(postData.IsHasAudio, postData.AudioLength, postData.RepairDescription),
						params: [$scope.repairId]
					}
				});
			})
		}
	}

	//修改 的rpc
	RpcServer.expose("RPC_FaultMaintenancePactInfo", function(params) {
		if(params.state == "main") {
			if(params.index === '') {
				$scope.partListData.push(params.partData);
			} else {
				$scope.partListData.splice(params.index, 1, params.partData);
			}
			$scope.$apply();
		}
	});

	function rpc() {
		//刷新 维修详情
		RPCObserver.broadcast('refresh_equ_repair_info');
		//刷新 故障设备详情 的故障维修记录和配件更换记录
		RpcClient.invoke("prod-info.html", "Rpc_refWorks");
		RPCObserver.broadcast('refresh_equ_fault_info');
		RPCObserver.broadcast('refresh_equ_fault_repair');
		//刷新 设备详情 的维修
		RPCObserver.broadcast('refresh_equ_info_repair');
		RPCObserver.broadcast('refresh_equ_info_pact');
		//刷新维修列表
		RPCObserver.broadcast('refresh_equ_repair_list');
		//刷新配件更换列表
		RPCObserver.broadcast('refresh_equ_parts_list');
		//刷新配件更换详情
		RPCObserver.broadcast('refresh_equ_part_info');

		//刷新 设备维修列表
		RpcClient.invoke("equ-repairList.html", "RPC_EquRepairListRefresh");
		//刷新 设备维修搜索列表
		//RpcClient.invoke("repair-search.html", "RPC_RepairSearchListRefresh");
		//刷新 更换新配件 页面故障信息
		RPCObserver.broadcast('partBaseInfoReload', {
			type: "repair",
			repairInfo: {
				IsHasAudio: postData.IsHasAudio,
				AudioLength: postData.AudioLength,
				RepairDescription: postData.RepairDescription
			}
		})
	}
}]);

//选择人员回调
function selectUserCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.repairUsers = angular.copy(obj);
	$scope.$apply();
}

//故障归类选择回调
function faultClassCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.faultInfo.classes.ID = obj.id
		$scope.faultInfo.classes.Name = obj.typename
	} else {
		$scope.faultInfo.classes = {};
	}
	$scope.$apply();
}

//故障选择回调
function faultSelectCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.faultInfo.content = obj;
	if(obj.EqFaultTypeID > 0) {
		$scope.faultInfo.classes.ID = obj.EqFaultTypeID;
		$scope.faultInfo.classes.Name = obj.EqFaultTypeName;
	}
	$scope.EqJane=obj.EqJane;
	$scope.$apply();
}
//选择抄送人员回调
function selectCopyingUserCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.sendUsers = angular.copy(obj);
	$scope.$apply();
}
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});