app.controller("GroupInfoController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "ChatUserService", "$Modal", "CacheService", "TapService", function($scope, ApiService, DataService, UtilsService, Loading, ChatUserService, $Modal, CacheService, TapService) {
	$scope.domData = {
		GroupName: "",
		GroupCode: query("groupcode"),
		GroupInfo: "",
		GroupUsers: "",
		UserID: "",
	};

	var user = CacheService.get("user", true);
	$scope.domData.UserID = user.data.UserID;

	//获取参数
	var cur = plus.webview.currentWebview();

	
	var curData = {
		//获取群详情
		getGroupInfo: function(callback) {
			var url = ApiService.Api50 + "/api/v1/Message/GroupInfo?groupCode=" + $scope.domData.GroupCode;

			DataService.get(url).then(function(data) {
				if(data) {
					$scope.domData.GroupInfo = data;
					$scope.domData.GroupName = data.GroupName;
				}
			});
		}
	};

	curData.getGroupInfo();
}]);

//选择人员后回调
function selectWorkUserCallback(arr) {
	if(arr.length === 0) return
	var appElement = document.querySelector('[ng-controller=GroupInfoController]');
	var $scope = angular.element(appElement).scope();
	//var allUsers = $scope.domData.GroupUsers.concat(arr)
	$scope.event.saveAddMember(arr)
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});