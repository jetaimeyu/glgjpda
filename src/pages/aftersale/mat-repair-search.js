app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.allMain = null; //接口返回的所有维修
	$scope.pageIndex = 1; //页数
	$scope.pageSize = 20; //每页数量
	var networkCanUse = true;
	//是否用于选择
	$scope.action = query("action");
	$scope.selectedId = query("selectedid") || 0;
	$scope.faultId = query("faultid");
	var userId = "";
	AuthService.getAuth().then(function(res) {
		userId = res.UserID;
		$scope.InnerCodeName = res.InnerCodeName || '出厂编号';
		$scope.search.getHistory();
	});

	//弹出键盘
	showInput();

	$scope.search = {
		text: "",
		history: [],
		getHistory: function() {
			var temp = CacheService.get(userId + "_mat_repair_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_mat_repair_search");
			$scope.domShowX = true;
			$scope.domShow = false;
		},
		doSearch: function() {
			$scope.search.text = document.querySelector("input").value.trim();
			if(!$scope.search.text) {
				mui.toast("请输入" + $scope.InnerCodeName);
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

			CacheService.set(userId + "_mat_repair_search", $scope.search.history, true);
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
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetCompRepairRecordsList?keywords=" + encodeURIComponent($scope.search.text) + "&pageIndex=" + $scope.pageIndex + "&pageSize=" + $scope.pageSize;
		if($scope.faultId > 0) url += "&faultId=" + $scope.faultId;
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
	//选择故障
	if($scope.action == "select") {
		//接受已选择的参数
		$scope.selectObj = plus.webview.currentWebview().selectObj;
		//rpc
		RPCObserver.on('refresh_mat_Repair_Select_Info', 'refresh_mat_Repair_Select_Info');
		window.refresh_mat_fault_Select_Info = function(params) {
			RPCObserver.broadcast('refresh_mat_Repair_Select_Refresh', params.ID);
			$scope.selectObj = params;
			$scope.$apply();

			var view = plus.webview.currentWebview();
			var opener = view.opener().opener();
			if(view.opener().callback) {
				opener.evalJS(view.opener().callback + "(" + JSON.stringify($scope.selectObj) + ")");
			}
			view.opener().close('none');
			mui.back();
			return;
		};
	}

	RPCObserver.on('refresh_mat_repair_list', 'refresh_mat_repair_list');
	window.refresh_mat_repair_list = function() {
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