var _callback;

app.controller("AppController", ["$scope", "$Modal", "UtilsService", "CacheService", "$filter", "ApiService", "Loading", "DataService", "CustomModalService", "ChooseService", "RPCObserver", "AuthService", "$q", function($scope, $Modal, UtilsService, CacheService, $filter, ApiService, Loading, DataService, CustomModalService, ChooseService, RPCObserver, AuthService, $q) {
	setTimeout(mui.init);
	//Loading.show();
	$scope.loaded = false;
	$scope.showTips = true; //是否维护模式
	Loading.show();
	var user = CacheService.get('user');
	//	user && init(user);
	user && getUserAuth();

	//	function getUserAuth() {
	//		var promises = [AuthService.getMenuAuth()];
	//		$q.all(promises).then(function(res) {
	//			CacheService.set("menuAuth", res[0], true);
	//			init(user);
	//		});
	//	};

	function getUserAuth() {
		var promises = [AuthService.getUserAuth(), DataService.get(ApiService.Api50 + '/api/v1/Org/OrgEditAuth'), AuthService.getMenuAuth(), AuthService.getYunModuleAuthority()];
		$q.all(promises).then(function(res) {
			res[1] && res[0].push('Q0');
			CacheService.set("userAuth", res[0], true);
			CacheService.set("menuAuth", res[2], true);
			CacheService.set("moduleAuth", res[3], true);
			init(user);
		});
	};

	function init(user) {
		//当前登录人信息
		$scope.user = user;
		//固定应用
		var cache = CacheService.get(user.UserID + "_my_app") || [];
		if(cache.length > 0) {
			//去除客户管理
			//			cache = cache.filter(function(item) {
			//				return item.action != "crm";
			//			});
			//2、验证应用权限
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
					if(cache[i] && cache[i].action == "outsourcingManagement") {
						if(!$filter("hasMenuAuth")("syyy", "wxgl","wdxq")||!$filter("hasMenuAuth")("syyy", "wxgl","wdbj")){
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
			$scope.CommonApp = cache;
		} else {
			$scope.CommonApp = [];
		}
		//user.CompID = 0;
		if(user.CompID > 0) { //企业用户
			if(cache.length == 0) {
				//				$scope.CommonApp.push({
				//					title: "待我处理",
				//					icon: "../images/todo.png",
				//					action: "workDesk",
				//					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				//					hasAuth: true,
				//					hasAdd: true,
				//					existed: true, //固定的我的应用功能
				//				});
				//				$filter("hasMenuAuth")("tygn", "CRMsy") && $scope.CommonApp.push({
				//					title: "CRM",
				//					icon: "../images/maintenancelog2.png",
				//					action: "crm",
				//					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				//					hasAuth: true,
				//					hasAdd: true,
				//					existed: true, //固定的我的应用功能
				//				});
				//				$filter("hasMenuAuth")("tygn", "rcgz") && $scope.CommonApp.push({
				//					title: "日常工作",
				//					icon: "../images/maintenancelog2.png",
				//					action: "workRecord",
				//					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				//					hasAuth: true,
				//					hasAdd: true,
				//					existed: true, //固定的我的应用功能
				//				});
				//				$scope.CommonApp.push({
				//					title: "操作日志",
				//					icon: "../images/customerevaluation.png",
				//					action: "eqLogs",
				//					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
				//					hasAuth: true,
				//					hasAdd: true,
				//					existed: true, //固定的我的应用功能
				//				});
			}
			//快捷录入

			//常用应用
			$scope.Mods = [{
				title: "增值服务",
				menus: []
			}, {
				title: "常用应用",
				menus: []
			}, {
				title: "地图查询",
				menus: [

					{
						title: "装备地图",
						icon: "../images/equipmentmap.png",
						action: "devMap",
						hasAuth: true,
						hasAdd: isAppAdd("devMap")
					}
				]
			}, {
				title: "供需市场",
				menus: [{
						title: "维修大厅", //应用名称
						icon: "../images/thirdpartyrepair.png", //图标
						action: "equThirdpartRepair", //点击响应事件
						hasAuth: true,
						hasAdd: isAppAdd("equThirdpartRepair")
					},
					{
						title: "交易大厅", //应用名称
						icon: "../images/img-jiaoyi.png", //图标
						action: "jiaoyi", //点击响应事件
						hasAuth: true,
						hasAdd: isAppAdd("jiaoyi")
					},
					{
						title: "租赁大厅", //应用名称
						icon: "../images/img-zulin.png", //图标
						action: "zulin", //点击响应事件
						hasAuth: true,
						hasAdd: isAppAdd("zulin")
					},
					{
						title: "回收大厅", //应用名称
						icon: "../images/img-huishou.png", //图标
						action: "huishou", //点击响应事件
						hasAuth: true,
						hasAdd: isAppAdd("huishou")
					},{
							title: "需求大厅",
							icon: "../images/mydemands.png",
							action: "demandHall", //点击响应事件
							hasAuth: true,
							hasAdd: isAppAdd("xuqiu")
					}
				]
			}];

			//增值服务
			$filter("hasModuleAuth")("after-sale") && $filter("hasMenuAuth")("syyy", "fwcx") && ($scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
				title: "售后服务",
				icon: "../images/sellafter.png",
				action: "aftersaleservice",
				hasAuth: true,
				hasAdd: isAppAdd("aftersaleservice")
			}]));

			if(($filter("hasMenuAuth")("syyy", "sbgl") || $filter("hasAuth")(['Q9', "Q14", "Q4"])) && $filter("hasModuleAuth")("eq")) {
				$scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
					title: "资产管理",
					icon: "../images/equipmentlibrary.png",
					action: "devicemanagement",
					hasAuth: true,
					hasAdd: isAppAdd("devicemanagement")
				}]);
			}

			$filter("hasModuleAuth")("crm") && ($scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
				title: "客户管理",
				icon: "../images/customermanagement.png",
				action: "crm",
				hasAuth: true,
				hasAdd: isAppAdd("crm")
			}]));

			$filter("hasModuleAuth")("iot") && $filter("hasMenuAuth")("dtcx", "cpfb") && user.CompID == 11 && ($scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
				title: "物联监测",
				icon: "../images/dev_maps.png",
				action: "devLinks",
				hasAuth: true,
				hasAdd: isAppAdd("devLinks")
			}]));
			if($filter("hasModuleAuth")("out-source")){
				($filter("hasMenuAuth")("syyy", "wxgl","wdxq")||$filter("hasMenuAuth")("syyy", "wxgl","wdbj"))&&($scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
					title: "外协管理",
					icon: "../images/Electronicarchives@3x.png",
					action: "outsourcingManagement",
					hasAuth: true,
					hasAdd: isAppAdd("outsourcingManagement")
				}]));
			}
			
			//

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
			//					title: "新建工单",
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
			//			$scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
			//				title: "操作日志",
			//				icon: "../images/customerevaluation.png",
			//				action: "eqLogs",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("eqLogs")
			//			}]);
			//			$filter("hasAuth")(['Q68']) && ($scope.Mods[0].menus = $scope.Mods[0].menus.concat([{
			//				title: "锁定装配",
			//				icon: "../images/machine-assembly@3x.png",
			//				action: "freeAssembly",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("freeAssembly")
			//
			//			}]));

			$filter("hasModuleAuth")("product") && $filter("hasMenuAuth")("dtcx", "cpfb") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
				title: "销售地图",
				icon: "../images/dev_maps.png",
				action: "prodDis",
				hasAuth: true,
				hasAdd: isAppAdd("prodDis")

			}]));

			$filter("hasModuleAuth")("after-sale-analysis") && $filter("hasMenuAuth")("dtcx", "fwdt") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
				title: "服务地图",
				icon: "../images/servicemap.png",
				action: "serviceMap",
				hasAuth: true,
				hasAdd: isAppAdd("serviceMap")
			}]));
			$filter("hasModuleAuth")("crm") && $filter("hasMenuAuth")("dtcx", "khdt") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
				title: "客户地图",
				icon: "../images/cusmap.png",
				action: "customerMap",
				hasAuth: true,
				hasAdd: isAppAdd("customerMap")
			}]));
			$filter("hasModuleAuth")("mdcode") && $filter("hasMenuAuth")("dtcx", "smdt") && ($scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
				title: "扫码地图",
				icon: "../images/scanmap.png",
				action: "scanProds",
				hasAuth: true,
				hasAdd: isAppAdd("scanProds")

			}]));
			$scope.Mods[2].menus = $scope.Mods[2].menus.concat([{
				title: "外协地图",
				icon: "../images/outsource_maps.png",
				action: "outsourcing",
				hasAuth: true,
				hasAdd: isAppAdd("outsourcing")
			}]);
			//			$filter("hasMenuAuth")("tygn", "CRMsy") && $scope.CommonApp.push({
			//				title: "CRM",
			//				icon: "../images/maintenancelog2.png",
			//				action: "crm",
			//				SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
			//				hasAuth: true,
			//				hasAdd: true,
			//				existed: true, //固定的我的应用功能
			//			});
			//			$scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//				title: "客户管理",
			//				icon: "../images/customermanagement.png",
			//				action: "crm",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("crm")
			//			}]);
			//			if($filter("hasMenuAuth")("tygn", "CRMsy")) {
			//				$scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//					title: "CRM",
			//					icon: "../images/customermanagement.png",
			//					action: "crm",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("crm")
			//				}]);
			//			}
			//			if($filter("hasMenuAuth")("syyy", "khgl")) {
			//				$scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
			//					title: "客户档案",
			//					icon: "../images/customermanagement.png",
			//					action: "customer",
			//					hasAuth: true,
			//					hasAdd: isAppAdd("customer")
			//				}]);
			//			}
			//       alert($filter("hasAuth")(['Q9',"Q14","Q4"]))

			$scope.Mods[1].menus = $scope.Mods[1].menus.concat([

				//				{
				//					title: "销售记录",
				//					icon: "../images/workdeskmanage.png",
				//					action: "prodsale"
				//				},
				{
					title: "企业定制",
					icon: "../images/eqinsprule.png",
					action: "customized",
					hasAuth: true,
					hasAdd: isAppAdd("customized")
				}
			]);
			$filter("hasModuleAuth")("product") && $filter("hasAuth")(['Q68']) && ($scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
				title: "锁定装配",
				icon: "../images/machine-assembly@3x.png",
				action: "freeAssembly",
				hasAuth: true,
				hasAdd: isAppAdd("freeAssembly")

			}]));
			//销售记录
			$filter("hasModuleAuth")("sale") && $filter("hasAuth")(['Q57']) && $scope.Mods[1].menus.push({
				title: "销售记录",
				icon: "../images/workdeskmanage.png",
				action: "prodsale",
				hasAuth: true,
				hasAdd: isAppAdd("prodsale")
			});
			//产品出库
			$filter("hasModuleAuth")("product") && $filter("hasMenuAuth")("syyy", "cpck") && ($scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
				title: "产品出库",
				icon: "../images/fleeinggoods.png",
				action: "outstock",
				hasAuth: true,
				hasAdd: isAppAdd("outstock")

			}]));
