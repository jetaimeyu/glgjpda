app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "ProdService", "Loading", "CacheService", "AuthService", "$Modal", "MapService", "LocationService", "UtilsService", function($scope, ApiService, DataService, ProdService, Loading, CacheService, AuthService, $Modal, MapService, LocationService, UtilsService) {
	//地址详细信息
	$scope.location = plus.webview.currentWebview().location;
	var map = "";

	Loading.show();
	setTimeout(function() {
		MapService.bMap().then(function(re) {
			map = new BMap.Map("map");
			//开启鼠标滚轮缩放
			map.enableScrollWheelZoom(true);
			//禁用双击放大
			map.disableDoubleClickZoom();

			map.centerAndZoom(new BMap.Point($scope.location.lng, $scope.location.lat), 18);
			var marker = new BMap.Marker(new BMap.Point($scope.location.lng, $scope.location.lat));
			map.addOverlay(marker);

			Loading.hide();
		})
	}, 500);

	$scope.confirm = function() {
		Loading.show();
		var view = plus.webview.currentWebview();
		var opener = view.opener().opener();
		if(view.opener().callback) {
			opener.evalJS(view.opener().callback + "(" + JSON.stringify($scope.location) + ")");
		}
		view.opener().close("none");
		setTimeout(function() {
			Loading.hide();
			mui.back();
		}, 800)
	}
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});