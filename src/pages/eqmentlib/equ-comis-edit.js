app.controller("EquEditController", ["$scope", "ApiService", "DataService", "UtilsService", "DatePickerService", "CacheService", "Loading", "$Modal", "$q", "$timeout", "RPCObserver", "$filter", function($scope, ApiService, DataService, UtilsService, DatePickerService, CacheService, Loading, $Modal, $q, $timeout, RPCObserver, $filter) {
	$scope.equ = {
		ID: "",
		EqName: "",
		SkuName: ""
	};
	//产品信息
	$scope.ProdInfo = {};

	//投产地信息
	$scope.posInfo = {};
	$scope.selectCompType = "";
	//生产厂家信息
	$scope.manufacturerInfo = {};
	//供应商信息
	$scope.suppliersInfo = {};
	$scope.PreProdPics = [];
	//编辑时的设备id
	//	$scope.EqID = query("equid") || 0;
	var isEdit = false;
	$scope.isEdit = false
	$scope.isPcode = false
	$scope.dataindex = query('dataindex')
	//设备信息
	$scope.EqInfo = {
		ID: 0,
		MDCode: query("mdcode") || "",
		PersonLiableName: "",
		PersonLiableID: ""

	};
	$scope.EPID = 0; //库存设备ID

	var editInfo = plus.webview.currentWebview().editInfo;

	if(editInfo) {
   isEdit = query('isEdit') || false;
		if(query('isEdit') == "true") {
			$scope.isEdit = query('isEdit')

			$scope.posInfo = editInfo.posInfo;
			setTimeout(function() {

				document.getElementById("equ-EqIdentifier").innerText = editInfo.EqIdentifier;
			})
		}
		if(editInfo.isPcode) {
//			alert($scope.isPcode)
//			$scope.isPcode = editInfo.isPcode;
//			alert($scope.isPcode)
			
		} else {
			$scope.EqInfo.SourceMDCode = editInfo.SourceMDCode; //设备码是仓库码的时候不要给SourceMDCode赋值
		}
		$scope.equ.EqName = editInfo.EqName;
		$scope.equ.SkuName = decodeURI(editInfo.SkuName);
		$scope.EqInfo.MDCode = editInfo.MDCode;
		$scope.SupplierName = editInfo.SupplierName;
		$scope.SupplierID = editInfo.SupplierID;
		$scope.EPID = editInfo.EPID || 0;
		$scope.WareHouseID = editInfo.WareHouseID;
		setTimeout(function(){
			$scope.EqInfo.CatalogID = editInfo.CatalogID;
		$scope.EqInfo.CatalogPath = editInfo.CatalogPath;
		$scope.EqInfo.CatalogName = editInfo.CatalogName;
		})
		$scope.EqInfo.PersonLiableID = editInfo.PersonLiableID;
		$scope.EqInfo.PersonLiableName = editInfo.PersonLiableName;
		$scope.ProdInfo.ProdID = editInfo.ProdID;
		document.getElementById("equ-Station").innerText = editInfo.Station;
		$scope.EqInfo.BeginProduceDate = editInfo.BeginProduceDate.split(' ')[0] || "";
		$scope.EqInfo.BuyDate = editInfo.BuyDate.split(' ')[0];
		$scope.EqInfo.Attach = editInfo.Attachs;
		$scope.EqInfo.Params = editInfo.Params;
	}
	var view = plus.webview.currentWebview().obj;
	var viewa = plus.webview.currentWebview().alldata
//	console.log(JSON.stringify(viewa.alldata))
	if(view) {
		
		if(!view.isEmpty) {
			
			$scope.isPcode = view.isPcode;
			
			
			$scope.equ.SkuName = decodeURIComponent(view.resInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
			$scope.ProdInfo = view.resInfo;
			$scope.EPID = view.resInfo.EPID || 0;
			$scope.WareHouseID = view.resInfo.WareHouseID;
			setTimeout(function() {
				if(view.resInfo.EqIdentifier) { //产品码有编号的时候
					document.getElementById("equ-EqIdentifier").innerText = view.resInfo.EqIdentifier;
				} else {
					document.getElementById("equ-EqIdentifier").innerText = "";
				}
			})
			if(!$scope.isPcode) {
				$scope.EqInfo.SupplierName = view.resInfo.SupplierName;
				$scope.EqInfo.SupplierID = view.resInfo.SupplierID;
				$scope.EqInfo.SupplierName = view.resInfo.SupplierName;
				$scope.EqInfo.SourceMDCode = view.codeValue;
			}
			$scope.EqInfo.MDCode = view.codeValue;
////			alert(JSON.stringify(view.resInfo))
//console.log(view.resInfo.CatalogName!=undefined)
//console.log(view.resInfo.CatalogID!=undefined)
//console.log(view.resInfo.CatalogPath!=undefined)
if(view.resInfo.CatalogName!=undefined&&view.resInfo.CatalogID!=undefined&&view.resInfo.CatalogPath!=undefined){
	setTimeout(function(){
		$scope.EqInfo.CatalogID =view.resInfo.CatalogID;
		$scope.EqInfo.CatalogPath = view.resInfo.CatalogPath;
		$scope.EqInfo.CatalogName = view.resInfo.CatalogName;
		})
}
			
			addScmSupplier(view.resInfo.SourceCompID);
			$scope.equ.EqName = decodeURIComponent(view.resInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");
		} else {
			$scope.EqInfo.MDCode = view.codeValue;
		}
	}

	//上传进度
	$scope.process = {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [{
			Text: "上传图片",
			State: 0,
			RetryMethod: uploadEqPics
		}]
	}

	//判断登录人是否是企业用户
	var user = CacheService.get('user');
	$scope.comId = user.CompID
	//$scope.comId=0
	if($scope.comId == 0) {
		$scope.EqInfo.PersonLiableID = user.UserID;
		$scope.EqInfo.PersonLiableName = $filter("getViewName")(user.UserName, user.RealName, user.Mdt);
	}

	$scope.customSelectOptions = {
		model: $scope.equ,
		idField: 'ID',
		nameField: 'EqName',
		selectfn: function() {
			$scope.tap('selequ');
		}
	};
	//无网络或请求失败重试
	$scope.retryModal = {
		msg: "设备维护",
		retry: init,
		state: ""
	}
	//选择投产地
	$scope.posSelect = function() {
		UtilsService.openWindow({
			needLogin: true,
			id: "pos-select.html",
			url: "pos-select.html",
			extras: {
				selectObj: $scope.posInfo,
				callback: "posSelectCallback"
			}
		});
	};

	$scope.rePos = function() {
		$scope.posInfo = {};
		getPosLocation();
	};

	//投产地自动定位
	function getPosLocation() {
		UtilsService.getLocation().then(function(res) {
			$scope.posInfo = {
				Province: res.province,
				City: res.city,
				District: res.district,
				Street: res.street,
				Address: res.address,
				MapLng: res.lng,
				MapLat: res.lat,
				PosName: "自动定位投产地",
				FactoryID: 0,
				ID: 0
			};

		}, function() {

		});
	}

	//选择生产厂家和供应商
	$scope.compSelect = function(type) {
		if(type == 'manu' && $scope.ProdInfo.hasOwnProperty("CompID")) {
			return;
		}
		$scope.selectCompType = type;
		UtilsService.openWindow({
			needLogin: true,
			id: "comp-select.html",
			url: "comp-select.html?type=" + type,
			extras: {
				selectObj: type == "manu" ? $scope.manufacturerInfo : $scope.suppliersInfo,
				callback: "compSelectCallback"
			}
		});
	}

	/*删除指定文件
	 * relativePath 文件相对路径
	 */
	function delFile(relativePath) {
		plus.io.resolveLocalFileSystemURL(relativePath, function(entry) {
			entry.removeRecursively(function(entry) {
				//console.log("已删除");
			}, function(e) {
				//console.log(e.message);
			});
		});
	}
	//存在的话直接用，不存在就下载
	function downloadLogo(serverPath, name) {
		var loacalPath = "_doc/image/" + name + ".jpg";
		plus.io.resolveLocalFileSystemURL(loacalPath, function(entry) {
			var imgUrl = "file://" + entry.fullPath;
			UtilsService.zipImage(imgUrl).then(function(res) {
				var tempobj = {
					"FileName": entry.name,
					"FilePath": imgUrl,
					"FileSmall": res.zip_src,
					"State": 0
				}
				if($scope.EqInfo.Attach) {
					$scope.EqInfo.Attach.push(tempobj);
				} else {
					$scope.EqInfo.Attach = [tempobj];
				}
			});
		}, function() {
			//开始下载
			downloadFile(serverPath, loacalPath, function(localFile, status) {
				if(status === 200) {
					var imgUrl = "file://" + plus.io.convertLocalFileSystemURL(loacalPath);
					UtilsService.zipImage(imgUrl).then(function(res) {
						var tempobj = {
							"FileName": name + ".jpg",
							"FilePath": imgUrl,
							"FileSmall": res.zip_src,
							"State": 0
						}
						if($scope.EqInfo.Attach) {
							$scope.EqInfo.Attach.push(tempobj);
						} else {
							$scope.EqInfo.Attach = [tempobj];
						}
					});
				}
			});
		})
	};

	//增加设备参数
	$scope.addParam = function() {
		document.activeElement.blur();
		!$scope.EqInfo.Params && ($scope.EqInfo.Params = []);
		var _param = {
			"ID": 0,
			"DataID": 0,
			"ParamKey": "EqParam",
			"ParamName": "",
			"ParamValue": "",
			"SortID": $scope.EqInfo.Params ? $scope.EqInfo.Params.length : 0
		}
		$scope.EqInfo.Params.push(_param);
		return false;
	};
	//删除设备参数
	$scope.delParam = function(obj) {
		document.activeElement.blur();
		//文本框有输入值，弹出询问框
		if(obj.ParamName || obj.ParamValue) {
			mui.confirm("是否删除该条设备参数？", "提示", ["删除", "取消"], function(e) {
				if(e.index == 0) {
					$scope.EqInfo.Params = $scope.EqInfo.Params.filter(function(_item) {
						return _item.SortID != obj.SortID;
					});
					$scope.$apply();
				}
			});
		} else {
			//文本框没有输入值，直接移除
			$scope.EqInfo.Params = $scope.EqInfo.Params.filter(function(_item) {
				return _item.SortID != obj.SortID;
			});
		}
		$scope.EqInfo.Params.forEach(function(ele, index) {
			ele.SortID = index;
		})
		$scope.$apply();
		return false;
	};
	//投产日期
	$scope.chooseOpDate = function() {
		DatePickerService.pickDate({
			selected: $scope.EqInfo.BeginProduceDate,
		}).then(function(res) {
			if(!$scope.EqInfo.BuyDate || $scope.EqInfo.BuyDate == $scope.EqInfo.BeginProduceDate) {
				$scope.EqInfo.BuyDate = res;
			}
			$scope.EqInfo.BeginProduceDate = res;
		});
	};
	//购买日期
	$scope.chooseBuyDate = function() {
		DatePickerService.pickDate({
			selected: $scope.EqInfo.BuyDate,
		}).then(function(res) {
			$scope.EqInfo.BuyDate = res;
		});
	};
	//初始化
	init();

	function init() {
		//		alert(1)
		Loading.show();
		$scope.EqID && loadEqInfo();
		if(!$scope.EqID) {
			getPosLocation();
			$scope.isLoad = true;
			Loading.hide();

			var prodinfo = plus.webview.currentWebview().prodInfo;
			prodinfo && ($scope.ProdInfo = prodinfo) && ($scope.EqInfo.MDCode = prodinfo.MDCode);

			prodinfo && addScmSupplier($scope.ProdInfo.CompID);

		}
	};

	//获得数据后初始化个参数值
	function setInfo(res) {

		//供应商
		$scope.suppliersInfo = {
			suppliername: res.SupplierName,
			id: res.SupplierID
		}
		//生产厂家
		$scope.manufacturerInfo = {
			suppliername: res.ProduceCompName,
			id: res.ProduceCompID
		}
		投产地
		$scope.posInfo = {
			posname: res.ProcPosName,
			id: res.ProcPosID
		}

		$scope.ProcPosID = res.ProcPosID;

		//参数
		for(var i = 0; i < $scope.EqInfo.Params.length; i++) {
			$scope.EqInfo.Params[i].SortID = i;
		}

		//图片
		$scope.EqInfo.Attach.forEach(function(img) {
			img.State = 1;
		});
	}

	//添加供应商 sourceCompID：产品所属企业
	function addScmSupplier(sourceCompID) {
		var url = ApiService.Api50 + "/api/v1/ScmSupplier/AddScmSupplier?sourceCompID=" + sourceCompID;
		DataService.get(url).then(function(res) {
			
			if(res) {
				if(!$scope.isPcode) {
					$scope.SupplierName = res.SupplierName

					$scope.SupplierID = res.ID
				}

				//		$scope.equ.EqName = $scope.ProdInfo.ProdName;
				$scope.equ.EqName = decodeURIComponent($scope.ProdInfo.ProdName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"")

				$scope.equ.SkuName = decodeURIComponent($scope.ProdInfo.SkuName).replace(/@squotes@/g, "'").replace(/@dquotes@/g, "\"");;
				$scope.EqInfo.ProduceCompName = res.SupplierName;
				$scope.EqInfo.ProduceCompID = res.ID;
				$scope.manufacturerInfo.suppliername = res.SupplierName;
				$scope.manufacturerInfo.id = sourceCompID;
				$scope.suppliersInfo.suppliername = res.SupplierName;
				$scope.suppliersInfo.id = sourceCompID;
				//产品码:赋值给SourceMDCode
				//				$scope.EqInfo.SourceMDCode = $scope.ProdInfo.MDCode;
				$scope.EqInfo.MDCode == '' && ($scope.EqInfo.MDCode = $scope.EqInfo.SourceMDCode);

				//isnew!=0  返回pictype0logo或者3实物图，isnew=0指定 实物图
				var pathList = [];
				if($scope.ProdInfo.hasOwnProperty("ImageList")) {
					if($scope.ProdInfo.IsNew == 0) {
						$scope.ProdInfo.ImageList.forEach(function(item) {
							var path = ApiService.Img + "/prod/photo/" + $scope.ProdInfo.ProdID + "/" + item + ".jpg";
							pathList.push(path);
						});
					} else {
						$scope.ProdInfo.ImageList.forEach(function(item) {
							var path = item.PicType == 0 ? (ApiService.Img + "/prod/logo/" + $scope.ProdInfo.ProdID + ".jpg") : (ApiService.Img + "/prod/photo/" + $scope.ProdInfo.ProdID + "/" + item.ID + ".jpg");
							pathList.push(path);
						});
					}
				}

				pathList.forEach(function(path, index) {
					$scope.PreProdPics.push({
						FileName: $scope.ProdInfo.ProdID + "_" + index + ".jpg"
					});
				});
				//去除之前产品带过来的图
				if($scope.EqInfo.Attach) {
					var temparry = new Array();
					for(var i = 0; i < $scope.EqInfo.Attach.length; i++) {
						var isUnq = true;
						for(var k = 0; k < $scope.PreProdPics.length; k++) {
							if($scope.EqInfo.Attach[i].FileName == $scope.PreProdPics[k].FileName) {
								isUnq = false;
							}
						}
						if(isUnq) {
							temparry.push($scope.EqInfo.Attach[i]);
						}
					}
					$scope.EqInfo.Attach = temparry;
				}
				//有图片，先下载产品图片到本地
				pathList.forEach(function(path, index) {
					downloadLogo(path, $scope.ProdInfo.ProdID + "_" + index);
				});
			}
		})
	};
	//选人
	$scope.selContact = function() {
		UtilsService.openWindow({
			needLogin: true,
			id: "contact-select.html",
			url: "../common/contact-select.html?action=select&must=false&multiselect=false&type=org",
			extras: {
				callback: "SelContact",
				selectObj: $scope.EqInfo.PersonLiableID ? [{
					"ViewName": $scope.EqInfo.PersonLiableName,
					"UserID": $scope.EqInfo.PersonLiableID,
				}] : []
			}
		});
	};
	//选择设备回调
	window.SelEquBack = function(obj) {
	
		$scope.equ.EqName = obj.EqName;
		$scope.equ.ID = obj.ID;
		$scope.WareHouseID = obj.ID;
		$scope.EPID = obj.EPID;
		$scope.StockNum = obj.StockNum;
		//		$scope.WareHouseID = obj.

		if(obj.EqIdentifier) {
			document.getElementById("equ-EqIdentifier").innerText = obj.EqIdentifier;
		}
		//		if(obj.SupplierID) {
		//			$scope.SupplierID = obj.SupplierID;
		//		}
		//		$scope.SupplierName = obj.SupplierName;
		$scope.equ.SkuName = obj.SkuName;
		if(obj.CatalogName != null) {
			$scope.EqInfo.CatalogID = obj.CatalogID;
			$scope.EqInfo.CatalogName = obj.CatalogName;
			$scope.EqInfo.CatalogPath = obj.CatalogPath;
		}

		$scope.$apply();
		//		var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + obj.ID;
		//		DataService.get(url).then(function(res) {
		//			$scope.EqInfo.Params = res.Params;
		//		});
	}
	$scope.Delsukname = function() {
//		alert(1)
		if($scope.WareHouseID > 0) {
			$scope.equ.SkuName = ""
		}
	}
	//跳转
	$scope.tap = function(key) {
		var url = {
			selcls: 'sel-clsification.html',
			selequ: 'equ-warehouse-list-head.html?action=select&must=true'
		};
		var extras = {
			selcls: {
				callback: "SelClsBack",
				selected: {
					id: $scope.EqInfo.CatalogID,
					name: $scope.EqInfo.CatalogName,
					pid: $scope.EqInfo.CatalogPath && $scope.EqInfo.CatalogPath.split("/").length > 1 ? $scope.EqInfo.CatalogPath.split("/")[$scope.EqInfo.CatalogPath.split("/").length - 2] : 0
				},
				billkey: "B23",
				ismust: true
			},
			selequ: {
				selectObj: {},
				callback: "SelEquBack"
			}
		};
		UtilsService.openWindow({
			needLogin: true,
			id: key == 'selequ' ? 'select-equ-list.html' : url[key].substring(url[key].lastIndexOf('/') + 1),
			url: url[key],
			extras: extras[key]
		});
	};

	//避免重复点击
	var isSubmitting = false;
	$scope.submitData = function(parm) {
    var indexu=viewa.findIndex(function(e){
			return e.ishasEqIdentifier = document.getElementById("equ-EqIdentifier").innerText
		})

        //返回输入的设备编号与传过来的设备编号重复的元素下标值
		viewa.forEach(function(item,index){
			if(viewa[index].EqIdentifier==document.getElementById("equ-EqIdentifier").innerText){
				$scope.rpindex = index
			}

			if(item.EqIdentifier==document.getElementById("equ-EqIdentifier").innerText){
//				alert($scope.rpindex)
//				alert($scope.dataindex)
//				alert($scope.ishasEqIdentifier)
                //如果下标相等说明是修改原数据，不做设备变号验重
				$scope.rpindex != $scope.dataindex?$scope.ishasEqIdentifier = true:$scope.ishasEqIdentifier = false
				}
			})
		if($scope.ishasEqIdentifier){
			mui.toast("列表已存在此设备编号");
			$scope.ishasEqIdentifier = false//重置一下
			return
		}
		if(parm == 'isEdi') {
			$scope.nosacnk = true
		}
		if($scope.StockNum == 0) {
			mui.toast("该设备库存量为0，请选择其他设备投产");
			return;
		}
		//		alert(editInfo.EqIdentifier)
		//验证必填字段
		if(document.getElementById("equ-EqIdentifier").innerText.trim() == "") {
			mui.toast("设备编号不能为空");
			return;
		}
		if($scope.equ.EqName.trim() == "") {
			mui.toast("设备名称不能为空");
			return;
		}
		if($scope.equ.SkuName.trim() == "") {
			mui.toast("设备型号不能为空");
			return;
		}
		if($scope.equ.SkuName.length > 500) {
			mui.toast("设备型号过长");
			return;
		}
		if(!$scope.EqInfo.CatalogID || !$scope.EqInfo.CatalogName) {
			mui.toast("请选择设备归类");
			return;
		}

		//验证迈迪码或者设备编号重复
		var result = 0; //0不重复 1设备编号重复 2迈迪码重复 3都重复
		var url = ApiService.Api52 + "/api/v1/EqApply/GetEqIdentifierMdcodeCount?eqIdentifier=" + encodeURI(document.getElementById("equ-EqIdentifier").innerText.trim()) + "&mdCode=" + $scope.EqInfo.MDCode;
		DataService.get(url).then(function(res) {
			result = res;
		})
		var innerText = "";
		switch(result) {
			case 1:
				innerText = "设备编号已存在，请核对后再试";
				break;
			case 2:
				innerText = "该设备码已投产，请核对后再试";
				break;
			case 3:
				innerText = "设备编号已存在且该设备码已投产，请核对后再试";
				break;
			default:
				break;
		}
		if(result > 0) {
			mui.toast(innerText);
			return;
		}
		//组装params

		var _params = [];
		var _doms = document.querySelectorAll(".params-flex");

		for(var i = 0; i < _doms.length; i++) {
			var _item = _doms[i];

			var _id = _item.getAttribute("data-id");
			var _NameDom = _item.querySelector(".params-row[data-type='name']");
			var _ValueDom = _item.querySelector(".params-row[data-type='value']");

			var _name = _NameDom.innerText;
			var _value = _ValueDom.innerText;

			//判断是否为空
			if(!trim(_name)) {
				mui.toast(_NameDom.getAttribute("placeholder"));
				return;
			} else if(!trim(_value)) {
				mui.toast(_ValueDom.getAttribute("placeholder"));
				return;
			}

			var _nameLength = _NameDom.getAttribute("data-length");
			var _valueLength = _ValueDom.getAttribute("data-length");

			if(_name.length > _nameLength) {
				mui.toast("参数名最大" + _nameLength + "个字");
				return;
			} else if(_value.length > _valueLength) {
				mui.toast("参数值最大" + _nameLength + "个字");
				return;
			}

			_params.push({
				"ID": _id,
				"DataID": 0,
				"ParamKey": "EqParam",
				"ParamName": _name,
				"ParamValue": _value,
				"SortID": _params.length
			});
		}

		$scope.EqInfo.Params = _params;

		//验证填字符长度
		if(!checkLengthUtil.check()) {
			return false;
		}
		if(isSubmitting) return;
		//开始上传
		isSubmitting = true;
		UtilsService.submitModal($scope.process, function() {
						isSubmitting = false;
						mui.back();
					}, function() {
						isSubmitting = false;
						postData.ImgAttach = null;
						postData.VideoAttach = null;
						$scope.process.SaveState = 0;
						$scope.process.ProcessList.forEach(function(item) {
							item.State = 0;
						})
						getCustomerServiceInfo();
					}, function() {
						isSubmitting = false;
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
		uploadEqPics();
		

	};
	//上传图片
	function uploadEqPics() {
		$scope.process.ProcessList[0].State = 1;
		var imgs = $scope.EqInfo.Attach ? $scope.EqInfo.Attach.filter(function(img, idx) {
			img.idx = idx; //记录图片在数组中的位置
			return img.State == 0;
		}) : [];
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
						$scope.EqInfo.Attach[imgs[index].idx] = {
							FileGuid: img.FileGuid,
							FileName: img.FileName,
							FileExt: img.FileExt,
							FilePath: img.FilePath,
							FileSize: imgs[index].FileSize,
							FileType: 1,
							State: 1
						};
					}
				});
				$scope.process.ProcessList[0].State = flag ? 2 : 3;
				//上传详情内容
				flag && saveEqInfo();
			});
		} else {
			$scope.process.ProcessList[0].State = 2;
			//上传详情内容
			saveEqInfo();
		}
	}
	//保存设备信息
	function saveEqInfo() {
		if($scope.nosacnk) {
			isEdit = true //保存按钮，返回数据后不跳扫码页
		}
		
		var postdata = {
			"isEdit": isEdit,
			"EPID": $scope.EPID,
			"WareHouseID": $scope.WareHouseID,
			"EqIdentifier": replaceHTML(document.getElementById("equ-EqIdentifier").innerText),
			"EqName": replaceHTML($scope.equ.EqName),
			"SkuName": $scope.equ.SkuName,
			"MDCode": $scope.EqInfo.MDCode,
			"SupplierName": $scope.SupplierName,
			"SupplierID": $scope.SupplierID,
			"SourceMDCode": $scope.EqInfo.SourceMDCode,
			"CatalogID": $scope.EqInfo.CatalogID,
			"CatalogPath": $scope.EqInfo.CatalogPath,
			"CatalogName": $scope.EqInfo.CatalogName,
			"PersonLiableID": $scope.EqInfo.PersonLiableID,
			"PersonLiableName": $scope.EqInfo.PersonLiableName,
			"ProdID": $scope.ProdInfo.ProdID,
			"ProcPosID": 0,

			"ProcPosInfo": $scope.posInfo,
			"Station": replaceHTML(document.getElementById("equ-Station").innerText),
			"BeginProduceDate": $scope.EqInfo.BeginProduceDate ? ($scope.EqInfo.BeginProduceDate + " 00:00:00") : "",
			"BuyDate": $scope.EqInfo.BuyDate ? ($scope.EqInfo.BuyDate + " 00:00:00") : "",
			"ProduceCompID": $scope.manufacturerInfo.id,
			"Attachs": $scope.EqInfo.Attach,
			//参数：去处空的
			"Params": $scope.EqInfo.Params && $scope.EqInfo.Params.filter(function(_item) {
				return _item.ParamName && _item.ParamValue;
			}),
			"isPcode": $scope.isPcode
		};
		RpcClient.invoke("equ-commissioning.html", "RPC_equ", postdata);
		mui.back()

	};
}]);
//删除参数
function delParams(pname, pvalue, sortid) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	var obj = {
		ParamName: pname,
		ParamValue: pvalue,
		SortID: sortid
	}
	$scope.delParam(obj);
};
mui("body").on("tap", ".params .icon-close", function() {
	var pname = this.getAttribute("pname");
	var pvalue = this.getAttribute("pvalue");
	var sortid = this.getAttribute("sortid");
	delParams(pname, pvalue, sortid);
});
//选择归类回调
function SelClsBack(obj) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.EqInfo.CatalogID = obj.ID;
	$scope.EqInfo.CatalogName = obj.DirName;
	$scope.EqInfo.CatalogPath = obj.Path;
	$scope.$apply();
};
//选择人员回调
function SelContact(obj) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	if(obj && obj.length > 0) {
		$scope.EqInfo.PersonLiableName = obj[0].ViewName;
		$scope.EqInfo.PersonLiableID = obj[0].UserID;
		$scope.$apply();
	} else if(obj && obj.length == 0) {
		$scope.EqInfo.PersonLiableName = "";
		$scope.EqInfo.PersonLiableID = 0;
		$scope.$apply();
	}
}

