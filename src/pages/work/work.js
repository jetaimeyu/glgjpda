var _callback;

app.controller("WorkController", ["$scope", "$Modal", "UtilsService", "CacheService", "$filter", "ApiService", "Loading", "DataService", "CustomModalService", "ChooseService", "RPCObserver", "AuthService", function($scope, $Modal, UtilsService, CacheService, $filter, ApiService, Loading, DataService, CustomModalService, ChooseService, RPCObserver, AuthService) {
	setTimeout(mui.init);
	$scope.loaded = false;
	$scope.showTips = false; //是否维护模式
	//	Loading.show();
	$scope.img = [{
		"imgurl": '../images/chat/yun.jpg'
	}, {
		"imgurl": '../images/chat/wang.jpg'
	}, {
		"imgurl": '../images/chat/tong.jpg'
	}, {
		"imgurl": '../images/chat/bao.jpg'
	}, {
		"imgurl": '../images/chat/ma.jpg'
	}];

	var user = CacheService.get('user');
	user && init(user);
	//	$scope.userCompId = "";

	function init(user) {
		//Loading.show();
		//当前登录人信息
		$scope.user = user;
		$scope.ISJJComp = user && (user.CompID == 266);
		getNewsList();
		getCoPicList()
		//固定应用
		var cache = CacheService.get(user.UserID + "_my_app") || [];
		//						CacheService.remove(user.UserID + "_my_app");
		//						console.log("cache:"+JSON.stringify(cache));
		if(cache.length > 0) {
			//去除客户管理
			//			cache = cache.filter(function(item) {
			//				return item.action != "crm";
			//			});
			//验证应用权限
			(function() {
				var i = cache.length;
				while(i--) {
					if(cache[i] && cache[i].action == "workRecord") {
						if(!$filter("hasMenuAuth")("tygn", "rcgz")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "crm") {
						if(!$filter("hasModuleAuth")("crm")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "prodsale") {
						if(!$filter("hasModuleAuth")("sale") || !$filter("hasAuth")(['Q57'])) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "devLinks") {
						if(!$filter("hasModuleAuth")("iot") || !$filter("hasMenuAuth")("dtcx", "cpfb")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "serviceMap") {
						if(!$filter("hasMenuAuth")("dtcx", "fwdt") || !$filter("hasModuleAuth")("after-sale-analysis")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "aftersaleservice") {
						if(!$filter("hasMenuAuth")("syyy", "fwcx") || !$filter("hasModuleAuth")("after-sale")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i] && cache[i].action == "prodDis") {
						if(!$filter("hasMenuAuth")("dtcx", "cpfb") || !$filter("hasModuleAuth")("product")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "scanProds") {
						if(!$filter("hasMenuAuth")("dtcx", "smdt") || !$filter("hasModuleAuth")("mdcode")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "devicemanagement") {
						if((!$filter("hasMenuAuth")("syyy", "sbgl") && !$filter("hasAuth")(['Q9', "Q14", "Q4"])) || !$filter("hasModuleAuth")("eq")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "devicemanagement") {
						if((!$filter("hasMenuAuth")("syyy", "sbgl") && !$filter("hasAuth")(['Q9', "Q14", "Q4"])) || !$filter("hasModuleAuth")("eq")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "prodsale") {
						if(!$filter("hasAuth")(['Q57'])) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "freeAssembly") {
						if(!$filter("hasAuth")(['Q68']) || !$filter("hasModuleAuth")("product")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "debug") {
						if(!$filter("hasAuth")(['Q30'])) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "faultOrder") {
						if(!$filter("hasAuth")(['Q25'])) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "faultyInfo") {
						if(!$filter("hasAuth")(['Q25'])) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "customerMap") {
						if(!$filter("hasMenuAuth")("dtcx", "khdt") || !$filter("hasModuleAuth")("crm")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "outstock") {
						if(!$filter("hasMenuAuth")("syyy", "cpck") || !$filter("hasModuleAuth")("product")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					if(cache[i] && cache[i].action == "publishOutsourcing") {
						if(!$filter("hasModuleAuth")("out-source")) {
							cache[i].hasAuth = false;
							cache.splice(i, 1);
						}
					}
					
				}
			})();
			//再赋值
			$scope.OtherApp = cache;
		} else {
			$scope.OtherApp = [];
		}
		$scope.CommonApp = [{
			title: "扫一扫",
			icon: "../images/scan_fun.png",
			action: "scan",
			SortID: 0,
			hasAuth: true, //是否有此功能权限(只限我的应用里判断)
			hasAdd: true, //功能是否已加入我的应用
			existed: true //固定的我的应用功能(只限我的应用里判断)
		}];
		if(user.CompID > 0) { //企业用户
			$scope.CommonApp.push({
				title: "待我处理",
				icon: "../images/todo.png",
				action: "workDesk",
				SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			});
			if($filter("hasMenuAuth")("tygn", "rcgz") && $filter("hasModuleAuth")("work")) {
				var title = $scope.ISJJComp ? "工作日志" : "日常工作";
				$scope.CommonApp.push({
					title: title,
					icon: "../images/maintenancelog2.png",
					action: "workRecord",
					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
					hasAuth: true,
					hasAdd: true,
					existed: true //固定的我的应用功能
				});
			}
			$filter("hasModuleAuth")("crm") && $scope.CommonApp.push({
				title: "行程记录",
				icon: "../images/addtirp.png",
				action: "addTrip",
				SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			});
			//			$scope.CommonApp.push({
			//				title: "客户管理",
			//				icon: "../images/customermanagement.png",
			//				action: "crm",
			//				SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
			//				hasAuth: true,
			//				hasAdd: true,
			//				existed: true //固定的我的应用功能
			//			});
			//快捷录入

			//常用应用
			//			$scope.Mods = [{
			//				title: "售后服务",
			//				menus: []
			//			}, {
			//				title: "常用应用",
			//				menus: []
			//			}, {
			//				title: "地图查询",
			//				menus: [
			//
			//					{
			//						title: "装备地图",
			//						icon: "../images/equipmentmap.png",
			//						action: "devMap",
			//						hasAuth: true,
			//						hasAdd: isAppAdd("devMap")
			//					}
			//				]
			//			}, {
			//				title: "供需市场",
			//				menus: [{
			//						title: "维修大厅", //应用名称
			//						icon: "../images/thirdpartyrepair.png", //图标
			//						action: "equThirdpartRepair", //点击响应事件
			//						hasAuth: true,
			//						hasAdd: isAppAdd("equThirdpartRepair")
			//					},
			//					{
			//						title: "交易大厅", //应用名称
			//						icon: "../images/img-jiaoyi.png", //图标
			//						action: "jiaoyi", //点击响应事件
			//						hasAuth: true,
			//						hasAdd: isAppAdd("jiaoyi")
			//					},
			//					{
			//						title: "租赁大厅", //应用名称
			//						icon: "../images/img-zulin.png", //图标
			//						action: "zulin", //点击响应事件
			//						hasAuth: true,
			//						hasAdd: isAppAdd("zulin")
			//					},
			//					{
			//						title: "回收大厅", //应用名称
			//						icon: "../images/img-huishou.png", //图标
			//						action: "huishou", //点击响应事件
			//						hasAuth: true,
			//						hasAdd: isAppAdd("huishou")
			//					}
			//				]
			//			}];

			//安装调试
			//			$filter("hasAuth")(['Q30']) && $scope.Mods[0].menus.push({
			//				title: "安装调试",
			//				icon: "../images/newdebug.png",
			//				action: "debug",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("debug")
			//			});
			//			if($filter("hasAuth")(['Q25'])) {
			//				$scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
			//					title: "来电报修",
			//					icon: "../images/callforrepair.png",
			//					action: "faultOrder",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("faultOrder")
			//				}, {
			//					title: "现场维修",
			//					icon: "../images/newrepair.png",
			//					action: "faultyInfo",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("faultyInfo")
			//				}]);
			//			}
			//			$filter("hasAuth")(['Q68']) && ($scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
			//				title: "锁定装配",
			//				icon: "../images/machine-assembly@3x.png",
			//				action: "freeAssembly",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("freeAssembly")
			//
			//			}]));
			//
			//			$filter("hasMenuAuth")("syyy", "fwcx") && ($scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//				title: "服务查询",
			//				icon: "../images/sellafter.png",
			//				action: "aftersaleservice",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("aftersaleservice")
			//			}]));
			//
			//			$filter("hasMenuAuth")("dtcx", "cpfb") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
			//				title: "产品分布",
			//				icon: "../images/dev_maps.png",
			//				action: "prodDis",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("prodDis")
			//
			//			}]));
			//			$filter("hasMenuAuth")("dtcx", "fwdt") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
			//				title: "服务地图",
			//				icon: "../images/servicemap.png",
			//				action: "serviceMap",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("serviceMap")
			//			}]));
			//			$filter("hasMenuAuth")("dtcx", "smdt") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
			//				title: "扫码地图",
			//				icon: "../images/scanmap.png",
			//				action: "scanProds",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("scanProds")
			//
			//			}]));
			//			if($filter("hasMenuAuth")("syyy", "khgl")) {
			//				$scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//					title: "客户档案",
			//					icon: "../images/customermanagement.png",
			//					action: "customer",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("customer")
			//				}]);
			//			}
			//			if($filter("hasMenuAuth")("syyy", "sbgl") || $filter("hasAuth")(['Q9', "Q14", "Q4"])) {
			//				$scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//					title: "设备管理",
			//					icon: "../images/equipmentlibrary.png",
			//					action: "devicemanagement",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("devicemanagement")
			//				}]);
			//			}
			//			$scope.Mods[1].menus = $scope.Mods[1].menus.concat([
			//
			//				{
			//					title: "企业定制",
			//					icon: "../images/eqinsprule.png",
			//					action: "customized",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("customized")
			//				}
			//			]);
			//销售记录
			//			$filter("hasAuth")(['Q57']) && $scope.Mods[1].menus.push({
			//				title: "销售记录",
			//				icon: "../images/workdeskmanage.png",
			//				action: "prodsale",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("prodsale")
			//			});

		} else { //个人用户
			//			$scope.Mods = [{
			//					title: "地图查询",
			//					menus: [{
			//						title: "装备地图",
			//						icon: "../images/equipmentmap.png",
			//						action: "devMap",
			//						hasAuth: true,
			//						hasAdd: isAppAdd("devMap")
			//					}]
			//				},
			//				{
			//					title: "供需市场",
			//					menus: [{
			//							title: "维修大厅", //应用名称
			//							icon: "../images/thirdpartyrepair.png", //图标
			//							action: "equThirdpartRepair", //点击响应事件
			//							hasAuth: true,
			//							hasAdd: isAppAdd("equThirdpartRepair")
			//						},
			//						{
			//							title: "交易大厅", //应用名称
			//							icon: "../images/img-jiaoyi.png", //图标
			//							action: "jiaoyi", //点击响应事件
			//							hasAuth: true,
			//							hasAdd: isAppAdd("jiaoyi")
			//						},
			//						{
			//							title: "租赁大厅", //应用名称
			//							icon: "../images/img-zulin.png", //图标
			//							action: "zulin", //点击响应事件
			//							hasAuth: true,
			//							hasAdd: isAppAdd("zulin")
			//						},
			//						{
			//							title: "回收大厅", //应用名称
			//							icon: "../images/img-huishou.png", //图标
			//							action: "huishou", //点击响应事件
			//							hasAuth: true,
			//							hasAdd: isAppAdd("huishou")
			//						}
			//					]
			//				}
			//			];
			$scope.CommonApp.push({
				title: "待我处理",
				icon: "../images/todo.png",
				action: "workTodoPer",
				SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			});
			$scope.CommonApp = $scope.CommonApp.concat([{
				title: "现场维修",
				icon: "../images/newrepair.png",
				action: "faultyInfo",
				SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能

			}, {
				title: "产品故障",
				icon: "../images/failurework.png",
				action: "faultOrderPer",
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			}, {
				title: "故障维修",
				icon: "../images/troubleshooting.png",
				action: "faultyInfoPer",
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能

			}, {
				title: "零配件更换",
				icon: "../images/partsreplacement.png",
				action: "partInfolistPer",
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			}, {
				title: "工作量统计",
				icon: "../images/newrepair.png",
				action: "repairStatistics",
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			}, {
				title: "配件更换统计",
				icon: "../images/todo.png",
				action: "partStatistic",
				hasAuth: true,
				hasAdd: true,
				existed: true //固定的我的应用功能
			}])
			//快捷录入;
			//			$scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
			//					title: "故障报修",
			//					icon: "../images/neweqfault.png",
			//					action: "faultRepairPer"
			//
			//				},
			//				{
			//					title: "新增设备",
			//					icon: "../images/newequ.png",
			//					action: "addEquPer"
			//
			//				},
			//				{
			//					title: "来电报修",
			//					icon: "../images/callforrepair.png",
			//					action: "faultOrder"
			//
			//				},
			//				{
			//					title: "现场维修",
			//					icon: "../images/newrepair.png",
			//					action: "faultyInfo"
			//
			//				}
			//			]);
			//常用应用
			//			$scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//					title: "产品故障",
			//					icon: "../images/failurework.png",
			//					action: "faultOrderPer"
			//				},
			//				{
			//					title: "故障维修",
			//					icon: "../images/troubleshooting.png",
			//					action: "faultyInfoPer"
			//
			//				},
			//				{
			//					title: "零配件更换",
			//					icon: "../images/partsreplacement.png",
			//					action: "partInfolistPer"
			//				},
			//				{
			//					title: "设备管理",
			//					icon: "../images/eqmaintenance.png",
			//					action: "equListPer"
			//
			//				},
			//				{
			//					title: "投产地维护",
			//					icon: "../images/eqsitemaintenance.png",
			//					action: "posListPer"
			//
			//				}
			//			]);
		}
		//待我处理
		GetTodoCount();

		//设置工作日志的角标
		!$scope.ISJJComp && setWorkLogBadge();
	}

	var mui_back = mui.back;
	mui.back = function() {
		if($Modal.modals().length > 0) {
			$Modal.close();
			return;
		}
		mui_back()
	}

	$scope.tap = function(_key) {
		if(_key == "faultRepairPer") {
			$scope.chooseFaultType();
			return;
		}
		var url = {
			aftersaleservice: '../pages/aftersale/index.html',
			devicemanagement: '../pages/eqmentlib/index.html',
			faultOrder: '../pages/aftersale/mat-fault-edit.html?source=telFault', //'../pages/aftersale/mat-order.html',//'../pages/aftersale/mat-fault-edit.html?source=telFault',
			faultyInfo: '../pages/aftersale/mat-repair.html',
			freeAssembly: '../pages/assembly/free-assembly.html',
			workRecord: $scope.ISJJComp ? '../pages/aftersale/work-edit.html' : '../pages/aftersale/work-list.html',
			workDesk: '../pages/work/work-desk.html',
			scan: '../pages/scan/scan.html',
			//scanProds: '../pages/map/template.html?key=scanprods',
			scanProds: '../pages/map/prod-scan-map.html',
			assist: '../pages/bid/assist.html',
			outsourcing: '../pages/outsourcing/comp-map.html',
			prodDis: '../pages/map/prod-dis-map.html',
			serviceMap: '../pages/map/service-map.html', //'../pages/map/template.html?key=services',
			customer: '../pages/customer/customer-list.html',
			customized: '../pages/customized/index.html',
			prodsale: '../pages/problib/prod-sales-record.html',
			repairStatistics: '../pages/stats/repair-statistic.html',
			partStatistic: '../pages/stats/part-statistic.html',
			eqLogs: '../pages/scan/scan.html?actionType=eq-Log',
			//个人
			workTodoPer: '../work/msg-all.html?from=personal',
			faultRepairPer: '../pages/eqmentlib/fault-edit.html',
			faultOrderPer: '../pages/aftersale/mat-fault-list.html',
			faultyInfoPer: '../pages/aftersale/mat-repair-list.html',
			partInfolistPer: '../pages/aftersale/mat-part-infolist-head.html',
			addEquPer: '../pages/eqmentlib/equ-edit.html',
			equListPer: '../pages/eqmentlib/equ-list.html',
			posListPer: '../pages/eqmentlib/pos-list.html',
			devMap: '../pages/map/eq-map.html',
			equThirdpartRepair: '../pages/eqmentlib/equ-thirdpart-repair-list.html',
			jiaoyi: "../pages/eqmentlib/equ-hall-list.html?state=3",
			zulin: "../pages/eqmentlib/equ-hall-list.html?state=11",
			huishou: "../pages/eqmentlib/equ-hall-list.html?state=9",
			crm: "../pages/crm/index.html",
			addTrip: '../pages/crm/index.html#/check?backIndex=1',
			customerMap: "../pages/map/customer-map.html",
			outstock: "../pages/outstock/supply_chain.html",
			publishOutsourcing: "../pages/outsourcing/demand-edit.html",
			devLinks: "../pages/map/dev-map-links.html",
			outsourcingManagement:'../pages/outsourcing/index.html',
			"demandHall": '../pages/outsourcing/demands.html'
		};
		var title = {
			workTodoPer: "待我处理"
		};
		switch(_key) {
			case "eqLogs":
				UtilsService.openWindow({
					needLogin: true,
					id: url[_key].substring(url[_key].lastIndexOf('/') + 1),
					url: url[_key],
					extras: {
						type: "eq"
					}
				});
				break;
			case "debug":
				//CustomModalService.debug();
				UtilsService.openWindow({
					needLogin: true,
					id: 'debug-edit.html',
					url: '../pages/aftersale/debug-edit.html'
				});
				break;
			case "prodlib":
				UtilsService.openWindow({
					needLogin: true,
					id: 'complib-index.html',
					url: '../pages/complib/index.html?compid={CompID}'
				});
				break;
			case "workTodoPer":
				UtilsService.openWindow({
					needLogin: true,
					id: "hyperlink.html",
					url: "../pages/common/hyperlink.html",
					extras: {
						hyperlink: {
							title: title[_key],
							url: url[_key]
						}
					}
				});
				break;
			case 'devicemanagement':
				UtilsService.openWindow({
					needLogin: true,
					id: 'equ-index.html',
					url: '../pages/eqmentlib/index.html'
				});
				break;
			default:
				UtilsService.openWindow({
					needLogin: true,
					id: url[_key].substring(url[_key].lastIndexOf('/') + 1),
					url: url[_key]
				});
				break;
		}

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
						_data.EqJane = data.resInfo.EqJane;
						var _compId = "";

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
		var url = "../pages/aftersale/mat-fault-submit.html";
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

	RPCObserver.on('refresh_inventory_info', 'refresh_inventory_info');
	window.refresh_inventory_info = function() {
		//		$scope.mySwiper2.destroy()
		$scope.$apply(getNewsList())
	}
	//获取新闻列表
	function getNewsList() {
		$scope.newslist = [];
		var url = ApiService.Api52 + "/api/v1/News/GetMdtCoUnewsList?compId=" + $scope.user.CompID;
		DataService.get(url).then(function(res) {
			if($scope.mySwiper2) {
				$scope.mySwiper2.destroy()
			}
			$scope.notice = res.DataRows.map(function(item) {
				return item
			})
			$scope.newslist = $scope.notice;

			if($scope.notice.length != 1) {
				setTimeout(function() {
					$scope.mySwiper2 = new Swiper('#swiper2', {
						init: false,
						initialSlide: 0,
						watchOverflow: true,
						speed: 1000,
						height: 50,
						direction: 'vertical',
						autoplay: true,
						loop: true,
						autoHeight: false,
						allowTouchMove: false,
						observer: true, //修改swiper自己或子元素时，自动初始化swiper
						observeParents: true, //修改swiper的父元素时，自动初始化swiper 

					})
					$scope.mySwiper2.updateSlides();
					$scope.mySwiper2.update()
					$scope.mySwiper2.init();

				}, 700);
			} else {
				setTimeout(function() {
					$scope.mySwiper2 = new Swiper('#swiper2', {
						watchOverflow: true,
					})
					$scope.mySwiper2.autoplay.stop();
					$scope.mySwiper2.updateSlides();
					$scope.mySwiper2.update()

				}, 700);

				return false;
			}

			//Loading.hide();
			$scope.loaded = true;
		}, function() {
			$scope.loaded = true;
		});
	};

	//获取自己企业的宣传图
	function getCoPicList() {
		var url = ApiService.Api52 + "/api/v1/Comp/GetMdtCoPicList";
		DataService.get(url).then(function(res) {

			if(res.length > 0) {
				$scope.picPath = res.map(function(item) {
					return ApiService.Api52 + "/api/v1/File/DownLoadPic?filePath=" + item.PicPath
				})

			} else {
				$scope.picPath = $scope.img.map(function(item) {
					return item.imgurl
				})

			}
			if($scope.mySwiper) {

				$scope.mySwiper.destroy()
			}

			setTimeout(function() {

				$scope.mySwiper = new Swiper('#swiper1', {
					init: false,
					initialSlide: 0,
					watchOverflow: true,
					speed: 1000,
					autoplay: {
						delay: 1000, //1秒切换一次
					},
					loop: true,
					effect: 'cube',
					cubeEffect: {
						slideShadows: false,
						shadow: false,
						shadowOffset: 100,
						shadowScale: 0.6
					},
					observer: true, //修改swiper自己或子元素时，自动初始化swiper
					observeParents: true, //修改swiper的父元素时，自动初始化swiper 

				});
				$scope.mySwiper.updateSlides();
				$scope.mySwiper.update()
				$scope.mySwiper.init();

			}, 700)

			//Loading.hide();
			$scope.loaded = true;
		}, function() {
			$scope.loaded = true;
		});
	};

	$scope.gomore = function() {
		UtilsService.openWindow({
			needLogin: true,
			id: "compnotice.html",
			url: "../pages/complib/compnotice.html"
		});

	};

	$scope.gonewsinfo = function(id) {
		//		alert(1)
		UtilsService.openWindow({
			needLogin: true,
			id: "noticeinfo.html",
			url: "../pages/complib/noticeinfo.html?id=" + id
		});
	}
	//验证是否已加入我的应用
	function isAppAdd(key) {
		return $scope.OtherApp.some(function(app, index) {
			return app.action == key;
		});
	}
	//刷新登陆
	RpcServer.expose("RPC_RefreshLogin", function(params) {
		params = params ? params : CacheService.get('user');

		init(params);

		$scope.$apply();
	});

	//获取用户信息
	RpcServer.expose("RPC_GetUserInfo", function(params, callback) {
		callback(CacheService.get('user'));
	});

	//跳转故障工单
	RpcServer.expose("RPC_OpenFaultList", function(params) {
		openListPage('aftersale/mat-fault-statistics.html', params);
	});

	//跳转故障维修
	RpcServer.expose("RPC_OpenRepairList", function(params) {
		openListPage('aftersale/mat-repair-statistics.html', params);
	});

	//跳转配件更换
	RpcServer.expose("RPC_OpenPartList", function(params) {
		openListPage('aftersale/mat-part-statistics.html', params);
	});

	//刷新待我处理的数量
	RpcServer.expose("RPC_RefToDo", function(params) {
		var _dom = document.querySelector("#span_todo");

		var value = _dom.getAttribute("data-value");

		value = parseInt(value) + 1;
		if(_dom) {
			_dom.setAttribute("data-value", value);
			_dom.innerText = value > 99 ? "99+" : value;
			_dom.style.display = value > 0 ? "block" : "none";
			_dom.innerText.length == 1 && (_dom.style.right = "12px");
			(_dom.innerText.length == 2 || _dom.innerText.length == 3) && (_dom.style.right = "10px");
		}
		//plus.Push.setCutBadger(value);
	});

	//获取待物处理的未读数量
	function GetTodoCount() {
		var url = ApiService.Api50 + "/api/v1/Common/GetTaskWaitForMeCount";

		DataService.get(url).then(function(res) {
			var _dom = document.querySelector("#span_todo");
			if(_dom) {
				_dom.setAttribute("data-value", res);
				_dom.innerText = res > 99 ? "99+" : res;
				_dom.style.display = res > 0 ? "block" : "none";
				_dom.innerText.length == 1 && (_dom.style.right = "12px");
				(_dom.innerText.length == 2 || _dom.innerText.length == 3) && (_dom.style.right = "10px");
			}

			//plus.Push.setCutBadger(res);

			Rpc_RefTabTodo(res);

		}, function() {

		});
	};

	RpcServer.expose("RefTodoCount", function() {
		GetTodoCount();
	})

	//刷新tab页面工作角标
	function Rpc_RefTabTodo(count) {
		RpcClient.invoke("tab.html", "RPC_RefToDo", count);
	}

	//当待我处理页面关闭时候的回调函数
	window.TodoBack = function() {
		GetTodoCount();
	};

	//当待我处理页面关闭时候的回调函数
	window.WorkLogBack = function() {
		setWorkLogBadge(function(_count) {
			RpcClient.invoke("tab.html", "RPC_RefToDoWorkLog", _count);
		});
	};

	//选择产品型号
	RpcServer.expose("RPC_SelectProdSku", function(params, callback) {
		_callback = callback;
		var isall = (params && params.hasOwnProperty('isall')) ? params.isall : true;
		var url = "../pages/problib/index.html?state=selsku&isall=" + isall;
		params && params.hasOwnProperty('type') && [1, 2].indexOf(params.type) >= 0 && (url += "&type=" + params.type);
		openWindow(url, {
			callback: 'selsku'
		}, 'problib-index.html');
	});

	//打开列表页面
	function openListPage(url, params) {
		var winid = url.substring(url.lastIndexOf('/') + 1);
		params && Object.keys(params).forEach(function(prop) {
			params[prop] != undefined && (url = $filter('addUrlParam')(url, prop, params[prop]));
		});
		openWindow(url, {}, winid);
	}

	//设置工作日志角标
	function setWorkLogBadge(callback) {
		if((user && user.CompID == 0) || !$filter("hasMenuAuth")("tygn", "rcgz") || !$filter("hasModuleAuth")("work") || $scope.ISJJComp) {
			typeof callback == "function" && (callback(0));
			return;
		}

		getWorkLogCount(function(_count) {
			renderLogBadge(_count);
			typeof callback == "function" && (callback(_count));
		});
	}
	//获取工作日志的数量
	function getWorkLogCount(callback) {
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetPagedMatWorkOrderWorkLogUnReadCount"
		DataService.get(url).then(function(res) {
			callback(res < 0 ? 0 : res);
		});
	}

	//刷新角标
	RpcServer.expose("RPC_RefToDoWorkLog", function(isRefresh) {

		if(isRefresh) {
			setWorkLogBadge(function(_count) {
				RpcClient.invoke("tab.html", "RPC_RefToDoWorkLog", _count);
			});
		} else {
			var _dom = document.querySelector("#span_badge_log");

			var _count = parseInt(_dom.getAttribute("data-value")) + 1;

			renderLogBadge(_count);
		}
	});

	function renderLogBadge(_count) {
		var _dom = document.querySelector("#span_badge_log");
		if(_dom) {
			_dom.innerText = _count;
			_dom.setAttribute("data-value", _count);
			_dom.style.display = _count > 0 ? "block" : "none";
			_dom.innerText.length == 1 && (_dom.style.right = "12px");
			(_dom.innerText.length == 2 || _dom.innerText.length == 3) && (_dom.style.right = "10px");
		}
	}
	//维护按钮
	document.getElementById("edit").addEventListener('tap', function() {
		UtilsService.openWindow({
			needLogin: true,
			id: "app-setting.html",
			url: "../pages/app-setting.html",
			extras: {
				callback: "appSettingCallback"
			}
		});
	});
	window.appSettingCallback = function() {
		$scope.OtherApp = [];
		var cuser = CacheService.get('user');
		init(cuser);
		$scope.$apply();
	}
}]);

function selsku(res) {
	_callback(res);
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});