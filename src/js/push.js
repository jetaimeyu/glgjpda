document.addEventListener('plusready', function() {
	var _BARCODE = plus.os.name == 'Android' ? 'XgPush' : 'MdXGPushPlugin' // 插件名称
	var B = window.plus.bridge

	var XGPushPlugin = {
		receiveMessage: {},
		openNotification: {},
		receiveNotification: {},
		receiveScan: {},
		receiveSwitch: {},
		receiveFiles: {},
		receiveVideoAndPhotoPath: {},
		//调用java方法
		callNative: function(fname, args, successCallback) {
			var callbackId = this.getCallbackId(successCallback, this.errorCallback)
			if(args != null) {
				args.unshift(callbackId)
			} else {
				var args = [callbackId]
			}
			return B.execSync(_BARCODE, fname, args)
		},
		getCallbackId: function(successCallback) {
			var success = typeof successCallback !== 'function' ? null : function(args) {
				successCallback(args)
			}
			return B.callbackId(success, this.errorCallback)
		},
		errorCallback: function(errorMsg) {
			console.log('Javascript callback error: ' + errorMsg)
		},
		fireDocumentEvent: function(ename, jsonData) {
			var event = document.createEvent('HTMLEvents')
			event.initEvent(ename, true, true)
			event.eventType = 'message'

			jsonData = JSON.stringify(jsonData)
			var data = JSON.parse(jsonData)
			event.arguments = data
			document.dispatchEvent(event)
		},
		// Common method
		getRegistrationID: function(successCallback) {
			this.callNative('getRegistrationID', null, successCallback)
		},
		setTags: function(tags) {
			this.callNative('setTags', [tags], null)
		},
		setAlias: function(alias) {
			this.callNative('setAlias', [alias], null)
		},
		setTagsWithAlias: function(tags, alias) {
			if(alias == null) {
				this.setTags(tags)
				return
			}
			if(tags == null) {
				this.setAlias(alias)
				return
			}
			var arrayTagWithAlias = [tags]
			arrayTagWithAlias.unshift(alias)
			this.callNative('setTagsWithAlias', arrayTagWithAlias, null)
		},
		stopPush: function() {
			this.callNative('stopPush', null, null)
		},
		resumePush: function() {
			this.callNative('resumePush', null, null)
		},
		isPushStopped: function(successCallback) {
			this.callNative('isPushStopped', null, successCallback)
		},
		/******************* Android methods START******************/
		//初始化
		init: function() {
			if(plus.os.name == 'Android') {
				this.callNative('init', null, null)
			}
		},
		//获取当前版本号
		getVersionName: function(successCallback) {
			this.callNative('getVersionName', null, successCallback)
		},
		//设置角标
		setCutBadger: function(num) {
			if(plus.os.name == 'Android') {
				this.callNative('setCutBadger', [num], null)
			} else {
				try {
					this.callNative('setBadgeNumber', [num], null)
				} catch(exception) {
					console.log(exception)
				}
			}
		},
		//清除角标
		removeCutBadger: function() {
			if(plus.os.name == 'Android') {
				this.callNative('removeCutBadger', null, null)
			}
		},
		//百度定位
		getBdLocation: function(successCallback) {
			if(plus.os.name == 'Android') {
				this.callNative('getBdLocation', null, successCallback)
			}
		},
		//检查更新
		checkUpdate: function(isShowTip) {
			if(plus.os.name == 'Android') {
				this.callNative('checkUpdate', [isShowTip], null)
			}
		},
		//网络请求
		getHttp: function(successCallback, url, token, key) {
			if(plus.os.name == 'Android') {
				this.callNative('getHttp', [url, token, key], successCallback)
			}
		},
		//选择文件
		onBrowse: function(mType) {
			if(plus.os.name == 'Android') {
				this.callNative('onBrowse', [mType], null)
			}
		},
		//拍照、录视频
		videoAndPhotoCapture: function(successCallback) {
			if(plus.os.name == 'Android') {
				this.callNative('videoAndPhotoCapture', null, successCallback)
			}
		},
		//图片裁剪
		cropperPhoto: function(successCallback) {
			if(plus.os.name == 'Android') {
				this.callNative('cropperPhoto', null, successCallback)
			}
		},
		//选择照片
		chooseImage: function(successCallback) {
			if(plus.os.name == 'Android') {
				this.callNative('chooseImage', null, successCallback)
			}
		},
		//查看图片
		previewImage: function(images, index) {
			if(plus.os.name == 'Android') {
				this.callNative('previewImage', [images, index], null)
			}
		},
		//播放视频
		playVideo: function(url, title) {
			this.callNative('playVideo', [url, title], null)
		},
		//抖动
		playShake:function () {
			this.callNative('playShake', null, null)
		},
		//是否有二维码
		isQRCode: function (successCallback,url) {
			this.callNative('isQRCode', [url], successCallback)
		},
		//注册信鸽推送
		registerPush: function(successCallback, userid, username) {
			data = [userid, username];
			this.callNative('registerPush', data, successCallback)
		},
		//反注册信鸽推送
		unregisterPush: function(successCallback, userid, username) {
			data = [userid, username];
			this.callNative('unregisterPush', data, successCallback)
		},
		//获取推送服务状态
		getPushStatus: function() {
			if(plus.os.name == 'Android') {
				this.callNative('getPushStatus', null, null)
			}
		},
		//调试模式
		setDebugMode: function(mode) {
			if(plus.os.name == 'Android') {
				this.callNative('setDebugMode', [mode], null)
			}
		},
		//创建本地推送
		addLocalNotification: function(builderId, content, title, notiID, broadcastTime, extras) {
			if(plus.os.name == 'Android') {
				data = [builderId, content, title, notiID, broadcastTime, extras]
				this.callNative('addLocalNotification', data, null)
			}
		},
		//移除本地推送
		removeLocalNotification: function(notificationId) {
			if(plus.os.name == 'Android') {
				this.callNative('removeLocalNotification', [notificationId], null)
			}
		},
		//清除本地通知
		clearLocalNotifications: function() {
			if(plus.os.name == 'Android') {
				this.callNative('clearLocalNotifications', null, null)
			}
		},
		//清除所有通知
		clearAllNotification: function() {
			if(plus.os.name == 'Android') {
				this.callNative('clearAllNotification', null, null)
			}
		},
		clearNotificationById: function(notificationId) {
			if(plus.os.name == 'Android') {
				this.callNative('clearNotificationById', [notificationId], null)
			}
		},
		setBasicPushNotificationBuilder: function() {
			if(plus.os.name == 'Android') {
				this.callNative('setBasicPushNotification', null, null)
			}
		},
		setCustomPushNotificationBuilder: function() {
			if(plus.os.name == 'Android') {
				this.callNative('setCustomPushNotificationBuilder', null, null)
			}
		},
		setLatestNotificationNum: function(num) {
			if(plus.os.name == 'Android') {
				this.callNative('setLatestNotificationNum', [num], null)
			}
		},
		setPushTime: function(successCallback, weekDays, startHour, endHour) {
			if(plus.os.name == 'Android') {
				this.callNative('setPushTime', [weekDays, startHour, endHour], successCallback)
			}
		},
		setSilenceTime: function(successCallback, startHour, startMinute, endHour, endMinute) {
			if(plus.os.name == 'Android') {
				this.callNative('setSilenceTime', [startHour, startMinute, endHour, endMinute], successCallback)
			}
		},
		requestPermission: function() {
			if(plus.os.name == 'Android') {
				this.callNative('requestPermission', null, null)
			}
		},
		//检查权限CAMERA、RECORD
		checkPermission: function(permission) {
			if(plus.os.name == 'Android') {
				return this.callNative('checkPermission', [permission], null)
			}
		},
		getConnectionState: function(successCallback) {
			if(plus.os.name == 'Android') {
				this.callNative('getConnectionState', null, successCallback)
			}
		},
		onGetRegistrationId: function(rId) {
			if(plus.os.name == 'Android') {
				this.fireDocumentEvent('push.onGetRegistrationId', rId)
			}
		},
		//接收到透传消息
		receiveMessageInAndroidCallback: function(data) {
			//alert("透传消息:" + data);
			if(plus.os.name == 'Android') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveMessage = jsonObj
				this.fireDocumentEvent('push.receiveMessage', this.receiveMessage)
			}
		},
		openNotificationInAndroidCallback: function(data) {
			if(plus.os.name == 'Android') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.openNotification = jsonObj
				this.fireDocumentEvent('push.openNotification', this.openNotification)
			}
		},
		//接收到扫码信息返回
		receiveScanInAndroidCallback: function(data) {
			if(plus.os.name == 'Android') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveScan = jsonObj
				this.fireDocumentEvent('push.receiveScan', this.receiveScan)
			}
		},
		//接受前后台切换消息
		receiveSwitchInAndroidCallback: function(data) {
			if(plus.os.name == 'Android') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveSwitch = jsonObj
				this.fireDocumentEvent('push.receiveSwitch', this.receiveSwitch)
			}
		},
		//接收到普通消息
		receiveNotificationInAndroidCallback: function(data) {
			//alert("通知栏消息:" + data);
			if(plus.os.name == 'Android') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveNotification = jsonObj
				this.fireDocumentEvent('push.receiveNotification', this.receiveNotification)
			}
		},
		//接收选择文件信息
		transmitSelectFilesInAndroidCallback: function(data) {
			//		            alert("选择文件信息:" + data);
			if(plus.os.name == 'Android') {
				//data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveFiles = jsonObj
				this.fireDocumentEvent('push.receiveFiles', this.receiveFiles)
			}
		},
		//接收视频、照片信息
		videoAndPhotoCaptureInAndroidCallback: function(data) {
			//alert("接收视频、照片路径:" + JSON.stringify(data));
			if(plus.os.name == 'Android') {
				//data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveVideoAndPhotoPath = jsonObj
				this.fireDocumentEvent('push.receiveVideoAndPhotoPath', this.receiveVideoAndPhotoPath)
			}
		},
		/******************* Android methods END******************/

		//接收IOS普通推送消息
		receiveNotificationIniOSCallback: function(data) {
			//alert("通知栏消息:" + data);
			if(plus.os.name == 'iOS') {
				var jsonObj = JSON.parse(data)
				this.receiveNotification = jsonObj

				this.fireDocumentEvent('push.receiveNotification', this.receiveNotification)
			}
		},
		//接收IOS透传消息
		receiveMessageIniOSCallback: function(data) {
			if(plus.os.name == 'iOS') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveMessage = jsonObj
				this.fireDocumentEvent('push.receiveMessage', this.receiveMessage)
			}
		},
		receiveNotificationLaunceAppIniOSCallback: function(data) {
			if(plus.os.name == 'iOS') {
				data = JSON.stringify(data)
				var jsonObj = JSON.parse(data)
				this.receiveMessage = jsonObj
				this.fireDocumentEvent('push.receiveNotificationLaunchApp', this.receiveMessage)
			}
		},
		//接收IOS后台（静默）推送消息
		receiveNotificationBackgroundIniOSCallback: function(data) {
			//alert("静默消息：" + data);
			if(plus.os.name == 'iOS') {
				var jsonObj = JSON.parse(data)
				this.receiveMessage = jsonObj
				this.fireDocumentEvent('push.receiveNotificationBackground', this.receiveMessage)
			}
		},
		// iOS methods
		//设置角标数字
		setBadgeNumber: function(value) {
			if(plus.os.name == 'iOS') {
				try {
					this.callNative('setBadgeNumber', [value], null)
				} catch(exception) {
					console.log(exception)
				}
			}
		},
		getDeviceToken: function() {
			if(plus.os.name == 'iOS') {
				try {
					return this.callNative('getDeviceToken', [], null)
				} catch(exception) {
					console.log(exception)
				}
			}
		},
		setApplicationIconBadgeNumber: function(badge) {
			if(plus.os.name == 'iOS') {
				this.callNative('setApplicationIconBadgeNumber', [badge], null)
			}
		},
		getApplicationIconBadgeNumber: function(callback) {
			if(plus.os.name == 'iOS') {
				this.callNative('getApplicationIconBadgeNumber', [], callback)
			}
		},
		startLogPageView: function(pageName) {
			if(plus.os.name == 'iOS') {
				this.callNative('startLogPageView', [pageName], null)
			}
		},
		stopLogPageView: function(pageName) {
			if(plus.os.name == 'iOS') {
				this.callNative('stopLogPageView', [pageName], null)
			}
		},
		beginLogPageView: function(pageName, duration) {
			if(plus.os.name == 'iOS') {
				this.callNative('beginLogPageView', [pageName, duration], null)
			}
		},
		setLogOFF: function() {
			if(plus.os.name == 'iOS') {
				this.callNative('setLogOFF', [], null)
			}
		},
		setCrashLogON: function() {
			if(plus.os.name == 'iOS') {
				this.callNative('crashLogON', [], null)
			}
		},
		setLocation: function(latitude, longitude) {
			if(plus.os.name == 'iOS') {
				this.callNative('setLocation', [latitude, longitude], null)
			}
		},
		//		setTimeout(function() {
		//			plus.Push.addLocalNotificationIniOS("2018-03-17 15:37:30", "通知于2018-03-17 15:37:30发", 1, "identifierKey", {
		//				"hello": "你好"
		//			});
		//		}, 100)
		addLocalNotificationIniOS: function(delayTime, content, badge, notificationID, extras) {
			if(plus.os.name == 'iOS') {
				var data = [delayTime, content, badge, notificationID, extras]
				this.callNative('setLocalNotification', data, null)
			}
		},
		deleteLocalNotificationWithIdentifierKeyIniOS: function(identifierKey) {
			if(plus.os.name == 'iOS') {
				var data = [identifierKey]
				this.callNative('deleteLocalNotificationWithIdentifierKey', data, null)
			}
		},
		clearAllLocalNotificationsIniOS: function() {
			if(plus.os.name == 'iOS') {
				this.callNative('clearAllLocalNotifications', [], null)
			}
		},
		//ios视频播放
		recordVideo: function(successCallback) {
			if(plus.os.name == 'iOS') {
				this.callNative('recordVideo', null, successCallback)
			}
		},
		//图片裁剪
		imageResizer: function(imagedata, successCallback) {
			if(plus.os.name == 'iOS') {
				var data = [imagedata];
				this.callNative('imageResizer', data, successCallback)
			}
		},
		//图片查看 imageList图片数据源 currentIndex 点击图片的索引
		openImageBrowser: function(imageList, currentIndex, successCallback) {
			if(plus.os.name == 'iOS') {
				var data = [imageList, currentIndex];
				this.callNative('openImageBrowser', data, successCallback)
			}
		}
	}
	//调用java方法初始化
	XGPushPlugin.init();
	window.plus.Push = XGPushPlugin;
}, true)