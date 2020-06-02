app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.allMain = null; //接口返回的所有维修

	$scope.pageIndex = 1; //页数
	$scope.pageSize = 20; //每页数量
	$scope.state = 0;
	var networkCanUse = true;
	var kw = plus.webview.currentWebview();
	var keywords = kw.keywords;
	//是否用于选择
	$scope.action = query("action");
	$scope.multiselect = query("multiselect") //多选
	var userId = "";
	AuthService.getAuth().then(function(res) {
		userId = res.UserID;
		if(keywords != undefined && keywords != '') {
			$scope.search.text = keywords;
			setTimeout($scope.search.doSearch, 200);
		} else {
			//弹出键盘
			showInput();
			$scope.domShow = false;
		}
		$scope.search.getHistory();
	});

	$scope.search = {
		text: "",
		history: [],
		getHistory: function() {
			var temp = CacheService.get(userId + "_equ_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_equ_search");
			$scope.domShowX = true;
		},
		doSearch: function(type) {
			$scope.search.text = document.querySelector("input").value.trim();
			if(!$scope.state && !$scope.search.text) {
				mui.toast("请选择设备状态或输入设备编号或设备名称！");
				return;
			}
			$scope.allMain = null; //清空原数据
			$scope.domShow = null;
			Loading.show();
			//关闭键盘
			document.activeElement.blur();
			if(!$scope.state||type!=1) {
				var idx = $scope.search.history.indexOf($scope.search.text);
				if(idx >= 0) {
					$scope.search.history.splice(idx, 1);
				}
				//存储本地cach
				if($scope.search.history.length == 10) {
					$scope.search.history.splice(9, 1);
				}

				$scope.search.history = [$scope.search.text].concat($scope.search.history);

				CacheService.set(userId + "_equ_search", $scope.search.history, true);
			}
			$scope.search.text != "" && type != 2 && ($scope.state = 0);
			if($scope.state > 0) {
				switch($scope.state) {
					case "1":
						$scope.search.text = '在用';
						break;
					case "2":
						$scope.search.text = '保养';
						break;
					case "3":
						$scope.search.text = '待售';
						break;
					case "4":
						$scope.search.text = '空闲';
						break;
					case "7":
						$scope.search.text = '维修';
						break;
					case "9":
						$scope.search.text = '停用';
						break;
					case "11":
						$scope.search.text = '租赁';
						break;
					default:
						break;
				}
			}

			//开启上拉事件
			mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
			$scope.pageIndex = 0;
			mui('#pullrefresh').pullRefresh().refresh(true);
			mui("#pullrefresh").pullRefresh().pullupLoading();
		},
		//点击历史span搜索
		searchSpan: function(keyWords) {
			$scope.search.text = keyWords;
			$timeout(function() {
				$scope.search.doSearch();
			}, 100)

		},
		//点击搜索x
		deleteSearch: function() {
			$scope.state = 0;
			$scope.search.text = '';
			$scope.domShow = false; //控制列表显示
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
		}
	};
	$scope.tap = function(state) {
		//关闭键盘
		document.activeElement.blur();
		//设备状态 1正常2保养3代售4空闲7维修8停用9报废10二手
		$scope.state = state;
		$timeout(function() {
			$scope.search.doSearch(1);
		}, 100)
	};

	function GetEqInfoList() {
		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoList?pageIndex=" + $scope.pageIndex + "&pageSize=" + $scope.pageSize + "&keywords=" + ($scope.state ? '' : encodeURIComponent($scope.search.text)) + "&state=" + $scope.state;
		DataService.get(url).then(function(res) {
			Loading.hide();
			$scope.domShow = true;
			networkCanUse = true;
			setTimeout(function() {
				document.activeElement.blur();
			}, 100);
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
			mui.os.ios && mui("#pullrefresh").pullRefresh() && mui('#pullrefresh').pullRefresh().scrollTo(0, 0)
			$scope.allMain.length==0 && mui('#pullrefresh').pullRefresh().scrollTo(0, 0);
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

	//上拉加载
	function uppullRefresh() {
		if(networkCanUse) {
			$scope.pageIndex++; //页数
		}
		GetEqInfoList();
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
		$scope.selectArr = plus.webview.currentWebview().selectArr;
		//rpc
		RPCObserver.on("RPC_FaultEquSelectInfo", "faultEquSelectInfo");
		window.faultEquSelectInfo = function(params) {
			RPCObserver.broadcast("RPC_FaultEquSelectRefresh", params);
			$scope.selectArr = params;
			$scope.$apply();
			return;
		}
	}

	//取消
	$scope.cancel = function() {
		mui.back();
	}
	//确定
	$scope.save = function() {

		if($scope.selectArr.length == 0) {

			mui.toast("请选择一个设备");
			return;
		}
		$scope.multiselect == "false" && ($scope.selectArr = $scope.selectArr[0]);
		var view = plus.webview.currentWebview();
		var opener = view.opener().opener();
		if(view.opener().callback) {
			opener.evalJS(view.opener().callback + "(" + JSON.stringify($scope.selectArr) + ")");
		}
		view.opener().close('none');
		mui.back();
	}
	RPCObserver.on('refresh_equ_list', 'refresh_equ_list');
	window.refresh_equ_list = function() {
		$scope.search.doSearch(2);
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