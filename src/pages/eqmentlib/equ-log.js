mui.init();

app.controller("bodyCtl", ["$scope", "DataService", "ApiService", "UtilsService", "$filter", "TapService", "AuthService", "CacheService", function ($scope, DataService, ApiService, UtilsService, $filter, TapService, AuthService, CacheService) {
	$scope.domData = {
		info: [],
		id: query("equid"),
		mdcode: query("mdcode"),
		list: []
	};
	$scope.curUser = CacheService.get("user");

	$scope.States = {
		1: "签到",
		2: "记录",
		3: "签退"
	};
	$scope.roundColor = {
		1: 'color_orange',
		3: 'color_blue',
		2: 'color_green'
	};

	$scope.event = {
		add: function () {
			var data = $scope.domData.info[0];
			var state = $scope.domData.list.length == 0 ? 1 : 2;
			UtilsService.openWindow({
				url: "eq-log-add.html?equid=" + data.ID + "&mdcode=" + data.MDCode + "&state=" + state,
				id: "eq-log-add.html"
			})
		},
		openLogInfo: function (id) {
			UtilsService.openWindow({
				url: "eq-log-info.html?id=" + id,
				id: "eq-log-info.html"
			})
		},
		history:function(){
			var data = $scope.domData.info[0];
			UtilsService.openWindow({
				url: "eq-log-history.html?equid=" + data.ID + "&mdcode=" + data.MDCode,
				id: "eq-log-history.html"
			});
		}
	};

	var curData = {
		info: function () {
			var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + $scope.domData.id;
			DataService.get(url).then(function (res) {
				$scope.domData.info = [res];

				curData.getLogs();
			}, function () {
				mui.hideLoading();
			})
		},
		getLogs: function () {
			var url = ApiService.Api50 + "/api/v1/Equipment/GetEqLog?mdcode=" + $scope.domData.info[0].MDCode;
			DataService.get(url).then(function (res) {
				mui.hideLoading();
				$scope.domData.list = res;
			}, function () {
				mui.hideLoading();
			})
		}
	};

	window.addSuccess = function (data) {
		var _data = $scope.domData.list;

		var listData = $scope.domData.list.find(function (item) {
			return item.CreateDate == data.CreateDate
		});

		if (!listData) {
			_data.push({
				CreateDate: data.CreateDate,
				DataRow: []
			});
			_data = _data[0].DataRow;
		} else {
			_data = listData.DataRow;
		}

		_data.push({
			CreateDate: data.CreateTime,
			CreateUserName: data.CreateUserName,
			State: data.State,
			Description: data.Description
		});

		$scope.$apply();
	};


	RpcServer.expose("RPC_refresh", function (userInfo) {
		mui.showLoading("", "div");
		curData.getLogs();
	});
	curData.info();
}]);

mui.showLoading("", "div");

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});