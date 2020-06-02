app.controller("searchCtrl", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "CacheService", "AuthService", "RPCObserver",
	function ($scope, ApiService, DataService, UtilsService, Loading, CacheService, AuthService, RPCObserver) {
		var ws = plus.webview.currentWebview();
		$scope.action = ws.action ? ws.action : '';
		$scope.selectedUsers = ws.selectedUsers ? ws.selectedUsers : [];
		$scope.multiSelect = ws.multiSelect ? ws.multiSelect : false;;
		var resType = ws.resType ? ws.resType : 0;
		$scope.searchUsers = "";
		$scope.loaded = false;
		var userId = "";
		AuthService.getAuth().then(function (res) {
			userId = res.UserID;
			$scope.search.getHistory();
		});
		//弹出键盘
		showInput();
		$scope.search = {
			text: "",
			history: [],
			getHistory: function () {
				var temp = CacheService.get(userId + "_res" + resType + "_search");
				if (temp)
					$scope.search.history = CacheService.get(userId + "_res" + resType + "_search");
			},
			doSearch: function () {
				if (!$scope.search.text) {
					mui.toast("请输入搜索名称！");
					return;
				}

				Loading.show();

				//关闭键盘
				document.activeElement.blur();
				var idx = $scope.search.history.indexOf($scope.search.text);
				if (idx >= 0) {
					$scope.search.history.splice(idx, 1);
				}
				//存储本地cach
				if ($scope.search.history.length == 10) {
					$scope.search.history.splice(9, 1);
				}

				$scope.search.history = [$scope.search.text].concat($scope.search.history);
				CacheService.set(userId + "_res" + resType + "_search", $scope.search.history, true);

				$scope.loaded = "temp";
				setTimeout(function () {
					//搜索人员

					var url = ApiService.Api50 + "/api/v1/Resource/ResourceSearch?resourceName=" + encodeURIComponent($scope.search.text) + "&resType=" + resType;
					if (resType == 2) {
						url = ApiService.Api50 + "/api/v1/Resource/ResourceMyTalk?resourceName=" + encodeURIComponent($scope.search.text)
					}
					DataService.get(url).then(function (res) {
						Loading.hide();
						if (resType == 2) {
							$scope.searchUsers = res.Users;
						} else {
							$scope.searchUsers = res;
						}
						$scope.loaded = true;
					}, function (error) {
						$scope.loaded = true;
					})
				}, 150);
			},
			cancel: function () {
				mui.back();
			},
			save: function () {
				if ($scope.selectedUsers.length == 0) {
					mui.toast("请选择人员");
					return;
				}

				$scope.selectedUsers.forEach(function (user) {
					if (user.ViewName)
						user.RealName = user.ViewName;
				});

				var view = plus.webview.currentWebview();
				var opener = view.opener().opener().opener();
				if (view.opener().opener().callback) {
					opener.evalJS(view.opener().opener().callback + "(" + JSON.stringify($scope.selectedUsers) + ")");
				}

				ws.opener().opener().close('none');
				mui.back();
			}
		};
		RpcServer.expose("RPC_SearchUserListRefresh", function () {
			$scope.search.doSearch();
		})
		RPCObserver.on("SyncSelectedData", "SyncSelectedData");
		window.SyncSelectedData = function (selectObj) {
			$scope.selectedUsers = selectObj;
			$scope.$apply();
		}
	}
]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	var style = {
		scrollIndicator: 'none'
	};
	mui.os.android && (style.softinputMode = 'adjustResize');
	plus.webview.currentWebview().setStyle(style);
});