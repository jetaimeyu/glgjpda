app.controller("OutStockController", ["$scope", "$filter", "AuthService", "ApiService", "DataService", "UtilsService", "ChatUserService", "Loading", "RPCObserver", "ShareLogService", "CacheService",
	function($scope, $filter, AuthService, ApiService, DataService, UtilsService, ChatUserService, Loading, RPCObserver, ShareLogService, CacheService) {
		$scope.data = {
			pageSize: 10,
			//当前页数
			pageIndex: 0,
			//总条数
			totalCount: 0,
			//客户名称
			customerName: '',
			//选择的ID
			checkedID: 0,
			//客户数据
			customerList: "",
			//选择的数据
			selectedList: {},
			//是否必填
			IsRequire: '',
		}
		//桂林国际定制
		$scope.curUser = CacheService.get("user");
		$scope.isglgj = $scope.curUser.CompID == 27712;
		
		$scope.isIos = !mui.os.android;
		$scope.isLoad = false;
		$scope.isSearch = false;
		var self = plus.webview.currentWebview();
		//console.log(JSON.stringify(self))
		if(self.selectObj.chooseID) {
			$scope.data.checkedID = self.selectObj.chooseID;
		}
		if(self.selectObj.IsRequire) {
			$scope.data.IsRequire = self.selectObj.IsRequire;
		}
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
			$scope.data.pageIndex++;
			loadCustomer()
		}
		//隐藏上拉加载提示
		function hideTips() {
			document.body.querySelector(".mui-pull-bottom-tips").classList.add("mui-hidden");
		}

		//显示上拉加载提示
		function showTips() {
			document.body.querySelector(".mui-pull-bottom-tips").classList.remove("mui-hidden");
		}

		//客户数据
		var isEnd = false;

		function loadCustomer() {
			Loading.show();
			var url = ApiService.Api45 + "/api/v1.0/Customer/GetCustomerList?catalogId&page=" + $scope.data.pageIndex + "&pageSize=" + $scope.data.pageSize + "&viewType=0&timeType=0&State=1&customerName=" + encodeURIComponent($scope.data.customerName);
			DataService.post(url, []).then(function(res) {
				if(res) {
					$scope.data.totalCount = res.TotalCount;
					if(typeof $scope.data.customerList == "string") {
						$scope.data.customerList = res.DataRows;
					} else {
						$scope.data.customerList = $scope.data.customerList.concat(res.DataRows);
					}
					isEnd = $scope.data.customerList.length ? $scope.data.customerList.length >= (res.TotalCount) : true;
					if(mui("#pullrefresh").pullRefresh()) {
						mui('#pullrefresh').pullRefresh().refresh(true);
						mui("#pullrefresh").pullRefresh().endPullupToRefresh(isEnd);
					}
					if($scope.data.customerName != '') {
						var result = document.querySelector('.search-result');
						if(result) {
							result.style.display = "block";
						}
					}
				}

				$scope.isLoad = true;
				Loading.hide();
				hideUpData();
			}, function(error) {
				Loading.hide();
				$scope.isLoad = true;
				$scope.data.customerList = "";
				mui("#pullrefresh").pullRefresh().endPullupToRefresh(true);
				hideUpData();
			});
		}
		//当数据为空时，隐藏上拉的提示
		function hideUpData() {
			var tip = document.querySelector('.mui-pull-bottom-pocket');
			if(tip) {
				if(!$scope.data.customerList || $scope.data.customerList.length == 0) {
					tip.classList.contains('mui-visibility') && tip.classList.remove('mui-visibility');
					tip.classList.contains('mui-block') && tip.classList.remove('mui-block');
				} else {
					!tip.classList.contains('mui-visibility') && tip.classList.add('mui-visibility');
					!tip.classList.contains('mui-block') && tip.classList.add('mui-block');
				}
			}
		}
		//点击选择整行   
		$scope.selectRow = function(id) {
			if($scope.data.checkedID == id) {
				//如果选中，再次点击取消选中
				$scope.data.checkedID = "";
			} else {
				$scope.data.checkedID = id;
			}
		};
		//选择
		$scope.selectCustomer = function() {
			if($scope.data.IsRequire == 1 && $scope.data.checkedID == "") {
				mui.toast("请选择客户");
				return;
			}
			for(var i = 0; i < $scope.data.customerList.length; i++) {
				if($scope.data.checkedID == $scope.data.customerList[i].CustomerID) {
					$scope.data.selectedList = $scope.data.customerList[i];
					break;
				}
			}
			var view = plus.webview.currentWebview();
			var opener = view.opener();
			if(view.callback) {
				var ret = {
					ID: $scope.data.selectedList.CustCompID,
					CustomerID: $scope.data.selectedList.CustomerID,
					CustName: $scope.data.selectedList.CustomerName,
					Province: $scope.data.selectedList.Province,
					City: $scope.data.selectedList.City,
					District: $scope.data.selectedList.District,
					Address: $scope.data.selectedList.Address,
					Street: $scope.data.selectedList.Street,
					MapLat: $scope.data.selectedList.MapLat,
					MapLng: $scope.data.selectedList.MapLng,
					MainLinkName: $scope.data.selectedList.MainLinkName,
					MainLinkPhone: $scope.data.selectedList.MainLinkPhone,
				};
				opener.evalJS(view.callback + "(" + JSON.stringify(ret) + ")");
			}
			mui.back();
		};
		//搜索
		$scope.search = function() {
			//$scope.data.customerName = document.querySelector("input[type='search']").value.trim();

			if(!$scope.data.customerName) {
				mui.toast("请输入搜索内容!")
				return;
			}
			$scope.isSearch = true;
			$scope.data.pageIndex = 1;
			$scope.isLoad = false;
			$scope.data.customerList = [];
			loadCustomer();
		}
		$scope.searchClear = function() {
			if(!$scope.data.customerName) {
				document.querySelector('.search-result').style.display = "none";
				$scope.isSearch = false;
				$scope.data.pageIndex = 1;
				$scope.isLoad = false;
				$scope.data.customerList = [];
				loadCustomer();
			}
		}
		$scope.deleteSearch = function() {
			document.querySelector('.search-result').style.display = "none";

			$scope.data.customerName = "";
			$scope.isSearch = false;
			$scope.data.pageIndex = 1;
			$scope.isLoad = false;
			$scope.data.customerList = [];
			loadCustomer();
		}
	}
]);
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	plus.webview.currentWebview().setStyle({
		scrollIndicator: 'none'
	});
});