//			$filter("hasModuleAuth")("out-source") && ($scope.Mods[1].menus = $scope.Mods[1].menus.concat([{
//				title: "发布外协需求",
//				icon: "../images/outsource_publish.png",
//				action: "publishOutsourcing",
//				hasAuth: true,
//				hasAdd: isAppAdd("publishOutsourcing")
//			}]))
			//			$scope.Mods[1].menus.push({
			//				title: "产品出库",
			//				icon: "../images/fleeinggoods.png",
			//				action: "outstock",
			//				hasAuth: true,
			//				hasAdd: isAppAdd("outstock")
			//			});

		} else { //个人用户
			$scope.Mods = [{
					title: "地图查询",
					menus: [{
						title: "装备地图",
						icon: "../images/equipmentmap.png",
						action: "devMap",
						hasAuth: true,
						hasAdd: isAppAdd("devMap")
					}, 
//					{
//						title: "发布外协需求",
//						icon: "../images/outsource_publish.png",
//						action: "publishOutsourcing",
//						hasAuth: true,
//						hasAdd: isAppAdd("publishOutsourcing")
//
//					}
					]
				},
				{
					title: "供需市场",
					menus: [{
							title: "维修大厅", //应用名称
							icon: "../images/thirdpartyrepair.png", //图标
							action: "equThirdpartRepair", //点击响应事件
							hasAuth: true,
							hasAdd: isAppAdd("equThirdpartRepair")
						},
						{
							title: "交易大厅", //应用名称
							icon: "../images/img-jiaoyi.png", //图标
							action: "jiaoyi", //点击响应事件
							hasAuth: true,
							hasAdd: isAppAdd("jiaoyi")
						},
						{
							title: "租赁大厅", //应用名称
							icon: "../images/img-zulin.png", //图标
							action: "zulin", //点击响应事件
							hasAuth: true,
							hasAdd: isAppAdd("zulin")
						},
						{
							title: "回收大厅", //应用名称
							icon: "../images/img-huishou.png", //图标
							action: "huishou", //点击响应事件
							hasAuth: true,
							hasAdd: isAppAdd("huishou")
						}
//						,{
//							title: "需求大厅",
//							icon: "../images/mydemands.png",
//							action: "demandHall", //点击响应事件
//							hasAuth: true,
//							hasAdd: isAppAdd("xuqiu")
//						}
					]
				}
			];
			//			$scope.Mods = [{
			//				title: "快捷录入",
			//				menus: []
			//			}, {
			//				title: "常用应用",
			//				menus: []
			//			}];
			//			if(cache.length == 0) {
			//
			//				$scope.CommonApp.push({
			//					title: "待我处理",
			//					icon: "../images/todo.png",
			//					action: "workTodoPer",
			//					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//				});
			//				$scope.CommonApp = $scope.CommonApp.concat([{
			//					title: "现场维修",
			//					icon: "../images/newrepair.png",
			//					action: "faultyInfo",
			//					SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//
			//				}, {
			//					title: "产品故障",
			//					icon: "../images/failurework.png",
			//					action: "faultOrderPer",
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//				}, {
			//					title: "故障维修",
			//					icon: "../images/troubleshooting.png",
			//					action: "faultyInfoPer",
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//
			//				}, {
			//					title: "零配件更换",
			//					icon: "../images/partsreplacement.png",
			//					action: "partInfolistPer",
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//				}, {
			//					title: "工作量统计",
			//					icon: "../images/newrepair.png",
			//					action: "repairStatistics",
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//				}, {
			//					title: "配件更换统计",
			//					icon: "../images/todo.png",
			//					action: "partStatistic",
			//					hasAuth: true,
			//					hasAdd: true,
			//					existed: true, //固定的我的应用功能
			//				}])
			//			}
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
		setWorkLogBadge();
		Loading.hide();
		$scope.loaded = true;
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
			outsourcingManagement:'../pages/outsourcing/index.html',
			faultOrder: '../pages/aftersale/mat-fault-edit.html?source=telFault', //'../pages/aftersale/mat-order.html',//
			faultyInfo: '../pages/aftersale/mat-repair.html',
			freeAssembly: '../pages/assembly/free-assembly.html',
			workRecord: '../pages/aftersale/work-list.html',
			workDesk: '../pages/work/work-desk.html',
			scan: '../pages/scan/scan.html',
			//scanProds: '../pages/map/template.html?key=scanprods',
			scanProds: '../pages/map/prod-scan-map.html',
			outsourcing: '../pages/outsourcing/comp-map.html',
			assist: '../pages/bid/assist.html',
			prodDis: '../pages/map/prod-dis-map.html',
			serviceMap: '../pages/map/service-map.html', //'../pages/map/template.html?key=services'
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
			"demandHall": '../pages/outsourcing/demands.html',
			crm: "../pages/crm/index.html",
			customerMap: "../pages/map/customer-map.html",
			outstock: "../pages/outstock/supply_chain.html",
			publishOutsourcing: "../pages/outsourcing/demand-edit.html",
			devLinks: "../pages/map/dev-map-links.html"
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
						var _compId = "";

						data.resInfo.ProdInfo && (_compId = data.resInfo.ProdInfo.CompID);
						_data.CompID = _compId;
						_data.EqJane = data.resInfo.EqJane;
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

	//添加功能
	$scope.addAction = function(item, event, myapp) {
		event && event.stopPropagation();
		item.hasAdd = true;
		$scope.CommonApp.push({
			title: item.title,
			icon: item.icon,
			action: item.action,
			SortID: $scope.CommonApp ? $scope.CommonApp.length : 0,
			hasAuth: item.hasAuth,
			hasAdd: true
		});
	};
	//删除功能
	var isOver = true;
	$scope.delAction = function(item, event, myapp) {
		event && event.stopPropagation();
		if(isOver) {
			isOver = false;
			item.hasAdd = false;
			//我的应用里删除同时，下面的hasAdd设为false;
			if(myapp) {
				if(item.existed) {
					isOver = true;
					return;
				}
				$scope.Mods.forEach(function(mod, index) {
					mod.menus.forEach(function(ele, num) {
						if(ele.action == item.action) {
							ele.hasAdd = false;
							return false;
						}
					})
				});
			}
			var _index = -1;
			$scope.CommonApp.forEach(function(ele, index) {
				if(ele.action == item.action) {
					_index = index;
					return false;
				}
			});
			if(_index > -1) {
				$scope.CommonApp.splice(_index, 1);
			}
			isOver = true;
		}

	};
	//保存本地
	$scope.saveMyapp = function() {
		CacheService.set(user.UserID + "_my_app", $scope.CommonApp, true);
		//plus.webview.currentWebview().opener().reload();
		var view = plus.webview.currentWebview();
		var opener = view.opener();
		if(view.callback) {
			opener.evalJS(view.callback + "()");
		}
		mui.back();
		mui.toast("已保存");
	};
	//验证是否已加入我的应用
	function isAppAdd(key) {
		return $scope.CommonApp.some(function(app, index) {
			return app.action == key;
		});
	}

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
		if(user && user.CompID == 0) {
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
			// alert(res);
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
	var compare = function(prop) {
		return function(obj1, obj2) {
			var val1 = obj1[prop];
			var val2 = obj2[prop];
			if(!isNaN(Number(val1)) && !isNaN(Number(val2))) {
				val1 = Number(val1);
				val2 = Number(val2);
			}
			if(val1 < val2) {
				return -1;
			} else if(val1 > val2) {
				return 1;
			} else {
				return 0;
			}
		}
	}
	window.reset_order = function(evt) {
		//		console.log("before:" + JSON.stringify($scope.CommonApp))
		if(evt.newIndex > -1) {
			var oldIdx = evt.oldIndex;
			var newIdx = evt.newIndex;

			var nums = 0;
			if(oldIdx < newIdx) {
				nums = 0.5; //向下拖动
			} else {
				nums = -0.5; //向上拖动
			}
			//			console.log("oldIdx:" + oldIdx + ",newIdx:" + newIdx);
			$scope.CommonApp[oldIdx - 1].SortID = newIdx + nums - 1; //-1shang
			$scope.CommonApp = $scope.CommonApp.sort(compare("SortID"));
			$scope.CommonApp = $scope.CommonApp.filter(function(_item, _idx) {
				_item.SortID = _idx;
				return true;
			});
			$scope.CommonApp.forEach(function(ele, index) {
				ele.SortID = index;
			})
			$scope.$apply();
		}
		//		console.log("after:" + JSON.stringify($scope.CommonApp))
	};
}]);

