app.controller("outSourceController", ["$scope", "$filter", "UtilsService", "AuthService",  "Loading", function($scope, $filter, UtilsService, AuthService, Loading) {
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
				}
			];
//			$filter("hasModuleAuth")("out-source") && ($scope.CommonApp[0].menus.push({
//				title: "发布需求",
//				icon: "../../images/outsource_publish.png",
//				action: "publishOutsourcing"
//			}))
			if($filter("hasModuleAuth")("out-source")){
				$filter("hasMenuAuth")("syyy", "wxgl","wdxq")&&$scope.CommonApp[0].menus.push({
						title: "我的需求",
						icon: "../../images/mydemand.png",
						action: "myDemand"
					})
				
				$filter("hasMenuAuth")("syyy","wxgl", "wdbj")&&($scope.CommonApp[0].menus.push(
					{
						title: "我的报价",
						icon: "../../images/myoffer.png",
						action: "myOffer"
					}
				));
			
			}
			
		});

	}
	$scope.tap = function(_key) {
		var url = {
			"publishOutsourcing": 'demand-edit.html',
			"outsourceMap": 'comp-map.html',
			"myDemand": 'demand-list.html',
			"myOffer": 'mydemand.html',
			"demandHall": 'demands.html',
		};
		UtilsService.openWindow({
			needLogin: true,
			id: url[_key],
			url: url[_key]

		});
	};

}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});