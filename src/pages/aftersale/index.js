app.controller("EqController", ["$scope", "$filter", "UtilsService", "ApiService", "AuthService", "Loading", "RPCObserver", function($scope, $filter, UtilsService, ApiService, AuthService, Loading, RPCObserver) {
	setTimeout(mui.init);
	init()
	Loading.show();
	$scope.loaded = false;

	function init() {
		AuthService.getAuth().then(function(user) {
			//当前登录人信息
			$scope.user = user;
			$scope.loaded = true;
			Loading.hide();
			//常用应用
			$scope.CommonApp = [{
					title: "业务操作",
					menus: [],
				}, {
					title: "数据查询",
					menus: [],
				},
				{
					title: "统计分析",
					menus: []
				}
			];
			$filter("hasAuth")(['Q30']) && $scope.CommonApp[0].menus.push({
				title: "安装调试",
				icon: "../../images/newdebug.png",
				action: "debug"
			});
			if($filter("hasAuth")(['Q25'])) {
				$scope.CommonApp[0].menus = $scope.CommonApp[0].menus.concat([{
					title: "新建工单",
					icon: "../../images/callforrepair.png",
					action: "fault"
				}, {
					title: "现场维修",
					icon: "../../images/newrepair.png",
					action: "repair"
				}]);
			};
			$scope.CommonApp[0].menus.push({
				title: "扫码签到",
				icon: "../../images/scan_fun.png",
				action: "commonScanSign"
			})
			if((!$filter("hasAuth")(['Q30']) && !$filter("hasAuth")(['Q25'])) || !$filter("hasModuleAuth")("after-sale")) {
				$scope.CommonApp.splice(0, 1);
			}
			if($filter("hasMenuAuth")("syyy", "fwcx") && $filter("hasModuleAuth")("after-sale")) {
				if($scope.CommonApp[0].menus.length == 0) {
					var i = 0
				} else {
					var i = 1
				}
				if($filter("hasMenuAuth")("syyy", "fwcx", "sjcx")) {
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "azts") && $scope.CommonApp[i].menus.push({
						title: "安装调试",
						icon: "../../images/Installationdebugging.png",
						action: "debug-list"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "cpgz") && $scope.CommonApp[i].menus.push({
						title: "产品故障", //应用名称
						icon: "../../images/failurework.png", //图标
						action: "faultOrder" //点击响应事件
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "gzwx") && $scope.CommonApp[i].menus.push({
						title: "故障维修",
						icon: "../../images/troubleshooting.png",
						action: "faultyInfo"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "khhf") && $scope.CommonApp[i].menus.push({
						title: "客户回访",
						icon: "../../images/clientreview.png",
						action: "evalList"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "lpjgh") && $scope.CommonApp[i].menus.push({
						title: "零配件更换",
						icon: "../../images/partsreplacement.png",
						action: "partInfolist"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "ybjl") && $scope.CommonApp[i].menus.push({
						title: "延保记录",
						icon: "../../images/extendservice.png",
						action: "extendService"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "sjcx", "qtfw") && $scope.CommonApp[i].menus.push({
						title: "其他服务",
						icon: "../../images/customerservice.png",
						action: "customerService"
					});
					if($filter("hasMenuAuth")("syyy", "khgl") && $filter("hasModuleAuth")("customer-service")) {
						$scope.CommonApp[i].menus.push({
							title: "客户服务",
							icon: "../../images/customerpros.png",
							action: "customer",
						});
					}
				} else if($filter("hasMenuAuth")("syyy", "khgl") && $filter("hasModuleAuth")("customer-service")) {
					$scope.CommonApp[i].menus.push({
						title: "客户服务",
						icon: "../../images/customerpros.png",
						action: "customer",
					});
				} else {
					$scope.CommonApp.splice(i, 1);
				}

			} else {
				if($scope.CommonApp[0].menus.length == 0) {
					var i = 0
				} else {
					var i = 1
				}
				$scope.CommonApp.splice(i, 1);
			}

			if($filter("hasMenuAuth")("syyy", "fwcx") && $filter("hasModuleAuth")("after-sale-analysis")) {
				var i = 0;
				if($scope.CommonApp[0].menus.length == 0) {
					i = 0;
				} else {
					if($scope.CommonApp[1].menus.length == 0) {
						i = 1;
					} else {
						i = 2;
					}
				}
				if($filter("hasMenuAuth")("syyy", "fwcx", "tjfx")) {
					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "gzzs") && $scope.CommonApp[i].menus.push({
						title: "故障走势",
						icon: "../../images/failuretrend.png",
						action: "faultTrend"
					});

					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "gzfb") && $scope.CommonApp[i].menus.push({
						title: "故障分布",
						icon: "../../images/faultdistribution.png",
						action: "faultArea"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "gzltj") && $scope.CommonApp[i].menus.push({
						title: "工作量统计",
						icon: "../../images/maintenancestatistics.png",
						action: "repairStatistics"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "khpj") && $scope.CommonApp[i].menus.push({
						title: "客户评价",
						icon: "../../images/customerevaluation.png",
						action: "evalStatistics"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "gzfl") && $scope.CommonApp[i].menus.push({
						title: "故障归类",
						icon: "../../images/faultclassification.png",
						action: "faultCategory"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "pjgh") && $scope.CommonApp[i].menus.push({
						title: "配件更换",
						icon: "../../images/replacementparts.png",
						action: "partsChange"
					});
					$filter("hasMenuAuth")("syyy", "fwcx", "tjfx", "cjgz") && $scope.CommonApp[i].menus.push({
						title: "常见故障",
						icon: "../../images/commonfaultcategory.png",
						action: "commonFaultCategory"
					});
				} else {
					$scope.CommonApp.splice(i, 1);
				}

			} else {
				var i = 0;
				if($scope.CommonApp[0].menus.length == 0) {
					i = 0;
				} else {
					if($scope.CommonApp[1].menus.length == 0) {
						i = 1;
					} else {
						i = 2;
					}
				}
				$scope.CommonApp.splice(i, 1);
			}
			//客户回访记录
			//			!$filter("hasAuth")(['Q32', 'Q33']) && $scope.CommonApp[0].menus.splice(3, 1);
		});

	}
	$scope.tap = function(_key) {
		var url = {
			"fault": '../aftersale/mat-fault-edit.html?source=telFault',
			"faultOrder": 'mat-fault-list.html',
			"faultyInfo": 'mat-repair-list.html',
			"partInfolist": 'mat-part-infolist-head.html',
			"evalList": 'eval-list.html',
			"repair": '../aftersale/mat-repair.html',
			"repairList": 'repair-list.html',
			"customerService": '../aftersale/service-index.html',
			"commonFaultCategory": '../stats/common-fault-category.html',
			"extendService": '../../pages/problib/securing-services.html',
			"teamAssembly": '../../pages/assembly/index.html?type=record',
			"debug": '../aftersale/debug-edit.html',
			"debug-list": '../aftersale/debug-index.html',
			customer: '../../pages/customer/customer-list.html',
			faultTrend: ApiService.Tools + '/stat/fault-trend.html',
			faultTrend: ApiService.Tools + '/stat/fault-trend.html',
			faultArea: ApiService.Tools + '/stat/fault-area.html',
			repairStatistics: ApiService.Tools + '/stat/repair-statistics.html',
			evalStatistics: ApiService.Tools + '/stat/evalStatistics.html',
			faultCategory: ApiService.Tools + '/stat/fault-category.html',
			partsChange: ApiService.Tools + '/stat/parts-change.html',
		};
		var title = {
			"debug-list": "安装调试记录",
			customerService: "其他服务",
			faultTrend: "故障走势",
			faultArea: "故障分布",
			repairStatistics: "工作量统计",
			evalStatistics: "客户评价",
			faultCategory: "故障归类",
			partsChange: "配件更换"
		};
		switch(_key) {
			case "commonScanSign":
				UtilsService.openWindow({
					needLogin: true,
					id: 'scan.html',
					url: '../scan/scan.html',
					extras: {
						callback: "scanCallback"
					}
				});
				break;
			case "prodlib":
				UtilsService.openWindow({
					needLogin: true,
					id: 'complib-index.html',
					url: '../pages/complib/index.html?compid={CompID}'
				});
				break;
			case "debug-list":
			case "customerService":
			case "faultTrend":
			case "faultArea":
			case "repairStatistics":
			case "evalStatistics":
			case "faultCategory":
			case "partsChange":
				UtilsService.openWindow({
					needLogin: true,
					id: "hyperlink.html",
					url: "../../pages/common/hyperlink.html",
					extras: {
						hyperlink: {
							title: title[_key],
							url: url[_key]
						}
					}
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

		UtilsService.openWindow({
			needLogin: true,
			id: url[_key],
			url: url[_key]

		});
		mui('#popover').popover('hide');
	};

	RPCObserver.on('close_popover', 'close_popover');
	window.close_popover = function() {
		mui('#popover').popover('hide');
	}

	window.scanCallback = function(res) {
		res = JSON.parse(res);
		var mdCode = res.codeValue;
		var prodInfo = res.resInfo;
		prodInfo.MDCode = res.codeValue;
		setTimeout(function() {
			UtilsService.openWindow({
				id: "scanSign.html",
				url: "scanSign.html",
				extras: {
					prodInfo: prodInfo
				}
			});
		}, 200);
	};

}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});