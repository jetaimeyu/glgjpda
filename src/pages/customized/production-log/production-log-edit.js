app.controller("productionLogEditController",["$scope","UtilsService","ApiService","DataService","DatePickerService","Loading",function($scope,UtilsService,ApiService,DataService,DatePickerService,Loading){			
	$scope.data={
		IsQualified: 1, //1合格，0不合格
		CustomerName: "",
		ID: 0,
		CheckDate: '',
		OrderID: "",
		ManualNo:"",
		JobType: "",
		DictType: "",
		DictName: "",
		JobContent: "",
		ProduceDate: "",
		WorkProgress: "",
		IsPublic: 0,
		Remark: "",
		jobtypelist: [],
		
	}
	var isSave=false;
	$scope.method={
		test: function() {
			getProdOrderLog($scope.data.ManualNo)
	
		},
		//日期选择
		chooseDate:function() {
			DatePickerService.pickDate({
				selected: $scope.data.CheckDate,
			}).then(function(res) {
				$scope.data.CheckDate = res;
			});
		},
		//扫一扫
		scan:function(){
			UtilsService.openWindow({
				needLogin: true,
				id: 'scan.html',
				url: '../../scan/scan.html',
				extras: {
					callback: "scanCallBack",
					type:"scan_technics"
				}
			});
		},
		//选择工作分类
		selectJobType:function(){
			var url = ApiService.Api45 + "/api/v1.1/Produce/GetDictionary";
			DataService.get(url).then(function(data) {
					$scope.data.JobType = data;
					$scope.data.typetitle = $scope.data.JobType.map(function(res) {
						return {
							title: res.DictName
						}
					})
					plus.nativeUI.actionSheet({
						title: "选择工作分类",
						cancel: "取消",
						buttons: $scope.data.typetitle
		
					}, function(e) {
						var index = e.index - 1;
						$scope.data.DictType = $scope.data.JobType[index].DictType;
						$scope.data.JobType = $scope.data.JobType[index].ID;
						$scope.data.DictName = $scope.data.typetitle[index].title
					})
				
	
			})
		},
		saveInfo:function(){
			if(isSave){
				return false;
			}
			if(!$scope.data.OrderID) {
				mui.toast("订单编号不正确，请重新扫码或输入");
				return;
			}
			if($scope.data.WorkProgress.trim() > 100) {
				mui.toast("输入工作进度不得大于100%")
			}
			$scope.data.IsQualified=m("#jobType a").classList.contains("md-active") ? "1" : "0";
			isSave=true;
			Loading.show();
			var url = ApiService.Api45 + "/api/v1.1/Produce/SaveProdOrderLog";
			var savaData = {
				"ID": 0,
				"OrderID": $scope.data.OrderID,
				"JobType": $scope.data.JobType,
				"JobContent": $scope.data.JobContent,
				"ProduceDate": $scope.data.CheckDate + " 00:00:00",
				"WorkProgress": $scope.data.WorkProgress,
				"IsPublic": $scope.data.IsQualified,
				"Remark": $scope.data.Remark,
				"CustomerName": $scope.data.CustomerName,
//				"DictName": $scope.data.DictName,
				"DictType": $scope.data.DictType
		
			};
//			console.log(JSON.stringify(savaData))
			DataService.post(url, savaData).then(function(res) {
				if(res){
					mui.toast("保存成功！");
					
				}else{
					mui.toast("保存失败，请重试");
				}
				isSave=false;
				Loading.hide();
				setTimeout(
					function(){
						mui.back()
					}
				,300)
				mui.back()
			})
		}
		
	}
	//获取生产日志
	function getProdOrderLog(codeNo){
		var url = ApiService.Api45 + "/api/v1.1/Produce/GetProdOrderLog?OrderID=2&ManualNo=" + codeNo;
		DataService.get(url).then(function(data) {
//				console.log(JSON.stringify(data))
				if(data.length != 0 && data[0].CustomerName) {
					$scope.data.CustomerName = data[0].CustomerName;
					$scope.data.OrderID=data[0].ID;
					$scope.data.ManualNo=data[0].ManualNo;
				} else {
					$scope.data.OrderID = "";
					$scope.data.CustomerName = "";
					mui.toast("订单编号不正确");
				}
	
			},function(e){
							
			})
	}
	//扫描成功后的反馈
	window.scanCallBack=function(type,code) {
//		console.log(JSON.stringify(code))
		$scope.data.ManualNo = code;
		getProdOrderLog($scope.data.ManualNo)

	}
	//切换是否合格
	mui("body").on("tap", "#jobType .md-switch-button", function() {
		document.activeElement.blur();
		$scope.data.IsQualified = parseInt(this.getAttribute("dataId"));
		$scope.$apply()
	});		
				
}])	
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});

