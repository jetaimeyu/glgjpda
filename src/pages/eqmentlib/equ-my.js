app.controller("ContactOrgController", ["$scope", "ApiService", "DataService", "Loading", "RPCObserver", "$q", function($scope, ApiService, DataService, Loading, RPCObserver, $q) {
	//页面数据
	$scope.data = null;
	$scope.latelyData = null;
	$scope.Network = true;
	$scope.isEnd = false;
	var authType = query("authtype");

	var pageIndex = 0;
	var pageSize = 10;

	Loading.show();

	//是否用于选择设备
	$scope.action = query("action");
	$scope.selectObj = plus.webview.currentWebview().selectObj;

	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#pullrefresh',
				down: {
					callback: pulldownRefresh
				},
				up: {
					auto: true,
					callback: pullupRefresh
				}
			}
		});
	})

	function pulldownRefresh() {
		pageIndex = 1;
		getMyEqInfoList('down');
	}

	function pullupRefresh() {
		$scope.Network && pageIndex++;
		//获取所有的设备信息
		getMyEqInfoList();
	}

	//获取我负责的所有的设备信息
	function getMyEqInfoList(type) {
		//我负责的所有设备列表
		var url1 = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoList?authType=" + authType + "&pageIndex=" + pageIndex + "&pageSize=" + pageSize;
		//最近创建
		var url2 = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoIntervalList?authType=" + authType + "&pageIndex=1&pageSize=9999";
		var promises = [DataService.get(url1)];
		pageIndex == 1 && promises.push(DataService.get(url2));
		$q.all(promises).then(function(res) {
			$scope.Network = true;
			Loading.hide();
			$scope.isLoad = true;
			if(type == "down") {
				$scope.latelyData = null;
				$scope.data = null;
			}

			res[1] && ($scope.latelyData = res[1].DataRows);

			$scope.data == null && ($scope.data = []);
			$scope.data = $scope.data.concat(res[0].DataRows);
			$scope.isEnd = $scope.data.length >= res[0].TotalCount;
			if(mui("#pullrefresh").pullRefresh()) {
				if(type == "down") {
					mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
					mui('#pullrefresh').pullRefresh().refresh(true);
					mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
				} else {
					mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
				}
			}
			hideUpData();
		}, function(error) {
			$scope.Network = false;
			$scope.isLoad = true;
			$scope.latelyData == null && ($scope.latelyData = []);
			$scope.data == null && ($scope.data = []);
			if(mui("#pullrefresh").pullRefresh()) {
				mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				mui("#pullrefresh").pullRefresh().endPullupToRefresh($scope.isEnd);
			}
			hideUpData();
		})
	}
	//当数据为空时，隐藏上拉的提示
	function hideUpData() {
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if(tip) {
			if($scope.data.length == 0) {
				tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
				tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
			} else {
				!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
				!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
			}
		}
	}

	RPCObserver.on('refresh_equ_list', 'refresh_equ_list');
	window.refresh_equ_list = pulldownRefresh;
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});