//选择投产地回调
function posSelectCallback(obj) {

	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	$scope.posInfo = obj ? obj : null;
	$scope.$apply();
}

//选择厂家和供应商回调
function compSelectCallback(obj) {
	var appElement = document.querySelector('[ng-controller=EquEditController]');
	var $scope = angular.element(appElement).scope();
	if($scope.selectCompType == "manu") {
		if(!$scope.suppliersInfo.id || $scope.suppliersInfo.id == $scope.manufacturerInfo.id) {
			$scope.suppliersInfo = obj ? obj : null;
		}
		$scope.manufacturerInfo = obj ? obj : null;
	} else {
		$scope.suppliersInfo = obj ? obj : null;
	}
	$scope.$apply();
}
//排序(由于排序后设备参数删除ng-click会不起作用，所以用此方法)
Sortable.create(document.getElementById("params-body"), {
	group: "params",
	animation: 150,
	scroll: false,
	handle: ".opt-left",
	onStart: function() {
		mui(".mui-scroll-wrapper")[0].style.overflow = "hidden";
	},
	onEnd: function(evt) {
		mui(".mui-scroll-wrapper")[0].style.overflow = "scroll";
		if(evt.newIndex > -1) {
			var oldIdx = evt.oldIndex;
			var newIdx = evt.newIndex;

			var nums = 0;
			if(oldIdx < newIdx) {
				nums = 0.5; //向下拖动
			} else {
				nums = -0.5; //向上拖动
			}
			var appElement = document.querySelector('[ng-controller=EquEditController]');
			var $scope = angular.element(appElement).scope();
			$scope.EqInfo.Params[oldIdx - 1].SortID = newIdx + nums - 1; //-1shang
			$scope.EqInfo.Params = $scope.EqInfo.Params.sort(compare("SortID"));
			$scope.EqInfo.Params = $scope.EqInfo.Params.filter(function(_item, _idx) {
				_item.SortID = _idx;
				return true;
			});
			$scope.EqInfo.Params.forEach(function(ele, index) {
				ele.SortID = index;
			})
			$scope.$apply();
		}
	}
});

function sortId(a, b) {
	return a.SortID - b.SortID
}
var compare = function(prop) {
	return function(obj1, obj2) {
		var val1 = obj1[prop];
		var val2 = obj2[prop];
		if(!isNaN(Number(val1)) && !isNaN(Number(val2))) {
			val1 = Number(val1);
			val2 = Number(val2);
		}
		if(val1 < val2) {
			return -1;
		} else if(val1 > val2) {
			return 1;
		} else {
			return 0;
		}
	}
}
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});