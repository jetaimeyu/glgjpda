var app = angular.module('TestForm', ["Bill"]);

app.filter("hasAuth", ['CacheService', function(CacheService) {
	var user = CacheService.get('user');
	return function(keys, userid) {
		var auths = CacheService.get('userAuth') || [];
		var self;
		if(keys instanceof Array) {
			var ret = false;
			for(var i = 0; i < keys.length; i++) {
				if(['Q5', 'Q10', 'Q15', 'Q26', 'Q31'].indexOf(keys[i]) >= 0) {
					self = user.UserID == userid;
				} else if(['Q4', 'Q9', 'Q25'].indexOf(keys[i]) >= 0) {
					self = user.CompID == 0;
				} else {
					self = false;
				}
				var flag = self || auths.some(function(item) {
					return item == keys[i];
				});
				if(flag) {
					ret = true;
					break;
				}
			}
			return ret;
		} else {
			if(['Q5', 'Q10', 'Q15', 'Q26', 'Q31'].indexOf(keys) >= 0) {
				self = user.UserID == userid;
			} else if(['Q4', 'Q9', 'Q25'].indexOf(keys) >= 0) {
				self = user.CompID == 0;
			} else {
				self = false;
			}
			return self || auths.indexOf(keys) >= 0;
		}
	}
}]);
// 聊天
app.factory("ChatUserService", ["CacheService", "$rootScope", function(CacheService, $rootScope) {
	var user = CacheService.get('user');
	return {
		tap: function(options) {
			$rootScope.$broadcast("stop_audio");
			if(options.chatId == user.UserID) {
				mui.toast('不能与自己会话');
			} else {
				var params = {
					needLogin: true,
					id: 'chat-' + options.chatId,
					url: '../../pages/message/chat.html',
					extras: options,
					createNew: false
				}
				openWindow(params.url, params.extras, params.id, params.createNew);
			};
		}
	};
}]);
// 客户信息 列表组件
app.directive('customerInfoList', [
	function() {
		return {
			restrict: 'E',
			scope: {
				model: "=ngModel" // 创建一个全新的隔离作用域
			},
			transclude: true, // 不想让指令内部的内容被模板替换，可以设置这个值为true
			templateUrl: './customerInfoList.html',
			controller: ["$scope", "UtilsService", "$rootScope", "CacheService", "ChatUserService", "$filter",
				function($scope, UtilsService, $rootScope, CacheService, ChatUserService, $filter) {
					//跳转到相应的页面
					$scope.evals = {
						1: "非常满意",
						2: "满意",
						3: "一般",
						4: "不满意"
					}
					$scope.DateType = {
						1: "日",
						2: "月",
						3: "年"
					}
					$scope.tap = function(href, obj) {
						$rootScope.$broadcast("stop_audio");
						if(href.indexOf("eval-info.html") > -1) {
							var url = obj.IsEval == 0 ? 'eval-edit.html' : 'eval-info.html';
							openWindow('../aftersale/' + url + '?repairid=' + obj.ID + "&evalid=" + obj.EvalID + "&Jurisdiction=" + $filter("hasAuth")("Q33"), {}, url);
						} else {
							openWindow(href + "?id=" + obj.ID, {}, href);
						}
					};
					$scope.lookover = function(key) {
						openWindow("customer-datas.html?key=" + key + "&id=" + query("dataid"), {}, "customer-datas.html");
					}

					var userInfo = CacheService.get("user");
					var userid = userInfo ? userInfo.UserID : 0;
					$scope.chart = function(event, user) {
						event.stopPropagation();
						if(userid == user.ID) {
							mui.toast('不能与自己会话');
						} else {
							// 不存在
							ChatUserService.tap({
								chatId: user.CreateUserID || user.ID,
								chatName: user.CreateUserName || user.Name,
								hasLogo: user.ULogoIsExist,
								chatCompId: user.CompID
							});
						}
					};
				}
			]
		};
	}
]);

// 有语音时 标题 fileter
app.filter("formatRepairInfo", ["ApiService", function(ApiService) {
	return function(IsHasAudio, AudioLength, Description) {
		return IsHasAudio == 1 ? '[' + AudioLength + '秒语音描述]' + Description : Description;
	}
}]);
//替换图片路径中的反斜线
app.filter('filePathReg', function() {
	return function(filePath) {
		return filePath.replace(/\\/g, "/");
	}
});
// 设备图片
app.filter("getEquLogo", ["ApiService", "$filter", function(ApiService, $filter) {
	return function(equUrl, w) {
		return equUrl ? ApiService.Api47 + "/api/v1/BillFile/DownLoadFile?filePath=" + $filter("filePathReg")(equUrl) + "&w=" + w : "../../images/equ/defImg.png";
	}
}]);