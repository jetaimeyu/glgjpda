app.controller("RepairEditController", ["$scope", "ApiService", "DataService", "UtilsService", "AuthService", "Loading", "$Modal", "$q", "$timeout", "ChatUserService", "$filter", "RPCObserver", "CacheService", "DatePickerService",
	function($scope, ApiService, DataService, UtilsService, AuthService, Loading, $Modal, $q, $timeout, ChatUserService, $filter, RPCObserver, CacheService, DatePickerService) {
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
		$scope.draftProcess = {
			SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
			ProcessList: [{
				Text: "保存到草稿箱", //0未执行 1执行中 2完成 3失败
				State: 0,
				RetryMethod: uploadAudio
			}]
		}
		$scope.print = false;
		$scope.IsNew = query("id") ? false : true; //判断是否是新建单，只有新建才有客户签名
		var curUser = CacheService.get("user");
		$scope.ISJJComp = curUser.CompID == 266;
		$scope.CompID = curUser.CompID;
		//景津266
		$scope.JJCompID = 266;
		$scope.draftId = query("draftId") || 0;
		//$scope.curComId = 0
		$scope.queryRepairID = query("id") || 0;
		$scope.repairId = $scope.queryRepairID;
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
		//维修人员
		$scope.repairUsers = [];
		$scope.partListData = []; //配件list
		//景津需求字段 到场时间 离场时间
		$scope.ArriveDate = "";
		$scope.LeaveDate = "";
		$scope.CustSuggest = ""; /// 客户意见建议
		$scope.EqJane = "";
		$scope.planTime = ''; //预计工时
		//抄送人
		$scope.sendUsers = [];
		UtilsService.getDefaultRecipient().then(function(res) {
			if(res && $scope.repairId == 0) {
				$scope.sendUsers.push(res);
			}
		});
		$scope.Stage = 0;
		$scope.chooseStage = function (value) {
			$scope.Stage = value;
		};
		var sendUserIDs = [];
		//故障
		$scope.faultInfo = {
			//故障设备
			content: {},
		}
		//故障归类
		$scope.matFatClass = {};
		//故障描述
		$scope.faultDesc = {
			ID: "",
			Name: ""
		}
		$scope.repairDesc = {
			ID: "",
			Name: "" //维修内容
		};
		$scope.repairResult = {
			ID: "",
			Name: "" //维修结果
		};
		
		//责任判定
		$scope.matResponsibility = {
			ID: "",
			Name: ""
		};
		//自定义维修参数
		$scope.RepairParams=[];
		$scope.customer = {
			ID: 0,
			Name: "",
			Province: "",
			City: "",
			District: "",
			Address: "",
			Street: "",
			MapLng: "",
			MapLat: ""
		};
		var mui_back = mui.back;
		mui.back = function() {
			if(document.getElementById("signatureparent").style.display == "block") {
				$scope.signature("close");
				return;
			}
			mui_back()
		}
		$scope.customerurl = ApiService.Api50 + "/api/v2/Customer/SearchCustomer?keyWords=";

		// 选择组件
		$scope.customSelectOptions = {
			faultdesc: {
				model: $scope.faultDesc,
				idField: 'ID',
				nameField: 'Name',
				selectfn: function() {
					$scope.selectFaultDesc();
				}
			},
			desc: {
				model: $scope.repairDesc,
				idField: 'ID',
				nameField: 'Name',
				selectfn: function() {
					$scope.selectDescriptionPhrase();
				}
			},
			result: {
				model: $scope.repairResult,
				idField: 'ID',
				nameField: 'Name',
				selectfn: function() {
					$scope.selectResultPhrase();
				}
			},
			faultClass: {
				model: $scope.matFatClass,
				idField: 'ID',
				nameField: 'Name',
				selectfn: function() {
					$scope.tap('faultClass');
				}
			},
			responsibility: {
				model: $scope.matResponsibility,
				idField: 'ID',
				nameField: 'Name',
				selectfn: function() {
					$scope.tap('responsibility');
				}
			},
			select: {
				model: $scope.customer,
				idField: 'ID',
				nameField: 'Name',
				selectfn: function() {
					$scope.tap('selectCustomer');
				},
				clearfn: function() {
					$scope.linkName = "";
					$scope.linkPhone = "";

					var names = Object.getOwnPropertyNames($scope.customer);
					for(var i = 0; i < names.length; i++) {
						$scope.customer[names[i]] = names[i] == "ID" ? 0 : "";
					}
				}
			},
			dropDownCallback: function(data) {
				if(data.LinkManList.length > 0) {
					$scope.linkName = data.LinkManList[0].LinkName || "";
					$scope.linkPhone = data.LinkManList[0].LinkPhone || "";
				}
			}
		};
		$scope.url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetMatFailureTypeListByCompID?compId=" + curUser.CompID + "&keywords=";
		$scope.resurl = ApiService.Api50 + "/api/v1/MatWorkOrder/GetMatResponsibilityListByCompID?compId=" + curUser.CompID + "&keyWords=";
		AuthService.getAuth().then(function(res) {
			//			$scope.CompID = res.CompID;
			$scope.InnerCodeName = res.InnerCodeName || '出厂编号';
			if($scope.repairId == 0 && !$scope.draftId) {
				var user = {
					UserID: res.UserID,
					ViewName: $filter("getViewName")(res.UserName, res.RealName, res.Mdt),
					CompID: res.CompID,
					ULogoIsExist: res.ULogoIsExist
				};
				//$scope.sendUsers.push(user);
				$scope.repairUsers.push(user);
				$scope.ProdCompID = query("prodcompid") || "";
			}
			$scope.curComId = $scope.UserCompID = res.CompID;
			if($scope.draftId) {
				$scope.renderDrafts();
			} else {
				//初始化
				init();
			}
		});
		$scope.getcuinfo = function() {
			if($scope.ISJJComp) {
				if(document.getElementById("prodInnerCode").innerText.trim() == "") {
					return;
				} else {
					var url = ApiService.Api50 + "/api/v1/MdCode/GetMdCodeByInnerCode?CompID=" + curUser.CompID + '&InnerCode=' + document.getElementById("prodInnerCode").innerText;
					DataService.get(url).then(function(res) {
						$scope.faultInfo.content.ProdName = res.ProdName
						$scope.faultInfo.content.ProdID = res.ProdID
						$scope.faultInfo.content.SkuName = res.SkuName
						$scope.faultInfo.content.MDCode = res.MDCode
						//											$scope.ProdList[0]=res

					}, function(e) {
						//						if(!$scope.faultInfo.content.MDCode){
						//							document.getElementById("prodInnerCode").innerText= "";
						//						}
					})
				}
			}

		}

		$scope.scan = function(key) {
			document.activeElement.blur();
			$scope.$broadcast("stop_audio");
			setTimeout(function() {
				UtilsService.openWindow({
					needLogin: true,
					id: 'scan.html',
					url: '../scan/scan.html',
					extras: {
						callback: "scanCallback"
					}
				});
			})
		};
			////获取故障维修参数
		function loadRepairParams(pid) {
			var url = ApiService.Api52 + "/api/v1/MatWorkOrder/GetProdRepairParamsList?prodId=" + pid;
			DataService.get(url).then(function(res) {
//				console.log(JSON.stringify(res))
				$scope.RepairParams=res;
			}, function(e) {
//				console.log(JSON.stringify(e))
			})
		}
		//点击维修参数
		$scope.selectRepairParams=function(index) {
			var param = $scope.RepairParams[index];
			var btns = [],
				i = param.ParamsValues.length;
		
			while(i--) {
				btns.push({
					title: param.ParamsValues[i].Name
				});
			}
			plus.nativeUI.actionSheet({
				cancel: "取消",
				buttons: btns
			}, function(e) {
				if(e.index == 0) {
					document.activeElement.blur();
					return;
				}
				document.activeElement.blur();
//				console.log(JSON.stringify(btns[e.index - 1]))
				if(btns[e.index - 1] != undefined) {
					$scope.RepairParams[index].ParamDefValue = btns[e.index - 1].title;
					$scope.$apply()
				}
			});
		};
		//跳转产品详情
		$scope.toProdInfoPage = function(id) {
			if($scope.isscan) {
				UtilsService.openWindow({
					needLogin: true,
					id: 'prodinfo-head.html',
					url: '../problib/prodinfo-head.html?prodId=' + id
				});
			}
		};
		window.scanCallback = function(res) {
			res = JSON.parse(res);
			if(res.resType == 1) {
				res.resInfo.SkuName = decodeURIComponent(res.resInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
				res.resInfo.ProdName = decodeURIComponent(res.resInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g,
					"\"");
				res.resInfo.MdCode = res.codeValue;
				$scope.faultInfo.content = {
					ProdID: res.resInfo.ProdID,
					ProdInnerCode: decodeURIComponent(res.resInfo.InnerCode).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\""),
					ProdName: res.resInfo.ProdName,
					SkuName: res.resInfo.SkuName,
					SkuID: res.resInfo.SkuID,
					MDCode: res.resInfo.MdCode || res.resInfo.MDCode,
					ProdCompID: res.resInfo.SourceCompID,
					ID: 0
				}
				$scope.EqJane = res.resInfo.EqJane;
				$scope.ProdCompID = res.resInfo.SourceCompID;
				document.querySelector("#prodInnerCode").innerText = $scope.faultInfo.content.ProdInnerCode;
				if($scope.CompID>0){
					loadRepairParams($scope.faultInfo.content.ProdID)
				}
				$scope.$apply();
			} else if(res.resType == 2) {
				mui.toast("不允许扫设备码,请扫描产品码");
			}
		}

		$scope.renderDrafts = function() {
			var cache = CacheService.get(curUser.UserID + "_mat_repair_submit") || {};
			var data = cache[$scope.draftId];
			if(data) {
				Object.keys(data.content).forEach(function(item) {
					if(item == "id") {

					} else {
						$scope[item] = data.content[item];
					}
				});
			}

			if($scope.faultInfo.content.ProdInnerCode) {
				document.getElementById("prodInnerCode").innerText = $scope.faultInfo.content.ProdInnerCode;
			}

			document.getElementById("repairDesc").innerText = $scope.repairDesc.Name;
			document.getElementById("repairResult").innerText = $scope.repairResult.Name;
			document.getElementById("faultDesc").innerText = $scope.faultDesc.Name;

			document.getElementById("content").style.display = "block";
			document.getElementById("footer").style.display = "block";

			if(!$scope.province) {
				getLocationo();
			}

		};

		$scope.saveDrafts = function() {

			var cache = CacheService.get(curUser.UserID + "_mat_repair_submit") || {};
			var curDate = new Date();

			$scope.faultInfo.content.ProdInnerCode = document.getElementById("prodInnerCode").innerText;
			$scope.matResponsibility.Name = document.querySelector("#matResponsibility input").value;
			$scope.matFatClass.Name = document.querySelector("#matFatClass input").value;
			var data = {
				id: curDate.getTime(),
				createdate: curDate.Format("yyyy-MM-dd HH:mm:ss"),
				content: {
					audio: $scope.audio,
					imageList: $scope.imageList,
					videoList: $scope.videoList,
					repairDesc: $scope.repairDesc,
					faultDesc: $scope.faultDesc,
					repairResult: $scope.repairResult,
					repairUsers: $scope.repairUsers,
					faultInfo: $scope.faultInfo,
					province: $scope.province,
					city: $scope.city,
					district: $scope.district,
					street: $scope.street,
					address: $scope.address,
					Maplng: $scope.Maplng,
					Maplat: $scope.Maplat,
					ArriveDate: $scope.ArriveDate,
					LeaveDate: $scope.LeaveDate,
					CustSuggest: $scope.CustSuggest,
					planTime: $scope.planTime,
					partListData: $scope.partListData,
					matFatClass: $scope.matFatClass,
					matResponsibility: $scope.matResponsibility,
					matRecord: $scope.matRecord,
					repairId: $scope.repairId,
					linkName: $scope.linkName,
					linkPhone: $scope.linkPhone,
					customer: $scope.customer,
					ProdCompID: $scope.ProdCompID,
					EqJane: $scope.EqJane,
					RepairParams:$scope.RepairParams,
				}
			};
			if($scope.draftId) {
				delete cache[$scope.draftId];
			}

			cache[data.id] = data;
			$scope.draftId = data.id;

			$scope.saveToCache(cache);
			//			UtilsService.submitModal($scope.draftProcess, function() {
			//				mui.back();
			//			}, function() {
			//				$scope.draftProcess.SaveState = 1;
			//				$scope.draftProcess.ProcessList.forEach(function(item) {
			//					item.State = 0;
			//				})
			//			}, function() {});
			mui.toast("已保存到草稿箱")
		};

		$scope.delteDrafts = function() {
			if($scope.draftId) {
				var cache = CacheService.get(curUser.UserID + "_mat_repair_submit") || {};

				delete cache[$scope.draftId];
				$scope.saveToCache(cache);
			}
		};

		function rpcDrafts() {
			RpcClient.invoke("mat-drafts-prod-wx.html", "Rpc_refDrafts");
		};

		$scope.saveToCache = function(data) {
			CacheService.set(curUser.UserID + "_mat_repair_submit", data, true);
			rpcDrafts();
			$scope.draftProcess.ProcessList[0].State = 2;
			$timeout(function() {
				$scope.draftProcess.SaveState = 1;
			}, 800);
		}

		//无网络或请求失败重试
		$scope.retryModal = {
			msg: "故障维修",
			retry: init,
			state: ''
		}

		function init() {
			if($scope.repairId) {
				Loading.show();
				//根据id获取维修信息
				getEqRepairRecords();
			} else {
				document.getElementById("content").style.display = "block";
				document.getElementById("footer").style.display = "block";
				$scope.matRecord = plus.webview.currentWebview().addMatRecord; //接收设备信息
				$scope.matRecord && ($scope.faultInfo.content = {
					ProdID: $scope.matRecord.ProdID,
					ProdInnerCode: $scope.matRecord.ProdInnerCode,
					ProdName: $scope.matRecord.ProdName,
					SkuName: $scope.matRecord.SkuName,
					SkuID: $scope.matRecord.SkuID,
					MDCode: $scope.matRecord.MdCode || $scope.matRecord.MDCode,
					ID: $scope.matRecord.ID || 0, //故障id
					HasAudio: $scope.matRecord.IsHasAudio || 0,
					AudioLength: $scope.matRecord.AudioLength || 0,
					Description: $scope.matRecord.Description || ""
				});
				$scope.matRecord && ($scope.EqJane = $scope.matRecord.EqJane)
				$scope.faultInfo.content.ProdInnerCode && (document.querySelector("#prodInnerCode").innerText = $scope.faultInfo.content.ProdInnerCode);

				var MatFaultType = plus.webview.currentWebview().addMatFaultType; //故障类型
				if(MatFaultType != undefined) {
					$scope.matFatClass.ID = MatFaultType.MatFaultTypeID
					$scope.matFatClass.Name = MatFaultType.MatFaultTypeName
				}

				var Responsibility = plus.webview.currentWebview().addResponsibility; //责任判定
				if(Responsibility != undefined) {
					$scope.matResponsibility.ID = Responsibility.ResponsibilityID
					$scope.matResponsibility.Name = Responsibility.ResponsibilityName
				}
				//企业用户获取维修参数
				if($scope.CompID>0&&($scope.faultInfo.content.ProdID)){
					loadRepairParams($scope.faultInfo.content.ProdID)
				}
				getLocationo();
			}
		};

		function getLocationo() {
			//位置定位
			UtilsService.getLocation(true).then(function(location) {
				$scope.customer.MapLat = $scope.Maplat = location.lat; //纬度
				$scope.customer.MapLng = $scope.Maplng = location.lng; //经度
				$scope.customer.Address = $scope.address = location.address; //详细地址
				$scope.customer.Province = $scope.province = location.province; //省
				$scope.customer.City = $scope.city = location.city; //市
				$scope.customer.District = $scope.district = location.district; //区
				$scope.customer.Street = $scope.street = location.street; //街道
			});
		}

		//上传音频
		$scope.audio = {};
		$scope.videoList = []; //上传视频
		$scope.imageList = []; //上传图片

		var postData = {
			"ImgAttach": null,
			"ArmAttach": null,
			"VideoAttach": null,
			"RepairParamsList":[]
		}

		//根据id获取维修信息
		function getEqRepairRecords() {
			var url = ApiService.Api52 + "/api/v1/MatWorkOrder/GetMatRepairRecords?repairId=" + $scope.repairId;
			DataService.get(url).then(function(res) {
				document.getElementById("content").style.display = "block";
				document.getElementById("footer").style.display = "block";
				$scope.retryModal.state = '';
				Loading.hide();
//				console.log(JSON.stringify(res))
				if(res) {
					$scope.repairId = res.ID;
					$scope.ProdCompID = res.CompID;
					//设备
					$scope.faultInfo.content = {
						ProdInnerCode: res.ProdInnerCode,
						ProdID: res.ProdID,
						ProdName: res.ProdName,
						SkuName: res.SkuName,
						SkuID: res.SkuID,
						MDCode: res.MdCode || res.MDCode,
						ID: res.MatWordOrderFailureID, //故障id
						HasAudio: res.FaultIsHasAudio,
						AudioLength: res.FaultAudioLength,
						Description: res.Description
					}
					res.RepairParamsList.forEach(function(item){
						item.ParamDefValue=item.ParamValue
					})
					$scope.RepairParams=res.RepairParamsList;
					$scope.repairDesc.ID = res.RepairDescriptionID;
					$scope.repairDesc.Name = res.RepairDescription;
					$scope.repairResult.ID = res.RepairResultID;
					$scope.repairResult.Name = res.RepairResult;
					$scope.faultDesc.ID = res.DescriptionID;
					$scope.faultDesc.Name = res.Description;

					$scope.ArriveDate = res.ArriveDate;
					$scope.LeaveDate = res.LeaveDate;
					$scope.CustSuggest = res.CustSuggest;
					$scope.planTime = res.PlanTime

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
					$scope.matFatClass.ID = res.MatFaultTypeID;
					$scope.matFatClass.Name = res.EqFaultTypeName;
					//责任判定
					$scope.matResponsibility.ID = res.ResponsibilityID;
					$scope.matResponsibility.Name = res.ResContent;
				}
			}, function(error) {
				$scope.retryModal.state = error.State;
			})
		}

		$scope.tap = function(key) {
			document.activeElement.blur();
			$scope.$broadcast("stop_audio");
			switch(key) {
				//选择维修人员
				case 'selectUser':
					if($scope.curComId > 0) {
						UtilsService.openWindow({
							needLogin: true,
							id: "contact-select.html",
							url: "../common/contact-select.html?action=select&multiselect=true&must=true",
							extras: {
								selectObj: $scope.repairUsers,
								callback: "selectUserCallback"
							}
						});
					}

					break;
					//选择故障内容
				case 'faultSelect':
					UtilsService.openWindow({
						needLogin: true,
						id: "mat-fault-list.html",
						url: "mat-fault-list.html?action=select&must=true&prodid=" + ($scope.matRecord == undefined ? "" : $scope.matRecord.ProdID) + "&skuid=" + ($scope.matRecord == undefined ? "" : $scope.matRecord.SkuID) + "&mdcode=" + ($scope.matRecord == undefined ? "" : $scope.matRecord.MdCode) + "&from=" + (query('from') || "") + "&ischeckcomp=1",
						extras: {
							innercode: $scope.matRecord && $scope.matRecord.ProdInnerCode || "",
							selectObj: $scope.faultInfo.content,
							addMatRecord: $scope.matRecord,
							callback: "faultSelectCallback"
						}
					});
					break;
					//查看故障详情
				case 'faultDetail':
					UtilsService.openWindow({
						needLogin: true,
						id: "mat-fault-info.html",
						url: "mat-fault-info.html?id=" + $scope.faultInfo.content.ID || 0,
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
						id: "mat-fault-class.html",
						url: "mat-fault-class.html",
						extras: {
							selectObj: {
								id: $scope.matFatClass.ID,
								name: $scope.matFatClass.Name
							},
							callback: "faultClassCallback"
						}
					});
					break;
					//选择责任判定
				case 'responsibility':
					UtilsService.openWindow({
						needLogin: true,
						id: "select-duty.html",
						url: "select-duty.html",
						extras: {
							selectObj: {
								id: $scope.matResponsibility.ID,
								name: $scope.matResponsibility.Name
							},
							callback: "selectDutyCallback"
						}
					});
					break;
					//新增更换配件
				case 'part':
					UtilsService.openWindow({
						needLogin: true,
						id: 'mat-part-edit.html',
						url: 'mat-part-edit.html?id=0'
					});
					break;
					//选择抄送人
				case 'selectCopyingUser':
					UtilsService.openWindow({
						needLogin: true,
						id: "contact-select.html",
						url: "../common/contact-select.html?action=select&multiselect=true",
						extras: {
							selectObj: $scope.sendUsers,
							callback: "selectCopyingUserCallback"
						}
					});
					break;
				case 'faultEdit':
					UtilsService.openWindow({
						needLogin: true,
						id: "mat-fault-edit.html",
						url: "mat-fault-edit.html?from=" + query('from') + "&source=mat-repair",
						extras: {
							innercode: $scope.matRecord && $scope.matRecord.ProdInnerCode || "",
							selectObj: $scope.faultInfo.content,
							addMatRecord: $scope.matRecord,
							callback: "faultSelectCallback"
						}
					});
					break;
					//产品详情
				case "prodinfos":
					UtilsService.openWindow({
						needLogin: true,
						id: 'prodinfo-head.html',
						url: '../problib/prodinfo-head.html?prodId=' + $scope.faultInfo.content.ProdID + "&SkuID=" + $scope.faultInfo.content.SkuID + "&MdCode=" + $scope.faultInfo.content.MDCode
					});
					break;
				case 'selectCustomer':
					UtilsService.openWindow({
						needLogin: true,
						id: "customer-search.html",
						url: "../search/customer-search.html?action=select&must=true",
						extras: {
							selectObj: $scope.customer,
							callback: "selectCustomerContactCallback"
						}
					});
					break;
			}
		}

		//选择客户回调
		window.selectCustomerContactCallback = function(obj) {
			$scope.customer.ID = obj.ID;
			$scope.customer.Name = obj.CustomerName;
			if(obj.LinkManList.length > 0) {
				$scope.linkName = obj.LinkManList[0].LinkName;
				$scope.linkPhone = obj.LinkManList[0].LinkPhone;
			}
			$scope.$apply();
		}

		//避免重复点击
		var isSubmitting = false;
		//保存
		$scope.save = function(key) {

			$scope.print = key && key == 'print' ? true : false;
			document.activeElement.blur();
			$scope.$broadcast("stop_audio");
			if(!$scope.repairId && (!$scope.matRecord || !$scope.matRecord.ProdID)) {
				if($scope.ISJJComp) {
					if(!$scope.faultInfo.content.MDCode && document.querySelector("#prodInnerCode").innerText.trim() == "") {
						mui.alert("请扫描产品码或输入" + $scope.InnerCodeName);
						return;
					}
				} else {
					if(!$scope.faultInfo.content.MDCode) {
						mui.toast("请扫描产品码");
						return;
					}
					if(document.querySelector("#prodInnerCode").innerText.trim() == "") {
						mui.toast("请输入" + $scope.InnerCodeName);
						return;
					}
				}

				$scope.faultInfo.content.ProdInnerCode = document.querySelector("#prodInnerCode").innerText.trim();

			} else {
				if(!$scope.faultInfo.content.ID) {
					mui.toast("请选择一个故障！!");
					return;
				}
			}

			if(document.querySelector("#plantime").innerText.trim() == "") {

			}
			//维修参数
			var params = document.body.querySelectorAll("#tab1 .param");
			postData.RepairParamsList=[];
				for(var i = 0; i < params.length; i++) {
						var index = parseInt(params[i].parentElement.getAttribute("idx"));
						var param = $scope.RepairParams[index];
						var obj = {
							ID:param.ID,
							SortID:param.SortID,
							IsRequired: param.IsRequired,
							IsDisabled:param.IsDisabled,
							ParamID: param.ParamID,
							ParamName: param.ParamName,
							ParamType: param.ParamType + "", 
							ParamValue: (params[i].nodeName == "SPAN") ? params[i].innerText : params[i].value,
							
					};
					postData.RepairParamsList.push(obj);
				}
//				console.log(JSON.stringify(postData.RepairParamsList))
				for(var i = 0; i < postData.RepairParamsList.length - 1; i++) {
					var param = postData.RepairParamsList[i];
					if(param.IsRequired == 1 && !param.ParamValue) {
						mui.alert("请" + (param.ParamType == 0 ? '输入' : '选择') + "参数 " + param.ParamName + "！");
						return false;
					}
				}
			//验证填字符长度
			if(!checkLengthUtil.check()) {
				return false;
			}
			//			if($scope.faultDesc.Name.trim() == "" && !$scope.faultInfo.content.ID) {
			//				mui.toast("请输入故障描述！");
			//				return;
			//			}
			if($scope.repairDesc.Name.trim() == "") {
				$scope.CompID == $scope.JJCompID ? mui.toast("请输入故障解决方法步骤！") : mui.toast("请输入维修内容！");
				return;
			}
			if($scope.repairResult.Name.trim() == "") {
				$scope.CompID == $scope.JJCompID ? mui.toast("请输入工作结果！") : mui.toast("请输入维修结果！");
				return;
			}
			if($scope.repairUsers.length == 0) {
				mui.toast("请选择维修人员！");
				return;
			}
			if(!$scope.queryRepairID && (!$scope.matRecord || !$scope.matRecord.ID)) { //!$scope.repairId
				if(!$scope.customer.Name) {
					mui.toast("请选择一个客户！");
					return;
				}
				if(!$scope.linkName) {
					mui.toast("请输入联系人！");
					return;
				}
				if(!$scope.linkPhone) {
					mui.toast("请输入联系电话！");
					return;
				}
			}

			var patt1 = new RegExp(/^(([1-9][0-9]*)|(([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2})))$/);

			if($scope.planTime && !patt1.test(Number($scope.planTime))) {
				mui.toast('预计工时时间格式不正确')
				return

			}
			if(isSubmitting) return;
			//开始上传
			isSubmitting = true;
			//如果保存后打印
			$scope.print && $scope.process.ProcessList.push({
				Text: "打印维修工单",
				State: 0,
				RetryMethod: printOrder
			})
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
				});
				$scope.process.ProcessList[5] && $scope.process.ProcessList.splice(5, 1);
				getEqRepairRecords();
			}, function() {
				isSubmitting = false;
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
				postData.FaultInfo = $scope.faultInfo.content;
				postData.Customer = $scope.customer;
				postData.Customer.LinkPhone = $scope.linkPhone;
				postData.Customer.LinkName = $scope.linkName;
				postData.RepairDescriptionID = $scope.repairDesc.ID || 0;
				postData.RepairDescription = $scope.repairDesc.Name;
				postData.DescriptionID = $scope.faultDesc.ID || 0;
				postData.Description = $scope.faultDesc.Name;
				postData.RepairResultID = $scope.repairResult.ID || 0;
				postData.RepairResult = $scope.repairResult.Name;
				postData.RepairUsers = $scope.repairUsers.map(function(item) {
					return item.UserID;
				}).join('/');
				postData.IsHasAudio = $scope.audio && $scope.audio.FileSize > 0 ? 1 : 0;
				postData.AudioLength = ($scope.audio && $scope.audio.FileSize) || 0;
				postData.Province = $scope.province;
				postData.City = $scope.city;
				postData.District = $scope.district;
				postData.Street = $scope.street;
				postData.Address = $scope.address;
				postData.MapLng = $scope.Maplng;
				postData.MapLat = $scope.Maplat;
				postData.ArriveDate = $scope.ArriveDate + ':00';
				postData.LeaveDate = $scope.LeaveDate + ':00';

				postData.planTime = $scope.planTime,
					postData.CustSuggest = $scope.CustSuggest;
				postData.RepairParts = $scope.partListData;
				postData.MatFaultTypeID = $scope.matFatClass.ID || 0;
				postData.MatFaultTypeName = $scope.matFatClass.Name;
				postData.ResponsibilityID = $scope.matResponsibility.ID || 0;
				postData.ResponsibilityName = $scope.matResponsibility.Name;
				postData.EqJane = $scope.EqJane;
				postData.SendUsers = $scope.sendUsers.map(function(item) {
					return item.UserID;
				}).join('/');
				var url = ApiService.Api50 + "/api/v1/MatWorkOrder/SaveMatRepairRecords?stage="+$scope.Stage;
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
						//rpc刷新
						rpc();
						$scope.repairId = res;
						$scope.delteDrafts();
						$scope.process.ProcessList[3].State = 2;

						if($scope.IsNew && $scope.JJCompID == curUser.CompID) {
							$Modal.close();
							$scope.signature("show");
						} else {
							$scope.print && printOrder();
							$timeout(function() {
								$scope.process.SaveState = 1;
							}, 800);
						}
						//发送消息
						//if($scope.curComId > 0) {
						sendMsg(postData);
						//}

					}
				}, function(res) {
					$scope.process.ProcessList[5] && $scope.process.ProcessList.splice(5, 1);
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
							eventName: "repair",
							logo: ApiService.Down + "/chat/repair.png",
							title: "故障维修",
							desc: $filter("formatRepairInfo")(postData.IsHasAudio, postData.AudioLength, postData.RepairDescription),
							params: [$scope.repairId]
						}
					});
				})
			}
		}
		//打印维修工单
		function printOrder() {
			var repairUsers = $scope.repairUsers.map(function(item) {
				return item.ViewName;
			}).join(',');
			var serverPath = ApiService.Api50 + "/api/v1/MatWorkOrder/ExportRepairExcel?matRepairId=" + $scope.repairId;
			var _time = $scope.LeaveDate.substr(0, 10).replace(/-/g, '\.');
			var localPath = "_doc/RepairOrder/" + $scope.customer.Name + $scope.faultInfo.content.SkuName + repairUsers + _time + "维修" + ".pdf";
			$scope.process.ProcessList[5].State = 1;
			downloadFile(serverPath, localPath, function(localfile, status) {
				if(status == 200) {
					$scope.process.ProcessList[5].State = 2;
					mui.toast("下载成功");
					plus.io.resolveLocalFileSystemURL(localPath, function(entry) {
						plus.runtime.openFile(localPath, {
							top: 10,
							left: 10,
							width: 200,
							height: 200
						}, function(e) {
							mui.toast("无法打开此文件！");
						});
					}, function() {});
					$scope.process.ProcessList[5] && $scope.process.ProcessList.splice(5, 1);
				} else {
					$scope.process.ProcessList[5].State = 3;
					$scope.process.ProcessList[5] && $scope.process.ProcessList.splice(5, 1);
					mui.toast("下载失败");
				}
			})
		}
		//选择维修内容
		$scope.selectDescriptionPhrase = function() {
			UtilsService.openWindow({
				needLogin: true,
				id: "phrase-select.html",
				url: "phrase-select.html?action=select&&type=1",
				extras: {
					selectObj: {
						ID: $scope.repairDesc.ID,
						Content: $scope.repairDesc.Name
					},
					callback: "selectDescriptionPhraseCallback"
				}
			});
		};
		//选择故障描述
		$scope.selectFaultDesc = function() {
			UtilsService.openWindow({
				needLogin: true,
				id: "phrase-select.html",
				url: "phrase-select.html?action=select&&type=3",
				extras: {
					selectObj: {
						ID: $scope.faultDesc.ID,
						Content: $scope.faultDesc.Name
					},
					callback: "selectFaultDescCallback"
				}
			});
		}
		//选择常用短语
		$scope.selectResultPhrase = function() {
			UtilsService.openWindow({
				needLogin: true,
				id: "phrase-select.html",
				url: "phrase-select.html?action=select&&type=2",
				extras: {
					selectObj: {
						ID: $scope.repairResult.ID,
						Content: $scope.repairResult.Name
					},
					callback: "selectResultPhraseCallback"
				}
			});
		};

		function initToday() {
			var url = ApiService.Api50 + "/api/v1/Common/GetSystemDate";
			DataService.get(url).then(function(res) {
				$scope.BuyDate = res;
				$scope.Today = res;
				$scope.isLoad = true;
			});
		}
		initToday();
		$scope.chooseDate = function(key) {
			$scope.planTime = ''
			var selectedDate = key == "LeaveDate" ? $scope.LeaveDate : $scope.ArriveDate;
			DatePickerService.pickDate({
				selected: selectedDate,
				minDate: $scope.Today
			}).then(function(res) {
				key == "LeaveDate" ? ($scope.LeaveDated = res) : ($scope.ArriveDated = res);
				DatePickerService.pickTime({
					selected: selectedDate
				}).then(function(res) {

					key == "LeaveDate" ? ($scope.LeaveDate = $scope.LeaveDated.replace(/\//g, "-") + " " + res) : ($scope.ArriveDate = $scope.ArriveDated.replace(/\//g, "-") + " " + res);
					key == "LeaveDate" ? ($scope.LeaveDateL = $scope.LeaveDated + ',' + res) : ($scope.ArriveDateL = $scope.ArriveDated + ',' + res);
					if($scope.ArriveDate && $scope.LeaveDate) {
						//					$scope.date1 = new Date($scope.ArriveDateL)
						//					$scope.date2 = new Date($scope.LeaveDateL)

						var date1 = new Date($scope.ArriveDate.replace(/-/g, "/"))
						var date2 = new Date($scope.LeaveDate.replace(/-/g, "/"))

						var s1 = date1.getTime(),
							s2 = date2.getTime();
						var total = (s2 - s1) / 1000;

						var day = parseInt(total / (24 * 60 * 60)); //计算整数天数
						var afterDay = total - day * 24 * 60 * 60; //取得算出天数后剩余的秒数
						var hour = parseInt(afterDay / (60 * 60)); //计算整数小时数
						var afterHour = total - day * 24 * 60 * 60 - hour * 60 * 60; //取得算出小时数后剩余的秒数
						var min = parseInt(afterHour / 60); //计算整数分
						var afterMin = total - day * 24 * 60 * 60 - hour * 60 * 60 - min * 60; //取得算出分后剩余的秒数
						var mins = min / 60
						var totaltime = day * 24 + hour + Math.round(mins * 100) / 100

					}

					if(totaltime) {

						if(totaltime > 0) {
							$scope.planTime = totaltime.toString()
						} else {
							mui.toast('离场时间不能小于到场时间')
							$scope.LeaveDate = ""
						}

					}

				});

			});
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
			RPCObserver.broadcast('RPC_RepairViewRefresh');
			//刷新 故障设备详情 的故障维修记录和配件更换记录
			RpcClient.invoke("mat-fault-info.html", "RPC_FaultInfoListRefresh");
			RpcClient.invoke("mat-fault-info.html", "RPC_FaultInfoRefresh");
			//刷新 设备详情 的维修
			RpcClient.invoke("equ-details.html", "RPC_EquRepairRefresh");
			RpcClient.invoke("equ-details.html", "RPC_FaultDelectPactInfo");
			//刷新 维修列表
			RPCObserver.broadcast('refresh_mat_repair_list');
			//刷新 配件更换列表
			RPCObserver.broadcast('refresh_mat_part_list');
			//刷新配件更换详情
			RPCObserver.broadcast("RPC_MatPartInfoRefresh");
			//刷新客户详情-合计 列表
			RPCObserver.broadcast("refresh_my_sxun");
			//刷新 设备维修列表
			RpcClient.invoke("equ-repairList-sub.html", "RPC_EquRepairListRefresh");
			//刷新 客户回访信息
			RpcClient.invoke("eval-edit.html", "RPC_EvalInfoRefresh");
			RpcClient.invoke("eval-info.html", "RPC_EvalInfoRefresh");
			RpcClient.invoke("eval-list-sub.html", "RPC_EvalListRefresh");
			RPCObserver.broadcast('refresh_mat_eval_list');
			//刷新更换新配件页面
			RPCObserver.broadcast("matPartReplacementRef", {
				type: "repair",
				RepairDescription: postData.RepairDescription,
				AudioLength: postData.AudioLength,
				AudioLength: postData.AudioLength
			});
			// 刷新业务预警
			RpcClient.invoke("forewarning-all.html", "RPC_Msg_Change", {
				key: 4,
				init: false
			});
			//刷新维修统计列表
			RpcClient.invoke("repair-statistics.html", "RefreshPage");
			//刷新待办页签
			RpcClient.invoke("msg-list.html", "RPC_UnreadRefreshForChat");
			//刷新 待办列表
			RPCObserver.broadcast('refresh_msg_all_list');
			//刷新 设备维修搜索列表
			//		RpcClient.invoke("mat-repair-search.html", "RPC_MatRepairSearchListRefresh");
			// 客户信息刷新
			RpcClient.invoke("customer-info.html", "RPC_BillViewRefresh", "customer");
		}

		//电子签名部分：
		//isLoad 改为 document.getElementById("content").style.display = "block";
		$scope.datapair = "";
		var screen_height = window.screen.availWidth - 120;
		var screen_width = window.screen.availHeight;
		var $sigdiv = $("#signature").jSignature({
			"width": screen_width,
			"height": screen_height,
			"lineWidth": 7,
			"background-color": "#FFFFFF"
		})
		pubsubprefix = 'jSignature.demo.'
		//电子签名
		$scope.signature = function(key) {
			switch(key) {
				case "show":
					canvas.show();
					plus.screen.lockOrientation('landscape'); //锁死屏幕方向为横屏
					break;
				case "clear":
					$sigdiv.jSignature('reset');
					break;
				case "save":
					$scope.datapair = $sigdiv.jSignature("getData");
					var signatureData = {
						"dataId": $scope.repairId,
						"type": 2,
						"picBase64String": $scope.datapair
					};
					var signUrl = ApiService.Api50 + "/api/v1/File/UploadSignPic";
					DataService.post(signUrl, signatureData).then(function(res) {
						//打印工单
						$scope.print && printOrder();
						$timeout(function() {
							$scope.process.SaveState = 1;
							UtilsService.saveModal(function() {
								isSubmitting = false;
								mui.back();
							});
						}, 800);
					})
					canvas.hide();
					plus.screen.unlockOrientation(); //解除屏幕方向的锁定
					plus.screen.lockOrientation("portrait-primary");
					break;
				case "close":
					canvas.hide();
					plus.screen.unlockOrientation(); //解除屏幕方向的锁定
					plus.screen.lockOrientation("portrait-primary");
					break;
				default:
					break;
			}
		}

		var canvas = {
			show: function() {
				document.getElementById("signatureparent").style.display = "block";
				document.getElementById("header").style.display = "none";
				document.getElementById("content").style.display = "none";
				document.getElementById("footer").style.display = "none";
			},
			hide: function() {
				document.getElementById("signatureparent").style.display = "none";
				document.getElementById("header").style.display = "block";
				document.getElementById("content").style.display = "block";
				document.getElementById("footer").style.display = "block";
			}
		}
	}
]);

