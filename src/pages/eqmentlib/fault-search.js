app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.data = null; //接口返回的所有故障
	$scope.searchName = ""; //搜索名称
	$scope.EquID = ""; //设备ID
	$scope.pageSize = 20; //每页数量
	$scope.pageIndex = 1;
	var networkCanUse = true; //能正常启用网络

	//是否用于选择
	$scope.action = query("action");
	$scope.must = query("must");
	$scope.selectedId = query("selectedid") || 0;
	$scope.must = query("must");
	$scope.equipmentId = query('equid') || '';
	var userId = "";
	var _canLoad = false;
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
			var temp = CacheService.get(userId + "_equ_fault_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_equ_fault_search");
			$scope.domShowX = true;
			$scope.domShow = false;
		},
		doSearch: function(type) {
			_canLoad = true;
			$scope.search.text = document.querySelector("input").value.trim();
			if(type == 1) {
				$scope.searchName = $scope.search.text;
				$scope.EquID = "";
			}

			if(!$scope.search.text) {
				mui.toast("请输入设备编号！");
				return;
			}
			$scope.data = null; //清空原数据
			Loading.show();
			//关闭键盘
			document.activeElement.blur();
			var idx = $scope.search.history.indexOf($scope.search.text);
			if(type != 2) {
				if(idx >= 0) {
					$scope.search.history.splice(idx, 1);
				}
				//存储本地cach
				if($scope.search.history.length == 10) {
					$scope.search.history.splice(9, 1);
				}

				//存储本地cach
				$scope.search.history = [$scope.search.text].concat($scope.search.history);
				CacheService.set(userId + "_equ_fault_search", $scope.search.history, true);
			}
			//开启上拉事件
			mui('#pullrefresh').pullRefresh().enablePullupToRefresh();
			$scope.pageIndex = 0;
			mui('#pullrefresh').pullRefresh().refresh(true);
			mui("#pullrefresh").pullRefresh().pullupLoading();
		},
		//点击历史 故障归类搜索
		searchlist: function(eqIdentifier, ID) {
			if(ID != undefined) {
				$scope.EquID = ID;
				$scope.searchName = "";
				$scope.search.text = eqIdentifier;
			} else {
				$scope.searchName = eqIdentifier;
				$scope.EquID = "";
				$scope.search.text = eqIdentifier;

			}
			$timeout(function() {
				$scope.search.doSearch(ID && 2);
			}, 100)
		},
		//点击搜索x
		deleteSearch: function() {
			$scope.search.text = '';
			$scope.domShow = false; //控制列表显示
			_canLoad = true;
			mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
		}

	};

	$scope.FailureTypeList = "";
	//获取故障归类列表
	Loading.show();

	function GetEqFailureTypeList() {
		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqFailureTypeList";
		Loading.hide();
		$scope.isLoad = true;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.FailureTypeList = res;
			}
		})
	};
	GetEqFailureTypeList();

	//搜索
	function getPagedCompEqWorkOrderFailureList() {
		var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetPagedCompEqWorkOrderFailureList?eqIdentifier=" + encodeURIComponent($scope.searchName) + "&pageSize=" + $scope.pageSize + "&pageIndex=" + $scope.pageIndex + "&failureTypeId=" + $scope.EquID + "&equipmentId=" + $scope.equipmentId + "&authType=0";
		$scope.action == 'select' && (url += "&jobFrom=1");
		DataService.get(url).then(function(res) {
			Loading.hide();
			$scope.domShow = true;
			networkCanUse = true;
			($scope.data == null) && ($scope.data = []);
			$scope.data = $scope.data.concat(res.DataRows);
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

	//选择故障
	if($scope.action == "select") {
		//接受已选择的参数
		$scope.selectObj = plus.webview.currentWebview().selectObj;
		//rpc
		RPCObserver.on("RPC_FaultSelectInfo", "faultSelectInfo");
		window.faultSelectInfo = function(params) {
			RPCObserver.broadcast("RPC_FaultSelectRefresh", params.ID);
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
		}
	}
	//上拉加载服务
	function uppullRefresh() {
		if(!_canLoad) {
			return;
		}
		if(networkCanUse) {
			$scope.pageIndex++; //页数
		}
		getPagedCompEqWorkOrderFailureList();
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

	RPCObserver.on('refresh_equ_fault_list', 'refresh_equ_fault_list');
	window.refresh_equ_fault_list = function() {
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