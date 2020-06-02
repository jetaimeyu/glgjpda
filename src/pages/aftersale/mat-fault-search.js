app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver", "$timeout", function($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver, $timeout) {
	$scope.domShow = null; //控制列表显示
	$scope.domShowX = false; //控制x显示
	$scope.data = null; //接口返回的所有故障
	$scope.searchName = ""; //搜索名称
	$scope.MatFaultTypeID = ""; //故障归类ID
	$scope.ResponsibilityID = ""; //责任判定ID
	$scope.pageSize = 20; //每页数量
	$scope.pageIndex = 1;
	var networkCanUse = true; //能正常启用网络
	var _canLoad = false;
	var prodId = query("prodid") || "";
	var skuId = query("skuid") || "";
	var mdCode = query("mdcode") || "";
	var innerCode = query("innercode") || "";
	//是否用于选择
	$scope.action = query("action");
	$scope.must = query("must");
	$scope.selectedId = query("selectedid") || 0;
	var userId = "";
	AuthService.getAuth().then(function(res) {
		$scope.UserCompID = res.CompID;
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
			var temp = CacheService.get(userId + "_mat_fault_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_mat_fault_search");
			$scope.domShowX = true;
			$scope.domShow = false;
		},
		doSearch: function(type) {
			_canLoad = true;
			$scope.search.text = document.querySelector("input").value.trim();
			if(type == 1) {
				$scope.searchName = $scope.search.text;
				$scope.MatFaultTypeID = "";
				$scope.ResponsibilityID = "";
			}

			if(!$scope.search.text) {
				mui.toast("请输入" + $scope.InnerCodeName);
				return;
			}
			$scope.data = null; //清空原数据
			Loading.show();
			//关闭键盘
			document.activeElement.blur();
			if(type != 2) {

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
				CacheService.set(userId + "_mat_fault_search", $scope.search.history, true);
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
				$scope.MatFaultTypeID = ID;
				$scope.searchName = "";
				$scope.ResponsibilityID = "";
				$scope.search.text = eqIdentifier;
			} else {
				$scope.searchName = eqIdentifier;
				$scope.MatFaultTypeID = "";
				$scope.ResponsibilityID = "";
				$scope.search.text = eqIdentifier;

			}
			$timeout(function() {
				$scope.search.doSearch(ID && 2);
			}, 100)
		},
		//责任判定搜索
		searchByRes: function(eqIdentifier, ID) {
			$scope.ResponsibilityID = ID;
			$scope.searchName = "";
			$scope.MatFaultTypeID = "";
			$scope.search.text = eqIdentifier;
			$timeout(function() {
				$scope.search.doSearch(2);
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

	$scope.FailureTypeList = "";
	//获取故障归类列表
	Loading.show();

	GetEqFailureTypeList();

	function GetEqFailureTypeList() {
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetMatFailureTypeList";
		Loading.hide();
		$scope.isLoad = true;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.FailureTypeList = res;
			}
		})
	};

	$scope.ResponsibilityList = "";
	//获取责任判定列表
	GetMatResponsibilityList();

	function GetMatResponsibilityList() {
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetMatResponsibilityList";
		Loading.hide();
		$scope.isLoad = true;
		DataService.get(url).then(function(res) {
			if(res) {
				$scope.ResponsibilityList = res;
			}
		})
	};

	//搜索
	function getPagedCompMatWorkOrderFailureList() {
		var url = ApiService.Api50 + "/api/v1/MatWorkOrder/GetPagedCompMatWorkOrderFailureList?keyWords=" + encodeURIComponent($scope.searchName) + "&pageSize=" + $scope.pageSize + "&pageIndex=" + $scope.pageIndex + "&authType=0";
		if($scope.MatFaultTypeID) {
			url += "&matFaultTypeId=" + $scope.MatFaultTypeID;
		}
		if($scope.ResponsibilityID) {
			url += "&responsibilityId=" + $scope.ResponsibilityID;
		}
		mdCode && (url += "&mdCode=" + mdCode);
		prodId && (url += "&prodId=" + prodId);
		skuId && (url += "&skuId=" + skuId);
		innerCode && (url += "&prodInnerCode=" + innerCode);
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
	//上拉加载服务
	function uppullRefresh() {
		if(!_canLoad) {
			return;
		}
		if(networkCanUse) {
			$scope.pageIndex++; //页数
		}
		getPagedCompMatWorkOrderFailureList();
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

	//选择故障
	if($scope.action == "select") {
		//接受已选择的参数
		$scope.selectObj = plus.webview.currentWebview().selectObj;
		//rpc
		RPCObserver.on('refresh_mat_fault_Select_Info', 'refresh_mat_fault_Select_Info');
		window.refresh_mat_fault_Select_Info = function(params) {
			RPCObserver.broadcast('refresh_mat_fault_Select_Refresh', params.ID);
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