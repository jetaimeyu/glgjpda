app.controller("myEwmDetailsCtrl", ["$scope", "CacheService", "UtilsService", "ApiService", "AuthService", "$timeout", "$filter", "ChatUserService", function ($scope, CacheService, UtilsService, ApiService, AuthService, $timeout, $filter, ChatUserService) {
	$timeout(function () {
		$scope.isLoad = true;
	})

	 
	var wc = plus.webview.currentWebview();

	$scope.GroupInfo = wc.groupInfo;


	$scope.logo =  ApiService.Api50+"/api/v1/MsgGroupPic/"+$scope.GroupInfo.GroupCode+"_96x96.jpg";

	var curUser = CacheService.get("user");
	$scope.file = "";
	$scope.sendToMore = function () {
		document.querySelector("header").style.display = "none";
		document.querySelector(".mui-content").style.background = "#fff";
		document.querySelector("body").style.background = "#fff";
		document.querySelector(".mui-content").style.paddingTop = "0px";

		setTimeout(function () {
			var bitmap = new plus.nativeObj.Bitmap("qrCode");
			// 将webview内容绘制到Bitmap对象中
			wc.draw(bitmap, function () {
				bitmap.save("_doc/qrCode.jpg", {
					overwrite: true,
					quality: 40,
					clip: {
						top: "0px",
						left: '0px',
						height: "360px",
						width: "100%"
					}
				}, function (i) {
					document.querySelector("header").style.display = "block";
					document.querySelector(".mui-content").style.paddingTop = "40px";
					document.querySelector(".mui-content").style.background = "";
					document.querySelector("body").style.background = "";

					$scope.file = i.target;
					// console.log('保存图片成功：' + JSON.stringify(i));
					bitmap.clear();

					UtilsService.openWindow({
						id: "contact-select.html",
						url: "../common/contact-select.html?action=select&multiselect=false&isGroup=true",
						extras: {
							selectObj: [],
							callback: "forwardback"
						}
					});

				}, function (e) {
					bitmap.clear();
					document.querySelector(".mui-content").style.paddingTop = "40px";
					document.querySelector(".mui-content").style.background = "";
					document.querySelector("body").style.background = "";

					document.querySelector("header").style.display = "block";
				});

			}, function (e) {
				document.querySelector(".mui-content").style.paddingTop = "40px";
				document.querySelector(".mui-content").style.background = "";
				document.querySelector("body").style.background = "";

				document.querySelector("header").style.display = "block";
				mui.toast("应用截图失败");
			});
		}, 100)

	};
	window.forwardback = function (res) {

		var sendTo = res;
		mui.showLoading("正在发送消息", "div");

		var data = {
			fileType: 1,
			localFile: $scope.file,
			funcKey: "MsgFile"
		};

		UtilsService.uploadFile(data).then(function (res) {
			var result = res.responseText;
			typeof (result) == "string" && (result = JSON.parse(result));
			var content = [];
			content.push(4);

			content.push(result.Data[0].FilePath);
			content.push(result.Data[0].Width);
			content.push(result.Data[0].Height);
			var transData = [0, [content]];

			for (var i = 0; i < sendTo.length; i++) {
				var user = sendTo[i];
				if (user.GroupCode) {
					ChatUserService.sendGroup({
						GroupCode: user.UserID,
						GroupName: user.ViewName,
						GroupID: user.GroupID,
						type: 4,
						content: ""
					}, JSON.stringify(transData));
				} else {
					ChatUserService.send({
						chatId: user.UserID,
						chatName: user.ViewName,
						chatCompId: user.CompID,
						hasLogo: curUser.ULogoIsExist,
						chatLogo: user.ULogoIsExist,
						type: 4,
						content: ""
					}, JSON.stringify(transData));
				}
			}

			mui.hideLoading();

		}, function (res) {
			mui.hideLoading();
			var result = res.responseText;
			typeof (result) == "string" && (result = JSON.parse(result));
			mui.toast("推荐自己失败：" + result.ErrorMessage);
		})


	}
	

		$("#qrcode").qrcode({
			render: 'canvas',
			text: utf16to8("http://m.maidiyun.com?MDGP" + $scope.GroupInfo.GroupCode),
			width: 180,
			height: 180,
			src:$scope.logo
		});
		$("#qrcode").show();


	function utf16to8(str) { //转码
		var out, i, len, c;
		out = "";
		len = str.length;
		for (i = 0; i < len; i++) {
			c = str.charCodeAt(i);
			if ((c >= 0x0001) && (c <= 0x007F)) {
				out += str.charAt(i);
			} else if (c > 0x07FF) {
				out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
				out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
				out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
			} else {
				out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
				out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
			}
		}
		return out;
	}
}]);

mui.plusReady(function () {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});