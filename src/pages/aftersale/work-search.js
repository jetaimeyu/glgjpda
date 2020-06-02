app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.data = null; //接口返回的所有日志
	$scope.dataByType = null; //点击搜索分类时的日志数据
	$scope.searchName = ""; //搜索名称
	$scope.TypeName = ""; //分类名称
	$scope.pageSize = 20; //每页数量
	$scope.pageIndex = 0;
	$scope.logType = 0;
	var networkCanUse = true; //能正常启用网络
	var _canLoad = false;
	var userId = "";
	AuthService.getAuth().then(function(res) {
		userId = res.UserID;
		$scope.search.getHistory();
	});
	//弹出键盘
	showInput();

	$scope.search = {
		text: "",
		history: [],
		getHistory: function() {
			var temp = CacheService.get(userId + "_mat_work_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_mat_work_search");
			$scope.domShowX = true;
			$scope.domShow = false;
		},
		doSearch: function(type) {
			_canLoad = true;
			$scope.search.text = document.querySelector("input").value.trim();
			if(type == 0) {
				$scope.searchName = $scope.search.text;
				$scope.TypeName = "";
			}
			if((!$scope.search.text) && (!$scope.TypeName)) {
				mui.toast("请输入搜索内容");
				return;
			}

			$scope.data = null; //清空原数据
			$scope.logType = type;
			$scope.dataByType = null;
			Loading.show();
			//关闭键盘
			document.activeElement.blur();
			if(type == 0) {
				var idx = $scope.search.history.indexOf($scope.search.text);
				if(idx >= 0) {
					$scope.search.history.splice(idx, 1);
				}
				//存储本地cach
				if($scope.search.history.length == 10) {
					$scope.search.history.splice(9, 1);
				}
				if(mui('#pullrefresh').pullRefresh()) {
					mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
				}
				//存储本地cach
				$scope.search.history = [$scope.search.text].concat($scope.search.history);
				CacheService.set(userId + "_mat_work_search", $scope.search.history, true);
			}

			$scope.pageIndex = 0;
			getWorkLogList()

		},
		//点击历史搜索
		searchlist: function(eqIdentifier, type) {
			//开启上拉事件
			$scope.pageIndex = 0;
			//$scope.logType = type;
			if(type == 0) { //全部
				$scope.searchName = eqIdentifier
				$scope.TypeName = "";
				//	mui('#pullrefresh').pullRefresh().disablePullupToRefresh();

			} else { //日志
				$scope.TypeName = eqIdentifier;
				$scope.searchName = "";
				mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
				mui('#pullrefresh').pullRefresh().refresh(true);
			}
			$scope.search.text = eqIdentifier;
			$timeout(function() {
				$scope.search.doSearch(type);
			}, 100)
		},
		//点击搜索x
		deleteSearch: function() {
			_canLoad = true;
			$scope.search.text = '';
			$scope.domShow = false; //控制列表显示

		}

	};
	//上拉加载服务
	function uppullRefresh() {
		if(!_canLoad) {
			return;
		}
		if(networkCanUse) {
			$scope.pageIndex++; //页数
		}
		getWorkLogList();
	};
	//上拉加载
	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#pullrefresh',
				up: {
					callback: uppullRefresh
				},
			}
		});
		setTimeout(function() {
			//没有搜索的时候禁用上拉事件
			mui('#pullrefresh').pullRefresh().disablePullupToRefresh();
		}, 50);

	});
	$scope.LogTypeList = "";
	//获取日志归类列表
	Loading.show();
	GetWorkLogTypeList();

	function GetWorkLogTypeList() {
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetWorkLogTypeList";
		Loading.hide();
		$scope.isLoad = true;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.LogTypeList = res;
			}
		})
	};
	//搜索
	function getWorkLogList() {
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/SerachWorkLog?type=" + $scope.logType + "&keyWords=" + encodeURIComponent($scope.searchName) + "&pageSize=" + $scope.pageSize + "&pageIndex=" + $scope.pageIndex + "&logTypeName=" + encodeURIComponent($scope.TypeName);
		DataService.get(url).then(function(res) {
			console.log(url);
			networkCanUse = true;
			Loading.hide();
			if(res.hasOwnProperty("Users") && res.hasOwnProperty("Logs")) {
				$scope.data = res;
			} else {
				($scope.dataByType == null) && ($scope.dataByType = []);
				$scope.dataByType = $scope.dataByType.concat(res.DataRows);

				var isEnd = $scope.dataByType.length >= res.TotalCount;
				if(mui("#pullrefresh").pullRefresh()) {
					mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
				}
			}
			var tip = document.querySelector('.mui-pull-bottom-pocket');
			if(tip && ($scope.dataByType != null)) {
				if($scope.dataByType.length == 0) {
					tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
					tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
				} else {
					!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
					!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
				}
			}
			setTimeout(function() {

				$scope.$apply(function() {
					$scope.domShow = true;
				})
			}, 100);
			
		}, function() {
			$scope.domShow = true;
			networkCanUse = false;
		})
	}

	$scope.tap = function(logType) {
		UtilsService.openWindow({
			needLogin: true,
			id: 'work-search-list.html',
			url: 'work-search-list.html?type=' + logType,
			extras: {
				keywords: $scope.searchName,
				logTypeName: $scope.TypeName
			}
		});

	}
	RPCObserver.on('refresh_mat_work_list', 'refresh_mat_work_list');
	window.refresh_mat_work_list = function() {
		$scope.search.doSearch();
	};

}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	var style = {
		scrollIndicator: 'none'
	};
	mui.os.android && (style.softinputMode = 'adjustResize');
	plus.webview.currentWebview().setStyle(style);
});