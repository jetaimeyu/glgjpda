app.controller("RepairListController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", function($scope, ApiService, DataService, UtilsService, Loading) {
	$scope.EquiFailRecord = null;

	//下拉刷新
	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#RepairListCont',
				down: {
					auto: true,
					callback: getRepairList
				}
			}
		});
	})

	function getRepairList() {
		var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetPagedEqRepairRecordsList?equipmentId=" + query("equid") + "&pageIndex=1&pageSize=9999";
		DataService.get(url).then(function(res) {
			$scope.domShow = true;
			if(res) {
				$scope.EquiFailRecord = res.DataRows;
				Loading.hide();
				mui("#RepairListCont").pullRefresh() && mui('#RepairListCont').pullRefresh().endPulldownToRefresh(); //结束下拉刷新
			}
		});
	}
	
	init();

	function init() {
		Loading.show();
		getRepairList();
	}

	//删除 的rpc
	RpcServer.expose("RPC_EquRepairListRefresh", function() {
		getRepairList();
	})
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});