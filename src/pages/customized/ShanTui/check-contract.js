app.controller("ContController", ["$scope", "$filter", "AuthService", "ApiService", "DataService",
	"UtilsService", "ChatUserService", "Loading", "RPCObserver", "ShareLogService", "CacheService",
	function($scope, $filter, AuthService, ApiService, DataService, UtilsService, ChatUserService, Loading,
		RPCObserver, ShareLogService, CacheService) {
		//选中Tab
		$scope.selectTab = 'faultSubmit';
		$scope.JobType = 1;
		$scope.ImgUrl = ApiService.Img;
		$scope.Api45 = ApiService.Api45;
		$scope.Photos = []; //图片
		$scope.mdCode = 0;
		$scope.contractData = {}; //合同信息,
//		$scope.formDate = function(date) {
//			return date.split(" ")[0]
//		};
		//修改合同权限
		$scope.editAuth = false;
		$scope.MendList = []; //故障报修列表
		$scope.DebugList = []; //安装调试列表
		$scope.ScrollMendPage = 1; //故障报修页码
		$scope.ScrollDebugPage = 1; //安装调试页码
		$scope.MendTotalCount = 0;
		$scope.DebugTotalCount = 0;
		$scope.getUnit = function(e) {
			switch(e) {
				case 1:
					return " 天";
					break;
				case 2:
					return " 个月";
					break;
				case 3:
					return " 年";
					break;
			}
		};
		$scope.tap = function(prodid,skuid,mdcode,innercode){
			var url = '../../problib/prodinfo-head.html?prodId=' + prodid + "&SkuID=" + skuid + "&MdCode=" + mdcode + "&ProdInnerCode=" + encodeURIComponent(innercode);
			UtilsService.openWindow({
					needLogin: true,
					id: "prodinfo-head.html",
					url: url
				});
		};
		var user = CacheService.get("user");
		if(query("mdcode")) {
			$scope.mdCode = query("mdcode");
			loadCantractInfo();
		}
		//加载合同数据
		function loadCantractInfo() {
			var url = ApiService.Api45 + "/api/v1.0/WorkOrder/GetMatContractInfo?mdCode=" + $scope.mdCode;
			DataService.get(url).then(function(reData) {
				$scope.editAuth = $filter("hasAuth")("Q6T") >= 0 && (user.CompID == reData.CompID) ? true : false;
				$scope.contractData = reData;
				document.getElementById("content").style.display = "block";
			});
		}
		mui("body").on("tap", ".edit", function() {
			openWindow("add-contract.html?edit=true", {
				callback: "refresh",
				contractData: JSON.stringify($scope.contractData)
			}, "add-contract.html");
			return false;
		})
		RPCObserver.on("ContrackReLoad","ContrackReLoad");
		window.ContrackReLoad = loadCantractInfo;

		//切换页面
		mui("body").on("tap", ".md-tab-item", function() {
			if(this.classList.contains("mui-active")) {
				return;
			}
			$scope.selectTab = this.getAttribute("data-type");
			$scope.JobType = this.getAttribute("data-index");
		});

	}
]);
//格式化迈迪国标通用物联码
app.filter('getMdCode', function() {
	return function(mdcode) {
		if(!mdcode || mdcode.length <= 14) {
			return mdcode;
		}
		return "物联码：***" + mdcode.substr(-14);
	}
});
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	mui.init();
	mui.previewImage();
});
