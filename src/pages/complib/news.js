app.controller("CompNewsController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", function($scope, ApiService, DataService, UtilsService, Loading) {
	$scope.newsList = [];
	var page = 1;
	var pageSize = 10;
	var compid = query("compid");

	setTimeout(function() {
		//初始化上拉、下拉控件
		mui.init({
			pullRefresh: {
				container: '#slider',
				down: {
					callback: loadNewData
				},
				up: {
					auto: false,
					contentrefresh: '正在加载...',
					callback: loadMoreData
				}
			}
		});

		setTimeout(function() {
			mui('#slider').pullRefresh().pullupLoading();
		}, 100)
	})

	/**
	 * 刚打开页面时，加载新闻
	 */
	function loadFirstData() {
		Loading.show();
		loadData("down", function(hasMoreData) {
			console.log(hasMoreData);
			if(hasMoreData == 1) {
				mui("#slider").pullRefresh().endPullupToRefresh(true);
			} else if(hasMoreData == 0) {
				if(mui("#slider").pullRefresh()) {
					mui('#slider').pullRefresh().endPulldownToRefresh();
					mui('#slider').pullRefresh().endPullupToRefresh(hasMoreData < 2);
				}
			}
			scollTip();
		});
	}

	/**
	 * 访问接口，加载新闻数据
	 */
	function loadData(loadType, callback) {
		var url = ApiService.Api50 + "/api/v1/News/GetNewsList?pageIndex=" + page + "&pageSize=" + pageSize + "&compId=" + compid;
		DataService.get(url).then(function(data) {
			Loading.hide();
			$scope.isLoad = true;
			var hasMoreData = 0; //无新闻
			data.forEach(function(item) {
				item.ImgUrl = item.ImgUrl.replace(/http:\/\/api3.maidiyun.com/g, ApiService.Api30).replace(/\/\/mdcloud.maidiyun.com\/50/g, ApiService.Api50);
			});
			data.length > 0 && (page += 1);
			if(data.length < pageSize) {
				hasMoreData = 1; //无更多新闻
			} else {
				hasMoreData = 2; //还有更多新闻
			}
			if(loadType == "down") {
				$scope.newsList = data;
			} else {
				$scope.newsList = $scope.newsList.concat(data);
			}
			callback(hasMoreData);
		});
	}

	/**
	 * 加载更多的新闻
	 */
	function loadMoreData() {
		loadData("up", function(hasMoreData) {
			mui('#slider').pullRefresh().endPullupToRefresh(hasMoreData < 2);
			scollTip();
		});
	}

	/**
	 * 下拉加载的新闻
	 */
	function loadNewData() {
		page = 1;
		//加载新闻
		loadData("down", function(hasMoreData) {
			mui('#slider').pullRefresh().endPulldownToRefresh();
			mui('#slider').pullRefresh().refresh(true);

			if(hasMoreData == 1) {
				mui("#slider").pullRefresh().endPullupToRefresh(true);
			} else if(hasMoreData == 2) {
				mui("#slider").pullRefresh().endPullupToRefresh(false);
			}
			scollTip();
		});
	};
	/**
	 * 跳转新闻详情
	 */
	$scope.tap = function(type, id) {
		switch(type) {
			//故障内容
			case "newsInfo":
				UtilsService.openWindow({
					needLogin: true,
					id: "news-info.html",
					url: "news-info.html?id=" + id
				});
				break;
			default:
				break;
		}
	}

	function scollTip() {
		var tip = document.querySelector('.mui-pull-bottom-pocket');
		if(tip) {
			if($scope.newsList.length == 0) {
				tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
				tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
			} else {
				!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
				!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
			}
		}
	}

}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});