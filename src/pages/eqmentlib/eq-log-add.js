mui.init();

app.controller("bodyCtl", ["$scope", "DataService", "ApiService", "UtilsService", "$filter", "TapService", "AuthService", "CacheService", "$q", "BillService", "$timeout", function ($scope, DataService, ApiService, UtilsService, $filter, TapService, AuthService, CacheService, $q, BillService, $timeout) {
	$scope.domData = {
		title: "",
	};

	$scope.isLoad = false;

	var user = CacheService.get('user');

	$scope.info = {
		ID: "",
		//故障描述
		EquID: query("equid"),
		//故障设备
		MdCode: query("mdcode"),
		MapLat: "", //纬度
		MapLng: "", //经度
		Address: "", //详细地址
		Province: "", //省
		City: "", //市
		District: "", //区
		Street: "", //街道
		Description: "",
		State: query("state")
	};

	$scope.FinishQuantity=1;
	$scope.ProcessProgress = 0;

	$scope.audio = {}; //上传音频
	$scope.imageList = []; //上传图片
	$scope.videoList = []; //上传视频


	$scope.demand={
		
	};

	$scope.chooseDemand=function(){
		UtilsService.openWindow({
			url:"ep-demand-header.html",
			id:"ep-demand-header.html",
			extras:{
				data:$scope.demand,
				callback:"demandCallback"
			}
		});
	};


	function getDemandInfo()
	{
		DataService.get(ApiService.Api45+"/api/v1/EpDemand/GetDemandOverCount?demandId="+$scope.demand.ID).then(function(res){
			$scope.OverCount=res.OverCount;
			$scope.AllCount=res.AllCount;
			if(res == 0)
			{
				$scope.ProcessProgress ="100%";
			}
			else
			{
				$scope.ProcessProgress = (Math.round($scope.FinishQuantity / $scope.AllCount * 10000) / 100.00)+"%";
			}
		})
	}
	$scope.OverCount=-1;

	window.demandCallback = function(res){
		$scope.demand = res;
		$scope.FinishQuantity=1;
		if($scope.demand.ID)
		{
			getDemandInfo();
		}
		else
		{
			$scope.OverCount=-1;
		}
		$scope.$apply();
	};


	 document.querySelector("#finish_count").addEventListener("blur",function(){
		if(this.value>$scope.OverCount)
		{
			$scope.FinishQuantity= $scope.OverCount;
			mui.toast("您输入的已完成数量超过剩余数量！");
		}else if(this.value<=0)
		{
			$scope.FinishQuantity=1;
			mui.toast("您输入的已完成数量必须大于0！");
		}

		$scope.ProcessProgress = (Math.round($scope.FinishQuantity / $scope.AllCount * 10000) / 100.00)+"%";
		$scope.$apply();
	 });


	

	$scope.event = {
		choose: function (value) {
			$scope.info.State = value;
		}
	};

	if ($scope.info.State == 1) {
		$scope.domData.title = "签到";
	} else {
		$scope.domData.title = "记录";
	}

	

	var postData = {
		"ArmAttach": null,
		"ImgAttach": null,
		"VideoAttach": null
	}

	$scope.process = {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [{
			Text: "上传语音文件", //0未执行 1执行中 2完成 3失败
			State: 0,
			RetryMethod: uploadAudio
		}, {
			Text: "上传图片",
			State: 0,
			RetryMethod: uploadImgs
		}, {
			Text: "上传视频",
			State: 0,
			RetryMethod: uploadVideos
		}, {
			Text: "保存内容",
			State: 0,
			RetryMethod: submitData
		}]
	};

	function uploadAudio() {
		if (!isNetWorkCanUse()) {
			mui.toast("网络连接失败，请检查网络后再试");
		}
		if ($scope.audio && $scope.audio.FileSize && !$scope.audio.FileGuid) {
			$scope.process.ProcessList[0].State = 1;
			UtilsService.uploadFileBill($scope.audio.FilePath, 2).then(function (res) {
				if (res != null) {
					res.FileSize = $scope.audio.FileSize;
					res.FileType = 2;
					postData.ArmAttach = res;
				}
				$scope.process.ProcessList[0].State = (res == null ? 3 : 2);
				//上传图片
				uploadImgs();
			});
		} else {
			if ($scope.audio.FileGuid) {
				postData.ArmAttach = $scope.audio;
			}
			$scope.process.ProcessList[0].State = 2;
			//上传图片
			uploadImgs();
		}
	};
	

	function uploadImgs() {
		if ([0, 3].indexOf($scope.process.ProcessList[1].State) >= 0) {
			$scope.process.ProcessList[1].State = 1;
			var imgs = $scope.imageList.filter(function (img) {
				return img.State == 0;
			});
			if (imgs.length > 0) {
				var promises = imgs.map(function (img) {
					return UtilsService.uploadFileBill(img.FilePath, 1);
				});
				$q.all(promises).then(function (res) {
					var flag = true;
					res.forEach(function (img, index) {
						if (img == null) {
							flag = false;
						} else {
							imgs[index].State = 1;
							img.FileSize = imgs[index].FileSize;
							img.FileType = 1;
							postData.ImgAttach.push(img);
						}
					});
					$scope.process.ProcessList[1].State = flag ? 2 : 3;
					uploadVideos();
				});
			} else {
				$scope.process.ProcessList[1].State = 2;
				uploadVideos();
			}
		} else {
			uploadVideos();
		}
	};

	function uploadVideos() {
		if (!isNetWorkCanUse()) {
			mui.toast("网络连接失败，请检查网络后再试");
		}
		if ([0, 3].indexOf($scope.process.ProcessList[2].State) >= 0) {
			$scope.process.ProcessList[2].State = 1;
			var videos = $scope.videoList.filter(function (video) {
				return video.State == 0;
			});
			if (videos.length > 0) {
				var promises = videos.map(function (video) {
					return UtilsService.uploadFileBill(video.FilePath, 3);
				});
				$q.all(promises).then(function (res) {
					var flag = true;
					res.forEach(function (video, index) {
						if (video == null) {
							flag = false;
						} else {
							videos[index].State = 1;
							video.FileSize = videos[index].FileSize;
							video.FileType = 3;
							postData.VideoAttach.push(video);
						}
					});
					$scope.process.ProcessList[2].State = flag ? 2 : 3;
					//提交
					submitData();
				});
			} else {
				$scope.process.ProcessList[2].State = 2;
				//提交
				submitData();
			}
		} else {
			submitData();
		}
	};

	function submitData() {

		
		if ($scope.process.ProcessList[0].State == 2 && $scope.process.ProcessList[1].State == 2) {
			$scope.process.ProcessList[3].State = 1;

			//产品信息
			postData.MdCode = $scope.info.MdCode;
			postData.EquID = $scope.info.EquID;
			//描述
			postData.Description = $scope.info.Description;
			//录音
			postData.IsHasAudio = $scope.audio.FileSize > 0 ? 1 : 0;
			postData.AudioLength = $scope.audio.FileSize || 0;


			postData.Province = $scope.info.Province;
			postData.City = $scope.info.City;
			postData.District = $scope.info.District;
			postData.Address = $scope.info.Address;
			postData.Street = $scope.info.Street;
			postData.MapLng = $scope.info.MapLng;
			postData.MapLat = $scope.info.MapLat;
			postData.State = $scope.info.State;

			if( $scope.OverCount>0)
			{
				postData.Demand = {
					DemandID : $scope.demand.ID || 0,
					ProcessProgress:$scope.ProcessProgress,
					FinishQuantity:$scope.FinishQuantity
				}
			}
		}

		$scope.process.SaveState = 2;
		var url = ApiService.Api50 + "/api/v1/Equipment/SaveEqLog";
		DataService.post(url, postData).then(function (res) {
			if (res) {

				$scope.process.ProcessList[3].State = 2;
				RpcClient.invoke("equ-logs.html", "RPC_refresh");

				$timeout(function () {
					$scope.process.SaveState = 1;
				}, 800)
			}
		}, function (res) {
			$scope.process.ProcessList[3].State = 3;
			if (!isNetWorkCanUse()) {
				mui.toast("网络连接失败，请检查网络后再试");
			}
		});
	};


	UtilsService.getLocation(true).then(function (location) {
		$scope.info.MapLat = location.lat; //纬度
		$scope.info.MapLng = location.lng; //经度
		$scope.info.Address = location.address; //详细地址
		$scope.info.Province = location.province; //省
		$scope.info.City = location.city; //市
		$scope.info.District = location.district; //区
		$scope.info.Street = location.street; //街道
	}, function () {});


	//避免重复点击
	var isSubmitting = false;


	$scope.save = function () {

		if($scope.info.State!=1 && $scope.OverCount>0)
		{
			if($scope.demand.ID>0 && $scope.FinishQuantity<=0)
			{
				mui.toast("请填写外协已完成数量！");
				return;
			}
		}
	

		if ($scope.info.State == 2 && $scope.info.Description.trim() == "" && !$scope.audio.FileSize) {
			mui.toast("文字描述与语音描述至少存在一个");
			return;
		}
		if($scope.info.Description&&$scope.info.Description.trim().length>100) {
			mui.toast("文字描述最长100！");
			return;
		}
		if(!$scope.info.Province) {
			mui.toast("请选择设备地址！");
			return;
		}
		if (isSubmitting) return;

		isSubmitting = true;


		if (postData.ImgAttach == null) {
			postData.ImgAttach = $scope.imageList.filter(function (item) {
				return item.ID > 0;
			}).map(function (item) {
				return {
					ID: item.ID,
					FileGuid: item.FileGuid,
					FileName: item.FileName,
					FileExt: item.FileExt,
					FilePath: item.FilePath,
					FileSize: item.FileSize,
					FileType: item.FileType
				}
			})
		}

		if (postData.VideoAttach == null) {
			postData.VideoAttach = $scope.videoList.filter(function (item) {
				return item.ID > 0;
			}).map(function (item) {
				return {
					ID: item.ID,
					FileGuid: item.FileGuid,
					FileName: item.FileName,
					FileExt: item.FileExt,
					FilePath: item.FilePath,
					FileSize: item.FileSize,
					FileType: item.FileType
				}
			})
		}


		UtilsService.submitModal($scope.process, function () {
			isSubmitting = false;
			mui.back();
		}, null, function () {
			isSubmitting = false;
			$scope.process.SaveState = 0;
			$scope.process.ProcessList.forEach(function (item) {
				item.State = 0;
			})
			postData.ImgAttach = [];
			$scope.imageList.forEach(function (item) {
				item.State = 0;
			})
			postData.VideoAttach = [];
			$scope.videoList.forEach(function (item) {
				item.State = 0;
			})
		});
		//开始附件上传(语音-图片)
		uploadAudio();



		// var curDate = new Date();
		// plus.webview.currentWebview().opener().evalJS("addSuccess("+JSON.stringify({
		// 	CreateDate:curDate.Format("yyyy-MM-dd"),
		// 	State:$scope.info.State,
		// 	Description:$scope.info.Description,
		// 	CreateTime:curDate.Format("hh:mm"),
		// 	CreateUserName:user.RealName
		// })+")");
		// mui.back();
	}

	$scope.isLoad = true;

}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});