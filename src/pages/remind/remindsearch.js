app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.type = query("type") || "undefined";
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.data = null; //接口返回的所有日志
	$scope.searchName = ""; //搜索名称
	$scope.TypeName = ""; //分类名称
	$scope.pageSize = 20; //每页数量
	$scope.pageIndex = 1;
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
			if(type == 1) {
				$scope.searchName = $scope.search.text;
				$scope.TypeName = "";
			}

			if(!$scope.search.text) {
				mui.toast("请输入日程内容");
				return;
			}
			$scope.data = null; //清空原数据
			Loading.show();
			//关闭键盘
			document.activeElement.blur();
			if(type == 1) {
				var idx = $scope.search.history.indexOf($scope.search.text);
				if(idx >= 0) {
					$scope.search.history.splice(idx, 1);
				}

				//存储本地cach
				if($scope.search.history.length == 10) {
					$scope.search.history.splice(9, 1);
				}

				//存储本地cach
				$scope.search.history = [$scope.search.text].concat($scope.search.history);
				CacheService.set(userId + "_mat_work_search", $scope.search.history, true);
			}
			//开启上拉事件
			mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
			$scope.pageIndex = 0;
			mui('#pullrefresh').pullRefresh().refresh(true);
			mui("#pullrefresh").pullRefresh().pullupLoading();
		},
		//点击历史搜索
		searchlist: function(eqIdentifier, type) {
			if(type == 1) {
				$scope.searchName = eqIdentifier
				$scope.TypeName = "";
			} else {
				$scope.TypeName = eqIdentifier;
				$scope.searchName = "";
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
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
		}

	};

	//获取日志归类列表

	//搜索
	function getWorkLogList(type) {
		var url = ApiService.Api50;
		switch($scope.type) {
			
			case 'undefined':
			  url += "/api/v1/MatWork/GetPagedMatWorkScheduleNotOvertimeList?content=" + encodeURIComponent($scope.searchName) + "&pageSize=" + $scope.pageSize + "&pageIndex=" + $scope.pageIndex + "&logTypeName=" + encodeURIComponent($scope.TypeName);
			break;
			case 'done':
			  url += "/api/v1/MatWork/GetPagedMatWorkScheduleOvertimeList?content=" + encodeURIComponent($scope.searchName) + "&pageSize=" + $scope.pageSize + "&pageIndex=" + $scope.pageIndex + "&logTypeName=" + encodeURIComponent($scope.TypeName);
			break;
		}
		DataService.get(url).then(function(res) {

				Loading.hide();
				$scope.domShow = true;
				networkCanUse = true;
				($scope.data == null) && ($scope.data = []);
				$scope.data = $scope.data.concat(res.Data);
				var isEnd = $scope.data.length >= res.TotalCount;
				if(mui("#pullrefresh").pullRefresh()) {
					mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
				}

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
			}, function() {
				$scope.domShow = true;
				networkCanUse = false;
				if(mui("#pullrefresh").pullRefresh()) {
					setTimeout(function() {
						mui("#pullrefresh").pullRefresh().endPullupToRefresh();
					}, 800)
				}
			})
	}
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

	RPCObserver.on('refresh_mat_fault_list', 'refresh_mat_fault_list');
	window.refresh_mat_fault_list = function() {
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