function selsku(res) {
	_callback(res);
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	var appElement = document.querySelector('[ng-controller=AppController]');
	var $scope = angular.element(appElement).scope();
	var sort;
	var ispaixu = true;
	mui.init({
		gestureConfig: {
			longtap: true,
		}
	});
	//维护按钮
	document.getElementById("edit").addEventListener('tap', function() {
		//console.log(JSON.stringify($scope.Mods))
		init(false, true);
	});
	//初始化排序
	function init(islongtap, isTriggerByBtn) {
		if(!ispaixu) {
			if(isTriggerByBtn) {
				$scope.showTips = true;
			}!sort && setSortable(isTriggerByBtn);
			ispaixu = true;
		} else {
			if(islongtap) return;
			ispaixu = false;
			//保存本地
			$scope.saveMyapp();
			$scope.showTips = false;
		}
		$scope.$apply();
	};
	var touchtime, item_offset = {
		left: '',
		top: ''
	};
	//	//移除
	//	mui("body").on("tap",".img-remove",function(){
	//		var action = this.getAttribute("action");
	//		alert("移除:"+action);
	//	})
	//	//添加
	//	mui("body").on("tap",".img-add",function(){
	//		var action = this.getAttribute("action");
	//		
	//		alert("添加："+action);
	//	})

	//长按激活排序
	mui(".business-details").on('longtap', 'img', function() {
		initForSort(false);
	});

	function initForSort(isTriggerByBtn) {
		if(isTriggerByBtn) return;
		$scope.showTips = true;
		$scope.$apply();
		ispaixu = true;
	};
	setSortable(false);

	function setSortable(isTriggerByBtn) {
		sort = new Sortable(document.getElementById("ul_imgs"), {
			chosenClass: 'sort-chosen',
			ghostClass: 'sort-ghost',
			delay: 150,
			animation: 400,
			handle: '.drag-handle',
			//-------- 自定义属性
			isDropAnimation: false, //DragDrop时是否对DragEl启用滑动效果
			ghostScale: 1.2, //DragGhostEl 缩放效果
			//--------
			onStart: function( /**Event*/ evt) { // 拖拽
				mui(".mui-scroll-wrapper")[0].style.overflow = "hidden";
				touchtime = evt.timeStamp;
				item_offset.left = evt.item.offsetLeft;
				item_offset.top = evt.item.offsetTop;
				var itemEl = evt.item;
			},
			onEnd: function( /**Event*/ evt) { // 拖拽
				mui(".mui-scroll-wrapper")[0].style.overflow = "scroll";
				var itemEl = evt.item;
				var timespan = evt.timeStamp - touchtime;
				if(timespan < 200) {} else if(itemEl.offsetLeft == item_offset.left && itemEl.offsetTop == item_offset.top) {} else {
					reset_order(evt);
				}
				touchtime = null;
			},
		});
	};
	//	Sortable.create(document.getElementById("ul_imgs"), {
	//		group: "business-details",
	//		animation: 150,
	//		scroll: false,
	//		handle: ".drag-handle",
	//		onStart: function () {
	//		},
	//		onEnd: function (evt) {
	//			reset_order(evt);
	//		}
	//	});
});