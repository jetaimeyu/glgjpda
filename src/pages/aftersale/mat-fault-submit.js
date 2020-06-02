app.controller("FaultSubnitCtrl", ["$scope", "UtilsService", "$Modal", "DataService", "ApiService", "Loading", "$q", "ChatUserService", "$filter", "$timeout", "AuthService", "BillService", "RPCObserver", "CacheService",
	function($scope, UtilsService, $Modal, DataService, ApiService, Loading, $q, ChatUserService, $filter, $timeout, AuthService, BillService, RPCObserver, CacheService) {
		$scope.audio = {}; //上传音频
		$scope.imageList = []; //上传图片
		$scope.videoList = []; //上传视频
		$scope.JobFrom = query("jobfrom") || 0; //报修方式 1.内部报修 2.外部报修 3.第三方报修
		$scope.DraftID = query("draftid") || 0;
		$scope.nochoosed = query("nochoosed");
		$scope.EqJane="";
		Loading.show();
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
				Text: "保存报修内容",
				State: 0,
				RetryMethod: submitData
			}, {
				Text: "通知负责人",
				State: 0,
				RetryMethod: dispatching
			}]
		};
		//		$scope.jobtitle = {
		//					id: 3,
		//					title: "第三方报修"
		//		};
		//故障
		$scope.faultInfo = {
			ID: "",
			//故障描述
			faultDescription: "",
			//故障设备
			prodInfo: {},
			UserName: "",
			CompName: "",
			CompID: 0,
			UserPhone: "",
			ReportType: 2,
			Maplat: "", //纬度
			Maplng: "", //经度
			address: "", //详细地址
			province: "", //省
			city: "", //市
			district: "", //区
			street: "", //街道
			QuotedPrice: "" //报修价格
		};
		//服务单位
		$scope.stations = [];
		$scope.curUser = CacheService.get("user");
		$scope.matFatClass = {}; //故障归类
		$scope.faultDescription = {}; //故障描述
		$scope.url = ApiService.Api50 + "/api/v1/Equipment/GetEqFailureTypeList?keyWords=";

		$scope.faultInfo.UserName = $filter("getViewName")($scope.curUser.UserName, $scope.curUser.RealName, $scope.curUser.Mdt);
		$scope.faultInfo.CompName = $scope.curUser.CompName;
		$scope.faultInfo.CompID = $scope.curUser.CompID;
		$scope.faultInfo.UserPhone = $scope.curUser.Phone;
		//派工人
		$scope.workUsers = [];
		//抄送人
		$scope.sendUsers = [];

		$scope.customSelectOptions = {
			model: $scope.matFatClass,
			idField: 'ID',
			nameField: 'Name',
			selectfn: function() {
				$scope.tap('faultClass');
			}
		}
		$scope.faildescSelectOptions = {
			model: $scope.faultDescription,
			idField: 'ID',
			nameField: 'Name',
			selectfn: function() {
				$scope.tap('failClass');
			}
		}
		var postData = {
			"ArmAttach": null,
			"ImgAttach": null,
			"VideoAttach": null
		}
		$scope.getType = function(type) {
			var str = "";
			switch(type) {
				case 1:
					str = "服务专员： ";
					break;
				case 2:
					str = "售后部门： ";
					break;
				case 3:
					str = "加盟服务站： ";
					break;
				default:
					break;
			}
			return str;
		};
		//监听-停止语音
		$scope.$on('emit-stop-audio', function() {
			$scope.$broadcast("stop_audio");
		});
		/**
		 * ****************报修人信息：切换报修类型：2单位 1个人************
		 */
		mui("#reportComp").on("tap", ".md-switch-button", function() {
			document.activeElement.blur();
			$scope.faultInfo.ReportType = parseInt(this.getAttribute("dataId"));
			$scope.$apply();
		});

		//初始化
		init();

		function init() {
			//草稿箱过来的
			if($scope.DraftID) {
				var cache = CacheService.get($scope.curUser.UserID + "_mat_fault_submit") || [];
				var getJobTitle = function(item) {
					switch(parseInt(item.JobFrom)) {
						case 1:
							return {
								id: 1,
								title: "内部报修"
							};
							break;
						case 2:
							return {
								id: 2,
								title: "外部报修"
							};
							break;
						case 3:
							return {
								id: 3,
								title: "第三方报修"
							};
							break;
						default:
							break;
					}
				};
				cache.forEach(function(item) {
					if(item.id == $scope.DraftID) {
						$scope.audio = item.audio; //上传音频
						$scope.imageList = item.imageList; //上传图片
						$scope.videoList = item.videoList; //上传视频
						$scope.jobtitle = getJobTitle(item);
						$scope.JobFrom = item.JobFrom;
						$scope.EqJane=item.EqJane;
						$scope.DraftID = item.id;
						$scope.faultInfo = item.faultInfo;
						$scope.faultInfo.prodInfo.Maplat = item.faultInfo.Maplat; //纬度
						$scope.faultInfo.prodInfo.Maplng = item.faultInfo.Maplng; //经度
						$scope.faultInfo.prodInfo.Address = item.faultInfo.address; //详细地址
						$scope.faultInfo.prodInfo.Province = item.faultInfo.province; //省
						$scope.faultInfo.prodInfo.City = item.faultInfo.city; //市
						$scope.faultInfo.prodInfo.District = item.faultInfo.district; //区
						$scope.faultInfo.prodInfo.Street = item.faultInfo.street; //街道
						$scope.matFatClass = item.matFatClass || {};
						$scope.stations = item.stations;
						$scope.workUsers = item.workUsers;
						$scope.sendUsers = item.sendUsers;
						if(item.FAQObj && item.FAQObj != {}) {
							$scope.faultDescription = item.FAQObj;
							$scope.faildescSelectOptions = {
								model: $scope.faultDescription,
								idField: 'ID',
								nameField: 'Name',
								selectfn: function() {
									$scope.tap('failClass');
								}
							}
						}
						$scope.isRuleLoad = true;
						$scope.customSelectOptions = {
							model: $scope.matFatClass,
							idField: 'ID',
							nameField: 'Name',
							selectfn: function() {
								$scope.tap('faultClass');
							}
						}
					}
				});
			} else if($scope.nochoosed == 1 && $scope.JobFrom == 3) {
				$scope.jobtitle = {
					id: 3,
					title: "第三方报修"
				};
			} else if($scope.JobFrom == 3) {

				$scope.jobtitle = {
					id: 3,
					title: "第三方报修"
				};

			} else if($scope.JobFrom == 1) {

				$scope.jobtitle = {
					id: 1,
					title: "内部报修"
				};
			} else if($scope.JobFrom == 2) {

				$scope.jobtitle = {
					id: 2,
					title: "外部报修"
				};
			}

			//传过来的产品信息
			var prodInfo = plus.webview.currentWebview().prodInfo || $scope.faultInfo.prodInfo;

			$scope.prodCatalogId = prodInfo.CatalogName ? prodInfo.CatalogName.ID : 0;
			$scope.QDLUrl = ApiService.Api50 + "/api/v1/Prod/MdtGetPagedPkgQuestionDictionaryList?cId=" + $scope.prodCatalogId + "&compId=" + prodInfo.CompID + "&prodId=" + prodInfo.ProdID + "&subject=";

			if(prodInfo) {
				$scope.faultInfo.prodInfo = prodInfo;
				if(prodInfo.EqJane){
					$scope.EqJane=prodInfo.EqJane;
				}
				if(!$scope.DraftID && $scope.JobFrom == 0) { //判断报修数据是哪里来的（如果不是从草稿箱来的就设置默认报修方式
					if($scope.faultInfo.prodInfo.EqID == 0) {

						$scope.jobtitle = {
							id: 2,
							title: "外部报修"
						};
						$scope.JobFrom = 2;
					} else if($scope.faultInfo.prodInfo.EqID > 0 && $scope.faultInfo.prodInfo.SourceMDCode != '' && $scope.curUser.CompID > 0) {

						$scope.jobtitle = {
							id: 2,
							title: "外部报修"
						};
						$scope.JobFrom = 2;
						//位置定位
						UtilsService.getLocation(true).then(function(location) {
							$scope.faultInfo.Maplat = location.lat; //纬度
							$scope.faultInfo.Maplng = location.lng; //经度
							$scope.faultInfo.address = location.address; //详细地址
							$scope.faultInfo.province = location.province; //省
							$scope.faultInfo.city = location.city; //市
							$scope.faultInfo.district = location.district; //区
							$scope.faultInfo.street = location.street; //街道
							$scope.getDefaultServiceStation();
						}, function() {
							$scope.getDefaultServiceStation()
						});
					} else {

						$scope.jobtitle = {
							id: 1,
							title: "内部报修"
						};
						$scope.JobFrom = 1
					}

				}
				if(!$scope.faultInfo.prodInfo.EqID && !prodInfo.Province) {
					externalSubmit();
				} else {
					$scope.faultInfo.Maplat = prodInfo.Maplat; //纬度
					$scope.faultInfo.Maplng = prodInfo.Maplng; //经度
					$scope.faultInfo.address = prodInfo.Address; //详细地址
					$scope.faultInfo.province = prodInfo.Province; //省
					$scope.faultInfo.city = prodInfo.City; //市
					$scope.faultInfo.district = prodInfo.District; //区
					$scope.faultInfo.street = prodInfo.Street; //街道
					$scope.faultInfo.prodInfo.SourceMDCode == "" && !$scope.JobFrom && ($scope.JobFrom = query("jobfrom") ? query("jobfrom") : 1);
					($scope.curUser.CompID == 0 ||
						($scope.DraftID && !prodInfo.Province && $scope.JobFrom == 2) ||
						(!prodInfo.Province && $scope.JobFrom == 3)) &&
					externalSubmit();
				}
				//$scope.faultInfo.hasInnercode = prodInfo.ProdInnerCode == '' ? false : true;
				getCompInnerCodeName(prodInfo.CompID);
			}
			Loading.hide();
			$scope.isLoad = true;
		};

		//外部报修处理
		function externalSubmit() {
			if($scope.JobFrom != 3) {
				$scope.JobFrom = query("jobfrom") ? query("jobfrom") : 2;
			}

			//位置定位
			UtilsService.getLocation(true).then(function(location) {
				$scope.faultInfo.Maplat = location.lat; //纬度
				$scope.faultInfo.Maplng = location.lng; //经度
				$scope.faultInfo.address = location.address; //详细地址
				$scope.faultInfo.province = location.province; //省
				$scope.faultInfo.city = location.city; //市
				$scope.faultInfo.district = location.district; //区
				$scope.faultInfo.street = location.street; //街道
				$scope.getDefaultServiceStation();
			}, function() {
				$scope.getDefaultServiceStation()
			});
		}
		//获取默认的服务单位
		$scope.getDefaultServiceStation = function() {

			var customerName = $scope.faultInfo.ReportType == 2 ? $scope.faultInfo.CompName : "";
			var url = ApiService.Api50 + "/api/v1/AfterSale/GetMatRepairRuleSpecial?customerName=" + encodeURIComponent(customerName) + "&city=" + $scope.faultInfo.city + "&province=" + $scope.faultInfo.province + "&compId=" + $scope.faultInfo.prodInfo.CompID + "&mapLat=" + $scope.faultInfo.Maplat + "&mapLng=" + $scope.faultInfo.Maplng;
			DataService.get(url).then(function(res) {
				$scope.isRuleLoad = true;
				if(res.SendUsers.length > 0) {
					$scope.workUsers = [];
					res.SendUsers.forEach(function(item) {
						$scope.workUsers.push({
							"UserID": item.UserID,
							"ViewName": item.Name,
							"CompID": item.CompID,
							"ULogoIsExist": item.ULogoIsExist
						});
					});
					//服务单位
					res.Items.forEach(function(item) {
						item.Distance = formatM2KM(item.Distance);
					});
					$scope.stations = res.Items;
				} else {
					mui.toast("该企业未维护售后服务制度，无法在线报修！");
				}
			});
		};
		//根据企业编号获取企业内部码
		function getCompInnerCodeName(compid) {
			var url = ApiService.Api50 + "/api/v1/Comp/GetCompInnerCodeName?compId=" + compid;
			DataService.get(url).then(function(res) {
				$scope.faultInfo.prodInfo.InnerCodeName = res || '出厂编号';
			});
		};
		$scope.tap = function(key, event) {
			event && event.stopPropagation();
			document.activeElement.blur();
			$scope.$broadcast("stop_audio");
			switch(key) {
				//选择报修方式
				case 'JobFrom':

					if($scope.nochoosed == 1) { //设备详情右上角第三方报修传的nochoosed=1,只允许用第三方报修
						return false;
					} else if($scope.faultInfo.prodInfo.EqID == 0) { //未加入设备的产品只能外部
						UtilsService.actionSheet("报修方式", [{
							id: 1,
							title: "外部报修"
						}]).then(function(res) {
							$scope.jobtitle = res,
								$scope.JobFrom = res.id;
							if($scope.JobFrom == 3) {
								//位置定位
								UtilsService.getLocation(true).then(function(location) {

									$scope.faultInfo.Maplat = location.lat; //纬度
									$scope.faultInfo.Maplng = location.lng; //经度
									$scope.faultInfo.address = location.address; //详细地址
									$scope.faultInfo.province = location.province; //省
									$scope.faultInfo.city = location.city; //市
									$scope.faultInfo.district = location.district; //区
									$scope.faultInfo.street = location.street; //街道
									$scope.getDefaultServiceStation();
								}, function() {
									$scope.getDefaultServiceStation()
								});
							} else {
								$scope.workUsers = [];
							}
						})
					} else if(!($scope.faultInfo.prodInfo.EqID > 0 && $scope.faultInfo.prodInfo.SourceMDCode != '' && $scope.curUser.CompID > 0)) {

						UtilsService.actionSheet("报修方式", [{
							id: 1,
							title: "内部报修"
						}, {
							id: 3,
							title: "第三方报修"
						}]).then(function(res) {
							$scope.jobtitle = res,
								$scope.JobFrom = res.id;
							if($scope.JobFrom == 3) {
								//位置定位
								UtilsService.getLocation(true).then(function(location) {

									$scope.faultInfo.Maplat = location.lat; //纬度
									$scope.faultInfo.Maplng = location.lng; //经度
									$scope.faultInfo.address = location.address; //详细地址
									$scope.faultInfo.province = location.province; //省
									$scope.faultInfo.city = location.city; //市
									$scope.faultInfo.district = location.district; //区
									$scope.faultInfo.street = location.street; //街道
									$scope.getDefaultServiceStation();
								}, function() {
									$scope.getDefaultServiceStation()
								});
							} else {
								$scope.workUsers = [];
							}
						})
					} else { //满足外部报修条件
						UtilsService.actionSheet("报修方式", [{
								id: 1,
								title: "内部报修"
							},
							{
								id: 2,
								title: "外部报修"
							},
							{
								id: 3,
								title: "第三方报修"

							}
						]).then(function(res) {
							$scope.jobtitle = res,
								$scope.JobFrom = res.id;

							if($scope.JobFrom == 2 || $scope.JobFrom == 3) {

								//位置定位
								UtilsService.getLocation(true).then(function(location) {
									$scope.faultInfo.Maplat = location.lat; //纬度
									$scope.faultInfo.Maplng = location.lng; //经度
									$scope.faultInfo.address = location.address; //详细地址
									$scope.faultInfo.province = location.province; //省
									$scope.faultInfo.city = location.city; //市
									$scope.faultInfo.district = location.district; //区
									$scope.faultInfo.street = location.street; //街道
									$scope.getDefaultServiceStation();

								}, function() {
									$scope.getDefaultServiceStation()
								});
							} else {
								$scope.workUsers = [];
							}
						})
					}
					break;
					//选择派工人
				case 'selectWorkUser':
					UtilsService.openWindow({
						needLogin: true,
						id: "contact-select.html",
						url: "../common/contact-select.html?action=select&multiselect=true&type=org",
						extras: {
							selectObj: $scope.workUsers,
							callback: "selectWorkUserCallback"
						}
					});
					break;
					//选择抄送人
				case 'selectSendUser':
					UtilsService.openWindow({
						needLogin: true,
						id: "contact-select.html",
						url: "../common/contact-select.html?action=select&multiselect=true&type=org",
						extras: {
							selectObj: $scope.sendUsers,
							callback: "selectSendUserCallback"
						}
					});
					break;
					//选择地址
				case 'addressSelect':
					UtilsService.openWindow({
						id: "mdAddress.html",
						url: "../../js/pages/mdAddress.html?needlogin=false",
						extras: {
							callback: 'getAddr'
						}
					});
				case 'faultClass':
					UtilsService.openWindow({
						needLogin: true,
						id: "fault-class.html",
						url: "../eqmentlib/fault-class.html",
						extras: {
							selectObj: {
								id: $scope.matFatClass.ID,
								name: $scope.matFatClass.Name
							},
							callback: "faultClassCallback"
						}
					});
					break;
				case 'failClass':
					UtilsService.openWindow({
						needLogin: true,
						id: "equ-handbookList-head.html",
						url: "../eqmentlib/equ-handbookList-head.html?cid=" + $scope.prodCatalogId + "&compid=" + $scope.faultInfo.prodInfo.CompID + "&prodid=" + $scope.faultInfo.prodInfo.ProdID,
						extras: {
							callback: "equHandbookCallback"
						}
					});
					break;
				case 'saveDraft':
					//console.log("faultInfo:" + JSON.stringify($scope.faultInfo))
					//console.log("stations:" + JSON.stringify($scope.stations))
					var cache = CacheService.get($scope.curUser.UserID + "_mat_fault_submit") || [];
					var cache_item = {
						timeStamp: new Date().Format("yyyy-MM-dd HH:mm:ss"),
						//图片、视频、语音
						audio: $scope.audio,
						imageList: $scope.imageList,
						videoList: $scope.videoList,
						JobFrom: $scope.JobFrom,
						id: $scope.DraftID || Date.parse(new Date()),

						//故障基本信息
						faultInfo: $scope.faultInfo,
						matFatClass: $scope.matFatClass,
						stations: $scope.stations,
						workUsers: $scope.workUsers,
						sendUsers: $scope.sendUsers,
						FAQObj: $scope.faultDescription,
						EqJane:$scope.EqJane
					}
					//cache_item.faultInfo.faultDescription == "" && 
					if(($scope.faultInfo.prodInfo.EqID > 0 && $scope.faultInfo.prodInfo.SourceMDCode != '' && $scope.curUser.CompID > 0) || ($scope.faultInfo.prodInfo.EqName == '' && $scope.faultInfo.prodInfo.ProdName != '')) {
						cache_item.faultInfo.faultDescription = "";
					}
					if($scope.faultDescription.Name != "") {
						cache_item.faultInfo.faultDescription = $scope.faultDescription.Name;
					}

					if(!$scope.DraftID) {
						//新增，直接添加
						cache.unshift(cache_item);
					} else {
						var index = function() {
							var i = cache.length;
							while(i--) {
								if(cache[i].id === $scope.DraftID) {
									return i;
								}
							}
							return -1;
						}
						//修改，删除之前的再添加
						if(index() > -1) {
							cache.splice(index(), 1);
							cache.unshift(cache_item);
						}
					}
					CacheService.set($scope.curUser.UserID + "_mat_fault_submit", cache, true);
					mui.toast("已存入草稿箱");
					$scope.DraftID = cache_item.id;
					RpcClient.invoke("mat-drafts.html", "Rpc_refDrafts");
					break;
			}
		};

		//避免重复点击
		var isSubmitting = false;
		//保存
		$scope.save = function() {
			$scope.$broadcast("stop_audio");
			document.activeElement.blur();
			if($scope.workUsers.length == 0 && $scope.JobFrom == 2) {
				mui.toast("该设备厂家未设置在线售后服务网点，无法在线报修！");
				return;
			}
			//验证填字符长度
			if(!checkLengthUtil.check()) {
				return false;
			}

			if(($scope.faultInfo.prodInfo.EqID > 0 && $scope.faultInfo.prodInfo.SourceMDCode != '' && $scope.curUser.CompID > 0) || ($scope.faultInfo.prodInfo.EqName == '' && $scope.faultInfo.prodInfo.ProdName != '')) {
				if(JSON.stringify($scope.faultDescription) == "{}" && !$scope.audio.FileSize) {
					mui.toast("文字描述与语音描述至少存在一个");
					return;
				}
			} else {
				if($scope.faultInfo.faultDescription.trim() == "" && !$scope.audio.FileSize) {
					mui.toast("文字描述与语音描述至少存在一个");
					return;
				}

			}
			if($scope.JobFrom == 0) {
				mui.toast("请选择报修方式！");
				return;
			}
			if($scope.workUsers.length == 0 && $scope.JobFrom == 1) {
				mui.toast("请选择派工人！");
				return;
			}
			if($scope.JobFrom == 2 && $scope.curUser.CompID > 0) {
				if($scope.faultInfo.ReportType == 2 && $scope.faultInfo.CompName.trim() == "") {
					mui.toast("请输入报修单位！");
					return;
				}
				if($scope.faultInfo.UserName.trim() == "") {
					mui.toast("请输入报修人！");
					return;
				}
				if($scope.faultInfo.UserPhone.trim() == "") {
					mui.toast("请输入报修人联系电话！");
					return;
				}
				if($scope.faultInfo.province.trim() == "") {
					mui.toast("请输入设备地址！");
					return;
				}
			}
			if($scope.JobFrom == 3 && $scope.curUser.CompID > 0) {
				if(!checkLengthUtil.check()) {
					return false;
				}
				if($scope.faultInfo.ReportType == 2 && $scope.faultInfo.CompName.trim() == "") {
					mui.toast("请输入联系单位！");
					return;
				}
				if($scope.faultInfo.UserName.trim() == "") {
					mui.toast("请输入联系人！");
					return;
				}
				if($scope.faultInfo.UserPhone.trim() == "") {
					mui.toast("请输入联系电话！");
					return;
				}
				if($scope.faultInfo.UserPhone.trim() == "") {
					mui.toast("请输入联系电话！");
					return;
				}
				if($scope.faultInfo.province.trim() == "") {
					mui.toast("请输入设备地址！");
					return;
				}
				if($scope.faultInfo.QuotedPrice != "") {
					var reg = /(^[1-9]([0-9]+)?(\.[0-9]{1,2})?$)|(^(0){1}$)|(^[0-9]\.[0-9]([0-9])?$)/;
					var money = $scope.faultInfo.QuotedPrice;
					if(money != '面议') {
						if(!reg.test(money)) {
							mui.toast("费用格式不正确请重新输入");
							return;
						} else if(money == 0) {
							mui.toast("费用格式不正确请重新输入");
							return;
						}
					}
				}

			}
			if(isSubmitting) return;
			//开始上传
			isSubmitting = true;
			if(postData.ImgAttach == null) {
				postData.ImgAttach = $scope.imageList.filter(function(item) {
					return item.ID > 0;
				}).map(function(item) {
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
			if(postData.VideoAttach == null) {
				postData.VideoAttach = $scope.videoList.filter(function(item) {
					return item.ID > 0;
				}).map(function(item) {
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
			UtilsService.submitModal($scope.process, function() {
				isSubmitting = false;
				mui.back();
			}, null, function() {
				isSubmitting = false;
				$scope.process.SaveState = 0;
				$scope.process.ProcessList.forEach(function(item) {
					item.State = 0;
				})
				postData.ImgAttach = [];
				$scope.imageList.forEach(function(item) {
					item.State = 0;
				})
				postData.VideoAttach = [];
				$scope.videoList.forEach(function(item) {
					item.State = 0;
				})
			});
			//开始附件上传(语音-图片)
			uploadAudio();
		};

		//上传语音
		function uploadAudio() {
			if(!isNetWorkCanUse()) {
				mui.toast("网络连接失败，请检查网络后再试");
			}
			if($scope.audio && $scope.audio.FileSize && !$scope.audio.FileGuid) {
				$scope.process.ProcessList[0].State = 1;
				UtilsService.uploadFileBill($scope.audio.FilePath, 2).then(function(res) {
					if(res != null) {
						res.FileSize = $scope.audio.FileSize;
						res.FileType = 2;
						postData.ArmAttach = res;
					}
					$scope.process.ProcessList[0].State = (res == null ? 3 : 2);
					//上传图片
					uploadImgs();
				});
			} else {
				if($scope.audio.FileGuid) {
					postData.ArmAttach = $scope.audio;
				}
				$scope.process.ProcessList[0].State = 2;
				//上传图片
				uploadImgs();
			}
		}
		//上传图片
		function uploadImgs() {
			if([0, 3].indexOf($scope.process.ProcessList[1].State) >= 0) {
				$scope.process.ProcessList[1].State = 1;
				var imgs = $scope.imageList.filter(function(img) {
					return img.State == 0;
				});
				if(imgs.length > 0) {
					var promises = imgs.map(function(img) {
						return UtilsService.uploadFileBill(img.FilePath, 1);
					});
					$q.all(promises).then(function(res) {
						var flag = true;
						res.forEach(function(img, index) {
							if(img == null) {
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
		}
		//上传视频
		function uploadVideos() {
			if(!isNetWorkCanUse()) {
				mui.toast("网络连接失败，请检查网络后再试");
			}
			if([0, 3].indexOf($scope.process.ProcessList[2].State) >= 0) {
				$scope.process.ProcessList[2].State = 1;
				var videos = $scope.videoList.filter(function(video) {
					return video.State == 0;
				});
				if(videos.length > 0) {
					var promises = videos.map(function(video) {
						return UtilsService.uploadFileBill(video.FilePath, 3);
					});
					$q.all(promises).then(function(res) {
						var flag = true;
						res.forEach(function(video, index) {
							if(video == null) {
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
		}
		//上传故障报修详情
		function submitData() {
			if($scope.process.ProcessList[0].State == 2 && $scope.process.ProcessList[1].State == 2) {
				$scope.process.ProcessList[3].State = 1;
				postData.ID = $scope.faultInfo.ID; //编号
				//产品信息
				postData.MDCode = $scope.faultInfo.prodInfo.MDCode;
				postData.ProdInnerCode = $scope.faultInfo.prodInfo.ProdInnerCode;
				postData.ProdID = $scope.faultInfo.prodInfo.ProdID;
				postData.ProdName = $scope.faultInfo.prodInfo.ProdName;
				postData.QuotedPrice = $scope.faultInfo.QuotedPrice,
				postData.SkuID = $scope.faultInfo.prodInfo.SkuID;
				postData.SkuName = $scope.faultInfo.prodInfo.SkuName;
				postData.ProdCompID = $scope.faultInfo.prodInfo.CompID;
				postData.MatFaultTypeID = $scope.matFatClass.ID || 0;
				postData.EqJane=$scope.EqJane;
				if($scope.JobFrom == 3) {
					postData.MatFaultTypeName = ""
				} else {
					postData.MatFaultTypeName = $scope.matFatClass.Name;
				}

				postData.SendUsers = $scope.sendUsers.map(function(item) {
					return item.UserID;
				}).join('/');
				//描述
				if(($scope.faultInfo.prodInfo.EqID > 0 && $scope.faultInfo.prodInfo.SourceMDCode != '' && $scope.curUser.CompID > 0) || ($scope.faultInfo.prodInfo.EqName == '' && $scope.faultInfo.prodInfo.ProdName != '')) {
					postData.Description = $scope.faultDescription.Name;
				} else {
					postData.Description = $scope.faultInfo.faultDescription;
				}

				//录音
				postData.IsHasAudio = $scope.audio.FileSize > 0 ? 1 : 0;
				postData.AudioLength = $scope.audio.FileSize || 0;
				postData.JobFrom = $scope.JobFrom; //1.内部报修 2.外部报修 3.第三方报修
				postData.WorkOrderType = !$scope.faultInfo.prodInfo.EqID ? 1 : 2;
				postData.EquipmentID = $scope.faultInfo.prodInfo.EqID;
				//设备地址
				if($scope.faultInfo.province) {
					postData.Province = $scope.faultInfo.province;
					postData.City = $scope.faultInfo.city;
					postData.District = $scope.faultInfo.district;
					postData.Address = $scope.faultInfo.address;
					postData.Street = $scope.faultInfo.street;
					postData.MapLng = $scope.faultInfo.Maplng;
					postData.MapLat = $scope.faultInfo.Maplat;
				}

				if($scope.JobFrom == 2) {

					//报修单位
					postData.ReportCompName = $scope.faultInfo.ReportType == 2 ? $scope.faultInfo.CompName : "个人";
					//报修人信息
					postData.LinkName = $scope.faultInfo.UserName;
					postData.LinkPhone = $scope.faultInfo.UserPhone;

					postData.RuleUsers = [];
					$scope.stations.forEach(function(item) {
						postData.RuleUsers.push({
							"ID": 0,
							"UserID": item.UserID,
							"RuleID": item.ID,
							"RuleType": item.RuleType,
							"PublicID": item.PublicID
						});
					});
				}
				if($scope.JobFrom == 3) {
					postData.LinkName = $scope.faultInfo.UserName;
					postData.LinkPhone = $scope.faultInfo.UserPhone;
				}
				$scope.process.SaveState = 2;
					var url = ApiService.Api52 + "/api/v1/MatWorkOrder/SaveMatWorkOrderFailure";
//				var url = ApiService.Api50 + "/api/v1/MatWorkOrder/SaveMatWorkOrderFailure";
				DataService.post(url, postData).then(function(res) {

					if(res) {
						RPCObserver.broadcast("refresh_equ_info_fault");
						RPCObserver.broadcast("refresh_equ_fault_list");
						//刷新设备履历
						RPCObserver.broadcast("refresh_equ_operationLog");
						$scope.faultInfo.ID = res;
						$scope.process.ProcessList[3].State = 2;
						rpc();
						if(postData.JobFrom != 3) {
							dispatching(res);
							sendUserMsg(postData);
						} else {
							$scope.process.ProcessList.splice(4, 1)
						}

						$timeout(function() {
							$scope.process.SaveState = 1;
							rpc();
						}, 800)
					}
				}, function(res) {
					$scope.process.ProcessList[3].State = 3;
					if(!isNetWorkCanUse()) {
						mui.toast("网络连接失败，请检查网络后再试");
					}
				});
			}
		}

		//rpc刷新
		function rpc() {
			RpcClient.invoke("prod-info.html", "Rpc_refWorks");
			RPCObserver.broadcast("refresh_equ_state");
			//保存成功删除草稿
			if($scope.DraftID) {
				var cache = CacheService.get($scope.curUser.UserID + "_mat_fault_submit") || [];
				var index = function() {
					var i = cache.length;
					while(i--) {
						if(cache[i].id === $scope.DraftID) {
							return i;
						}
					}
					return -1;
				}
				RpcClient.invoke("mat-drafts.html", "Rpc_delDrafts", index());
			}
		};

		//给抄送人发送消息
		function sendUserMsg(postData) {
			$scope.sendUsers.forEach(function(user) {
				ChatUserService.send({
					chatId: user.UserID,
					chatName: user.ViewName,
					chatCompId: user.CompID,
					hasLogo: $scope.curUser.ULogoIsExist,
					chatLogo: user.ULogoIsExist,
					type: 7,
					content: {
						eventName: "equ-fault",
						logo: ApiService.Down + "/chat/equ-fault.png",
						title: "设备故障",
						desc: $filter("formatFaultInfo")(postData.IsHasAudio, postData.AudioLength, postData.Description || ""),
						params: [$scope.faultInfo.ID]
					}
				});
			})
		}
		//派工给
		function dispatching(res) {
			$scope.process.ProcessList[4].State = 1;

			var url = ApiService.Api50 + "/api/v1/Common/SaveShare";

			var postdata = {
				DataFrom: shareLog.fault,
				DataID: res,
				Operate: '派工给',
				Content: '',
				SendUsers: $scope.workUsers.map(function(item) {
					return item.UserID;
				}).join('/'),
				DataType: 1,
				ActionType: 0
			};
			DataService.post(url, postdata).then(function(ret) {
				sendMsg(ret);
				$timeout(function() {
					$scope.process.SaveState = 1;
					rpc();

					//照片
					$scope.imageList.forEach(function(item) {
						item.State = 1;
					});

					//视频
					$scope.videoList.forEach(function(item) {
						item.State = 1;
					});
				}, 800)
			}, function() {
				$scope.process.ProcessList[4].State = 3;
			});
		}
		//给抄送人发送消息
		function sendMsg(res) {
			$scope.process.ProcessList[4].State = 2;
			$scope.workUsers.forEach(function(user) {
				var content = {};
				if(!$scope.faultInfo.prodInfo.EqID || $scope.JobFrom == 2) {
					content = {
						eventName: "fault",
						logo: ApiService.Down + "/chat/fault.png",
						title: "故障工单",
						desc: $filter("formatFaultInfo")(postData.IsHasAudio, postData.AudioLength, postData.Description || ""),
						params: [$scope.faultInfo.ID, res, 1]
					}
				} else {
					content = {
						eventName: "equ-fault",
						logo: ApiService.Down + "/chat/equ-fault.png",
						title: "设备故障",
						desc: $filter("formatDeviceFaultInfo")(postData.IsHasAudio, postData.AudioLength, postData.Description || ""),
						params: [$scope.faultInfo.ID, res, 1]
					}
				}
				if(user.UserID == $scope.curUser.UserID) {
					//刷新带我处理
					RpcClient.invoke("work.html", "RefTodoCount");
				}
				ChatUserService.send({
					chatId: user.UserID,
					chatName: user.ViewName,
					chatCompId: user.CompID,
					hasLogo: $scope.curUser.ULogoIsExist,
					chatLogo: user.ULogoIsExist,
					type: 7,
					content: content
				});
			})
		}
	}

]);
//选择派工人员回调
function selectWorkUserCallback(obj) {
	var appElement = document.querySelector('[ng-controller=FaultSubnitCtrl]');
	var $scope = angular.element(appElement).scope();
	$scope.workUsers = angular.copy(obj);
	$scope.$apply();
}

//选择抄送人员回调
function selectSendUserCallback(obj) {
	var appElement = document.querySelector('[ng-controller=FaultSubnitCtrl]');
	var $scope = angular.element(appElement).scope();
	$scope.sendUsers = angular.copy(obj);
	$scope.$apply();
}

function getAddr(res) {
	var appElement = document.querySelector('[ng-controller=FaultSubnitCtrl]');
	var $scope = angular.element(appElement).scope();
	$scope.faultInfo.province = res.province;
	$scope.faultInfo.city = res.city;
	$scope.faultInfo.district = res.district;
	$scope.faultInfo.address = res.address;
	$scope.faultInfo.street = res.street;
	$scope.faultInfo.Maplng = res.lng;
	$scope.faultInfo.Maplat = res.lat;
	$scope.getDefaultServiceStation();
	$scope.$apply();
}

function faultClassCallback(obj) {
	var appElement = document.querySelector('[ng-controller=FaultSubnitCtrl]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.matFatClass.ID = obj.id
		$scope.matFatClass.Name = obj.typename
	} else {
		$scope.matFatClass = {};
	}
	$scope.$apply();
};

//手册回调
function equHandbookCallback(obj) {
	var appElement = document.querySelector('[ng-controller=FaultSubnitCtrl]');
	var $scope = angular.element(appElement).scope();
	if(obj) {
		$scope.faultDescription.ID = obj.ID;
		$scope.faultDescription.Name = obj.Subject;
	}
	$scope.$apply();
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});