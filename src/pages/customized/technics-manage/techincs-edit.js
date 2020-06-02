app.controller("TCController", ["$scope", "ApiService", "UtilsService", "DataService", "Loading", "$Modal", "RPCObserver", "$filter", "DatePickerService", "AuthService",
	function($scope, ApiService, UtilsService, DataService, Loading, $Modal, RPCObserver, $filter, DatePickerService, AuthService) {
		$scope.isLoad = false
		$scope.UserId = query("userId")
		$scope.TechincsCode = "" //工艺过程码
		$scope.OrderNo = "" //订单编号
		$scope.ProdName = ""
		$scope.SkuName = ""
		$scope.OrderProcessNo = ""
		$scope.ProcessStepID = "" //工艺步骤ID
		$scope.StepName = "" //工艺步骤名称
		$scope.FixedTime = "" //定额台时
		$scope.QualifiedCount = "" //合格的数量
		$scope.InferiorCount = "" //次品的数量
		$scope.WasteCount = "" //废品数量
		$scope.IsQualified = "" //是否合格
		$scope.ReQualified = "" //加载时记录当前是否合格
		$scope.WorkShopList = "" //车间数组
		$scope.EquipmentList = "" //设备数组
		$scope.WorkmenList = "" //操作人员数组
		$scope.CheckerList = "" //检验数组
		$scope.SaveProcessStep = { //保存时用到的传参对象
			"ID": 0,
			"FixedTime": 0,
			"WorkShop": "",
			"Equipment": "",
			"Workmen": "",
			"IsQualified": 1,
			"QualifiedCount": 0,
			"InferiorCount": 0,
			"WasteCount": 0,
			"Checker": "",
			"CheckDate": ""
		}
		$scope.StepNameList = [] //工艺步骤单项信息
		$scope.CheckTime = [] //检验时间
		$scope.CheckDate = "" //默认检验时间
		$scope.ServerDate = "" //服务器时间
		$scope.StepPosition = { //每项选中的子项位置
			"WorkShop": [],
			"Equipment": [],
			"Workmen": [],
			"Checker": [],
			"IsQualified": []
		}
		$scope.IsUserExist = true //人员是否存在
		$scope.IsCheker = false //是否检验
		$scope.IsWorkmen = false //是否是操作人

		$scope.IsCheckMan = true //是否是检验员
		$scope.isHaveOpera = true //是否有操作员权限
		$scope.isHaveCheck = true //是否有检查员权限
		$scope.isChecked = {
			workshop: false,
			equipment: false,
			workmen: false,
			check: false,
			checker: false
		} //是否选择对象
		
		//findIndex的polyfill
		if(!Array.prototype.findIndex) {
			Object.defineProperty(Array.prototype, 'findIndex', {
				value: function(predicate) {
					if(this == null) {
						throw new TypeError('"this" is null or not defined');
					}
					var o = Object(this);
					var len = o.length >>> 0;
					if(typeof predicate !== 'function') {
						throw new TypeError('predicate must be a function');
					}
					var thisArg = arguments[1];
					var k = 0;
					// 6. Repeat, while k < len
					while(k < len) {
						var kValue = o[k];
						if(predicate.call(thisArg, kValue, k, o)) {
							return k;
						}
						k++;
					}
					return -1;
				}
			});
		}
		//加载工艺信息
		function getData() {
			var url = ApiService.Api45 + "/api/v1.0/Process/GetProcessStep?ProcessStepID=" + $scope.ProcessStepID;
			getAjaxData(url, function(data) {
				if(data.State == 1 && data.Data) {
					$scope.FixedTime = data.Data.FixedTime;
					$scope.QualifiedCount = data.Data.QualifiedCount;
					$scope.InferiorCount = data.Data.InferiorCount;
					$scope.WasteCount = data.Data.WasteCount;
					$scope.IsQualified = data.Data.IsQualified;
					$scope.ReQualified = data.Data.IsQualified;
					$scope.WorkShopList = data.Data.WorkShopList;
					$scope.EquipmentList = data.Data.EquipmentList;
					$scope.WorkmenList = data.Data.WorkmenList;
					$scope.CheckerList = data.Data.CheckerList;
					$scope.ServerDate = data.Data.ServerDate;
					$scope.CheckDate = data.Data.CheckDate || data.Data.ServerDate
					$scope.SaveProcessStep.FixedTime = $scope.FixedTime;
					//判断人员是否是操作员
					var isInWorkmen = isContainUser($scope.WorkmenList)
					//判断人员是否是检验员
					var isInChecker = isContainUser($scope.CheckerList)

					updateView(isInWorkmen, isInChecker)

					if(isInWorkmen && !isInChecker) {
						$scope.isHaveCheck = false
						$scope.IsCheckMan = false
					} else if(!isInWorkmen && isInChecker) {
						$scope.isHaveOpera = true
					} else if(isInWorkmen && isInChecker) {
						$scope.isHaveCheck = true
						$scope.isHaveOpera = true
						$scope.IsCheckMan = true
					} else {
						$scope.isHaveCheck = false
						$scope.isHaveOpera = false
						$scope.IsCheckMan = false
						$scope.IsUserExist = false
					}
					$scope.IsCheckMan = $scope.IsQualified == 0
					$scope.isLoad = true
					$scope.$apply()
				} else {

				}
			});
		}

		function updateView(isInWorkmen, isInChecker) {
			if($scope.WorkShopList.length) {
				$scope.isChecked['workshop'] = isCheck('WorkShopList')
			}
			if($scope.EquipmentList.length) {
				$scope.isChecked['equipment'] = isCheck('EquipmentList')
			}
			if($scope.WorkmenList.length) {
				$scope.IsWorkmen = isCheck('WorkmenList')
				$scope.isChecked['workmen'] = Boolean($scope.IsWorkmen)
			}
			if($scope.CheckerList.length) {
				$scope.IsCheker = isCheck('CheckerList')
				$scope.isChecked['checker'] = Boolean($scope.IsCheker)
			}
			if($scope.IsQualified == 0 || $scope.IsQualified == 1) {
				$scope.isChecked['check'] = true

				$scope.SaveProcessStep.IsQualified = $scope.IsQualified;
				if($scope.IsQualified == 0) {
					$scope.SaveProcessStep.QualifiedCount = $scope.QualifiedCount;
					$scope.SaveProcessStep.InferiorCount = $scope.InferiorCount;
					$scope.SaveProcessStep.WasteCount = $scope.WasteCount;
				}
			}
		}
		
		//判断数组里是否有IsCheck
		function isCheck(key) {
			return $scope[key].findIndex(function(item) {
				return item.IsChecked == 1
			}) > -1
		}
		//判断是否含有人员
		function isContainUser(arr) {
			return arr.findIndex(function(item) {
				return item.ID == $scope.UserId
			}) > -1
		}

		$scope.init = function() {
			//获取工艺步骤ID
			$scope.ProcessStepID = plus.webview.currentWebview().ProcessStepID;
			//获取工艺过程码
			$scope.TechincsCode = plus.webview.currentWebview().TechincsCode;
			$scope.OrderNo = plus.webview.currentWebview().OrderNo;
			$scope.ProdName = plus.webview.currentWebview().ProdName;
			$scope.SkuName = plus.webview.currentWebview().SkuName;
			$scope.OrderProcessNo = plus.webview.currentWebview().OrderProcessNo;
			//获取工艺步骤名称
			$scope.StepName = plus.webview.currentWebview().StepName;
			getData()
		}
		$scope.init()

		//$model弹窗
		mui.back = function() {
			if(isModal) {
				$Modal.close();
			} else {
				RPCObserver.broadcast('refresh_ZHMN_list');
				mui_back();
			}
		}
		var isModal = false;
		$scope.selectModal = function() {
			$Modal.modal({
				size: "small",
				footer: false,
				autoClose: true,
				template: '<div><ul class="data-group"><li class="data-row techincs_type_child" ng-repeat="el in params.StepNameList" ng-click="select(el,$index)"><label><i ng-class="{true:\'icon-roundcheckfill color-blue font-17 color-gray-deep\',false:\'icon-round font-17 color-gray-deep\'}[el.IsChecked == 1]"></i><span ng-bind="el.Name"></span></label></li><li class="data-row" ng-repeat="el in params.CheckTime"><label><span ng-bind="el.Name"></span></label><div class="body" ng-bind="params.CheckDate"></div></li></ul><button  class="mui-btn mui-btn-primary mui-btn-block" ng-click="selPhrase()">保存</button></div>',
				params: {
					StepNameList: $scope.StepNameList,
					CheckTime: $scope.CheckTime,
					CheckDate: $scope.CheckDate
				},
				controller: ['$scope', function($scope) {
					isModal = true;
					var IsQualified = ""
					var appElement = document.querySelector('[ng-controller=TCController]');
					var scope = angular.element(appElement).scope();
					$scope.select = function(data, index) {
						if(data.type && data.type === 'check') {
							$scope.params.StepNameList = $scope.params.StepNameList.map(function(item) {
								item.IsChecked = 0
								return item
							})

							$scope.params.StepNameList[index].IsChecked = 1
							IsQualified = data.ID

						} else {
							data.IsChecked = data.IsChecked == 1 ? 0 : 1
						}
					}

					$scope.$on("modal_close", function() {
						isModal = false;
						mui("#adpopover").off("tap", ".savePhrase");
					});

					$scope.selPhrase = function(phrase, index) {
						if(scope.typeKey == 'check') {
							scope.IsQualified = IsQualified
							scope.IsCheckMan = scope.IsQualified == '0'
						}
						if(scope.IsQualified == scope.ReQualified) {
							scope.SaveProcessStep.CheckDate = scope.CheckDate;
						} else {
							scope.SaveProcessStep.CheckDate = scope.ServerDate;
						}
						scope[scope.typeKey] = $scope.params.StepNameList
						updateView()
						$scope.$modal.close();
					}
				}]
			}).show()
		}

		//点击的类型
		$scope.typeKey = ''
		$scope.clickType = function(key) {
			document.activeElement.blur();
			$scope.typeKey = key
			if(key === 'check') {
				$scope.StepNameList = [{
					"ID": 1,
					"Name": "合格",
					"IsChecked": $scope.IsQualified == 1 ? 1 : 0,
					"type": "check"
				}, {
					"ID": 0,
					"Name": "不合格",
					"IsChecked": $scope.IsQualified == 0 ? 1 : 0,
					"type": "check"
				}];
				$scope.CheckTime = [{
					"ID": 2,
					"Name": "检验时间",
				}];
			} else {
				$scope.StepNameList = $scope[key].map(function(item) {
					return item
				})
			}
			console.log($scope.StepNameList);
			if(!$scope.StepNameList.length) {
				mui.toast("该项未配置参数值！");
			}
			$scope.selectModal()
		}
		//
		function saveType() {
			var obj = {
				WorkShop: 'WorkShopList',
				Equipment: 'EquipmentList',
				Workmen: 'WorkmenList',
				Checker: 'CheckerList'
			}
			for(var key in obj) {
				var str = ""
				$scope.StepPosition[key] = $scope[obj[key]].map(function(item) {
					if(item.IsChecked) {
						str += item.ID + ','
					}
				})
				$scope.SaveProcessStep[key] = str.replace(/,$/gi, '')
			}
		}
		$scope.btnSave = function() {
			saveType()
			if(!$scope.IsCheckMan) {
				$scope.QualifiedCount = ''
				$scope.InferiorCount = ''
				$scope.WasteCount = ''
			}
			var url = ApiService.Api45 + "/api/v1.0/Process/SaveProcessStep?userId=" + $scope.UserId;
			$scope.SaveProcessStep = { //保存时用到的传参对象
				"ID": $scope.ProcessStepID,
				"FixedTime": $scope.FixedTime,
				"WorkShop": $scope.SaveProcessStep.WorkShop,
				"Equipment": $scope.SaveProcessStep.Equipment,
				"Workmen": $scope.SaveProcessStep.Workmen,
				"IsQualified": $scope.IsQualified,
				"QualifiedCount": $scope.QualifiedCount,
				"InferiorCount": $scope.InferiorCount,
				"WasteCount": $scope.WasteCount,
				"Checker": $scope.SaveProcessStep.Checker,
				"CheckDate": $scope.SaveProcessStep.CheckDate
			};
			postAjaxData(url, $scope.SaveProcessStep, function(data) {
				if(data.State == 1 && data.Data != null) {
					mui.toast("保存成功！");
					mui.back();
				}
			}, true);
		}
	}
]);
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});