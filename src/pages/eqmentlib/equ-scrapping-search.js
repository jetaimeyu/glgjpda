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
	//故障id
	$scope.faultId = query("faultid") || "";
	$scope.must = query("must");
	$scope.equid = query("equid") || "";
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
			var temp = CacheService.get(userId + "equ_scrapping_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "equ_scrapping_search");
			$scope.domShowX = true;
			$scope.domShow = false;
		},
		doSearch: function() {
			$scope.search.text = document.querySelector("input").value.trim();
			if(!$scope.search.text) {
				mui.toast("请输入设备名称！");
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

			CacheService.set(userId + "equ_scrapping_search", $scope.search.history, true);
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
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
		}
	};

	function getPagedCompEqRepairRecordsList() {
		var url = ApiService.Api52 + "/api/v2/Equipment/GetYunOSEqInfoList?authType=4&state=9&eqName=" + encodeURIComponent($scope.search.text) + "&pageIndex=" + $scope.pageIndex + "&pageSize=" + $scope.pageSize;
		DataService.get(url).then(function(res) {
			Loading.hide();
			$scope.domShow = true;
			networkCanUse = true;
			($scope.allMain == null) && ($scope.allMain = []);
			$scope.allMain = $scope.allMain.concat(res.Data);

			var isEnd = $scope.allMain.length >= res.Total;
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
		getPagedCompEqRepairRecordsList();
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

	RPCObserver.on('refresh_equ_repair_list', 'refresh_equ_repair_list');
	window.refresh_equ_repair_list = function() {
		$scope.search.doSearch();
	};
	$scope.scarpDetails = function(id) {
		UtilsService.openWindow({
			needLogin: true,
			id: "equ-details.html",
			url: "equ-details.html?equid=" + id + "&isScrap=true"
		});
	}
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	var style = {
		scrollIndicator: 'none'
	};
	mui.os.android && (style.softinputMode = 'adjustResize');
	plus.webview.currentWebview().setStyle(style);
});