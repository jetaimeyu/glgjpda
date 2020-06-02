app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "ProdService", "Loading", "CacheService", "AuthService", "$Modal", function($scope, ApiService, DataService, ProdService, Loading, CacheService, AuthService, $Modal) {
	$scope.imgUrl = ApiService.Img; //产品图片路径
	$scope.searchProds = "";
	$scope.loaded = false;
	var userId = "";
	AuthService.getAuth().then(function(res) {
		userId = res.UserID;
		$scope.search.getHistory();
	});

	$scope.search = {
		text: "",
		history: [],
		getHistory: function() {
			var temp = CacheService.get(userId + "_prod_search");
			if(temp)
				$scope.search.history = CacheService.get(userId + "_prod_search");
		},
		doSearch: function() {
			if(!$scope.search.text) {
				mui.toast("请输入搜索名称！");
				return;
			}

			Loading.show();

			//关闭键盘
			document.activeElement.blur();
			//存储本地cach
			if($scope.search.history.length == 10) {
				$scope.search.history.splice(9, 1);
			}

			var idx = $scope.search.history.indexOf($scope.search.text);
			if(idx >= 0) {
				$scope.search.history.splice(idx, 1);
			}

			$scope.search.history = [$scope.search.text].concat($scope.search.history);
			CacheService.set(userId + "_prod_search", $scope.search.history, true);

			$scope.loaded = "temp";
			setTimeout(function() {
				ProdService.getPkgList($scope.search.text, '', 1, 9999).then(function(res) {
					Loading.hide();
					$scope.searchProds = res.DataRows;
					$scope.loaded = true;
				}, function(error) {
					$scope.loaded = true;
					Loading.hide();
				});
			}, 150);
		},
	};

	$scope.openSku = function(prod) {
		$Modal.modal({
				footer: true,
				size: 'small',
				autoClose: true,
				params: {
					prodid: prod.ProdID,
					prodname: prod.ProdName,
					sku: ''
				},
				template: "<md-select-sku prodid='params.prodid' prodname='params.prodname' sku='params.sku'></md-select-sku>",
				controller: ['$scope',
					function($scope) {
						$scope.$modal.callback = function() {
							if(!$scope.params.sku.SkuID) {
								mui.toast("请选择型号！");
								return false;
							}
							$scope.$modal.resolve($scope.params.sku);
							$scope.$modal.close();
						};
					}
				]
			}).show()
			.then(function(sku) {
				var view = plus.webview.currentWebview();
				var opener = view.opener().opener();
				if(view.opener().callback) {
					var temp = {
						ProdID: prod.ProdID,
						ProdName: prod.ProdName,
						SkuID: sku.SkuID,
						SkuName: sku.SkuName
					};
					opener.evalJS(view.opener().callback + "(" + JSON.stringify(temp) + ")");
				}
				view.opener().close('none');
				mui.back();
			});
	}
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});