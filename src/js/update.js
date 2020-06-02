var inf = {};
var apkVersion = "1.0.0";
var apkVersionNumber = 100;
var zipVersion = "1.0.0";
var zipVersionNumber = 100;
var updateType = "zip";

function checkUpdate() {
	if(!mui.os.android)
		return;
	//checkServer();
};

function checkServer() {
	//获取版本信息
	var url = MdAppUrl.Api45 + "/api/v1.0/App/CheckAndroidUpdate";
	mui.get(url, null, function(data) {
		inf.ApkVersion = data.ApkVersion;
		inf.ApkVersionNumber = data.ApkVersionNumber;
		inf.ZipVersion = data.ZipVersion;
		inf.ZipVersionNumber = data.ZipVersionNumber;
		inf.Description = data.Description;

		//优先升级资源包，否则升级apk
		//zip增量更新，强制更新
		if(zipVersionNumber < inf.ZipVersionNumber) {
			// 提示用户是否升级
			inf.title = '更新提醒';
			var btnArray = ["立即更新"];
			inf.note = inf.Description;
			plus.nativeUI.confirm(inf.note, function(i) {
				if(0 == i.index) {
					//打开窗口
					floatUpdateWebview();
				} else {
					plus.runtime.quit();
				}
			}, inf.title, btnArray);
		} else if(apkVersionNumber < inf.ApkVersionNumber) {
			//apk更新
			updateType = "apk";
			var btnArray = ["立即更新", "下次再说"];

			inf.note = inf.Description;
			inf.title = '更新提醒';
			inf.ismustupload = data.IsForceUpgrade;
			if(inf.ismustupload) {
				btnArray = ["立即更新"];
			}
			// 提示用户是否升级
			plus.nativeUI.confirm(inf.note, function(i) {
				if(0 == i.index) {
					//打开窗口
					floatUpdateWebview();
					//plus.runtime.openURL("www.maidiyun.com/update/phone/mdt.apk");
					//www.maidiyun.com/update/phone/mdt.apk
					//http://222.173.15.182:8046/update/phone/mdt.apk
				} else {
					if(inf.ismustupload) {
						plus.runtime.quit();
					}
				}
			}, inf.title, btnArray); //, "跳过此版本", "取　　消"
		}
	}, 'json');
};

// 创建悬浮窗口
var floatupw = null;
//升级下载窗口
function floatUpdateWebview() {
	if(floatupw) { // 避免快速多次点击创建多个窗口
		return;
	}
	floatupw = plus.webview.create("zipupdate.html?type=" + updateType, "zipupdate.html", {
		width: '300px',
		height: '100px',
		margin: "auto",
		background: "rgba(0,0,0,0.5)",
		scrollIndicator: 'none',
		scalable: false,
		popGesture: 'none'
	});
	floatupw.addEventListener("loaded", function() {
		floatupw.show('fade-in', 300);
		floatupw = null;
	}, false);
}
mui.plusReady(checkUpdate);