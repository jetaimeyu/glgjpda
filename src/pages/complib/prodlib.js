app.controller("CompProdLibController", ["$scope", "ApiService", "DataService", "Loading", "$q", "UtilsService", "TapService", "$filter",function($scope, ApiService, DataService, Loading, $q, UtilsService, TapService,$filter) {
	//企业编号
	$scope.compId = query('compid');
	//产品列表
	$scope.prods = null;
	//图册样式 1普通样式 2封面效果
	$scope.pictureStyle = 0;
	//显示询价
	$scope.isShowInquiry = 0;
	//是否第一次加载
	$scope.isFirstLoad = true;
	$scope.isResource = query("isResource") || 0;
	//目录
	$scope.tpl = {
		caption: '<span ng-class="{\'level0\':_node.id==\'0\'}" ng-bind="_node.name"></span>',
		icon: []
	};
	//每页条数
	var pageSize = 10;
	//当前页数
	var pageIndex = 0;
	//所选目录
	var sid = "";

	setTimeout(function() {
		mui.init({
			pullRefresh: {
				container: '#pullrefresh',
				up: {
					auto: true,
					callback: pullupRefresh
				}
			}
		});
	});

	$scope.ProdDetails = function(prodId, prodCompId) {
		TapService.openProdInfo(prodId, prodCompId,$scope.isResource);
	}
	init();

	//初始化
	function init() {
		//目录切换
		mui('body').on('tap', '.nav-dir', function() {
			mui('.mui-off-canvas-wrap').offCanvas('show');
		});
		//产品跳转
		mui(".mui-table-view").on("tap", ".mui-table-view-cell", function(e) {
			openWindow(this.getAttribute('url'));
		});

		Loading.show();

		//获取配置
		getConfig();
	}

	//获取配置
	function getConfig() {
		var url = ApiService.Api50 + "/api/v1/ProdShow/GetPkgShowConfigInfo?compId=" + $scope.compId;
		DataService.get(url).then(function(res) {
			if(res) {
				//显示询价
				$scope.isShowInquiry = res.IsShowInquiry;
				//图册样式 1普通样式 2封面效果
				$scope.pictureStyle = res.PictureStyle;
			}
		})
	}

	//加载目录
	$scope.loadDir = function() {
		var _defer = $q.defer();
		var url = ApiService.Api50 + "/api/v1/Prod/GetCompDir?compId=" + $scope.compId;
		DataService.get(url).then(function(res) {
			var _dirs = res.map(function(_item) {
				return {
					id: _item.ID,
					name: _item.SName,
					parent_id: _item.PID,
					path: _item.SPath
				};
			});
			_defer.resolve([{
				id: 0,
				is_leaf: _dirs.length == 0,
				name: '全部',
				path: '',
				expanded: _dirs.length > 0,
				tree_id: '0',
				children: DataService.listToTree(_dirs)
			}]);
		});
		return _defer.promise;
	};

	//目录点击
	$scope.$on("tree-node-selected", function(_event, _item) {
		if($scope.isFirstLoad) return;
		sid = _item.path;
		$scope.prods = [];
		pageIndex = 1;
		if(mui('#pullrefresh').pullRefresh()) {
			mui('#pullrefresh').pullRefresh().refresh(true);
			if(mui.os.ios) {
				mui('#pullrefresh').pullRefresh().scrollTo(0, 0, 0);
			}
		}
		//加载产品
		loadProduct();
		//		mui('#pullrefresh').pullRefresh().pullupLoading();
	});

	//产品上拉加载
	function pullupRefresh() {
		pageIndex++;
		//加载产品
		loadProduct();
	}

	//加载产品
	function loadProduct() {
		var url = ApiService.Api50 + "/api/v1/Prod/SearchShow?compId=" + $scope.compId + "&page=" + pageIndex + "&pageSize=" + pageSize;
		if(sid) {
			url += "&sid=" + sid;
		}
		DataService.get(url).then(function(res) {
			$scope.isLoad = true;
			$scope.isFirstLoad = false;
			if(res) {
				$scope.prods == null && ($scope.prods = []);
				$scope.prods = $scope.prods.concat(res.DataRows);
				var isEnd = $scope.prods.length >= res.TotalCount;
				mui("#pullrefresh").pullRefresh() && mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
				var tip = document.querySelector('.mui-pull-bottom-pocket');
				if(tip) {
					if($scope.prods.length == 0) {
						tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
						tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
					} else {
						!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
						!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
					}
				}
			}
			Loading.hide();
		})
	}

}]);

//获取产品图片
app.filter('getLogo', ["ApiService", function(ApiService) {
	return function(item) {
		if(item.IsNew == 0) {
			return ApiService.Pic + "/cGtnL2xvZ28=_" + item.ProdID + "_200x200.jpg";
		} else {
			return ApiService.Img + "/prod/logo/" + item.ProdID + "_0x0.jpg";
		}
	}
}]);

//过滤产品价格
app.filter('getPrice', function() {
	return function(item) {
		var price = "";
		if(item.MinPrice > 0 || item.MaxPrice > 0) {
			if(item.MinPrice == item.MaxPrice) {
				price = item.MinPrice;
			} else {
				if(item.MinPrice > 0 && item.MaxPrice > 0) {
					price = item.MinPrice + "~" + item.MaxPrice
				} else if(item.MinPrice > 0) {
					price = item.MinPrice;
				} else if(item.MaxPrice > 0) {
					price = "0" + "~" + item.MaxPrice;
				}
			}
		}
		return price;
	}
});

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});