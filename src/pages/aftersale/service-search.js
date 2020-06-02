app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.allMain = null; //接口返回的所有维修
	$scope.pageIndex = 1; //页数
	$scope.pageSize = 20; //每页数量
	var paramsID = query("id");//参数id
	var networkCanUse = true;
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
			var temp = CacheService.get(userId + "_service_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_service_search");
			$scope.domShowX = true;
			$scope.domShow = false;
		},
		doSearch: function() {
			$scope.search.text = document.querySelector("input").value.trim();
			if(!$scope.search.text) {
				mui.toast("请输入工作内容");
				return;
			}
			$scope.allMain = null; //清空原数据
			Loading.show();
			//关闭键盘
			document.activeElement.blur();

			var idx = $scope.search.history.indexOf($scope.search.text);
			if(idx >= 0) {
				$scope.search.history.splice(idx, 1);
			}

			//存储本地cach
			if($scope.search.history.length == 10) {
				$scope.search.history.splice(9, 1);
			}

			$scope.search.history = [$scope.search.text].concat($scope.search.history);

			CacheService.set(userId + "_service_search", $scope.search.history, true);
			//开启上拉事件
			mui('#pullrefresh').pullRefresh().enablePullupToRefresh();

			$scope.pageIndex = 0;
			mui('#pullrefresh').pullRefresh().refresh(true);
			mui("#pullrefresh").pullRefresh().pullupLoading();
		},
		//点击历史span搜索
		searchSpan: function(eqIdentifier) {
			$scope.search.text = eqIdentifier;
			$timeout(function() {
				$scope.search.doSearch();
			}, 100)
		},
		//点击搜索x
		deleteSearch: function() {
			$scope.search.text = '';
			$scope.domShow = false; //控制列表显示
		}
	};

	function getCompRepairRecordsList() {
		var url = ApiService.Api50 + "/api/v2/Customer/GetCompCustomerServiceList?keyWords=" + encodeURIComponent($scope.search.text) + "&pageIndex=" + $scope.pageIndex + "&pageSize=" + $scope.pageSize + "&paramTypeId=" + paramsID;
		DataService.get(url).then(function(res) {
			Loading.hide();
			$scope.domShow = true;
			networkCanUse = true;
			($scope.allMain == null) && ($scope.allMain = []);
			$scope.allMain = $scope.allMain.concat(res.DataRows);

			var isEnd = $scope.allMain.length >= res.TotalCount;
			if(mui("#pullrefresh").pullRefresh()) {
				mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
			}

			var tip = document.querySelector('.mui-pull-bottom-pocket');
			if(tip) {
				if($scope.allMain.length == 0) {
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
		});
	};
	//上拉加载
	function uppullRefresh() {
		if(networkCanUse) {
			$scope.pageIndex++; //页数
		}
		getCompRepairRecordsList();
	};

	//下拉刷新,上拉加载
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

	//取消
	$scope.cancel = function() {
		mui.back();
	}
	//确定
	$scope.save = function() {
		if(!$scope.selectObj.ID && $scope.must == "true") {
			mui.toast("请选择一个维修记录");
			return;
		}

		var view = plus.webview.currentWebview();
		var opener = view.opener().opener();
		if(view.opener().callback) {
			opener.evalJS(view.opener().callback + "(" + JSON.stringify($scope.selectObj) + ")");
		}
		view.opener().close('none');
		mui.back();
	}
	RPCObserver.on('refresh_service_search_list', 'refresh_service_search_list');
	window.refresh_service_search_list = function() {
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