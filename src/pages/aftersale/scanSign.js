app.controller("ProdInfoCtl", ["$scope", "CustomModalService", "CacheService", "$Modal", "UtilsService", "ApiService", "DataService", "Loading", "$filter","ChatUserService", function($scope, CustomModalService, CacheService, $Modal, UtilsService, ApiService, DataService, Loading, $filter,ChatUserService) {
	var view = plus.webview.currentWebview();
	$scope.user = CacheService.get('user');
	$scope.isLoad = true;

	view.prodInfo.ProdName = decodeURIComponent(view.prodInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"").replace(/@percent@/g, "%");
	view.prodInfo.SkuName = decodeURIComponent(view.prodInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"").replace(/@percent@/g, "%");
	view.prodInfo.InnerCode =  view.prodInfo.InnerCode.replace(/@and@/g, "&").replace(/@hash@/g, "#");
	
	view.prodInfo.InnerCodeName = $scope.user.InnerCodeName || '出厂编号';
	$scope.ProdInfo =view.prodInfo;

	$scope.FacInstall = { //装配后生产厂家，20170706后改为源生产厂家对此赋值，不走装配
		ID: view.prodInfo.CompID,
		Name:view.prodInfo.CompName.replace(/@and@/g, "&").replace(/@hash@/g, "#")
	}

	$scope.sendUsers=[];

	$scope.curDate = new Date().Format("yyyy-MM-dd HH:mm")

	$scope.OutCust = { //出库时的客户信息
		IsHasOut: 0, //是否有出库信息
		//生产厂家时：首次出库客户信息
		FirstCust: "",
		//生产厂家时：最后一次出库信息
		LastCust: ""
	};
	$scope.Fac = { //源生产厂家
		ID: view.prodInfo.SourceCompID,
		Name: ""
	}


	$scope.process = {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [
		// 	{
		// 	Text: "上传语音文件", //0未执行 1执行中 2完成 3失败
		// 	State: 0,
		// 	RetryMethod: uploadAudio
		// }, {
		// 	Text: "上传图片",
		// 	State: 0,
		// 	RetryMethod: uploadImgs
		// }, {
		// 	Text: "上传视频",
		// 	State: 0,
		// 	RetryMethod: uploadVideos
		// },
		
		{
			Text: "保存签到信息",
			State: 0,
			RetryMethod: submitData
		}, {
			Text: "通知抄送人",
			State: 0,
			RetryMethod: sendMsg
		}]
	};
	

	//loadCantractInfo();
	//加载
	
	$scope.isLoad = true;

	UtilsService.getLocation(true).then(function(l) {
		$scope.PostData = {
			Province: l.province || "",
			City: l.city || "",
			District: l.district || "",
			Address:l.address || "",
			Street: (l.street || "") + (l.poiName || ""),
			MapLat: l.lat || 0.0,
			MapLng: l.lng || 0.0,
			MdCode:$scope.ProdInfo.MDCode,
			ProdID:$scope.ProdInfo.ProdID,
			SkuID:$scope.ProdInfo.SkuID
		};
	});

	loadProdCustInfo();
	var saving = false; 
	var sendUserIDs=[];
	$scope.event = {
		toDetail:function(){
			this.openWindow('prodinfo-head.html','../problib/prodinfo-head.html?prodId=' + $scope.ProdInfo.ProdID + "&SkuID=" + $scope.ProdInfo.SkuID + "&MdCode=" + $scope.ProdInfo.MDCode + "&ProdInnerCode=" + encodeURIComponent($scope.ProdInfo.InnerCode) + "&InnerCodeName=" + $scope.ProdInfo.InnerCodeName)
		},
		toComp:function(compId){
			this.openWindow('complib-index.html','../complib/index.html?compid=' + compId);
		},
		tel:function(phone){
			plus.device.dial(phone, false);
		},
		openWindow:function(id,url,extras){
			var params = {
				id:id,
				url:url
			};
			if(extras)
			{
				params.extras = extras;
			}
			UtilsService.openWindow(params);
		},
		save:function(){

			UtilsService.submitModal($scope.process, function() {
				saving = false;
				mui.back();
			}, function() {
				saving = false;
				$scope.process.SaveState = 0;
				$scope.process.ProcessList.forEach(function(item) {
					item.State = 0;
				})
			}, function() {
				saving = false;
				$scope.process.ProcessList.forEach(function(item) {
					item.State = 0;
				})
			});

			submitData();
		},
		selectUser:function(){
			this.openWindow("contact-select.html","../common/contact-select.html?action=select&multiselect=true",{
				selectObj: $scope.sendUsers,
				callback: "selectUserCallback"
			})
		}
	};

	function submitData(){
		$scope.process.ProcessList[0].State = 1;
		var url = ApiService.Api50+"/api/v1/Prod/ProdScanSign";
			//mui.showLoading("正在保存...", "div");
			DataService.post(url,$scope.PostData).then(function(res){
				//mui.hideLoading();
				//mui.toast("签到成功");
				$scope.process.ProcessList[0].State = 2;
				sendMsg(res);
				
				// setTimeout(function() {
				// 	mui.back();
				// }, 300);
				
			},function(){
				$scope.process.ProcessList[0].State = 3;
				//mui.hideLoading();
			})
	};

	window.selectUserCallback= function(obj){
		$scope.sendUsers = angular.copy(obj);
		$scope.$apply();
	};

	
	function sendMsg(res) {

		if($scope.sendUsers.length==0)
		{
			$scope.process.ProcessList[1].State = 2;
			$scope.process.SaveState = 1;
			return;
		}

		$scope.process.ProcessList[1].State = 1;

		$scope.sendUsers.filter(function(user) {
			return sendUserIDs.indexOf(user.UserID) < 0
		}).forEach(function(user) {
			ChatUserService.send({
				chatId: user.UserID,
				chatName: user.ViewName,
				chatCompId: user.CompID,
				hasLogo: $scope.user.ULogoIsExist,
				chatLogo: user.ULogoIsExist,
				type: 7,
				content: {
					eventName: "prod-scan-sign",
					logo: ApiService.Down + "/chat/scan-sign.png",
					title: "扫码签到",
					desc: $scope.ProdInfo.ProdName ,
					params: [res,($scope.PostData.Province == $scope.PostData.City?($scope.PostData.Province+" "+$scope.PostData.District):($scope.PostData.Province+" "+$scope.PostData.City+" "+$scope.PostData.District))]
				}
			});
		});

		setTimeout(function() {
			$scope.process.ProcessList[1].State = 2;
			$scope.process.SaveState = 1;
			$scope.$apply();
		}, 200);
	};
	
	//动态获取接口
	function getUrlList(url) {
		url += "&type=all&isscan=1";
		if($scope.ProdInfo.ProdInnerCode == "") {
			return url += '&mdcode=' + $scope.ProdInfo.MDCode;
		} else {
			return url += '&innercode=' + encodeURIComponent($scope.ProdInfo.ProdInnerCode);
		}

	};

	//通过物联码获取产品详情
	function getProdInfoByMdCode() {
		var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + query("MDCode") + "&CompID=" + $scope.user.CompID;
		DataService.get(url).then(function(res) {
			$scope.isLoad = true;
			$scope.ProdInfo = {
				ProdID: res.ProdID,
				CompID: res.CompID,
				ProdName: res.ProdName,
				SkuID: res.SkuID,
				SkuName: res.SkuName,
				ProdInnerCode: res.InnerCode,
				MDCode: query("MDCode"),
				InnerCodeName: $scope.user.InnerCodeName || '出厂编号',
				LogoIsExist: res.LogoIsExist
			};
			$scope.FacInstall.ID = res.CompID;
			$scope.FacInstall.Name = res.CompName;
			$scope.Fac.ID = res.SourceCompID;
//			$scope.Fac.Name = res.CompName;
		})
	}
	//获取产品出库所属客户信息
	function loadProdCustInfo() {
		var url = ApiService.Api45 + "/api/v1.0/Stock/GetProdOutHistory?MDCode="+$scope.ProdInfo.MDCode;
		DataService.get(url).then(function(res) {
			if(res.length == 0)
				return;
			else
				$scope.OutCust.IsHasOut = 1;
			//如果扫码产品的生产企业ID与当前用户所在企业ID相同，则显示第一次出库信息和最后一次出库信息
			if($scope.ProdInfo.CompID == $scope.user.CompID) {
				$scope.OutCust.FirstCust = res[0];
				if(res.length > 1) {
					$scope.OutCust.LastCust = res[res.length - 1];
				}
			}
		}, function(e) {})
	}

}]);

app.filter("getScanTime", function() {
	return function(date) {
		return GetDate(date, true, true);
	}
});

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});