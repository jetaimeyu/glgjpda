

app.controller("findController", ["$scope", "UtilsService", function($scope, UtilsService) {
//	setTimeout(mui.init);

	$scope.getSpareParts = function() {
		UtilsService.openWindow({
			needLogin: true,
			id: 'supermarket.html',
			url: 'find/supermarket.html',
		});
	};
	$scope.companySettleIn = function() {
		UtilsService.openWindow({
			needLogin: true,
			id: 'confirmarrival.html',
			url: 'confirmarrival.html',
		});
	};
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});