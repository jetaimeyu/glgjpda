app.controller("GroupMemberNameController", ["$scope", "ApiService", "DataService", "UtilsService", "Loading", "ChatUserService", "$Modal", "CacheService", "TapService", function ($scope, ApiService, DataService, UtilsService, Loading, ChatUserService, $Modal, CacheService, TapService) {
	$scope.domData = {
		GroupID: "",
		UserID: "",
		GroupCode:"",
		MemberName: ""
	};


	//获取参数
	var cur = plus.webview.currentWebview();
	$scope.domData.GroupID = cur.GroupID;
	$scope.domData.UserID = cur.UserID;
	$scope.domData.MemberName = cur.MemberName;
	$scope.domData.GroupCode = cur.GroupCode;

	$scope.event = {
		save: function () {
			if(!checkLengthUtil.check()) {
				return false;
			}

			if(!$scope.domData.MemberName.trim())
			{
				mui.toast("请输入您的群名片");
				return;
			}
			mui.showLoading("正在保存", "div");
			curData.updateMemberName();
		}
	};

	var curData = {
		//获取群详情
		updateMemberName: function () {
			var url = ApiService.Api50 + "/api/v1/Message/GroupMemberUpdate_Self?groupId=" + $scope.domData.GroupID + "&memberName=" + encodeURIComponent($scope.domData.MemberName);
			DataService.post(url).then(function (data) {
				//rpc 刷新接口
				var _data = {
					MemberName: $scope.domData.MemberName,
					UserID: $scope.domData.UserID
				};

				RpcClient.invoke("group-info.html","Rpc_refreshMemberName",_data);
				RpcClient.invoke("chat-group-"+$scope.domData.GroupCode,"Rpc_refreshMemberName",_data);

				mui.hideLoading();

				mui.back();
			});
		}
	};

}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});