app.controller("EqController", ["$scope", "$filter", "UtilsService", "AuthService", "Loading", "RPCObserver", "ChooseService", "$Modal", function($scope, $filter, UtilsService, AuthService, Loading, RPCObserver, ChooseService, $Modal) {
	setTimeout(mui.init);
	init()
	Loading.show();
	$scope.loaded = false;
	$scope.isIphone5 = (plus.device.model == "iPhone5");

	function init() {
		AuthService.getAuth().then(function(user) {
			//当前登录人信息
			$scope.user = user;
			$scope.loaded = true;
			Loading.hide();
			$scope.menu = [];

			$filter("hasAuth")(['Q9']) && $scope.menu.push({
				title: "故障报修",
				icon: "../../images/neweqfault.png",
				action: "faultrepair"
			}, {
				title: "设备维修",
				icon: "../../images/newrepair.png",
				action: "repairList"
			});
			if($filter("hasMenuAuth")("syyy", "sbgl")) {
				if($filter("hasMenuAuth")("syyy", "sbgl", "sjcx")) {
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "sbxjjh") && $scope.menu.push({
						title: "设备巡检",
						icon: "../../images/newinsp.png",
						action: "inspList"
					});

					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "sbbyjh") && $scope.menu.push({
						title: "保养计划",
						icon: "../../images/byjh.png",
						action: "preserveplanlist"

					});
				}
			}

			//			$filter("hasAuth")(['Q9']) && $scope.menu.push({
			//				title: "设备保养",
			//				icon: "../../images/preserve.png",
			//				action: "preserve"
			//			});

			//			$filter("hasAuth")(['Q9']) && $scope.menu.push({
			//				title: "保养计划",
			//				icon: "../../images/customerevaluation.png",
			//				action: "preserveplanlist"
			//
			//			});

			$filter("hasAuth")(['Q4']) && $scope.menu.push({
				title: "新增资产",
				icon: "../../images/newequ.png",
				action: "add"
			});

			$filter("hasAuth")(['Q81']) && $scope.menu.push({
				title: "设备投产",
				icon: "../../images/commissioning.png",
				action: "commissioning"
			});

			var autharr = {
				title: "业务操作",
				menus: $scope.menu
			};

			var _oldBack = mui.back;

			mui.back = function() {
				if($Modal.modals().length > 0) {
					$Modal.close();
					return;
				} else {
					_oldBack();
				}
			};

			//常用应用

			$scope.CommonApp = [{
				title: "数据查询",
				menus: []
			}];
			if($filter("hasMenuAuth")("syyy", "sbgl")) {
				$filter("hasMenuAuth")("syyy", "sbgl", "sbgz") && $scope.menu.push({
					title: "设备购置",
					icon: "../../images/purchase.png",
					action: "purchase"
				});
				$filter("hasMenuAuth")("syyy", "sbgl", "sbckgl") && $scope.CommonApp[0].menus.push({
					title: "资产仓库",
					icon: "../../images/warehouse.png",
					action: "warehouse"
				});

				$filter("hasMenuAuth")("syyy", "sbgl", "sbbflb") && $scope.CommonApp[0].menus.push({
					title: "报废资产",
					icon: "../../images/scrap.png",
					action: "scrap"
				});
				$filter("hasMenuAuth")("syyy", "sbgl", "sbshjl") && $scope.menu.push({
					title: "设备审核",
					icon: "../../images/examine.png",
					action: "examine"
				});
				$filter("hasMenuAuth")("syyy", "sbgl", "sbpdjh") && $scope.menu.push({
					title: "盘点计划",
					icon: "../../images/inventory-plan.png",
					action: "inventoryplan"
				});
				$scope.menu.push({
					title: "操作日志",
					icon: "../../images/customerevaluation.png",
					action: "eqLogs"
				});

				if($filter("hasMenuAuth")("syyy", "sbgl", "sjcx")) {
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "gzjl") && $scope.CommonApp[0].menus.push({
						title: "故障记录",
						icon: "../../images/eqfailure.png",
						action: "faultList"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "wxjl") && $scope.CommonApp[0].menus.push({
						title: "维修记录", //应用名称
						icon: "../../images/eqcareplan.png", //图标
						action: "repaiRecard" //点击响应事件
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "pjghjl") && $scope.CommonApp[0].menus.push({
						title: "配件更换记录",
						icon: "../../images/eqreplacement.png",
						action: "partInfolist"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "byjl") && $scope.CommonApp[0].menus.push({
						title: "保养记录",
						icon: "../../images/maintainrecords.png",
						action: "equpreserve"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "dbysb") && $scope.CommonApp[0].menus.push({
						title: "待保养设备",
						icon: "../../images/pendingmaintenanceequipment.png",
						action: "waitPreserve"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "sbda") && $scope.CommonApp[0].menus.push({
						title: "资产档案", //应用名称
						icon: "../../images/eqmaintenance.png", //图标
						action: "equList" //点击响应事件
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "dxjjh") && $scope.CommonApp[0].menus.push({
						title: "待巡检计划",
						icon: "../../images/eqinspecting.png",
						action: "waitingPatrol"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "yxjjh") && $scope.CommonApp[0].menus.push({
						title: "已巡检记录",
						icon: "../../images/eqinspection.png",
						action: "equcheck"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "xjyctj") &&  $scope.CommonApp[0].menus.push({
						title: "巡检异常统计",
						icon: "../../images/patrol-anomaly-statistics.png",
						action: "patrolunusualstatistics"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "dbyjh") && $scope.CommonApp[0].menus.push({
						title: "待保养计划",
						icon: "../../images/dbyjh.png",
						action: "waitPreservePlan"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "ybyjh") && $scope.CommonApp[0].menus.push({
						title: "已保养记录",
						icon: "../../images/ybysb.png",
						action: "donePreservePlan"
					});
					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "byyctj") &&  $scope.CommonApp[0].menus.push({
						title: "保养异常统计",
						icon: "../../images/byyctj.png",
						action: "maintentunomalystatistics"
					});

					//					$filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "dxjsb") && $scope.CommonApp[0].menus.push({
					//						title: "待巡检设备",
					//						icon: "../../images/eqinspecting.png",
					//						action: "waitOverhaul"
					//					});
					if($filter("hasMenuAuth")("syyy", "sbgl", "sjcx", "tcdt")) {
						$scope.CommonApp[0].menus.push({
							title: "投产地图", //应用名称
							icon: "../../images/productionmap.png", //图标
							action: "produceMap" //点击响应事件
						});
					};
				}
				$filter("hasMenuAuth")("syyy", "sbgl", "dpdjl") && $scope.CommonApp[0].menus.push({
					title: "待盘点设备",
					icon: "../../images/waiting-inventory.png",
					action: "waitinginventory"
				});
				$filter("hasMenuAuth")("syyy", "sbgl", "ypdjl") && $scope.CommonApp[0].menus.push({
					title: "盘点记录",
					icon: "../../images/has-inventory.png",
					action: "hasinventory"
				});
				$filter("hasMenuAuth")("syyy", "sbgl", "pdyctj") && $scope.CommonApp[0].menus.push({
					title: "盘点异常统计",
					icon: "../../images/inventory-anomaly-statistics.png",
					action: "inventoryanomalystatistics"
				});

			}

			// $filter("hasAuth")(['Q15']) && $scope.CommonApp[0].menus.splice(6,0,{
			// title: "巡检标准",
			// icon: "../../images/eqinsprule.png",
			// action: "inspPlanRule"
			// });

			if($scope.menu.length > 0) {

				$scope.CommonApp.unshift(autharr)
			}
		});

	}
	$scope.tap = function(_key) {

		if(_key == "faultrepair" || _key == "faultEdit") {
			$scope.chooseFaultType();
			return;
		}

		var url = {
			"equList": "equ-list.html",
			"waitingPatrol": "equ-patrol-list-all.html?type=1",
			"equcheck": "equ-patrol-list-all.html?type=2",
			//"equcheck": "insp-list.html",
			"patrolunusualstatistics": "equ-patrol-unusual-list.html",
			"equinsp": "insp-recard-list.html",
			"repaiRecard": "repair-list.html",
			"add": "equ-edit.html",
			"posList": 'pos-list.html',
			"faultList": 'fault-list.html',
			"faultrepair": 'fault-edit.html',
			"repairList": 'equ-repair.html',
			"partInfolist": 'part-infolist-head.html',
			//"inspList": 'equ-maintenance.html',
			"inspList": "equ-patrol-list-header.html",
			"preserve": 'equ-preserve.html',
			"equpreserve": 'preserve-list.html',
			"inspPlanRule": 'insp-rule-list.html',
			"waitOverhaul": 'wait-overhaul-head.html',
			"waitPreserve": 'wait-preserve-head.html',
			"purchase": "equ-new-p-list.html",
			"warehouse": "equ-warehouse-list-head.html",
			"waitPreservePlan": "equ-waitPreservePlan.html?type=1",
			"donePreservePlan": 'equ-mainten-done-list-header.html?type=2',
			"maintentunomalystatistics": "equ-maintent-unusual-list.html",

			"preserveplanlist": 'equ-maintainted-plan-list-haeder.html',
			"commissioning": "equ-commissioning.html",
			"scrap": "equ-scrapping-list-head.html",
			"examine": "equ-approve-list-header.html",
			"inventoryplan": "equ-inventory-list-header.html",
			"scan": "../scan/scan.html",
			"edit": "equ-edit.html",
			"faultEdit": "fault-edit.html",
			"repair": "equ-repair.html",
			"inventoryanomalystatistics": "equ-check-unusual-list.html",
			"eqLogs": '../scan/scan.html?actionType=eq-Log',
			"hasinventory": "equ-check-list.html?type=2",
			"waitinginventory": "equ-check-list.html?type=1",
			"inspPlan": "insp-plan-list.html",
			"addInsp": "equ-maintenance-details.html",
			"produceMap": "../map/template.html?key=produce"
		};
		var extras = {};
		if(_key == "scan") {
			extras = {
				type: "eq"
			}
		}
		UtilsService.openWindow({
			needLogin: true,
			id: url[_key],
			url: url[_key],
			extras: extras
		});
		mui('#popover').popover('hide');
	};

	$scope.chooseFaultType = function() {
		mui('#popover').popover('hide');
		ChooseService.equFault(function(type, data) {
			//清除view
			UtilsService.clearWindow();

			if(type == 1) {
				var _data = data;
				setTimeout(function() {
					_data.EqID = _data.ID;
					_data.EqSkuName = _data.SkuName;
					_data.CompID = _data.SourceCompID;
					_data.MDCode = _data.SourceMDCode;
					_data.Maplat = _data.MapLat;
					_data.Maplng = _data.MapLng;
					_data.SkuID = _data.ProdSkuID;
					openFault(1, _data);
				}, 500);
			} else if(type == 2) {
				// console.log(data)
				data = JSON.parse(data);
				setTimeout(function() {
					var _data = {};
					if(data.resType == 1) //产品
					{
						// data.resInfo.SkuName = decodeURIComponent(data.resInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
						// data.resInfo.ProdName = decodeURIComponent(data.resInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");

						// _data = data.resInfo;
						// _data.EqID = 0;
						// _data.MDCode = data.codeValue;

						plus.nativeUI.toast("请扫描设备码!");

					} else if(data.resType == 2) { //设备
						_data.EqID = data.resInfo.ID;
						_data.EqName = data.resInfo.EqName;
						_data.EqIdentifier = data.resInfo.EqIdentifier;
						_data.EqSkuName = data.resInfo.SkuName;
						_data.SourceMDCode = data.resInfo.SourceMDCode || "";
						_data.Maplat = data.resInfo.MapLat; //纬度
						_data.Maplng = data.resInfo.MapLng; //经度
						_data.Address = data.resInfo.Address; //详细地址
						_data.Province = data.resInfo.Province; //省
						_data.City = data.resInfo.City; //市
						_data.District = data.resInfo.District; //区
						_data.Street = data.resInfo.Street; //街道
						var _compId = "";
						_data.EqJane = data.resInfo.EqJane;
						data.resInfo.ProdInfo && (_compId = data.resInfo.ProdInfo.CompID);
						_data.CompID = _compId;

						_data.MDCode = data.codeValue;

						if(data.resInfo.ProdInfo) {
							_data.ProdID = data.resInfo.ProdInfo.ProdID;
							_data.ProdName = data.resInfo.ProdInfo.ProdName;
							_data.SkuID = data.resInfo.ProdInfo.SkuID;
							_data.SkuName = data.resInfo.ProdInfo.SkuName;
							_data.CompName = data.resInfo.ProdInfo.CompName;
							_data.IsNew = data.resInfo.ProdInfo.IsNew;
							_data.ProdInnerCode = data.resInfo.ProdInfo.ProdInnerCode;
						}

						openFault(2, _data);
					}
				}, 500);
			}
		})
	};

	function openFault(type, data) {
		var url = "../aftersale/mat-fault-submit.html";
		var id = "mat-fault-submit.html";

		var extras = {
			prodInfo: data
		};

		// if (type == 1 || (type == 2 && !data.SourceMDCode)) {
		// 	url = "fault-edit.html";
		// 	id = "fault-edit.html";

		// 	extras = {
		// 		addEquRecord: data
		// 	};
		// }

		UtilsService.openWindow({
			needLogin: true,
			id: id,
			url: url,
			extras: extras
		});
	}

	RPCObserver.on('close_popover', 'close_popover');
	window.close_popover = function() {
		mui('#popover').popover('hide');
	}
	//切换后台刷新
	RpcServer.expose("RPC_RefEquIndex", function() {
		init();
	});

}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	plus.webview.currentWebview().setStyle({
		scrollIndicator: 'none'
	})
});