//选择人员回调
function selectUserCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.repairUsers = angular.copy(obj);
	$scope.$apply();
}
//维修内容常用短语选择回调
function selectDescriptionPhraseCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.repairDesc.Name = obj.Content;
		$scope.repairDesc.ID = obj.ID;
	} else {
		$scope.repairDesc.Name = ""
		$scope.repairDesc.ID = "";
	}
	$scope.$apply();
}

//维修内容常用短语选择回调
function selectFaultDescCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.faultDesc.Name = obj.Content;
		$scope.faultDesc.ID = obj.ID;
	} else {
		$scope.faultDesc.Name = ""
		$scope.faultDesc.ID = "";
	}
	$scope.$apply();
}
//维修结果常用短语选择回调
function selectResultPhraseCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.repairResult.ID = obj.ID;
		$scope.repairResult.Name = obj.Content;
	} else {
		$scope.repairResult.Name = ""
		$scope.repairResult.ID = "";
	}
	$scope.$apply();
}
//故障归类选择回调
function faultClassCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.matFatClass.ID = obj.id
		$scope.matFatClass.Name = obj.typename
	} else {
		$scope.matFatClass = {};
	}
	$scope.$apply();
}

//故障归类选择回调
function selectDutyCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.matResponsibility.ID = obj.id
		$scope.matResponsibility.Name = obj.rescontent
	} else {
		$scope.matResponsibility = {};
	}
	$scope.$apply();
}
//故障选择回调
function faultSelectCallback(obj) {
	var appElement = document.querySelector('[ng-controller=RepairEditController]');
	var $scope = angular.element(appElement).scope();
	obj.MdCode = obj.MDCode;
	$scope.faultInfo.content = obj;
	$scope.faultInfo.content.HasAudio = obj.AudioLength > 0 ? 1 : 0;
	$scope.matFatClass.ID = obj.MatFaultTypeID;
	$scope.matFatClass.Name = obj.MatFaultTypeName;
	$scope.matResponsibility.ID = obj.ResponsibilityID;
	$scope.matResponsibility.Name = obj.ResponsibilityName;
	$scope.ProdCompID = obj.ProdCompID;
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