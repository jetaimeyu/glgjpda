mui.init();

app.controller("prodInfoCtl", ["$scope", "ApiService", "DataService", "UtilsService", "AuthService", "$filter", "CacheService", function($scope, ApiService, DataService, UtilsService, AuthService, $filter, CacheService) {

	$scope.domData = {
		mdCode: query("mdcode"),
		prodId: query("prodid"),
		skuId: query("skuid"),
		ImgUrl: ApiService.Img + "/prod/",
		pageIndex:1,
		pageSize:2,
		totalCount:0,
		showTopBar: false,
		prodInfo: "",
		photos: [],
		innerCodeName: "出厂编号",
		userCompId: 0,
		userId: 0,
		showEqExs: false,
		eqWorks: {},
		eqRepairs: {},
		eqRepairParts: {},
		partList:[],
		config: {
			PicType: 0,
			Theme: "",
			ModuleIconStyle: 1
		},
		linkShow: "",
		pkgItemShowKeys: ["MKey_dzsc", "MKey_dtjw", "MKey_gysc", "MKey_gzbx"],
		pkgItems: [{
				ModuleKey: "MKey_dzsc",
				imageurl: "../../images/prod/dianzishouce.png",
				ModuleName: "电子手册",
				ModuleIntro: "一机一册 方便省心"
			},
			{
				ModuleKey: "MKey_dtjw",
				imageurl: "../../images/prod/dongtaijianwei.png",
				ModuleName: "动态鉴伪",
				ModuleIntro: "快捷分辨 产品真伪"
			},
			{
				ModuleKey: "MKey_gysc",
				imageurl: "../../images/prod/gongyeshangcheng.png",
				ModuleName: "工业商城",
				ModuleIntro: "原厂配件 质量保证"
			},
			{
				ModuleKey: "MKey_gzbx",
				imageurl: "../../images/prod/guzhangbaoxiu.png",
				ModuleName: "故障报修",
				ModuleIntro: "一键报修 专人负责"
			}
		]
	};
	$scope.checkPrice= function (obj) {
		if (obj.ProdState != '2' || obj.SkuState != '2' || obj.Price.Price == '' || obj.Price.Price == null || parseFloat(obj.Price.Price) <= 0 || obj.ProdState == '' || obj.SkuState == '') {
			return false;
		} else if (obj.ProdState !== '' && obj.SkuState !== '' && obj.ProdState == '2' && obj.SkuState == '2' && parseFloat(obj.Price.Price) > 0) {
			return true;
		} else {
			return false;
		}
	};
	$scope.event = {
		closeTopBar: function() {
			$scope.domData.showTopBar = false;
		},
		openEqEdit: function() {

			UtilsService.openWindow({
				needLogin: true,
				id: "equ-edit.html",
				url: "../eqmentlib/equ-edit.html",
				extras: {
					prodInfo: $scope.domData.prodInfo,
					callback: "EqCallback"
				}
			});

			window.EqCallback = function(res) {
				if(res) {
					curData.reload();
				}
			};
		},
		openFaultEdit: function() {

			// if($scope.domData.showTopBar)
			// {
			//     plus.nativeUI.confirm("该物联码未绑定设备，是否绑定设备？", function(e) {
			//         if(e.index == 0) {
			//           $scope.event.openFaultEdit();
			//         }
			//     }, "提示", ["前往绑定", "取消"]);
			// }
			// else
			// {
			//}

			UtilsService.openWindow({
				needLogin: true,
				id: "equ-edit.html",
				url: "../aftersale/mat-fault-submit.html",
				extras: {
					prodInfo: $scope.domData.prodInfo
				}
			});
		},
		aboutComp: function() {

			var _data = $scope.domData;
			var _prodInfo = $scope.domData.prodInfo;

			var url = ApiService.M;
			url += "/weixin/aboutCompany.html?ismdt=1&code=" + _data.mdCode + "&ProdID=" + _prodInfo.ProdID + "&skuId=" + _prodInfo.SkuID + "&compId=" + _prodInfo.CompID + "&SkuName=" + encodeURIComponent(_prodInfo.SkuName);
			openUrl(url, "关于企业", "");

		},
		openComp: function() {
			UtilsService.openWindow({
				needLogin: true,
				id: "index.html",
				url: "../complib/index.html?compid=" + compId
			});
		},
		tap: function(key, jobFrom,data) {
			var _data = $scope.domData;
			var url = {
				repairList: '../eqmentlib/equ-repairList-head.html?equid=' + _data.prodInfo.EqID,
				repairView: '../eqmentlib/equ-repairView.html?id=' + (_data.eqRepairs.Data && _data.eqRepairs.Data.ID) || 0,
				faultInfo: '../eqmentlib/fault-info.html?id=' + (_data.eqWorks.Data && _data.eqWorks.Data.ID) || 0,
				faultrecord: '../eqmentlib/fault-record-head.html?equid=' + _data.prodInfo.EqID,
				partinfo: '../eqmentlib/equ-repairView.html?id=' + (_data.eqRepairParts.Data && _data.eqRepairParts.Data.ID) || 0,
				partInfoList: '../eqmentlib/part-infolist-header.html?equid=' + _data.prodInfo.EqID,
				prodinfo: data?'./prodinfo-head.html?prodId=' + data.ProdID + "&SkuID=" + data.SkuID:"",
			};

			var url = url[key];
			if(key == "faultInfo" && jobFrom == 2) {
				url = "../mine/fault-info.html?id=" + (_data.eqWorks.Data && _data.eqWorks.Data.ID) || 0;
			}
		
			else if(key == "faultInfo" && jobFrom == 3){
				url = "../eqmentlib/equ-thirdpart-repair-info.html?id=" + (_data.eqWorks.Data && _data.eqWorks.Data.ID) || 0;
			}
			var options = {
				needLogin: true,
				id: url.substring(url.lastIndexOf('/') + 1, url.indexOf('?')),
				url: url
			};
			if(key == 'faultrecord') {
				options.extras = {
					prodInfo: {
						MDCode: $scope.domData.prodInfo.MDCode,
						EqID: $scope.domData.prodInfo.EqID,
						EqName: $scope.domData.prodInfo.EqName,
						SkuName: $scope.domData.prodInfo.EqSkuName,
						EqIdentifier: $scope.domData.prodInfo.EqIdentifier,
						SourceMDCode: $scope.domData.prodInfo.MDCode,
						ProdID: $scope.domData.prodInfo.ProdID,
						ProdName: $scope.domData.prodInfo.ProdName,
						ProdInnerCode: $scope.domData.prodInfo.ProdInnerCode,
						SkuID: $scope.domData.prodInfo.SkuID,
						CompID: $scope.domData.prodInfo.CompID,
						Province: $scope.domData.prodInfo.Province,
						City: $scope.domData.prodInfo.City,
						District: $scope.domData.prodInfo.District,
						Street: $scope.domData.prodInfo.Street,
						Address: $scope.domData.prodInfo.Address,
						Maplat: $scope.domData.prodInfo.MapLat,
						Maplng: $scope.domData.prodInfo.MapLng,
						EqJane:$scope.domData.prodInfo.EqJane||""
					}
				}
			}
			UtilsService.openWindow(options);
		},
		prodGrid: function(item) {
			if(item.ModuleKey == 'MKey_gzbx') {
				$scope.event.openFaultEdit();
			} else if(item.ModuleKey == 'MKey_dtjw') {

				var _data = $scope.domData;
				var _prodInfo = $scope.domData.prodInfo;

				var url = ApiService.M;
				url += "/dtjw.html?v=2&ismdt=1&code=" + _data.mdCode + "&ProdID=" + _prodInfo.ProdID + "&skuId=" + _prodInfo.SkuID + "&compId=" + _prodInfo.CompID + "&SkuName=" + encodeURIComponent(_prodInfo.SkuName);

				openUrl(url, item.ModuleName, "");

			} else if(item.ModuleKey == 'MKey_dzsc') {

				var _data = $scope.domData;
				var _prodInfo = $scope.domData.prodInfo;

				var url = ApiService.M + "/weixin/handbook.html?v=1&ismdt=1&code=" + _data.mdCode + "&ProdID=" + _prodInfo.ProdID + "&skuId=" + _prodInfo.SkuID;

				openUrl(url, item.ModuleName, "");
			} else if(item.ModuleKey == 'MKey_gysc') {

				var _data = $scope.domData;
				var _prodInfo = $scope.domData.prodInfo;

				var url = ApiService.M;
				url += "/weixin/partShop.html?v=1&ismdt=1&compId=" + _prodInfo.CompID + "&ProdID=" + +_prodInfo.ProdID + "&skuId=" + _prodInfo.SkuID + "&code=" + _data.mdCode + "&SkuName=" + encodeURIComponent(_prodInfo.SkuName);

				openUrl(url, item.ModuleName, "");
			} else if(item.ModuleKey == 'MKey_3dshow') {

				var _data = $scope.domData;
				var _prodInfo = $scope.domData.prodInfo;

				var url = ApiService.M;

				url += "/Shop/no_3d_effect.html?v=2&ismdt=1&ProdID=" + _prodInfo.ProdID + "&code=" + _data.mdCode + "&skuId=" + _prodInfo.SkuID + "&compId=" + _data.CompID + "&SkuName=" + encodeURIComponent(_prodInfo.SkuName);

				openUrl(url, item.ModuleName, "");
			} else if(item.ModuleKey == "" && item.TextType == 1) { //自定义功能富文本的跳转页面   TextType为1是富文本为2是url链接
				var url = ApiService.M + '/weixin/showModuleInfo.html?moduleId=' + item.ID;

				openUrl(url, item.ModuleName, "");
			} else if(item.ModuleKey == "" && item.TextType == 2) { //自定义功能  跳转为url
				openUrl(item.RichUrl, item.ModuleName, "");
			}
		},
		getMorePart:function(){
			$scope.domData.pageIndex=2;
			curData.gerPartList()
		}
	};

	//刷新登陆
	RpcServer.expose("Rpc_refWorks", function(params) {
		curData.getWorks(false);
	});

	var curData = {
		//根据迈迪码获取详情
		getProdInfoByMdCode: function() {
			var url = ApiService.Api52 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + $scope.domData.mdCode + "&compid=" + $scope.domData.userCompId;
			DataService.get(url).then(function(res) {
//				console.log(JSON.stringify(res))
				res.MDCode = $scope.domData.mdCode;
				res.ProdInnerCode = res.InnerCode;
				$scope.domData.prodInfo = res;
				$scope.domData.photos = res.ImageList;

				curData.getConfigByMdCode();
				curData.getInnerCodeName()

				$scope.domData.linkShow = ApiService.M + "/Shop/no_3d_effect.html?v=2&ismdt=1&ProdID=" + res.ProdID + "&code=" + $scope.domData.mdCode + "&skuId=" + res.SkuID + "&compId=" + res.CompID + "&SkuName=" + encodeURIComponent(res.SkuName);
				setTimeout(function() {
					var slider = mui("#slider");
					slider.slider({
						interval: 1000
					});
				}, 200); 

				$scope.domData.showTopBar = res.hasOwnProperty("EqID") && res.EqID == 0 && $scope.domData.userCompId > 0 && $filter("hasAuth")(['Q4']);

				$scope.domData.showEqExs = res.EqID && res.EqCompID == $scope.domData.userCompId;

				curData.getWorks(false);
			});
		},
		getWorks: function(isApply) {

			if($scope.domData.showEqExs) {
				setTimeout(function() {
					curData.getEqWorks(isApply);
				}, 50);
				setTimeout(function() {
					curData.getEqRepairs(isApply);
				}, 100);
				setTimeout(function() {
					curData.getEqRepairParts(isApply);
				}, 150);
//				setTimeout(function(){
//					curData.gerPartList()
//				},150)
			}
			setTimeout(function(){
					curData.gerPartList()
				},150)
		},
		gerProdInfo: function() {
			var url = ApiService.Api50 + "/api/v2/Prod/GetProdInfo?prodId=" + $scope.domData.prodId + "&skuId=" + $scope.domData.skuId;

			DataService.get(url).then(function(res) {

			});
		},
		gerPartList: function() {
			var url = ApiService.Api45 + "/api/v1/Prod/GetAssemblyPartsBySkuIDForMobile?HostProdID=" + $scope.domData.prodId + "&SkuID=" + $scope.domData.skuId+"&page="+$scope.domData.pageIndex+"&pageSize="+$scope.domData.pageSize;
//			console.log(url)
			DataService.get(url).then(function(res) {
//				console.log(JSON.stringify(res))
				$scope.domData.totalCount=res.TotalCount;
				$scope.domData.partList=$scope.domData.partList.concat(res.DataRows)
			},function(err){
//				console.log(JSON.stringify(err))
			});
		},
		//获取出厂编号名称
		getInnerCodeName: function(_data) {
			var url=ApiService.Api45 + "/api/v1.0/Comp/GetCompInnerCodeName?compId=" + $scope.domData.prodInfo.CompID ;
			DataService.get(url).then(function(res) {
				$scope.domData.innerCodeName = res || '出厂编号';
			});
		},
		//获取产品图片
		getImages: function() {
			var url = ApiService.Api50 + "/api/v1/prod/GetImageList?prodId=" + $scopoe.domData.prodId;

			DataService.get(url).then(function(res) {

			});
		},
		//获取最新的故障工单
		getEqWorks: function(isApply) {
			var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetLastOneEqWorkOrderFailureInfo?equipmentId=" + $scope.domData.prodInfo.EqID;
			DataService.get(url).then(function(res) {
				if(res) {
					$scope.domData.eqWorks = res;

					isApply && ($scope.$apply());
				}
			})
		},
		//获取最新的维修记录
		getEqRepairs: function(isApply) {
			var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetLastOneEqRepairRecordsInfo?equipmentId=" + $scope.domData.prodInfo.EqID;
			DataService.get(url).then(function(res) {
				if(res) {
					$scope.domData.eqRepairs = res;

					isApply && ($scope.$apply());
				}
			})
		},
		//获取最新的配件更换记录
		getEqRepairParts: function(isApply) {
			var url = ApiService.Api50 + "/api/v2/MatWorkOrder/GetLastOneEqRepairPartsInfo?equipmentId=" + $scope.domData.prodInfo.EqID;
			DataService.get(url).then(function(res) {
				if(res) {
					$scope.domData.eqRepairParts = res;

					isApply && ($scope.$apply());
				}
			})
		},
		//获取企业配置
		getCompConfig: function(compId) {
			var url = ApiService.Api50 + "/api/v1/ProdShow/GetPkgShowConfigInfo?compid=" + compId;

			DataService.get(url).then(function(res) {
				$scope.domData.config = res;
			});
		},
		//根据迈迪码获取配置
		getConfigByMdCode: function() {
			var url = ApiService.Api45 + "/api/v2.0/MdCode/CheckCodeForCompConfig?code=" + $scope.domData.mdCode;

			DataService.get(url).then(function(res) {

				if(res.CompConfigs) {
					$scope.domData.config.PicType = res.CompConfigs.PictureStyle;
					$scope.domData.config.Theme = res.CompConfigs.ColorSetting;

					$scope.domData.config.ModuleIconStyle = res.CompConfigs.ModuleIconStyle;

					if(res.CompConfigs.PkgShowItems && res.CompConfigs.PkgShowItems.length > 0) {

						var data = res.CompConfigs.PkgShowItems.filter(function(_item) {
							return _item.IsEnabled == 1 && $scope.domData.pkgItemShowKeys.indexOf(_item.ModuleKey) >= 0;
						}).map(function(_item) {
							return {
								ModuleKey: _item.ModuleKey,
								imageurl: ApiService.Api45 + '/api/v2.0/ProdShow/GetProdShowIcon?compId=' + $scope.domData.prodInfo.CompID + '&moduleKey=' + _item.ModuleKey + '&itemId=' + _item.ID,
								ModuleName: _item.ModuleName,
								ModuleIntro: _item.ModuleIntro
							};
						});

						$scope.domData.pkgItems = data;
					}
				}

				if($scope.domData.prodInfo.EqID > 0 && $scope.domData.prodInfo.EqCompID != $scope.domData.userCompId) {
					//转换3D秀说
					for(var i = 0; i < $scope.domData.pkgItems.length; i++) {
						if($scope.domData.pkgItems[i].ModuleKey == "MKey_gzbx") {
							$scope.domData.pkgItems[i].ModuleKey = "MKey_3dshow";
							$scope.domData.pkgItems[i].ModuleName = "3D秀";
							$scope.domData.pkgItems[i].ModuleIntro = "3D秀展示";
							$scope.domData.pkgItems[i].imageurl = "../../images/prod/3dshowx.png";
						}
					}
				}

				if($scope.domData.config.Theme) {
					document.querySelector("body").setAttribute("id", $scope.domData.config.Theme);
				}
			});
		},
		reload: function() {
			curData.getProdInfoByMdCode();
		},
		//保存定位信息
		saveScanDate: function() {
			//获取本地的扫码记录
			var scanInfo = CacheService.get("prod-scan", true);

			var canSave = true;

			if(scanInfo) {
				canSave = scanInfo.data.MdCode != $scope.domData.mdCode;
				if(!canSave) {
					var diffDate = $filter("minuteDiff")(scanInfo.timestamp, Date.now());
					canSave = diffDate > 60;
				}
			}

			if(canSave) {
				//获取定位信息
				UtilsService.getLocation(true).then(function(location) {
					var data = {};
					data.lat = location.lat; //纬度
					data.lng = location.lng; //经度
					data.address = location.address; //详细地址
					data.province = location.province; //省
					data.city = location.city; //市
					data.district = location.district; //区
					data.street = location.street; //街道
					data.userId = $scope.domData.userId;

					curData.saveScabToServer(data);
				});
			}
		},
		saveScabToServer: function(_data) {
			var url = ApiService.ApiJ + "/mdcode/get?code=" + $scope.domData.mdCode + "&type=mdcode&scanInfo=" + (_data ? JSON.stringify(_data) : "{}");
			DataService.get(url, {
				adapter: function(res) {
					res.State = res.code == 200 ? 1 : 0;
					res.ErrorMessage = res.data.message;
					res.Data = res.data;
					return res;
				}
			}).then(function(res) {
				_data.MdCode = $scope.domData.mdCode;
				CacheService.set("prod-scan", _data, true);
			});
		}
	};
	
	
	AuthService.getAuth().then(function(res) {
		$scope.domData.userCompId = res.CompID;
		$scope.domData.userId = res.UserID;
//		$scope.domData.innerCodeName = res.InnerCodeName || '出厂编号';

		if($scope.domData.mdCode) {
			curData.saveScanDate();

			curData.getProdInfoByMdCode();
		}
	});
}]);

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});