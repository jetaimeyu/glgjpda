app.controller("ServiceStatController", ["$scope", "UtilsService", "ApiService", function($scope, UtilsService, ApiService) {
	setTimeout(mui.init);

	$scope.CommonApp = [{
		title: "故障走势",
		icon: "../../images/failuretrend.png",
		action: "faultTrend"
	}, {
		title: "故障分布",
		icon: "../../images/faultdistribution.png",
		action: "faultArea"
	}, {
		title: "工作量统计",
		icon: "../../images/maintenancestatistics.png",
		action: "repairStatistics"
	}, {
		title: "客户评价",
		icon: "../../images/customerevaluation.png",
		action: "evalStatistics"
	}, {
		title: "故障分类",
		icon: "../../images/faultclassification.png",
		action: "faultCategory"
	}, {
		title: "配件更换",
		icon: "../../images/replacementparts.png",
		action: "partsChange"
	}];
	$scope.loaded = true;

	$scope.tap = function(_key) {
		var url = {
			faultTrend: ApiService.Tools + '/stat/fault-trend.html',
			faultArea: ApiService.Tools + '/stat/fault-area.html',
			repairStatistics: ApiService.Tools + '/stat/repair-statistics.html',
			evalStatistics: ApiService.Tools + '/stat/evalStatistics.html',
			faultCategory: ApiService.Tools + '/stat/fault-category.html',
			partsChange: ApiService.Tools + '/stat/parts-change.html'
		};
		var title = {
			faultTrend: "故障报工数走势",
			faultArea: "故障分布图",
			repairStatistics: "工作量统计",
			evalStatistics: "客户评价统计",
			faultCategory: "故障分类统计",
			partsChange: "配件更换统计"
		};
		UtilsService.openWindow({
			needLogin: true,
			id: "hyperlink.html",
			url: "../common/hyperlink.html",
			extras: {
				hyperlink: {
					title: title[_key],
					url: url[_key]
				}
			}
		});
	};
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});