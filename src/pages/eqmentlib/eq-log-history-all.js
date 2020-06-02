mui.init();

app.controller("bodyCtl", ["$scope", "DataService", "ApiService", "UtilsService", "$filter", "TapService", "AuthService", "CacheService", "DatePickerService", function($scope, DataService, ApiService, UtilsService, $filter, TapService, AuthService, CacheService, DatePickerService) {

	//日期选择
	var _curDate = new Date();
	var curDate = {
		quarter: {
			"1": "一季度",
			"2": "二季度",
			"3": "三季度",
			"4": "四季度"
		},
		curYear: _curDate.getFullYear(),
		curValue: _curDate.getMonth(),
		curType: "month",
		view: _curDate.getFullYear() + "年" + (_curDate.getMonth() + 1) + "月"
	};

	$scope.domData = {
		title: {},
		id: query("equid"),
		mdcode: query("mdcode"),
		data: {},
		isLoad: false,
		curDate: curDate,
	};
	$scope.curUser = CacheService.get("user");

	$scope.States = {
		1: "签到",
		2: "记录",
		3: "签退"
	};
	$scope.roundColor = {
		1: 'color_orange',
		3: 'color_blue',
		2: 'color_green'
	};

	$scope.chooseDate = function() {
		var _date = $scope.domData.curDate;
		DatePickerService.getTime(_date.curYear, _date.curValue, _date.curType).then(function(data) {

			_date.curYear = data.year;
			_date.curType = data.type;
			_date.curValue = data.value;
			_date.startDate = data.startDate;
			_date.endDate = data.endDate;
			_date.view = data.view;
			mui.showLoading("", "div");
			$scope.domData.title = {};
			$scope.domData.isLoad = false;

			curData.title();

		});
	};

	$scope.getDateRange = function(callback) {
		var _date = $scope.domData.curDate;

		DatePickerService.getDateRange(parseInt(_date.curYear), parseInt(_date.curValue), _date.curType, function(startDate, endDate, view) {
			_date.startDate = startDate;
			_date.endDate = endDate;
			_date.view = view;
			typeof callback == "function" && (callback());
		});
	}

	$scope.event = {
		openLogInfo: function(user) {
			UtilsService.openWindow({
				url: "eq-log-history.html?userid=" + user.UserID+"&mdcode="+$scope.domData.mdcode+"&id="+$scope.domData.id,
				id: "eq-log-history.html"
			})
		},
		activeTab:function(key){
			if(!$scope.domData.data[key])
			{
				curData.data(key);
			}
		},
		
	};
	
	mui("body").on("tap",".md-tab-item",function(){
		$scope.event.activeTab(this.getAttribute("data-value"))
	})

	var curData = {
		title: function() {
			
			var _date = $scope.domData.curDate;
			var startDate = angular.copy(_date.startDate);
			var endDate = angular.copy(_date.endDate);

			var url = ApiService.Api50 + "/api/v1/Equipment/GetAllEqLogByDate?mdCode="+$scope.domData.mdcode+"&startDate=" + startDate.Format("yyyy-MM-dd 00:00:00") + "&endDate=" + endDate.Format("yyyy-MM-dd 00:00:00") + "&dataType=1&groupType=" + (curDate.curType != 'month' ? 1 : 0)
			DataService.get(url).then(function(res) {
				$scope.domData.title = res;
				$scope.domData.isLoad = true;
				if(res.DataRow.length > 0) {
					curData.data(res.DataRow[0].GroupDate)
				}
				mui.hideLoading();

				setTimeout(function() {
					MdConfig.StartUsingTab();
				}, 200);
			}, function() {
				mui.hideLoading();
			})
		},
		data: function(key) {
			mui.showLoading("", "div");
			
			var _date = $scope.domData.curDate;
			var startDate = angular.copy(_date.startDate);
			var endDate = angular.copy(_date.endDate);

			var url = ApiService.Api50 + "/api/v1/Equipment/GetAllEqLogByDate?mdCode="+$scope.domData.mdcode+"&startDate=" + startDate.Format("yyyy-MM-dd 00:00:00") + "&endDate=" + endDate.Format("yyyy-MM-dd 00:00:00") + "&dataType=0&groupType=" + (curDate.curType != 'month' ? 1 : 0)+"&key="+key
			DataService.get(url).then(function(res) {
				mui.hideLoading();
				$scope.domData.data[key] = res;
			}, function() {
				mui.hideLoading();
			})
		}
	};

	$scope.getDateRange(function() {
		curData.title();
	});

}]);

mui.showLoading("", "div");

mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});