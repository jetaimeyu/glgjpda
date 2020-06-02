app.controller("OutStockController", ["$scope", "$filter", "AuthService", "ApiService", "DataService", "UtilsService", "Loading", "RPCObserver", "CacheService",
	function($scope, $filter, AuthService, ApiService, DataService, UtilsService, Loading, RPCObserver, CacheService) {
		var openedDiv = 0; //1向上弹出的基本信息div，2向上弹出的产品信息div3出库单详情div
		//临时出库信息，弹出出库单确定和取消时使用
		var custTemp = {
			CustInfoID: 0, //企业客户的企业编号
			CustomerName: "", //企业客户名字
			CustomerNameCopy: "", //企业客户名字副本，编辑客户名称时使用
			CustomerID: 0, //企业客户编号		
			LinkName: "", //联系人
			LinkPhone: "", //联系电话
			Province: "",
			City: "",
			District: "",
			Address: "",
			MapLng: "", //经度
			MapLat: "", //纬度
			Street: "", //纬度
		};
		//		$scope.isIos=!mui.os.android;
		$scope.LoginCompID = 0;
		$scope.ImgUrl = MdAppUrl.Img; //产品图片地址,
		$scope.IsAdd = 1; //是否是新建出库单，1是，0否	
		$scope.IsSaved = false; //是否已经保存，返回时使用
		$scope.IsView = false; //是否是浏览状态
		$scope.IsEdit = false; //是否是修改状态，修改时不允许对出库产品进行操作（新增修改和删除）
		$scope.hasAuth = true; //有无修改权限
		$scope.Data = {
			OutStockID: 0, //出库单ID
			OutType: 1, //1手机出库，2pc端批量出库
			State: 1, //0未出库，1已出库
			//出库单信息
			CustomerType: query("customertype"), //客户类型 1企业客户、2经销商、3个人客户
			//客户信息
			CustInfo: {
				CustInfoID: 0, //企业客户的企业编号
				CustomerName: "", //企业客户名字
				CustomerNameCopy: "", //企业客户名字副本，编辑客户名称时使用
				CustomerID: 0, //企业客户编号		
				LinkName: "", //联系人
				LinkPhone: "", //联系电话
				//收货地址
				Province: "",
				City: "",
				District: "",
				Address: "",
				MapLng: "", //经度
				MapLat: "", //纬度
				Street: "", //街道门牌
				OutDate: "", //出库日期
			},

			//出库单参数
			OrderParams: [],

			//扫码后的产品信息
			ProdInfo: "",

			//产品信息
			OutProds: "",

			//修改时，删除的产品信息
			OutProdsDel: [],

			//产品内部码名称
			InnerCodeName: "",
		};
		//出库单id
		$scope.Data.OutStockID = query("id") || 0;
		$scope.IsAdd = $scope.Data.OutStockID ? 0 : 1;
		$scope.IsView = query("isview") == "1" ? true : false;
		//$scope.IsEdit = query("isedit") == "0" ? false : true;
		$scope.curUser = CacheService.get("user");
		//当前用户的企业ID
		$scope.LoginCompID = $scope.curUser.CompID;
		$scope.glgjCompID = 27712; //桂林国际
		//是否为带出来的数据（桂林国际）
		$scope.isTakeLinkName = false;
		$scope.isTakeLinkPhone = false;
		//		if($filter("hasAuth")(['Q5A'])) {
		//			$scope.hasAuth = true;
		//		} else {
		//			$scope.hasAuth = false;
		//		}
		if($scope.IsAdd == 1) {
			$scope.Data.OutProds = [];
			//新建出库单
			//获取出库单参数
			loadOrderParamsForAdd();
			//默认出库日期为当前时间
			document.getElementById("txtOutDate").value = (new Date()).Format("yyyy-MM-dd HH:mm");
		} else {
			//修改出库单，获取出库单详情和参数
			loadOrderDetailsForEdit();
			//获取出库产品详情和参数
			setTimeout(function() {
				loadProdDetailsForEdit();
			}, 200);
		}

		//产品内部码显示名称
		AuthService.getAuth().then(function(res) {
			$scope.Data.InnerCodeName = res.InnerCodeName || '出厂编号';
		});
		//隐藏向上弹出的产品信息
		document.getElementById("prodInfoTop").style.display = "none";

		if($scope.IsView == 1) {
			document.getElementById("baseInfo").style.display = "none";
		}
		if($scope.IsAdd == 1) {
			//如果是新增时，隐藏完成出库单，隐藏扫码
			document.getElementById("confirmOrder").style.display = "none";
			document.getElementById("ftScan").style.display = "none";
		} else {
			//修改标题
			document.getElementById("spTitle").innerText = "出库详情";
			//显示
			document.getElementById("ftScan").style.display = "block";
			//隐藏基本信息
			document.getElementById("baseInfo").classList.add("hideBaseInfo2");

			//隐藏下一步按钮
			document.getElementById("nextStep").style.display = "none";
			//将基本信息挪至底部
			document.getElementById("baseInfo").classList.add("bg2");
			document.getElementById("baseInfo").classList.add("hideEditInfo");
			document.getElementById("ftConfBaseInfo").style.display = "block";

			//显示出库详情
			document.getElementById("orderInfo").classList.remove("hideOrderInfo");
			document.getElementById("orderInfo").classList.add("showOrderInfo");
		}
		mui.back = function() {
			//			console.log(openedDiv)
			if($scope.IsSaved) {
				//当前保存成功时
				mui.currentWebview.close();
			} else if(openedDiv == 1) {
				//当前基本信息向上弹出时，隐藏
				hideBaseInfo();
			} else if(openedDiv == 2) {
				//当前产品信息向上弹出时，隐藏
				hideProdInfo();
			} else if($scope.IsView) {
				//当前浏览时
				mui.currentWebview.close();
			} else {
				//当前编辑状态时
				mui.confirm("您已编辑过，退出将丢失掉这些内容？", "确定", ['确定取消', '我再想想'], function(e) {
					if(e.index == 0) {
						mui.currentWebview.close();
					}
				});
			}
		};

		//点击修改按钮
		document.querySelector("#edit").addEventListener('tap', function() {
			if(openedDiv == 0) {
				$scope.IsView = false;
				$scope.IsEdit = true;
				$scope.$apply();
			}
			//document.getElementById("orderInfo").style.paddingBottom = "44px";
		});
		//新增时，获取出库单参数
		function loadOrderParamsForAdd() {
			var url = ApiService.Api50 + "/api/v1.0/Stock/GetOutOrderParams";
			DataService.get(url).then(function(reData) {
				//							console.log("loadOrderParamsForAdd:" + JSON.stringify(reData))
				$scope.isLoad = true;
				//添加参数值的字段
				reData.Data && reData.forEach(function(param, index) {
					param.ParamValue = param.ParamDefValue;
				});

				$scope.Data.OrderParams = reData;
				//文本框赋值
				setTimeout(function() {
					$scope.Data.OrderParams && $scope.Data.OrderParams.forEach(function(param, index) {
						if(param.ParamType == 0) {
							document.getElementById("txtOrderParam_" + param.ParamID).value = param.ParamDefValue;
						} else {
							selectOption("txtOrderParam_" + param.ParamID, param.ParamDefValue, param.ParamName);
						}
					})
				}, 300);
			});
		};
		//修改时，获取出库单详情和参数
		function loadOrderDetailsForEdit() {
			var url = ApiService.Api50 + "/api/v1.0/Stock/GetOutOrderDetailsForEdit?OutStockId=" + $scope.Data.OutStockID;
			DataService.get(url).then(function(reData) {
				//console.log("loadOrderDetailsForEdit:" + JSON.stringify(reData))
				$scope.isLoad = true;
				$scope.Data.OutType = reData.OutType;
				$scope.Data.State = reData.State;
				//设置客户类型
				$scope.Data.CustomerType = reData.CustomerType;
				//console.log("2:" + JSON.stringify($scope.Data.CustInfo))
				$scope.Data.CustInfo.CustCompID = reData.CustCompID;
				$scope.Data.CustInfo.CustomerName = reData.CustomerName;
				$scope.Data.CustInfo.CustomerNameCopy = reData.CustomerName;
				document.getElementById("txtCustomerName").value = reData.CustomerName;
				$scope.Data.CustInfo.CustomerID = reData.CustomerID;
				$scope.Data.CustInfo.LinkName = reData.LinkName;
				document.getElementById("txtLinkName").value = reData.LinkName;
				$scope.Data.CustInfo.LinkPhone = reData.LinkPhone;
				document.getElementById("txtLinkPhone").value = reData.LinkPhone;
				$scope.Data.CustInfo.Province = reData.Province;
				$scope.Data.CustInfo.City = reData.City;
				$scope.Data.CustInfo.District = reData.District;
				$scope.Data.CustInfo.Address = reData.Address;
				$scope.Data.CustInfo.Street = reData.Street;
				$scope.Data.CustInfo.MapLat = reData.MapLat;
				$scope.Data.CustInfo.MapLng = reData.MapLng;
				$scope.Data.CustInfo.OutDate = reData.OutDate.substr(0, 16);
				document.getElementById("txtOutDate").value = reData.OutDate.substr(0, 16);
				$scope.Data.OrderParams = reData.OrderParams;
				//				setTimeout(function() {}, 300);
			});
		};
		//修改时，获取出库产品详情和参数
		function loadProdDetailsForEdit() {
			var url = ApiService.Api50 + "/api/v1.0/Stock/GetOutProdDetailsForEdit?OutStockId=" + $scope.Data.OutStockID;
			DataService.get(url).then(function(reData) {
				//				console.log(JSON.stringify(reData))
				$scope.Data.OutProds = [];
				$scope.Data.OutProds = reData;
			});
		};
		//根据迈迪国标通用物联码获取产品信息
		function getProdInfoByMdCode(mdCode) {
			var url = ApiService.Api50 + "/api/v1.0/MdCode/GetProdInfoByMdCode?code=" + mdCode;
			DataService.get(url).then(function(res) {
				//			console.log(JSON.stringify(res))
				$scope.Data.ProdInfo = {
					ID: 0, //新增时是0
					ProdID: res.ProdID,
					ProdName: res.ProdName,
					SkuID: res.SkuID,
					SkuName: res.SkuName,
					MDCode: mdCode,
					ProdInnerCode: "",
					IsDelete: 0,
					//产品参数
					ProdParams: [],
					CompID: res.CompID,
				};

				//自己厂家的产品需要获取其内部码并展示
				if($scope.LoginCompID == $scope.Data.ProdInfo.CompID) {
					//获取产品内部码
					getInnerCodeByMdCode(mdCode);
				}
				//获取产品参数	
				setTimeout(function() {
					getProdParams(mdCode);
				}, 100);
			});
		};
		/*
		 * 扫码·回调。实现操作有：
		 * 1.判断当前扫码产品与出库单产品是否存在；
		 * 2.通过后端接口判断是否能否出库；
		 * 3.获取产品信息；
		 * 4.获取内部码；
		 * 5.获取产品参数信息。
		 */
		window.scanCallBack = function(prodinfo) {
			var type = JSON.parse(prodinfo).codeType;
			var mdCode = JSON.parse(prodinfo).codeValue;
			if(type == "QR") {

				//判断出库单中是否已存在此迈迪国标通用物联码的产品
				var isHasMdCode = false;
				var idx = 0;
				$scope.Data.OutProds.every(function(prod, index) {
					if(prod.MDCode == mdCode) {
						idx = index;
						isHasMdCode = true;
						return false;
					}
					return true;
				});
				if(isHasMdCode == true) {
					mui.alert("当前扫码产品与出库单中第 " + (idx + 1) + " 个产品的迈迪国标通用物联码相同，无法再次添加！");
					return;
				}
				//判断是否在已删除的产品中（修改出库单时使用）
				$scope.Data.OutProdsDel.every(function(prod, index) {
					if(prod.MDCode == mdCode) {
						//设置未删除，并移植到产品列表中
						$scope.Data.OutProdsDel[index].IsDelete = 0;
						$scope.Data.OutProds.push($scope.Data.OutProdsDel[index]);
						$scope.Data.OutProdsDel.splice(parseInt(index), 1);
						//$scope.Data.OutProdsDel.removeAt(index);
						$scope.$apply();
						isHasMdCode = true;
						return false;
					}
					return true;
				});
				if(isHasMdCode == true) {
					return;
				}

				//通过后端判断此产品能否出库
				//出库条件：1.如果当前产品的厂家ID与当前用户的企业ID相同，且没有出过库，可以出库；
				//         2.如果当前产品的最新的出库单中的企业客户ID与当前用户的企业ID相同，可以出库；		
				var url = ApiService.Api50 + "/api/v1.0/Stock/IsOutStock?MDCode=" + mdCode;
				DataService.get(url).then(function(reData) {
					//					console.log(JSON.stringify(reData))
					//可以出库，返回1
					//如果是出库环节中的企业，已经出库时，返回2
					//如果非出库环节中的企业，返回3
					//如果已经被装配到主机，返回4
					if(reData == 1) {
						getProdInfoByMdCode(mdCode);
						//显示向上弹出产品信息
						document.getElementById("prodInfoTop").style.display = "block";
						setTimeout(function() {
							document.getElementById("prodInfoTop").classList.add("showEditInfo");
							document.getElementById("prodInfoTopTool").classList.add("showTool");
							//半隐藏操作按钮
							if($scope.IsView) {
								//浏览时
								document.getElementById("edit").style.opacity = 0.5;
							} else {
								//编辑时
								document.getElementById("confirmOrder").style.opacity = 0.5;
							}
							//记录当前弹出的div
							openedDiv = 2;
						}, 300);
					} else if(reData == 2) {
						mui.alert("该产品已经出库，请扫描其他产品！");
					} else if(reData == 3) {
						mui.alert("请扫描本公司产品码！");
					} else if(reData == 4) {
						mui.alert("该产品已装配到主机，无法出库！");
					}

				}, function(e) {
					//console.log(JSON.stringify(e))
				});

			} else {
				//				mui.toast("请扫描设备迈迪国标通用物联码！");
				mui.toast("请输入正确的迈迪国标通用物联码！");

			}

		};
		//根据迈迪国标通用物联码获取内部码
		function getInnerCodeByMdCode(mdCode, prodId) {
			document.getElementById("txtInCode").value = "";
			document.getElementById("txtInCode").removeAttribute("readOnly");
			var url = ApiService.Api50 + "/api/v1.0/MdCode/GetInnerRelationByMdCode?MdCode=" + mdCode;
			DataService.get(url).then(function(reData) {
				//console.log(JSON.stringify(reData))
				if(reData && reData.InnerCode) {
					$scope.Data.ProdInfo.ProdInnerCode = reData.InnerCode;
					document.getElementById("txtInCode").value = reData.InnerCode;
					document.getElementById("txtInCode").setAttribute("readOnly", 'true');
				} else {
					document.getElementById("txtInCode").value = "";
					document.getElementById("txtInCode").removeAttribute("readOnly");
				}
			});
		};

		//根据内部码获取迈迪国标通用物联码
		function getMdCodeByMdInnerCode(compId, inCode, mdCode, callback) {
			//如果不是当前用户企业的产品，则不需要判断
			if($scope.LoginCompID != compId) {
				callback();
				return;
			}
			var temp = false;
			var url = ApiService.Api45 + "/api/v1.1/MdCode/ValidInnerCodeByMdCode?mdCode=" + mdCode + "&InnerCode=" + inCode;
			DataService.get(url).then(function(reData) {
				//								console.log(JSON.stringify(reData))
				if(reData == 1) {
					mui.toast("此" + $scope.Data.InnerCodeName + "已存在，请修改！");
					Loading.hide();
					isSave = false;
				} else {
					if(temp == false)
						callback();
				}
				temp = true;
			}, function() {
				if(temp == false) {
					callback();
					temp = true;
				}
			});

			//如果超过3秒钟，接口无反应时，直接执行回调
			setTimeout(function() {
				if(temp == false) {
					callback();
					temp = true;
				}
			}, 2000);
		}

		//获取产品参数
		function getProdParams(mdCode, prodId) {
			var url = ApiService.Api50 + "/api/v1.0/Stock/GetProdParams?prodId=" + prodId;
			DataService.get(url).then(function(reData) {
				//添加参数值的字段
				reData.Data && reData.forEach(function(param, index) {
					param.ParamValue = param.ParamDefValue;
				});
				//	console.log(JSON.stringify(reData))
				$scope.Data.ProdInfo.ProdParams = reData;
				//文本框赋值
				setTimeout(function() {
					$scope.Data.ProdInfo.ProdParams && $scope.Data.ProdInfo.ProdParams.forEach(function(param, index) {
						if(param.ParamType == 0) {
							document.getElementById("txtProdParam_" + param.ParamID).value = param.ParamDefValue;
						} else {
							selectOption("txtProdParam_" + param.ParamID, param.ParamDefValue, param.ParamName);
						}
					});
				}, 300)

			});
		}
		var saving = false;
		//完成出库单
		document.getElementById("confirmOrder").addEventListener("tap", function() {
			//有弹出的信息时，无法操作
			if(openedDiv != 0) {
				return;
			}

			if($scope.Data.OutProds.length == 0) {
				mui.toast("请扫码添加出库产品！");
				return;
			}
			if(saving) {
				return;
			}

			//只保存自己厂家产品的内部码和迈迪国标通用物联码的关系
			var mdInerCodeList = [];
			$scope.Data.OutProds && $scope.Data.OutProds.forEach(function(prod) {
				if($scope.LoginCompID == prod.CompID) {
					mdInerCodeList.push({
						MDCode: prod.MDCode,
						CompID: $scope.curUser.CompID,
						InnerCode: prod.ProdInnerCode
					});
				}
			});

			var outProds = []; //出库保存时的出库产品
			//遍历出库产品
			outProds = $scope.Data.OutProds.map(function(prod) {
				var prodParams = [];
				//遍历出库产品参数
				prodParams = prod.ProdParams.map(function(param) {
					return {
						ID: param.ID ? param.ID : 0, //出库产品参数ID，新增时是0
						ParamID: param.ParamID, //出库产品参数配置ID
						ParamName: param.ParamName,
						ParamValue: param.ParamValue,
						IsRequired: param.IsRequired
					};
				});
				return {
					ID: prod.ID, //新增时是0
					OutStockID: $scope.Data.OutStockID, //新增时是0
					ProdID: prod.ProdID,
					ProdName: prod.ProdName,
					SkuID: prod.SkuID,
					SkuName: prod.SkuName,
					MDCode: prod.MDCode,
					IsDelete: prod.IsDelete,
					ProdInnerCode: prod.ProdInnerCode,
					ProdParams: prodParams
				};
			});

			//保存
			var url = ApiService.Api50 + "/api/v1.0/MdCode/AddInnerCodeRelationList";
			DataService.post(url, mdInerCodeList).then(function(res) {
				if(res) {
					console.log("保存内部码成功");
				}
			}, function(error) {
				console.log("保存内部码失败：" + error.message);
			});
			//合并已删除的产品
			if($scope.Data.OutProdsDel.length > 0) {
				outProds = outProds.concat($scope.Data.OutProdsDel);
			}
			var orderParams = []; //出库保存时的出库单参数
			orderParams = $scope.Data.OrderParams.map(function(param) {
				return {
					ID: param.ID ? param.ID : 0, //出库单参数ID，新增时是0
					ParamID: param.ParamID, //出库单参数配置ID
					ParamName: param.ParamName,
					ParamValue: param.ParamValue,
					IsRequired: param.IsRequired
				}
			});
			//组装保存参数
			var paramData = {
				ID: $scope.Data.OutStockID,
				OutType: 1, //1手机出库，2pc端批量出库
				State: 1, //0未出库，1已出库		
				CustomerType: $scope.Data.CustomerType,
				OutDate: $scope.Data.CustInfo.OutDate + ":00",
				OrderParams: orderParams,
				OutProds: outProds
			};
			paramData.CustomerID = $scope.Data.CustInfo.CustomerID;
			paramData.CustCompID = $scope.Data.CustInfo.CustCompID;
			paramData.CustomerName = $scope.Data.CustInfo.CustomerName;
			paramData.LinkName = $scope.Data.CustInfo.LinkName;
			paramData.LinkPhone = $scope.Data.CustInfo.LinkPhone;
			paramData.Province = $scope.Data.CustInfo.Province;
			paramData.City = $scope.Data.CustInfo.City;
			paramData.District = $scope.Data.CustInfo.District;
			paramData.Address = $scope.Data.CustInfo.Address;
			paramData.Street = $scope.Data.CustInfo.Street;
			paramData.MapLng = $scope.Data.CustInfo.MapLng;
			paramData.MapLat = $scope.Data.CustInfo.MapLat;
			saving = true;
			Loading.show();
			//			console.log(JSON.stringify(paramData))
			var url = ApiService.Api50 + "/api/v1.0/Stock/SaveOutStock";
			DataService.post(url, paramData).then(function(res) {
				if(res) {
					mui.toast("出库成功！");
					saving = false;
					$scope.IsSaved = true;
					Loading.hide();
					//编辑后刷新上页面
					if($scope.IsAdd == 0)
						RPCObserver.broadcast('refresh_order_list');
					setTimeout(function() {
						mui.back();
					}, 300);

				}
			}, function(error) {
				saving = false;
				Loading.hide();
				mui.toast("保存失败！")
			});
		});
		var receiveNotification = function(event) {
			if(plus.os.name == 'Android') {
				var code = event.arguments;

				if(code.indexOf('?') >= 0) {
					code = code.split('?')[1];
				}
				var obj = {
					"codeType": "QR",
					"codeValue": code,
				}
				scanCallBack(JSON.stringify(obj));
			}
		};
		document.addEventListener("push.receiveNotification", receiveNotification, false);
		//avalon.filters.contractAddress = contractAddress;

		//设置span的值
		function selectOption(eleID, value, name) {
			if(value) {
				document.getElementById(eleID).innerText = value;
				document.getElementById(eleID).classList.remove("defValue");
			} else {
				document.getElementById(eleID).innerText = "请选择" + name;
				document.getElementById(eleID).classList.add("defValue");
			}
		}

		//选择客户
		document.querySelector(".choose_user").addEventListener("tap", function() {
			if($scope.Data.CustomerType == 1) {
				UtilsService.openWindow({
					needLogin: true,
					id: "select-customer.html",
					url: "select-customer.html",
					extras: {
						selectObj: {
							chooseID: $scope.Data.CustInfo.CustomerID,
							IsRequire: 1,
						},
						callback: "selectCustomer"
					}
				});
				//				openWindow("select-customer.html", {
				//					chooseID: $scope.Data.CustInfo.CustomerID,
				//					IsRequire: 1,
				//					callback: "selectCustomer"
				//				}, 'select-customer.html');
			} else {
				UtilsService.openWindow({
					needLogin: true,
					id: "select-pickdealer.html",
					url: "select-pickdealer.html",
					extras: {
						selectObj: {
							chooseID: $scope.Data.CustInfo.CustCompID,
						},
						callback: "selectCustomer"
					}
				});
				//				openWindow("pickdealer.html", {
				//					callback: "selectCustomer"
				//				});
			}

		});

		/***选择日期***/
		$scope.chooseDate = function() {
			var datePicker = new mui.DtPicker({
				"beginDate": new Date(1900, 01, 01),
				"endDate": new Date(2050, 12, 31),
				"value": document.getElementById("txtOutDate").value
			});
			datePicker.show(function(res) {
				document.getElementById("txtOutDate").value = res.text;
				$scope.$apply();
				datePicker.dispose();
			});
		}
		//选择收货地址
		mui("body").on("tap", "#selAddress", function() {
			if($scope.IsView)
				return;
			UtilsService.openWindow({
				id: "mdAddress.html",
				url: "../../js/pages/mdAddress.html?needlogin=false",
				extras: {
					callback: 'selectAddress'
				}
			});
		});

		//清除收货地址
		mui("body").on("tap", "#delAddress", function() {
			$scope.Data.CustInfo.Province = "";
			$scope.Data.CustInfo.City = "";
			$scope.Data.CustInfo.District = "";
			$scope.Data.CustInfo.Address = "";
			$scope.Data.CustInfo.MapLat = "";
			$scope.Data.CustInfo.MapLng = "";
			$scope.Data.CustInfo.Street = "";
		});
		//出库单参数选择
		mui("#baseInfo").on("tap", ".orderParam", function() {
			//关闭弹出的键盘
			document.activeElement.blur();
			var ele = this;
			var param = $scope.Data.OrderParams[this.getAttribute("idx")];
			var btnArray = [];
			param.Values && param.Values.forEach(function(value) {
				btnArray.push({
					title: value.Name
				});
			})
			plus.nativeUI.actionSheet({
				title: "请选择",
				//				title: "请选择" + param.ParamName,
				cancel: "取消",
				buttons: btnArray
			}, function(e) {
				var index = e.index;
				if(index > 0) {
					ele.innerText = param.Values[index - 1].Name;
					ele.classList.remove("defValue");
				}
			});
		});

		//下一步
		document.getElementById("nextStep").addEventListener("tap", function() {

			if(!validateBaseInfo())
				return;
			//修改标题
			document.getElementById("spTitle").innerText = "添加出库产品";
			//隐藏基本信息
			document.getElementById("baseInfo").classList.add("hideBaseInfo");
			//显示扫码
			document.getElementById("ftScan").style.display = "block";
			//			console.log("6:" + JSON.stringify($scope.Data.CustInfo))
			setTimeout(function() {
				//隐藏下一步按钮
				document.getElementById("nextStep").style.display = "none";
				//显示完成出库单按钮
				document.getElementById("confirmOrder").style.display = "block";
				//将基本信息挪至底部
				document.getElementById("baseInfo").classList.add("bg2");
				document.getElementById("baseInfo").classList.add("hideEditInfo");
				document.getElementById("ftConfBaseInfo").style.display = "block";
				document.getElementById("baseInfo").style.display = "none";
				//显示出库详情
				document.getElementById("orderInfo").classList.remove("hideOrderInfo");
				document.getElementById("orderInfo").classList.add("beginShowOrderInfo");
				setTimeout(function() {
					document.getElementById("orderInfo").classList.add("endShowOrderInfo");
				}, 100);
				//如果有传入的迈迪国标通用物联码，则添加到出库单中
				var mdcode = query("mdcode");
				if(mdcode) {
					scanCallBack("QR", mdcode);
				}
			}, 100);
		});
		//打开基本信息
		document.getElementById("shortBaseInfo").addEventListener("tap", function() {
			//console.log("5:" + JSON.stringify($scope.Data.CustInfo))
			document.getElementById("orderInfo").classList.remove("hideOrderInfo");
			document.getElementById("orderInfo").classList.add("showOrderInfo");
			//临时出库信息赋值
			custTemp.CustInfoID = $scope.Data.CustInfo.CustInfoID;
			custTemp.CustomerName = $scope.Data.CustInfo.CustomerName;
			custTemp.CustomerNameCopy = $scope.Data.CustInfo.CustomerNameCopy;
			custTemp.CustomerID = $scope.Data.CustInfo.CustomerID;
			custTemp.LinkName = $scope.Data.CustInfo.LinkName;
			custTemp.LinkPhone = $scope.Data.CustInfo.LinkPhone;
			custTemp.Province = $scope.Data.CustInfo.Province;
			custTemp.City = $scope.Data.CustInfo.City;
			custTemp.District = $scope.Data.CustInfo.District;
			custTemp.Address = $scope.Data.CustInfo.Address;
			custTemp.MapLat = $scope.Data.CustInfo.Lat;
			custTemp.MapLng = $scope.Data.CustInfo.Lng;
			document.getElementById("txtCustomerName").value = $scope.Data.CustInfo.CustomerName;
			document.getElementById("txtLinkName").value = $scope.Data.CustInfo.LinkName;
			document.getElementById("txtLinkPhone").value = $scope.Data.CustInfo.LinkPhone;
			document.getElementById("txtOutDate").value = $scope.Data.CustInfo.OutDate;
			//出库单参数重新赋值
			$scope.Data.OrderParams && $scope.Data.OrderParams.forEach(function(param, index) {
				//浏览时
				if($scope.IsView) {
					document.getElementById("spOrderParam_" + param.ParamID).innerText = param.ParamValue;
				} else {
					//修改时
					if(param.ParamType == 0) {
						document.getElementById("txtOrderParam_" + param.ParamID).value = param.ParamValue;
					} else {
						selectOption("txtOrderParam_" + param.ParamID, param.ParamValue, param.ParamName);
					}
				}
			});
			//显示向上弹出的基本信息
			document.querySelector("#baseInfo").scrollTop = 0;
			document.getElementById("baseInfo").style.display = "block";
			setTimeout(function() {
				document.getElementById("baseInfo").classList.add("showBaseInfo");
				document.getElementById("baseInfo").classList.add("showEditInfo");
				document.getElementById("ftConfBaseInfo").classList.add("showTool");
				//记录当前弹出的div
				openedDiv = 1;
				if($scope.IsView) {
					//浏览时
					document.getElementById("edit").style.opacity = 0.5;
				} else {
					//编辑时
					document.getElementById("confirmOrder").style.opacity = 0.5;
				}
			}, 100);
		});
		//确定基本信息
		document.getElementById("confirmBaseInfo").addEventListener("tap", function() {
			if(validateBaseInfo()) {
				hideBaseInfo();
			}
		});
		//验证基本信息
		function validateBaseInfo() {
			//			console.log("4:" + JSON.stringify($scope.Data.CustInfo))
			//验证基本信息
			if($scope.Data.CustomerType == 1 || $scope.Data.CustomerType == 2) {
				$scope.Data.CustInfo.CustomerName = trim(document.getElementById("txtCustomerName").value);
				if(!$scope.Data.CustInfo.CustomerName) {
					mui.toast("请选择或输入" + ($scope.Data.CustomerType == 1 ? "企业客户" : "经销商") + "名称！");
					return false;
				}
				//如果当前客户名称与副本不同时，则说明是手工修改的，要清空ID
				if($scope.Data.CustInfo.CustomerName != $scope.Data.CustInfo.CustomerNameCopy) {
					$scope.Data.CustInfo.CustCompID = 0;
					$scope.Data.CustInfo.CustomerID = 0;
				}
			}
			//保存联系人和电话
			$scope.Data.CustInfo.LinkName = trim(document.getElementById("txtLinkName").value);
			$scope.Data.CustInfo.LinkPhone = trim(document.getElementById("txtLinkPhone").value);
			//如果是个人时，验证联系人和联系人电话
			if($scope.Data.CustomerType == 3) {
				//判断联系人
				if(!$scope.Data.CustInfo.LinkName) {
					mui.toast("请输入联系人！");
					return;
				}
				//判断联系电话
				if(!$scope.Data.CustInfo.LinkPhone) {
					mui.toast("请输入联系电话！");
					return;
				}
			}

			//	//判断收货地址
			//	if(!$scope.Data.CustInfo.Province && !$scope.Data.CustInfo.City) {
			//		mui.toast("请选择收货地址！");
			//		return false;
			//	}

			//出库时间赋值
			$scope.Data.CustInfo.OutDate = document.getElementById("txtOutDate").value;
			//判断出库单参数或者产品参数的必填项，并且赋值
			var canNext = true;
			$scope.Data.OrderParams && $scope.Data.OrderParams.every(function(param, index) {
				var value = param.ParamType == 0 ? document.getElementById("txtOrderParam_" + param.ParamID).value : document.getElementById("txtOrderParam_" + param.ParamID).innerText;
				var paramValue = trim(value);
				if(param.IsRequired == 1 && (!paramValue || (paramValue == "请选择" + param.ParamName))) {
					canNext = false;
					mui.toast("请" + (param.ParamType == 0 ? "输入" : "选择") + param.ParamName + "！");
					return false;
				}

				if(param.ParamType == 1 && paramValue == "请选择" + param.ParamName)
					paramValue = "";

				//出库单参数赋值
				param.ParamValue = paramValue;
				return true;
			});
			$scope.$apply()
			return canNext;
		}
		//收回基本信息
		mui(".btn-group").on("tap", ".cancelBaseInfo", function() {
			//地址恢复原值
			//console.log("1:" + JSON.stringify($scope.Data.CustInfo))
			$scope.Data.CustInfo.CustInfoID = custTemp.CustInfoID;
			$scope.Data.CustInfo.CustomerName = custTemp.CustomerName;
			$scope.Data.CustInfo.CustomerNameCopy = custTemp.CustomerNameCopy;
			$scope.Data.CustInfo.CustomerID = custTemp.CustomerID;
			$scope.Data.CustInfo.LinkName = custTemp.LinkName;
			$scope.Data.CustInfo.LinkPhone = custTemp.LinkPhone;
			$scope.Data.CustInfo.Province = custTemp.Province;
			$scope.Data.CustInfo.City = custTemp.City;
			$scope.Data.CustInfo.District = custTemp.District;
			$scope.Data.CustInfo.Address = custTemp.Address;
			$scope.Data.CustInfo.MapLat = custTemp.Lat;
			$scope.Data.CustInfo.MapLng = custTemp.Lng;
			hideBaseInfo();
		});
		//向下隐藏基本信息
		function hideBaseInfo() {
			document.activeElement.blur();
			document.getElementById("baseInfo").classList.remove("showEditInfo");
			document.getElementById("ftConfBaseInfo").classList.remove("showTool");
			setTimeout(function() {
				//显示向上弹出的基本信息
				document.getElementById("baseInfo").style.display = "none";
			}, 300);
			//显示操作按钮
			if($scope.IsView) {
				//浏览时
				document.getElementById("edit").style.opacity = 1;
			} else {
				//编辑时
				document.getElementById("confirmOrder").style.opacity = 1;
			}
			//记录当前弹出的div
			openedDiv = 0;
		}
		//扫码添加产品
		document.getElementById("btnScan").addEventListener("tap", function() {
			mui.prompt(" ", "请输入产品码", "添加出库产品", ["取消", "确认"], function(e) {
				if(e.index == 1) {
					var _val = e.value || "";
					_val = _val.replace(/(^\s+)|(\s+$)/ig, "");
					if(_val == "") {
						mui.alert("请输入迈迪国标通用物联码!");
					} else {
						var info = {
							codeType: "QR",
							codeValue: e.value
						};
						var prodinfo = JSON.stringify(info)
						scanCallBack(prodinfo)
					}
				}
			})

			//			openWindow("../scan/scan.html", {
			//				callback: "scanCallBack"
			//			});
			//			UtilsService.openWindow({
			//				needLogin: true,
			//				id: "scan.html",
			//				url: "../scan/scan.html",
			//				extras: {
			//					callback: "scanCallBack",
			//					type: "scan_addOutstock"
			//				}
			//			});
		});

		//确定产品信息
		var isSave = false; //防止重复点击
		document.getElementById("confirmProdInfo").addEventListener("tap", function() {
			if(isSave == false) {
				Loading.show();
				isSave = true;
				//验证数据
				//如果当前产品的生产企业ID与当前用户的企业ID相同时，判断内部码是否已填
				if($scope.LoginCompID == $scope.Data.ProdInfo.CompID) {
					var innerCode = trim(document.getElementById("txtInCode").value);
					if(!innerCode) {
						mui.toast("请输入" + $scope.Data.InnerCodeName + "！");
						Loading.hide();
						isSave = false;
						return;
					}
					$scope.Data.ProdInfo.ProdInnerCode = innerCode;
				}
				//根据出厂编号和企业ID判断是否已经占用
				getMdCodeByMdInnerCode($scope.Data.ProdInfo.CompID, $scope.Data.ProdInfo.ProdInnerCode, $scope.Data.ProdInfo.MDCode, function() {
					//产品参数
					var canNext = true;
					//判断是否有重复的内部码
					$scope.Data.OutProds.every(function(prodTemp, prodIndexTemp, array) {
						if($scope.Data.ProdInfo.CompID == $scope.LoginCompID && prodTemp.MDCode != $scope.Data.ProdInfo.MDCode && prodTemp.ProdInnerCode == $scope.Data.ProdInfo.ProdInnerCode && $scope.Data.ProdInfo.ProdID == prodTemp.ProdID && $scope.Data.ProdInfo.SkuID == prodTemp.SkuID) {
							canNext = false;
							mui.alert("当前扫码产品与出库单中第 " + (prodIndexTemp + 1) + " 个产品的" + $scope.Data.InnerCodeName + "相同，无法再次添加！");
							return false;
						}

						return true;
					});
					//判断是否与本企业其他出厂编号重复
					if(!canNext) {
						isSave = false;
						Loading.hide();
						return;
					}
					//遍历出库产品参数，校验并赋值
					$scope.Data.ProdInfo.ProdParams && $scope.Data.ProdInfo.ProdParams.every(function(param, index) {
						var value = param.ParamType == 0 ? document.getElementById("txtProdParam_" + param.ParamID).value : document.getElementById("txtProdParam_" + param.ParamID).innerText;
						var paramValue = trim(value);
						//如果必填项没有填写，则提示
						if(param.IsRequired == 1 && (!paramValue || (paramValue == "请选择" + param.ParamName))) {
							canNext = false;
							mui.toast("请" + (param.ParamType == 0 ? "输入" : "选择") + param.ParamName + "！");
							return false;
						}
						if(param.ParamType == 1 && paramValue == "请选择" + param.ParamName)
							paramValue = "";

						//参数值赋值
						param.ParamValue = paramValue;
						return true;
					});
					if(!canNext) {
						isSave = false;
						Loading.hide();
						return;
					}

					//判断是否覆盖旧的，否则添加到出库产品数组中
					var idx = -1;
					$scope.Data.OutProds.every(function(prodTemp, prodIndexTemp, array) {
						if(prodTemp.MDCode == $scope.Data.ProdInfo.MDCode) {
							idx = prodIndexTemp;
							return false;
						}
						return true;
					});
					if(idx == -1)
						$scope.Data.OutProds.push($scope.Data.ProdInfo);
					else
						$scope.Data.OutProds[idx] = $scope.Data.ProdInfo;
					//					$scope.$apply()
					//清除弹出的产品信息
					setTimeout(function() {
						isSave = false;
						$scope.Data.ProdInfo = {
							ID: 0, //新增时是0
							ProdID: 0,
							ProdName: "",
							SkuID: 0,
							SkuName: "",
							MDCode: "",
							ProdInnerCode: "",
							IsDelete: 0,
							//产品参数
							ProdParams: [],
							CompID: 0,
						};
					}, 300);
					//收回产品信息
					hideProdInfo();
					Loading.hide();
				});
			}

		});

		//收回产品信息
		mui(".btn-group").on("tap", ".cancelProdInfo", function() {
			//document.activeElement.blur();
			hideProdInfo();
		});

		//向下隐藏产品信息
		function hideProdInfo() {
			document.activeElement.blur();
			//			console.log(JSON.stringify($scope.Data.ProdInfo))
			document.getElementById("prodInfoTop").classList.remove("showEditInfo");
			document.getElementById("prodInfoTopTool").classList.remove("showTool");
			setTimeout(function() {
				//显示向上弹出的基本信息
				document.getElementById("prodInfoTop").style.display = "none";
				//显示操作按钮
				if($scope.IsView) {
					//浏览时
					document.getElementById("edit").style.opacity = 1;
				} else {
					//编辑时
					document.getElementById("confirmOrder").style.opacity = 1;
				}

				//记录当前弹出的div
				openedDiv = 0;
			}, 300);
		}
		//弹出产品信息
		mui(".data-group").on("tap", ".prodInfo", function() {
			if($scope.IsEdit) return;
			var idx = this.getAttribute("idx");
			//console.log(JSON.stringify($scope.Data.OutProds))
			$scope.Data.ProdInfo = $scope.Data.OutProds[idx];
			$scope.$apply();
			//浏览时
			if($scope.LoginCompID == $scope.Data.ProdInfo.CompID) {
				if($scope.IsView) {
					document.getElementById("spInCode").innerText = $scope.Data.ProdInfo.ProdInnerCode;
				} else {
					//修改时
					document.getElementById("txtInCode").value = $scope.Data.ProdInfo.ProdInnerCode;
					if(document.getElementById("txtInCode").value) {
						document.getElementById("txtInCode").setAttribute("readOnly", 'true');
					}
				}
			}

			//文本框赋值
			//			console.log(JSON.stringify($scope.Data.ProdInfo.ProdParams))
			$scope.Data.ProdInfo.ProdParams && $scope.Data.ProdInfo.ProdParams.forEach(function(param, index) {
				//浏览时
				if($scope.IsView) {
					document.getElementById("spProdParam_" + param.ParamID).innerText = param.ParamValue;
				} else {
					//新增或编辑时
					if(param.ParamType == 0) {
						document.getElementById("txtProdParam_" + param.ParamID).value = param.ParamValue;
					} else {
						selectOption("txtProdParam_" + param.ParamID, param.ParamValue, param.ParamName);
					}
				}
			});

			//显示向上弹出产品信息
			document.getElementById("prodInfoTop").style.display = "block";
			setTimeout(function() {
				document.getElementById("prodInfoTop").classList.add("showEditInfo");
				document.getElementById("prodInfoTopTool").classList.add("showTool");

				//半隐藏操作按钮
				if($scope.IsView) {
					//浏览时
					document.getElementById("edit").style.opacity = 0.5;
				} else {
					//编辑时
					document.getElementById("confirmOrder").style.opacity = 0.5;
				}

				//记录当前打开的div
				openedDiv = 2;
			}, 300);
		});

		//出库单参数选择
		mui("#prodInfoTop").on("tap", ".prodParam", function() {
			//关闭键盘
			document.activeElement.blur();
			var ele = this;
			var param = $scope.Data.ProdInfo.ProdParams[this.getAttribute("idx")];
			var btnArray = [];
			param.Values && param.Values.forEach(function(value) {
				btnArray.push({
					title: value.Name
				});
			})
			plus.nativeUI.actionSheet({
				//				title: "请选择" + param.ParamName,
				title: "请选择",
				cancel: "取消",
				buttons: btnArray
			}, function(e) {
				var index = e.index;
				if(index > 0) {
					ele.innerText = param.Values[index - 1].Name;
					ele.classList.remove("defValue");
				}
			});
		});

		//删除产品
		mui("#orderInfo").on("tap", ".icon-close", function() {
			var idx = this.getAttribute("idx");
			//console.log("idx:" + idx);
			var outProdId = this.getAttribute("outProdId"); //出库产品ID，修改时有值，新增时无值
			//console.log("outProdId:" + outProdId);
			mui.confirm('确定要取消此产品出库吗？', '提示', ["取消", "确定"], function(e) {
				if(e.index == 1) {
					//如果是修改时删除，则标明删除，并移植到已删除的数组中			
					if(outProdId && outProdId != 0) {
						$scope.Data.OutProds[idx].IsDelete = 1;
						$scope.Data.OutProdsDel.push($scope.Data.OutProds[idx]);
					}
					$scope.Data.OutProds.splice(parseInt(idx), 1);
					$scope.$apply();
				}
			});
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

//已选择的客户回调
function selectCustomer(comp) {
	var appElement = document.querySelector('[ng-controller=OutStockController]');
	var $scope = angular.element(appElement).scope();
	$scope.Data.CustInfo.CustCompID = comp.ID; //企业id
	$scope.Data.CustInfo.CustomerName = comp.CustName;
	$scope.Data.CustInfo.CustomerNameCopy = comp.CustName;
	document.getElementById("txtCustomerName").value = comp.CustName;
	$scope.Data.CustInfo.CustomerID = comp.CustomerID;
	$scope.Data.CustInfo.Province = comp.Province;
	$scope.Data.CustInfo.City = comp.City;
	$scope.Data.CustInfo.District = comp.District;
	$scope.Data.CustInfo.Address = comp.Address;
	$scope.Data.CustInfo.MapLat = comp.MapLat;
	$scope.Data.CustInfo.MapLng = comp.MapLng;
	$scope.Data.CustInfo.Street = comp.Street;
	$scope.Data.CustInfo.LinkName = comp.MainLinkName; //主联系人姓名
	//document.getElementById("txtLinkName").value = comp.MainLinkName;
	$scope.Data.CustInfo.LinkPhone = comp.MainLinkPhone; //主联系人电话
	//document.getElementById("txtLinkPhone").value = comp.MainLinkPhone;
	//桂林国际定制
	if($scope.LoginCompID == $scope.glgjCompID) {
		$scope.isTakeLinkName = comp.MainLinkName.trim() ? true : false;
		$scope.isTakeLinkPhone = comp.MainLinkPhone.trim() ? true : false;
	}
	//	console.log("3:" + JSON.stringify($scope.Data.CustInfo))
	$scope.$apply();
}
//反馈已选择的收货地址
function selectAddress(local) {
	var appElement = document.querySelector('[ng-controller=OutStockController]');
	var $scope = angular.element(appElement).scope();
	$scope.Data.CustInfo.Province = local.province;
	$scope.Data.CustInfo.City = local.city;
	$scope.Data.CustInfo.District = local.district;
	$scope.Data.CustInfo.Address = local.address;
	$scope.Data.CustInfo.MapLat = local.lat;
	$scope.Data.CustInfo.MapLng = local.lng;
	$scope.Data.CustInfo.Street = local.street;
	$scope.$apply();
}

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
	//var appElement = document.querySelector('[ng-controller=OutStockController]');
	//var $scope = angular.element(appElement).scope();

});