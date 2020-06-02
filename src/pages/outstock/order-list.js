app.controller("OutStockController", ["$scope", "$filter", "AuthService", "ApiService", "DataService",
	"UtilsService", "ChatUserService", "Loading", "RPCObserver", "ShareLogService", "CacheService",
	function($scope, $filter, AuthService, ApiService, DataService, UtilsService, ChatUserService, Loading,
		RPCObserver, ShareLogService, CacheService) {
		$scope.ImgSrc = ApiService.Pic + "/" + imgPath.cmpLogo; //Y29tcC9sb2dv
		$scope.PageIndex = 0;
		$scope.Viewpermission = true; //是否有查看权限
		$scope.OrderList = ""; //出库单列表
		$scope.TotalCount = 0;
		$scope.tap = function(item) {
			UtilsService.openWindow({
				needLogin: true,
				id: 'order-save.html',
				url: 'order-save.html?id=' + item.ID + '&isview=1' + '&isedit=' + (item.OutType == 1 ? 1 : 0),
			});
		}
		$scope.isLoad = false;
		Loading.show();
		//下拉刷新,上拉加载

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
		})

		function pullupRefresh() {
			$scope.PageIndex++;
			getOrderList()
		}
		//隐藏上拉加载提示
		function hideTips() {
			document.body.querySelector(".mui-pull-bottom-tips").classList.add("mui-hidden");
		}

		//显示上拉加载提示
		function showTips() {
			document.body.querySelector(".mui-pull-bottom-tips").classList.remove("mui-hidden");
		}

		//获取出库单列表
		var isEnd = false;

		function getOrderList() {
			var url = ApiService.Api50 + "/api/v1.0/Stock/GetOutStockListNew?pageSize=10&page=" + $scope.PageIndex+'&isAll=1';
			DataService.get(url).then(function(reData) {
				$scope.isLoad = true;
//				console.log(url)
				Loading.hide();
				if(reData) {
//						console.log(JSON.stringify(reData))
					$scope.TotalCount = reData.TotalCount;
					if(typeof $scope.OrderList == "string") {
						$scope.OrderList = reData.DataRows;
					} else {
						$scope.OrderList = $scope.OrderList.concat(reData.DataRows);
					}
					isEnd = $scope.OrderList.length ? $scope.OrderList.length >= (reData.TotalCount) : true;
					if(mui("#pullrefresh").pullRefresh()) {
						mui('#pullrefresh').pullRefresh().refresh(true);
						mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
					}
				}
				hideUpData();
			}, function() {
				Loading.hide();
				$scope.isLoad = true;
				$scope.OrderList = "";
				mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
				hideUpData();
			});
		};
		//当数据为空时，隐藏上拉的提示
		function hideUpData() {
			var tip = document.querySelector('.mui-pull-bottom-pocket');
			if(tip) {
				if(!$scope.OrderList || $scope.OrderList.length == 0) {
					tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
					tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
				} else {
					!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
					!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
				}
			}
		}

		//刷新列表
		RPCObserver.on('refresh_order_list', 'refresh_order_list');
		window.refresh_order_list = function() {
			$scope.OrderList = "";
			$scope.PageIndex = 1;
			$scope.isLoad = false;
			Loading.show();
			getOrderList();
		};

	}

]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});