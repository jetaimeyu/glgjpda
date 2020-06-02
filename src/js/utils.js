var MdConfig = {
	//PC、Phone
	AppType: "Phone",
	//0 or 1 是否启用测试模式
	TestMode: 0,
	/**
	 * 启用页签
	 */
	StartUsingTab: StartUsingTab,
	//升级标识
	Edition: "E_Normal" //正常版本E_Normal、企业定制E_Enterprise_企业简称或者ID、演示版本E_Show
};
//document.addEventListener("plusready", function() {
//	plus.webview.currentWebview().setStyle({
//		softinputMode: "adjustResize" // 弹出软键盘时自动改变webview的高度
//	});
//})
var aniShow = "pop-in",
	duration = 160; //不同的设备上，延时时间不同
//只有ios支持的功能需要在Android平台隐藏；
if (mui.os.android) {
	//Android平台暂时使用slide-in-right动画
	if (parseFloat(mui.os.version) < 4.4) {
		aniShow = "slide-in-right";
	} else {
		duration = 250;
	}
} else {
	duration = 300;
}

//点击变灰色 
mui("body").on("tap", ".data-group.click-gray li,.click-gray:not(.data-group)", function () {
	(function ($) {
		var old_back_color = $.style.backgroundColor;
		$.style.backgroundColor = "#eeeeee";

		setTimeout(function () {
			$.style.backgroundColor = old_back_color;
		}, 100);
	})(this);
});

//点击跳转新页面
mui('body').on('tap', 'a[open-type=common],li[open-type=common]', function () {
	var href = this.getAttribute('href');
	var winid = this.getAttribute("winid");
	var nl = this.getAttribute("nl");
	var createNew = this.getAttribute("createNew");
	openWindow(href, {}, winid, nl, createNew);
});

//点击跳转新页面
mui('body').on('tap', 'a[open-type=out],li[open-type=out]', function () {
	var href = this.getAttribute('href');
	var title = this.getAttribute("title");

	openUrl(href, title, "");
});

function openUrl(url, title, newsOroem) {
	var innerWs = openWindow('../../template.html', {
		title: title || "",
		url: url,
		newsOroem: newsOroem //来自新闻还是企业定制
	});
}

function openWindow(href, extras, winid, nl, createNew) {
	if (!href) {
		return;
	}
	if (nl || plus.webview.currentWebview().needlogin) {
		extras = extras || {};
		extras.needlogin = true;
	}
	return muiOpenWindow(href, extras, winid, createNew);
	//	if(nl) {
	//		//重新加载用户信息，放置被踢掉后还有数据问题
	//		user.reload();
	//		if(!user.Token) {
	//			var loginView = muiOpenWindow("../login/login.html");
	//			loginView.addEventListener("close", function() {
	//				user.ready(function() {
	//					if(user.Token) {
	//						return muiOpenWindow(href, extras, winid, createNew);
	//					}
	//				});
	//			});
	//		} else {
	//			return muiOpenWindow(href, extras, winid, createNew);
	//		}
	//	} else {
	//		return muiOpenWindow(href, extras, winid, createNew);
	//	}
};

function muiOpenWindow(href, extras, winid, createNew) {

	if (createNew == 0) {
		var _win = plus.webview.getWebviewById(winid);
		if (_win) {
			mui.openWindow(_win);
			return _win;
		}
	}

	return mui.openWindow({
		id: winid || href,
		url: href,
		styles: {
			popGesture: (extras && extras.popGesture) || 'close'
		},
		show: {
			aniShow: aniShow,
			duration: duration
		},
		waiting: {
			autoShow: false
		},
		extras: extras,
		createNew: createNew == 1, //是否重复创建同样id的webview，默认为false:不重复创建，直接显示
	});
};
//切换switch控件
mui('body').on('tap', '.md-switch', function () {
	if (this.classList.contains('md-active')) {
		this.classList.remove('md-active');
	} else {
		this.classList.add('md-active');
	}
});
//切换多项选择的switch控件
//mui("body").on("tap", ".md-switch-button", function() {
//	if(this.classList.contains("md-active")) {
//		return;
//	}
//	var old = this.parentElement.querySelector(".md-switch-button.md-active");
//	old.classList.remove("md-active");
//	this.classList.add("md-active");
//});
//自定义div文字编辑器，控制placeholder
//mui("body").on("tap", "div.edit span.placeholder", function() {
//	this.parentElement.querySelector("div").focus();
//});
////自定义div文字编辑器，控制placeholder
//mui("body").on("input", "div.edit>div", function() {
//	var text = this.innerText.replace(/(^\s*)|(\s*$)/g, "");
//
//	if(text == "") {
//		this.parentElement.querySelector("span.placeholder").style.display = "";
//	} else {
//		this.parentElement.querySelector("span.placeholder").style.display = "none";
//	}
//});
//验证输入的字符长度
var checkLengthUtil = {
	/**
	 * 验证
	 */
	check: function () {
		//所有需要验证长度的dom
		var alllims = document.querySelectorAll("input[lenlimit],div[lenlimit]");
		//循环遍历
		for (j = 0, len = alllims.length; j < len; j++) {
			//允许最大长度
			var maxLen = alllims[j].getAttribute("lenlimit");
			//实际输入长度
			var actualLen = alllims[j].nodeName == 'INPUT' ? alllims[j].value.length : alllims[j].innerText.length;
			//超出长度限制
			if (maxLen < actualLen) {
				var labName = "";

				if (alllims[j].parentNode.parentNode.nodeName == "MD-DROP-DOWN-LIST") {
					labName = alllims[j].parentNode.parentNode.parentNode.parentNode.querySelector('label').innerText;
				} else {
					labName = alllims[j].nodeName == 'INPUT' ? alllims[j].parentNode.previousElementSibling.innerText : alllims[j].parentNode.parentNode.parentNode.querySelector('label').innerText;
				}

				mui.toast(labName + "最大长度" + maxLen + "个字");
				return false;
			}
		}
		return true;
	}
};
/**
 * 启用tab页签
 */
function StartUsingTab() {
	//切换tab页签
	mui('.md-tab').on('tap', '.md-tab-item', function () {
		if (this.classList.contains("md-active")) {
			return;
		}
		//隐藏当前显示的
		var tab = this.parentElement.querySelector(".md-active");

		if (tab) {
			var href = tab.getAttribute("href");

			if (href.substr(0, 1) == "#") {
				document.body.querySelector(href).style.display = "none";
			} else {
				plus.webview.hide(tab.getAttribute("winid") || href)
			}
			tab.classList.remove("md-active");
		}
		//激活点击的
		activeSubPage(this);
	});
	//显示指定页签
	function activeSubPage($) {
		$.classList.add("md-active");
		var href = $.getAttribute("href");

		if (href.substr(0, 1) == "#") {
			document.body.querySelector(href).style.display = "";
		} else {
			createSubPage(
				href,
				$.getAttribute("winid"),
				$.parentElement.getAttribute("top"),
				$.parentElement.getAttribute("bottom"));
		}
	}

	//创建或显示标签页的内容
	function createSubPage(href, winid, top, bottom, createNew) {
		var win = plus.webview.currentWebview().children().filter(function (win) {
			return win.id == winid;
		})[0];
		if (!win) {
			var styles = {
				popGesture: "none",
				top: (top || 0) + "px",
				bottom: (bottom || 0) + "px"
			};
			if (mui.os.android && ["5.0", "5.1"].indexOf(mui.os.version) >= 0) {
				styles.hardwareAccelerated = false;
			}
			win = plus.webview.create(href, winid || href, styles);
			plus.webview.currentWebview().append(win);
		}
		win.show();
	}

	//默认激活当前的tab页签
	var activeTab = document.body.querySelector(".md-tab-item.md-active");
	if (activeTab) {
		var tabListHref = document.body.querySelectorAll(".md-tab-item:not(.md-active)[href^='#']");
		var i = tabListHref.length;
		while (i--) {
			document.body.querySelector(tabListHref[i].getAttribute("href")).style.display = "none";
		}

		//		var tabListItem = document.body.querySelectorAll(".md-tab-item:not(.md-active)");
		//		var i = tabListItem.length;
		//		while(i--) {
		//			//创建未激活的页面
		//			if(tabListItem[i].getAttribute("winid")) {
		//				var win = plus.webview.getWebviewById(tabListItem[i].getAttribute("winid"));
		//				if(win) {
		//					win.close();
		//					win = null;
		//				}
		//			}
		//		}
		//启动当前激活的页面
		activeSubPage(activeTab);
	}
}

//各种接口连接地址
var MdAppUrl;

if (MdConfig.TestMode == 1) {
	var _mainServer = "http://222.175.121.187";
	MdAppUrl = {
		//测试服务器的接口地址 244
		Api: _mainServer + ":245/31",
		Api3: _mainServer + ":245/30",
		Api4: _mainServer + ":245/40",
		Api42: _mainServer + ":245/42",
		Api43: _mainServer + ":245/43",
		Api45: _mainServer + ":245/45",
		Api46: _mainServer + ":245/46",
		Api50: _mainServer + ":245/8150",
		downloadApp: "http://192.168.1.51:8134",
		Img: _mainServer + ":8010",
		pic: _mainServer + ":8011",
		News: "http://192.168.1.51:8083",
		video: "http://192.168.1.51:8031/mdweb",
		Tools: _mainServer + ":8092",
		InnerCodeUrl: "http://192.168.1.51:9977",
		Pay: "http://192.168.1.51:9991",
		Mobile: "http://192.168.1.51:8012",
		NewsCollect: "http://192.168.1.51:8099",
		Info: "http://192.168.1.51:8091",
		Down: _mainServer + ":8081", //"http://doc.maidiyun.com",//
		BindCode: "http://192.168.1.51:8045",
		ECode: "http://219.232.123.227:8081/E="
	};
} else {
	//正式服务器的接口地址
	MdAppUrl = {
		Api: "http://api.maidiyun.com",
		Api3: "http://api3.maidiyun.com",
		Api4: "http://api4.maidiyun.com",
		Api42: "http://api42.maidiyun.com",
		Api43: "http://api43.maidiyun.com",
		Api45: "http://api45.maidiyun.com",
		Api46: "http://api46.maidiyun.com",
		Api50: "http://api50.maidiyun.com",
		downloadApp: "http://download.maidiyun.com",
		Img: "http://image.maidiyun.com",
		pic: "http://pic.maidiyun.com",
		News: "http://apij.maidiyun.com",
		video: "http://video.maidiyun.com",
		Tools: "http://tools.maidiyun.com",
		InnerCodeUrl: "http://apij.maidiyun.com",
		Pay: "http://pay.maidiyun.com",
		Mobile: "http://m.maidiyun.com",
		NewsCollect: "http://news.maidiyun.com",
		Info: "http://info.maidiyun.com",
		Down: "http://down.maidiyun.com",
		BindCode: "http://item.maidiyun.com/45",
		ECode: "http://www.iotroot.com/E="
	};
}

var MdFileId = MdConfig.TestMode == 1 ? "109" : "109";

MdAppUrl.NewsImg = MdAppUrl.Api43;

//获取URL参数
function query(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = decodeURI(window.location.search).substr(1).match(reg);
	if (r != null) return unescape(r[2]);
};
/*
 * 想本地数据库中指定关键字中存入指定值，可以存入json结构，比如value = {"id":1, "name": "张三"}
 */
function localSave(key, value) {
	if (window.localStorage) {
		var data = localStorage.getItem(key);
		if (data)
			localClear(key);

		localStorage.setItem(key, JSON.stringify(value));
	}
};
/*
 * 返回指定关键字的值，以数组的形式返回，例如[{"id":1, "name": "张三"}, {"id":2, "name": "李四"}]
 * count：返回的最大数量，如果没有传入count或传入为0，则表示返回所有数量
 */
function localGet(key) {
	if (window.localStorage) {
		return JSON.parse(localStorage.getItem(key));
	}
};
/*
 * 清理指定关键字的全部值
 */
function localClear(key) {
	if (window.localStorage) {
		window.localStorage.removeItem(key);
	}
};
/*
 * 利用Get的方式获取数据
 */
function getAjaxData(url, callback, needToken, isAsync, contentType) {
	ajaxData(url, false, callback, "get", needToken, isAsync, contentType);
};
/*
 * 向服务器Post数据，并获取返回数据
 */
function postAjaxData(url, data, callback, needToken, isAsync, contentType) {
	ajaxData(url, data, callback, "post", needToken, isAsync, contentType);
};

function ajaxData(url, data, callback, ajaxType, needToken, isAsync, contentType) {
	if (typeof (data) == 'object') {
		data = JSON.stringify(data);
	}
	//验证是否需要加token
	var header = {
		'Content-Type': contentType || 'application/json'
	};
	if (needToken) {
		header.Authorization = "Bearer  " + user.Token;
	}
	if (!isAsync && isAsync != false) {
		isAsync = true;
	}
	if (isNetWorkCanUse()) {
		mui.ajax({
			headers: header,
			type: ajaxType,
			url: url,
			async: isAsync,
			data: data,
			dataType: "json",
			timeout: 10000,
			success: function (data) {
				callback(data);
			},
			error: function (xhr, type, errorThrown) {
				var msg;
				switch (type) {
					case "timeout":
						msg = "连接超时，请检查你的网络设置";
						break;
					case "error":
						msg = "请求失败，请稍后再试";
						break;
					case "abort":
						msg = "请求失败，请检查你的网络设置"; //"请求被终止,请求已被取消";
						break;
					case "parsererror":
						msg = "无法解析此请求";
						break;
				}
				callback({
					State: -99,
					ErrorMessage: msg
				});
			}
		});
	} else {
		callback({
			State: -99,
			ErrorMessage: '网络连接失败，请检查网络后再试'
		});
	}
};

//错误信息
var ErrorMessage = {
	Data: '数据加载异常',
	Operation: '操作失败'
};

//当前登录用的信息
var user = {
	CompID: 0,
	CompMdt: "",
	CompName: "",
	Duty: "",
	Email: "",
	IsDeptLeader: 0,
	Mdt: "",
	OrgID: 0,
	OrgName: "",
	Phone: "",
	RealName: "",
	Tel: "",
	UserID: 0,
	UserName: "",
	Sex: "1",
	UserType: 0, //1个人，2企业
	UUID: "",
	Token: "",
	UserAuth: "",
	InnerCodeName: "",
	logout: function () {
		localClear("user");
	},
	ready: function (callback) {
		user.reload();
		//setLiveness();
		if (callback) {
			return callback();
		}
	},
	//判断是否有某一个权限点
	hasAuth: function (auth) {
		return ("," + user.UserAuth + ",").indexOf("," + auth + ",") > -1;
	}
};
//调用记录活跃度接口
function setLiveness() {
	var date = new Date();
	var curdate = date.Format('yyyy-MM-dd');
	var url = MdAppUrl.Api45 + "/api/v1.0/User/AutoLogin?LoginType=" + (mui.os.android ? 2 : 3);
	if (localGet("Liveness") != curdate) {
		getAjaxData(url, function (reData) {
			if (reData && reData.State == 1) {
				localSave("Liveness", curdate);
			}
		}, true);
	}
};
//获取登录用户TOKEN
function getToken() {
	return user.Token;
};
user.reload = function () {

	var mu = localGet("user");
	mu = mu.data;
	if (mu) {
		user.CompID = mu.CompID;
		user.CompMdt = mu.CompMdt;
		user.CompName = mu.CompName;
		user.Duty = mu.Duty;
		user.Email = mu.EMail;
		user.IsDeptLeader = mu.IsDeptLeader;
		user.Mdt = mu.Mdt;
		user.OrgID = mu.OrgID;
		user.OrgName = mu.OrgName;
		user.Phone = mu.Phone;
		user.RealName = mu.RealName || mu.Mdt;
		user.Tel = mu.Tel;
		user.UserID = mu.UserID;
		user.UserName = mu.UserName;
		user.Sex = mu.Sex;
		user.UserType = mu.UserType;
		user.UserAuth = mu.UserAuth;
		user.InnerCodeName = mu.InnerCodeName ? mu.InnerCodeName : "出厂编号"; //(mu.CompID == 266?"任务单号":"出厂编号");//如果是景津，则显示任务单号
		user.UUID = mu.UUID;
		user.Token = mu.Token;
	} else {
		user.CompID = "";
		user.CompMdt = "";
		user.CompName = "";
		user.Duty = "";
		user.Email = "";
		user.IsDeptLeader = "";
		user.Mdt = "";
		user.OrgID = "";
		user.OrgName = "";
		user.Phone = "";
		user.RealName = "";
		user.Tel = "";
		user.UserID = "";
		user.UserName = "";
		user.Sex = "";
		user.UserType = "";
		user.UserAuth = "";
		user.InnerCodeName = "";
		user.UUID = "";
		user.Token = "";
	}
};

//日期转换
function GetDate(val, showTime, isSimplify, format, isList) {
	(!format && showTime) && (format = "yyyy-MM-dd HH:mm");
	(!format && !showTime) && (format = "yyyy-MM-dd");

	if (typeof val == "number") {
		val = new Date(val);
	} else if (typeof val == "string") {
		val = new Date(val.replace(/-/g, "/"));
	}
	if (isSimplify) {
		var date = val.Format(format);
		var today = new Date();
		var time = showTime ? (" " + val.Format("HH:mm")) : "";

		if (date == today.Format(format)) {
			return isList ? time : "今天" + time;
		} else {
			today.setDate(today.getDate() - 1);

			if (date == today.Format(format)) {
				return isList ? "昨天" : "昨天" + time;
			} else {
				today.setDate(today.getDate() - 1);
				if (date == today.Format(format)) {
					return isList ? "前天" : "前天" + time;
				} else {
					return date + time;
				}
			}
		}
	} else {
		return val.Format(format);
	}
	//
	//	var dt = (val - 621355968000000000 - 8 * 3600 * 10000000) / 10000;
	//
	//	var dayFormat = new Date(dt).Format("yyyy-MM-dd");
	//	var timeFormat = new Date(dt).Format("HH:mm");
	//	var nowDate = new Date().getFullYear() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getDate();
	//	var yesterday = new Date().getFullYear() + "-" + new Date().getMonth() + "-" + new Date().getDate();
	//
	//	if(isSimplify) {
	//		if(dayFormat == nowDate) {
	//			if(!showTime) {
	//				return "今天";
	//			} else {
	//				return timeFormat;
	//			}
	//		} else if(dayFormat == yesterday) {
	//			if(!showTime) {
	//				return "昨天";
	//			} else {
	//				return "昨天 " + timeFormat;
	//			}
	//		}
	//	} else {
	//		if(showTime) {
	//			return dayFormat + " " + timeFormat;
	//		} else {
	//			return dayFormat;
	//		}
	//	}
};

//数组去重
function unique(arr) {
	var result = [],
		hash = {};
	for (var i = 0, elem;
		(elem = arr[i]) != null; i++) {
		if (!hash[elem]) {
			result.push(elem);
			hash[elem] = true;
		}
	}
	return result;
};
/*************对象数组去重********************/
//将对象元素转换成字符串以作比较
function obj2key(obj, keys) {
	var n = keys.length,
		key = [];
	while (n--) {
		key.push(obj[keys[n]]);
	}
	return key.join('|');
}
//去重操作
function uniqeByKeys(array, keys) {
	var arr = [];
	var hash = {};
	for (var i = 0, j = array.length; i < j; i++) {
		var k = obj2key(array[i], keys);
		if (!(k in hash)) {
			hash[k] = true;
			arr.push(array[i]);
		}
	}
	return arr;
}
//替换所有
function ReplaceAll(str, sptr, sptr1) {
	while (str.indexOf(sptr) >= 0) {
		str = str.replace(sptr, sptr1);
	}
	return str;
}

//获取当前时间
function getCurrentTime() {
	var date = new Date();
	return date.Format('yyyy-MM-dd HH:mm:ss');
};

//转换时间戳
function formatDateTime(inputTime) {
	var time = new Date(parseInt(inputTime));

	return time.getFullYear() + "-" + (time.getMonth() + 1) + "-" + time.getDate() + " " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();

};
//生成UUID
function UUID() {
	var d = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (d + Math.random() * 16) % 16 | 0;
		d = Math.floor(d / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
	});
	return uuid;
};

Date.prototype.Format = function (fmt) {
	var o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
		"H+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if (/(y+)/.test(fmt))
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt))
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
};

Date.prototype.addYears = function (value) {
	this.setFullYear(this.getFullYear() + value);
	return this;
};

Date.prototype.addMonths = function (value) {
	this.setMonth(this.getMonth() + value);
	return this;
};

Date.prototype.addDays = function (value) {
	this.setDate(this.getDate() + value);
	return this;
};
Date.prototype.addMinutes = function (value) {
	this.setMinutes(this.getMinutes() + value);
	return this;
};

//删除左右两端的空格
function trim(str) {
	return str.replace(/(^\s*)|(\s*$)/g, "");
}

/**
 * @description 判断网络状态
 */
function getNetWorkState() {
	var NetStateStr = '未知';
	var types = {};
	types[plus.networkinfo.CONNECTION_UNKNOW] = "未知";
	types[plus.networkinfo.CONNECTION_NONE] = "未连接网络";
	types[plus.networkinfo.CONNECTION_ETHERNET] = "有线网络";
	types[plus.networkinfo.CONNECTION_WIFI] = "WiFi网络";
	types[plus.networkinfo.CONNECTION_CELL2G] = "2G蜂窝网络";
	types[plus.networkinfo.CONNECTION_CELL3G] = "3G蜂窝网络";
	types[plus.networkinfo.CONNECTION_CELL4G] = "4G蜂窝网络";
	NetStateStr = types[plus.networkinfo.getCurrentType()];
	return NetStateStr;
};
/**
 * @description 判断是否有网络
 */
function isNetWorkCanUse() {
	if (getNetWorkState() == '未知' || getNetWorkState() == '未连接网络') {
		return false
	}
	return true;
};
/**
 * 输入特殊符号时验证
 * @param {Object} textbox
 */
function validateValue(textbox) {
	//"[`~!#$^&*()=|{}':;',\\[\\].<>/?~！#￥……&*（）——|{}【】‘；：”“'。，、？]‘’";
	var IllegalString = "\\[//]\\[\\]$%\^|*\'\"\+";
	var textboxvalue = textbox.value;
	var index = textboxvalue.length - 1;
	var s = textbox.value.charAt(index);
	if (IllegalString.indexOf(s) >= 0) {
		mui.alert("不允许输入特殊符号：" + s, "提示", "我知道了");
		s = textboxvalue.substring(0, index);
		textbox.value = s;
	}
};
/**
 * 获取不同消息的显示内容
 * @param {Object} msgtype
 * @param {Object} msgtext
 */
function formatMsgText(msgtype, msgtext, issend) {
	var text;
	if (typeof (msgtype) != "number") {
		msgtype = parseInt(msgtype);
	}
	switch (msgtype) {
		case 1:
		case 3:
			msgtext = transRecImg(msgtext, 1);
			text = msgtext;
			break;
		case 2:
			text = "[工单]"; +
			JSON.parse(msgtext).Text; //{Text: , Voice: , VoiceLength: , WorkID: , JobType: }
			text += JSON.parse(msgtext).AudioLength > 0 ? "[语音]" : "";
			text += JSON.parse(msgtext).Text ? JSON.parse(msgtext).Text : "";

			if ((issend == true || issend == 1) && JSON.parse(msgtext).OrderType == '1' && JSON.parse(msgtext).IsForward == 0) {
				text = text.replace(user.RealName, "我").replace("客户", '');
			}
			break;
		case 4:
			text = "[产品]" + JSON.parse(msgtext).Name; //{Name: , ProdID: }
			break;
		case 5:
			var content = JSON.parse(msgtext);

			switch (content.Type) {
				case "1":
					text = "[抖动]"
					break;
				case "16":
					text = "[中标通知]" + (content.IsCancle == 0 ? "已中标" : "取消中标") + "：" + content.DemandComp + "的'" + content.DemandName + "'";
					break;
				case "17":
					text = "[报价通知]" + (content.IsCancle == 0 ? "报价" : "取消报价") + ":" + content.QuoteComp + "'" + content.DemandName + "'";
					break;
					//投诉建议
					//				case "19":
					//					if(issend == true || issend == 1) {
					//						text = "[发出一条投诉建议]";
					//					} else {
					//						text = "[您有一条新的投诉建议通知，请在企业云平台查看]";
					//					}
					//					break;
				default:
					//					if(issend == true || issend == 1) {
					//						text = "[发出一条新通知]";
					//					} else {
					//						text = "[您有一条新通知,请在通知消息中查看]";
					//					}
					break;
			}
			break;
		case 6:
			if (issend == true || issend == 1) {
				text = "[发出一个新任务]";
			} else {
				text = "[您有一条新任务,请在待办任务中查看]";
			}
			break;
			//山推领料单
			//		case 7:
			//			if(issend == true || issend == 1) {
			//				text = "[发出一个新领料单]";
			//			} else {
			//				text = "[您有一条新的领料单通知，请在电脑端查看]";
			//			}
			//			break;
		case 20: //格式化里面的图片标识为 [图片]
			break;
		case 30:
			text = "[图片]";
			break;
		case 31:
			text = "[语音]"; //{Voice: VoiceLength: }
			break;
		case 32:
			text = "[文件]";
			break;
		case 33:
			text = "[视频]";
			break;
		default:
			break;
	}
	return text || "";
}

//转换图片
function transRecImg(text, type) {
	var matchs = text.match(/[\[][A-Za-z0-9]{32}[\]]/g);

	if (!matchs || matchs.length == 0) {
		return text;
	} else if (matchs.length == 1) {
		var fileName = matchs[0].substring(1, matchs[0].length - 1);

		var url = MdAppUrl.Api43 + "/api/MsgFile/GetMsgFile?fname=" + fileName;
		if (type == 0) {
			return "[图片]";
		} else {
			var reg = new RegExp('\\[' + fileName + '\\]', "g");
			text = text.replace(reg, "[图片]");

			return text;
		}

	} else {
		for (var i = 0; i < matchs.length; i++) {
			var fileName = matchs[i].substring(1, matchs[i].length - 1);
			var img = MdAppUrl.Api43 + "/api/MsgFile/GetMsgFile?fname=" + fileName;

			var reg = new RegExp('\\[' + fileName + '\\]', "g");
			text = text.replace(reg, "[图片]");
		}
		return text;
	}
}

function getRandom(min, max) {
	var range = max - (min || 0);
	return (min + Math.round(Math.random() * range));
}

/**
 * 打开等待框
 */
var iswaiting = false;

function showWaiting() {
	if (iswaiting) {
		return;
	}
	iswaiting = true;
	plus.nativeUI.showWaiting('', {
		style: 'black',
		modal: false,
		background: 'rgba(0,0,0,0)'
	});
	//	//超过2s还没有执行完,则自动关闭等待,防止无休止等待
	//	setTimeout(function() {
	//		plus.nativeUI.closeWaiting();
	//	}, 5000);
}
/**
 * 关闭等待
 */
function hideWaiting() {
	iswaiting = true;
	if (!iswaiting) {
		return;
	}
	iswaiting = false;
	plus.nativeUI.closeWaiting();
}
//自定义返回
var mui_back = mui.back;
mui.back = function () {
	iswaiting = true;
	if (iswaiting) {
		hideWaiting();
	}
	mui_back();
};

/**
 * 判断对象是否在数组内
 * @param {Object} arr
 * @param {Object} obj
 */
function arrayContain(arr, obj) {
	var i = arr.length;

	while (i--) {
		if (arr[i] == obj) {
			return true;
		}
	}
	return false
}

/**
 * 组合省市地址
 * @param {Object} province
 * @param {Object} city
 * @param {Object} district
 * @param {Object} address
 */
function contractAddress(province, city, district, address, street) {
	province = province || "";
	city = city || "";
	district = district || "";
	address = address || "";
	street = street || "";

	if (province == city) {
		return province + " " + district + " " + address + " " + street;
	} else {
		return province + " " + city + " " + district + " " + address + " " + street;
	}
}

//获取距离
function getDistance(distance) {
	if (distance < 1000)
		return distance + "m";
	else if (distance > 1000)
		return (Math.round(distance / 100) / 10).toFixed(2) + "km";
}

/**
 * 创建网络文件下载任务
 * @param {Object} url
 * @param {Object} localFile
 * @param {Object} callback
 */
function downloadFile(url, localFile, callback) {
	var dtask = plus.downloader.createDownload(url, {
		filename: localFile
	}, function (d, status) {
		if (typeof callback != "function") {
			return;
		}
		callback(localFile, status);
	});
	dtask.start();
}

/**
 * 上传文件到网络
 * @param {Object} url
 * @param {Object} localFile
 * @param {Object} localFileIndex
 * @param {Object} callback
 */
function uploadFile(url, localFile, localFileIndex, callback) {
	var task = plus.uploader.createUpload(url, {
		method: "post"
	}, function (t, status) {
		if (status == 200 && JSON.parse(t.responseText).State == 1) {
			callback(localFileIndex, t, true);
		} else {
			callback(localFileIndex, t, false);
		}
	});
	task.addFile(localFile, {
		key: "F" + fileIndex
	});
	task.start();
	fileIndex += 1;
}
var fileIndex = 1;

/**
 * 压缩图片
 * @param {Object} srcFile
 * @param {Object} callback
 * @param {Object} width 默认20
 * @param {Object} dstFile 默认原文件后面加.temp
 * @param {Object} quality 默认60
 */
function zipImage(srcFile, callback, width, dstFile, quality) {
	dstFile = dstFile || (srcFile + '.temp');
	plus.zip.compressImage({
		src: srcFile,
		dst: dstFile,
		overwrite: true,
		width: width || "20%",
		quality: quality || 60
	}, function (e) {
		if (typeof callback == "function") {
			callback(srcFile, dstFile, true);
		}
	}, function (e) {
		callback(srcFile, dstFile, false);
	});
}

//照相机
var camera;
/**
 * 拍摄照片
 * @param {Object} callback
 */
function captureImage(callback) {
	if (!camera) {
		camera = plus.camera.getCamera();
	}
	camera.captureImage(function (e) {
		if (typeof callback == "function") {
			callback("file://" + plus.io.convertLocalFileSystemURL(e));
		}
	}, function (e) {
		if (typeof callback == "function") {
			callback(false);
		}
	});
}

/**
 * 从相册选择照片
 * @param {Object} callback
 */
function pickImage(callback, multiple) {
	if (multiple == undefined) {
		multiple = true;
	}
	plus.gallery.pick(function (e) {
		if (typeof callback == "function") {
			var ret = multiple ? e.files : e;
			callback(ret);
		}
	}, function (e) {
		if (typeof callback == "function") {
			callback(false);
		}
	}, {
		filter: "image",
		multiple: multiple,
		system: false
	});
}

var baiduMapConfig = {
	ak: "W6WIQmkWMM7fHZ1bQzONDGwimUikfaPU",
	mcode: "F8:6F:AF:50:86:C8:C6:A0:69:D0:9E:D4:A5:4C:F4:F7:2E:D2:C2:42;com.maidiyun.mdt",
}

function getFileSize(fileByte) {
	var fileSizeByte = fileByte;
	var fileSizeMsg = "";
	if (fileSizeByte < 1048576) fileSizeMsg = (fileSizeByte / 1024).toFixed(2) + "KB";
	else if (fileSizeByte == 1048576) fileSizeMsg = "1MB";
	else if (fileSizeByte > 1048576 && fileSizeByte < 1073741824) fileSizeMsg = (fileSizeByte / (1024 * 1024)).toFixed(2) + "MB";
	else if (fileSizeByte > 1048576 && fileSizeByte == 1073741824) fileSizeMsg = "1GB";
	else if (fileSizeByte > 1073741824 && fileSizeByte < 1099511627776) fileSizeMsg = (fileSizeByte / (1024 * 1024 * 1024)).toFixed(2) + "GB";
	else fileSizeMsg = "文件超过1TB";
	return fileSizeMsg;
}
var offcieView = [".doc", ".docx", ".xlsx", ".xls", ".ppt", ".pptx", ".pdf"];
var videoView = [".mp4", ".3gp", ".mpg", ".mpeg", ".avi", ".rm", ".rmvb", ".mov", ".wmv", ".mkv", ".flv"];
var imgView = [".jpg", ".gif", ".png"];
/**
 * 获取定位
 * @param {Object} callback [location]
 * @param {Object} fromGps
 */
function getGeocode(callback, fromGps, isOld) {
	if (typeof callback != "function") {
		return;
	}
	//获取本地存储的位置,并且没有超过15分钟,则直接返回
	if (!fromGps) {
		var location = localGet("MyPosition-" + (isOld || ""));
		if (location && (((new Date()).getTime() - location.geoTime) <= 900000)) {
			callback(location);
			return;
		}
	}
	//如果本地定位不可取,则通过定位模块重新定位
	plus.geolocation.getCurrentPosition(function (p) {
		if (p && p.coordsType) {
			localSave("locationType", p.coordsType);
		}
		if (JSON.stringify(p.address) != "{}") {
			location = location || {};
			location.geoTime = (new Date()).getTime();
			location.latitude = p.coords.latitude;
			location.longitude = p.coords.longitude;
			location.altitude = p.coords.altitude;
			if (p.addresses) {
				location.addresses = p.addresses || "";
				location.country = p.address ? p.address.country : "";
				location.province = (p.address.province || "");
				location.city = (p.address.city || "");
				location.district = p.address.district || "";
				location.street = p.address.street || "";
				location.poiName = p.address.poiName || "";

				if (isOld) {
					if (p.address.province == "内蒙古自治区") {
						location.province = "内蒙古";
					} else if (p.address.province == "新疆维吾尔自治区") {
						location.province = "新疆";
					} else if (p.address.province == "广西壮族自治区") {
						location.province = "广西";
					} else if (p.address.province == "西藏自治区") {
						location.province = "西藏";
					} else if (p.address.province == "宁夏回族自治区") {
						location.province = "宁夏";
					} else {
						location.province = (p.address.province || "").replace("省", "");
					}
					location.city = (p.address.city || "").replace("市", "");
				}
			}
		}

		localSave("MyPosition-" + (isOld || ""), location);
		callback(location);
	}, function (e) {
		callback(location);
	});
}

//geo的经纬度转换为百度经纬度
function geoLngLatToBaidu(lng, lat, callback) {
	if (typeof callback != "function") {
		return;
	}
	var from = localGet("locationType") == "gcj02" ? 3 : 1;
	var url = "http://api.map.baidu.com/geoconv/v1/?coords=" + lng + ',' + lat + "&output=json&from=" + from + "&to=5&ak=" + baiduMapConfig.ak;
	getAjaxData(url, function (res) {
		if (res && res.status == 0) {
			lng = res.result[0].x;
			lat = res.result[0].y;
		}
		callback(lng, lat);
	});
}

//页面的信息是否已经编辑过
function isEdit() {
	var i;
	//文本框是否有填写
	var inputList = document.body.querySelectorAll("input");
	i = inputList.length;

	while (i--) {
		if (inputList[i].value != "") {
			return true;
		}
	}
	//div编辑框是否填写
	var divList = document.body.querySelectorAll("div[contenteditable]");
	i = divList.length;

	while (i--) {
		if (divList[i].innerText.length > 1) {
			return true;
		}
	}
	//配件是否编辑
	if (document.querySelector(".partDomUl") && document.querySelector(".partDomUl").children.length > 1) {
		return true;
	}
	return false;
}

/**
 *
 * @param {Object} m
 */
function formatM2KM(m) {
	if (m < 1000) {
		return m + "m";
	}
	return (m / 1000) + "km";
}

/**
 * 找到第一个符合要求的父级
 * @param {Object} cur
 * @param {Object} match
 */
function closest(cur, match) {
	var par = cur.parentElement;

	if (par) {
		if (par.nodeName == match) {
			return par;
		}
		return closest(par, match);
	}
}
/**
 * 缩略版选择器
 * @param {Object} selector
 */
function m(selector) {
	return document.body.querySelector(selector);
}

function loadScript(url) {
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = url;
	document.body.appendChild(script);
}
/**
 * 为指定用户推送消息
 * @param {Object} msgtype
 * @param {Object} msgtext
 * @param {Object} userList
 */
function pushMessage(msgtype, msgtext, userList, callback) {
	if (typeof msgtext == "object") {
		msgtext = JSON.stringify(msgtext);
	}
	for (var i = 0; i < userList.length; i++) {
		var msg = {
			msgtype: msgtype,
			msgtext: msgtext
		};
		msg.receiver = userList[i].userId || userList[i].UserID;
		msg.receiverName = userList[i].userName || userList[i].UserName;

		pushMessageSingle(msg, callback);
	}
}

function pushMessageSingle(msg, callback) {
	RpcClient.invoke("tab-im.html", "RPC_SaveMsg", msg, function (obj) {
		msg.msgid = obj.msgid;
		if (typeof callback == "function") {
			callback(msg);
		}
		RpcClient.invoke("tab-im.html", "RPC_SendMsg", msg);
	});
}

//以下供产品详情和企业详情页使用
//获取图片服务器Base64
var imgPath = {
	cmpLogo: "Y29tcC9sb2dv", //企业Logo
	pkgLogo: "cGtnL2xvZ28=", //产品缩略图
	pkgImgs: "cGtnL2ltYWdlcw==", //产品宣传图
	pkgYb: "cGtnL3li", //产品二维样本
	userLogo: "dXNlci9sb2dv", //用户头像
};

/**
 * 通知人、通知人姓名、通知人企业编号、通知人企业名称、通知编号、附加文本、为什么事、什么人通知（JSON：TaskID、MyTaskID、WorkOrderID）
 */
var IM_Notice = [];
IM_Notice["N501"] = "[完成现场维修]";
IM_Notice["N502"] = "[完成现场调试]";
IM_Notice["N503"] = "[已致电客户,协助其维修]";
IM_Notice["N504"] = "[已对我们的服务完成回访]";
IM_Notice["N505"] = "[已对我们的服务做出评价]";

function getNotice(id) {
	return IM_Notice["N" + id];
}

/**
 * 将地点转换为百度坐标
 */
var transCount = 0

function transAddrToPoint(province, city, district, address, callback) {
	var url = "http://api.map.baidu.com/geocoder/v2/?address=" + province + city + district + address + "&output=json&ak=" + baiduMapConfig.ak;
	getAjaxData(url, function (res) {
		if (res && res.status == 0) {
			transCount = 0;
			callback(res.result.location.lng, res.result.location.lat);
		} else {

			if (transCount < 5) {
				transAddrToPoint(province, city, district, address, callback);
			} else {
				callback("");
			}
			transCount += 1;
		}
	});

};

/**
 * 获取比较的原始数据
 * @param {Object} jsondata 数据json类型
 * @param {Object} propertyarray 要比较的字段
 */
function setOriginalData(jsondata, propertyarray) {
	if (jsondata.hasOwnProperty("$model")) {
		jsondata = jsondata.$model;
	}
	var proobj = {};
	if (!propertyarray || !propertyarray.length) {
		propertyarray = Object.getOwnPropertyNames(jsondata)
	}
	propertyarray.forEach(function (_key) {
		proobj[_key] = jsondata[_key];
	});
	return proobj;
}
/**
 * 比较数据是否发生变化true 变化,false没变
 * @param {Object} originaldata 原始数据
 * @param {Object} currentdata 当前数据
 */
function jsonCompare(originaldata, currentdata) {
	if (currentdata.hasOwnProperty("$model")) {
		currentdata = currentdata.$model;
	}

	return Object.getOwnPropertyNames(originaldata).some(function (key) {
		//是否包含该属性
		if (!currentdata.hasOwnProperty(key)) {
			return true;
		} else if (originaldata[key] != currentdata[key]) {
			return true;
		}
	});
};
//深度比较两个对象
function deepCompare(x, y) {
	//console.log("x:" + JSON.stringify(x));
	//console.log("y:" + JSON.stringify(y));
	var i, l, leftChain, rightChain;

	function compare2Objects(x, y) {
		var p;

		// remember that NaN === NaN returns false
		// and isNaN(undefined) returns true
		if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
			return true;
		}

		// Compare primitives and functions.     
		// Check if both arguments link to the same object.
		// Especially useful on the step where we compare prototypes
		if (x === y) {
			return true;
		}

		// Works in case when functions are created in constructor.
		// Comparing dates is a common scenario. Another built-ins?
		// We can even handle functions passed across iframes
		if ((typeof x === 'function' && typeof y === 'function') ||
			(x instanceof Date && y instanceof Date) ||
			(x instanceof RegExp && y instanceof RegExp) ||
			(x instanceof String && y instanceof String) ||
			(x instanceof Number && y instanceof Number)) {
			return x.toString() === y.toString();
		}

		// At last checking prototypes as good as we can
		if (!(x instanceof Object && y instanceof Object)) {
			return false;
		}

		if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
			return false;
		}

		if (x.constructor !== y.constructor) {
			return false;
		}

		if (x.prototype !== y.prototype) {
			return false;
		}

		// Check for infinitive linking loops
		if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
			return false;
		}

		// Quick checking of one object being a subset of another.
		// todo: cache the structure of arguments[0] for performance
		for (p in y) {
			if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
				return false;
			} else if (typeof y[p] !== typeof x[p]) {
				return false;
			}
		}

		for (p in x) {
			if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
				return false;
			} else if (typeof y[p] !== typeof x[p]) {
				return false;
			}

			switch (typeof (x[p])) {
				case 'object':
				case 'function':

					leftChain.push(x);
					rightChain.push(y);

					if (!compare2Objects(x[p], y[p])) {
						return false;
					}

					leftChain.pop();
					rightChain.pop();
					break;

				default:
					if (x[p] !== y[p]) {
						return false;
					}
					break;
			}
		}

		return true;
	}

	if (arguments.length < 1) {
		return true; //Die silently? Don't know how to handle such case, please help...
		// throw "Need two or more arguments to compare";
	}

	for (i = 1, l = arguments.length; i < l; i++) {

		leftChain = []; //Todo: this can be cached
		rightChain = [];

		if (!compare2Objects(arguments[0], arguments[i])) {
			return false;
		}
	}

	return true;
};
//文件选择
function pickFile(callback, acceptType) {
	function ip(obj) {
		plus.android.importClass(obj);
		return obj;
	}
	if (plus.os.name == 'Android') {
		var CODE_REQUEST = 1000;
		var context = plus.android.runtimeMainActivity();
		ip(context);
		var Intent = plus.android.importClass('android.content.Intent');
		var intent = new Intent(Intent.ACTION_GET_CONTENT);
		intent.addCategory(Intent.CATEGORY_OPENABLE);
		if (acceptType) {
			intent.setType(acceptType);
		} else {
			intent.setType("*/*");
		}
		context.onActivityResult = function (requestCode, resultCode, intentData) {
			if (requestCode == CODE_REQUEST) {
				if (intentData) {
					var uriValue = intentData.getData();
					plus.android.importClass(uriValue);
					var scheme = uriValue.getScheme();
					if (scheme == 'content') { //还需要进行数据库查询，一般图片数据
						var cursor = ip(context.getContentResolver()).query(uriValue, ['_data'], null, null, null);
						if (cursor) {
							ip(cursor).moveToFirst();
							var columnIndex = cursor.getColumnIndex('_data');
							picturePath = cursor.getString(columnIndex);
							cursor.close();
							callback(picturePath); //返回文件路径
						}
					} else if (scheme == 'file') {
						callback(uriValue.getPath()); //返回文件路径
					}
				} else {
					callback(null);
				}
			}
		}
		context.startActivityForResult(intent, CODE_REQUEST);
	} else {
		plus.gallery.pick(function (e) {
			if (typeof callback == "function") {
				callback(e);
			}
		}, function (e) {
			if (typeof callback == "function") {
				callback(null);
			}
		});
	}
}

//遮罩
var ModalHelper = (function (bodyCls) {
	var scrollTop;
	return {
		showShade: function (id) {
			//创建遮罩
			var div = document.createElement('div');
			div.classList.add("shade");
			if (id)
				div.setAttribute("id", id);
			document.body.appendChild(div);

			//禁止穿透滚动
			scrollTop = document.scrollingElement.scrollTop;
			document.body.classList.add(bodyCls);
			document.body.style.top = -scrollTop + 'px';
		},
		hideShade: function (id, haveBodyCls) {
			//移除body样式
			//如果有多个遮罩时，不用移除body的样式，只有一个遮罩时移除即可
			if (document.getElementsByClassName("shade").length == 1)
				document.body.classList.remove(bodyCls);

			//移除遮罩
			var div = id ? document.getElementById(id) : document.getElementsByClassName("shade")[0];
			document.body.removeChild(div);

			//启动滚动
			document.scrollingElement.scrollTop = scrollTop;
		}
	};
})('modal-open');

//抄送日志类型
var shareLog = {
	'eq-fault': 1,
	'eq-repair': 2,
	'equ-insp': 3,
	'fault': 4,
	'debug': 5,
	'repair': 6,
	'repair-req': 7,
	'repair-log': 8,
	'eq-info': 9,
	'other-service': 10,
	'custom': 12,
	"inventory-detail": 17,
	"inventory-plan": 18
};

//短语类型
var briefType = {
	'job': 1,
	'mark': 2,
	'report': 3
};

var win_height = window.innerHeight;

//显示软键盘
function showInput() {
	if (mui.os.ios) {
		setTimeout(function () {
			var wv_current = plus.webview.currentWebview().nativeInstanceObject();
			wv_current.plusCallMethod({
				"setKeyboardDisplayRequiresUserAction": false
			});
			document.querySelector("input").focus();
		}, 330);
	} else {
		var nativeWebview = plus.webview.currentWebview().nativeInstanceObject();
		plus.android.importClass(nativeWebview);
		nativeWebview.requestFocus();
		var current_height = window.innerHeight;
		var Context = plus.android.importClass("android.content.Context");
		var InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
		var main = plus.android.runtimeMainActivity();
		var imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);

		imm.toggleSoftInput(0, InputMethodManager.SHOW_FORCED);

		setTimeout(function () {
			document.querySelector("input").focus();
		}, 150);
	}

	document.querySelector("input").addEventListener("blur", function () {
		setTimeout(function () {
			blurInput();
		}, 500);
	});
}

function blurInput() {
	var current_height = window.innerHeight;

	if (win_height > current_height) {
		if (mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var Context = plus.android.importClass("android.content.Context");
			var InputMethodManager = plus.android.importClass("android.view.inputmethod.InputMethodManager");
			var imm = main.getSystemService(Context.INPUT_METHOD_SERVICE);
			imm.toggleSoftInput(0, InputMethodManager.HIDE_NOT_ALWAYS);
		} else {
			document.activeElement.blur();
		}
	}
}

function replaceHTML(str) {
	return str.replace(/&nbsp;/g, "").replace(/<br>/g, "").replace(/^\n+|\n+$/g, "");
}
//原生图片预览
function previewImages() {
	var images = [].slice.call(document.querySelectorAll('.imageview-native'));
	var urls = [];
	var thums = [];
	images.forEach(function (item) {
		if (item.getAttribute("fullpath")) {
			urls.push(item.getAttribute("fullpath"));
		} else {
			urls.push(item.getAttribute("src"));
		}
		thums.push(item.getAttribute("src"));
	});
	mui('body').off('tap', '.imageview-native');
	mui('body').on('tap', '.imageview-native', function () {
		var index = images.indexOf(this);
		if (plus.os.name == "Android") {
			plus.Push.previewImage(urls.toString() + ";" + thums.toString(), index);
			// plus.nativeUI.previewImage(urls, {
			// 	current: index,
			// 	loop: true,
			// 	indicator: 'number'
			// });


		} else {
			plus.Push.openImageBrowser(urls, index);
		}

	});
}
//检查权限CAMERA、RECORD
// true表示程序已被用户授权使用此权限； false表示程序已被用户拒绝使用此权限；
function checkPermission(permission) {
	var tip = permission == "CAMERA" ? "打开摄像头失败，请开启摄像头权限后重试" : "录音失败，请开启录音或者麦克风权限后重试";
	var state = true;
		if (mui.os.android) {
			state = plus.Push.checkPermission(permission);
		} else {
			state = plus.navigator.checkPermission(permission) == "authorized" ? true : false;
		}
		if (!state) {
			mui.toast(tip);
		}
	return state;
}

//光标移动最后
function moveEnd(element, isForce) {
	var focus = isForce;
	if (!focus) {
		var _element;
		while (_element = _element ? _element.parentElement : window.getSelection().baseNode) {
			if (_element.isSameNode(element)) {
				focus = true;
				break;
			}
		}
	}
	if (focus) {
		var range = document.createRange();
		range.selectNodeContents(element);
		range.collapse(false);
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	}
}

//document.addEventListener('plusready', function () {
//	var _BARCODE = plus.os.name == 'Android' ? 'XgPush' : 'MdXGPushPlugin' // 插件名称
//	var B = window.plus.bridge
//
//	var XGPushPlugin = {
//		receiveMessage: {},
//		openNotification: {},
//		receiveNotification: {},
//		receiveScan: {},
//		receiveSwitch: {},
//		receiveFiles: {},
//		receiveVideoAndPhotoPath: {},
//		//调用java方法
//		callNative: function (fname, args, successCallback) {
//			var callbackId = this.getCallbackId(successCallback, this.errorCallback)
//			if (args != null) {
//				args.unshift(callbackId)
//			} else {
//				var args = [callbackId]
//			}
//			return B.execSync(_BARCODE, fname, args)
//		},
//		getCallbackId: function (successCallback) {
//			var success = typeof successCallback !== 'function' ? null : function (args) {
//				successCallback(args)
//			}
//			return B.callbackId(success, this.errorCallback)
//		},
//		errorCallback: function (errorMsg) {
//			console.log('Javascript callback error: ' + errorMsg)
//		},
//		fireDocumentEvent: function (ename, jsonData) {
//			var event = document.createEvent('HTMLEvents')
//			event.initEvent(ename, true, true)
//			event.eventType = 'message'
//
//			jsonData = JSON.stringify(jsonData)
//			var data = JSON.parse(jsonData)
//			event.arguments = data
//			document.dispatchEvent(event)
//		},
//		// Common method
//		getRegistrationID: function (successCallback) {
//			this.callNative('getRegistrationID', null, successCallback)
//		},
//		setTags: function (tags) {
//			this.callNative('setTags', [tags], null)
//		},
//		setAlias: function (alias) {
//			this.callNative('setAlias', [alias], null)
//		},
//		setTagsWithAlias: function (tags, alias) {
//			if (alias == null) {
//				this.setTags(tags)
//				return
//			}
//			if (tags == null) {
//				this.setAlias(alias)
//				return
//			}
//			var arrayTagWithAlias = [tags]
//			arrayTagWithAlias.unshift(alias)
//			this.callNative('setTagsWithAlias', arrayTagWithAlias, null)
//		},
//		stopPush: function () {
//			this.callNative('stopPush', null, null)
//		},
//		resumePush: function () {
//			this.callNative('resumePush', null, null)
//		},
//		isPushStopped: function (successCallback) {
//			this.callNative('isPushStopped', null, successCallback)
//		},
//		/******************* Android methods START******************/
//		//初始化
//		init: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('init', null, null)
//			}
//		},
//		//获取当前版本号
//		getVersionName: function (successCallback) {
//			this.callNative('getVersionName', null, successCallback)
//		},
//		//设置角标
//		setCutBadger: function (num) {
//			if (plus.os.name == 'Android') {
//				this.callNative('setCutBadger', [num], null)
//			} else {
//				try {
//					this.callNative('setBadgeNumber', [num], null)
//				} catch (exception) {
//					console.log(exception)
//				}
//			}
//		},
//		//清除角标
//		removeCutBadger: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('removeCutBadger', null, null)
//			}
//		},
//		//百度定位
//		getBdLocation: function (successCallback) {
//			if (plus.os.name == 'Android') {
//				this.callNative('getBdLocation', null, successCallback)
//			}
//		},
//		//检查更新
//		checkUpdate: function (isShowTip) {
//			if (plus.os.name == 'Android') {
//				this.callNative('checkUpdate', [isShowTip], null)
//			}
//		},
//		//网络请求
//		getHttp: function (successCallback, url, token, key) {
//			if (plus.os.name == 'Android') {
//				this.callNative('getHttp', [url, token, key], successCallback)
//			}
//		},
//		//选择文件
//		onBrowse: function (mType) {
//			if (plus.os.name == 'Android') {
//				this.callNative('onBrowse', [mType], null)
//			}
//		},
//		//拍照、录视频
//		videoAndPhotoCapture: function (successCallback) {
//			if (plus.os.name == 'Android') {
//				this.callNative('videoAndPhotoCapture', null, successCallback)
//			}
//		},
//		//图片裁剪
//		cropperPhoto: function (successCallback) {
//			if (plus.os.name == 'Android') {
//				this.callNative('cropperPhoto', null, successCallback)
//			}
//		},
//		//查看图片
//		previewImage: function (images, index) {
//			if (plus.os.name == 'Android') {
//				this.callNative('previewImage', [images, index], null)
//			}
//		},
//		//选择照片
//		chooseImage: function (successCallback) {
//			if (plus.os.name == 'Android') {
//				this.callNative('chooseImage', null, successCallback)
//			}
//		},
//		//播放视频
//		playVideo: function (url, title) {
//			this.callNative('playVideo', [url, title], null)
//		},
//		//抖动
//		playShake:function () {
//			this.callNative('playShake', null, null)
//		},
//		//是否有二维码
//		isQRCode: function (successCallback,url) {
//			this.callNative('isQRCode', [url], successCallback)
//		},
//		//注册信鸽推送
//		registerPush: function (successCallback, userid, username) {
//			data = [userid, username];
//			this.callNative('registerPush', data, successCallback)
//		},
//		//反注册信鸽推送
//		unregisterPush: function (successCallback, userid, username) {
//			data = [userid, username];
//			this.callNative('unregisterPush', data, successCallback)
//		},
//		//获取推送服务状态
//		getPushStatus: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('getPushStatus', null, null)
//			}
//		},
//		//调试模式
//		setDebugMode: function (mode) {
//			if (plus.os.name == 'Android') {
//				this.callNative('setDebugMode', [mode], null)
//			}
//		},
//		//创建本地推送
//		addLocalNotification: function (builderId, content, title, notiID, broadcastTime, extras) {
//			if (plus.os.name == 'Android') {
//				data = [builderId, content, title, notiID, broadcastTime, extras]
//				this.callNative('addLocalNotification', data, null)
//			}
//		},
//		//移除本地推送
//		removeLocalNotification: function (notificationId) {
//			if (plus.os.name == 'Android') {
//				this.callNative('removeLocalNotification', [notificationId], null)
//			}
//		},
//		//清除本地通知
//		clearLocalNotifications: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('clearLocalNotifications', null, null)
//			}
//		},
//		//清除所有通知
//		clearAllNotification: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('clearAllNotification', null, null)
//			}
//		},
//		clearNotificationById: function (notificationId) {
//			if (plus.os.name == 'Android') {
//				this.callNative('clearNotificationById', [notificationId], null)
//			}
//		},
//		setBasicPushNotificationBuilder: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('setBasicPushNotification', null, null)
//			}
//		},
//		setCustomPushNotificationBuilder: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('setCustomPushNotificationBuilder', null, null)
//			}
//		},
//		setLatestNotificationNum: function (num) {
//			if (plus.os.name == 'Android') {
//				this.callNative('setLatestNotificationNum', [num], null)
//			}
//		},
//		setPushTime: function (successCallback, weekDays, startHour, endHour) {
//			if (plus.os.name == 'Android') {
//				this.callNative('setPushTime', [weekDays, startHour, endHour], successCallback)
//			}
//		},
//		setSilenceTime: function (successCallback, startHour, startMinute, endHour, endMinute) {
//			if (plus.os.name == 'Android') {
//				this.callNative('setSilenceTime', [startHour, startMinute, endHour, endMinute], successCallback)
//			}
//		},
//		requestPermission: function () {
//			if (plus.os.name == 'Android') {
//				this.callNative('requestPermission', null, null)
//			}
//		},
//		//检查权限CAMERA、RECORD
//		checkPermission: function (permission) {
//			if (plus.os.name == 'Android') {
//				return this.callNative('checkPermission', [permission], null)
//			}
//		},
//		getConnectionState: function (successCallback) {
//			if (plus.os.name == 'Android') {
//				this.callNative('getConnectionState', null, successCallback)
//			}
//		},
//		onGetRegistrationId: function (rId) {
//			if (plus.os.name == 'Android') {
//				this.fireDocumentEvent('push.onGetRegistrationId', rId)
//			}
//		},
//		//接收到透传消息
//		receiveMessageInAndroidCallback: function (data) {
//			//alert("透传消息:" + data);
//			if (plus.os.name == 'Android') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveMessage = jsonObj
//				this.fireDocumentEvent('push.receiveMessage', this.receiveMessage)
//			}
//		},
//		openNotificationInAndroidCallback: function (data) {
//			if (plus.os.name == 'Android') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.openNotification = jsonObj
//				this.fireDocumentEvent('push.openNotification', this.openNotification)
//			}
//		},
//		//接收到扫码信息返回
//		receiveScanInAndroidCallback: function (data) {
//			if (plus.os.name == 'Android') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveScan = jsonObj
//				this.fireDocumentEvent('push.receiveScan', this.receiveScan)
//			}
//		},
//		//接受前后台切换消息
//		receiveSwitchInAndroidCallback: function (data) {
//			if (plus.os.name == 'Android') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveSwitch = jsonObj
//				this.fireDocumentEvent('push.receiveSwitch', this.receiveSwitch)
//			}
//		},
//		//接收到普通消息
//		receiveNotificationInAndroidCallback: function (data) {
//			//alert("通知栏消息:" + data);
//			if (plus.os.name == 'Android') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveNotification = jsonObj
//				this.fireDocumentEvent('push.receiveNotification', this.receiveNotification)
//			}
//		},
//		//接收选择文件信息
//		transmitSelectFilesInAndroidCallback: function (data) {
//			//		            alert("选择文件信息:" + data);
//			if (plus.os.name == 'Android') {
//				//data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveFiles = jsonObj
//				this.fireDocumentEvent('push.receiveFiles', this.receiveFiles)
//			}
//		},
//		//接收视频、照片信息
//		videoAndPhotoCaptureInAndroidCallback: function (data) {
//			//alert("接收视频、照片路径:" + JSON.stringify(data));
//			if (plus.os.name == 'Android') {
//				//data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveVideoAndPhotoPath = jsonObj
//				this.fireDocumentEvent('push.receiveVideoAndPhotoPath', this.receiveVideoAndPhotoPath)
//			}
//		},
//		/******************* Android methods END******************/
//
//		//接收IOS普通推送消息
//		receiveNotificationIniOSCallback: function (data) {
//			//alert("通知栏消息:" + data);
//			if (plus.os.name == 'iOS') {
//				var jsonObj = JSON.parse(data)
//				this.receiveNotification = jsonObj
//
//				this.fireDocumentEvent('push.receiveNotification', this.receiveNotification)
//			}
//		},
//		//接收IOS透传消息
//		receiveMessageIniOSCallback: function (data) {
//			if (plus.os.name == 'iOS') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveMessage = jsonObj
//				this.fireDocumentEvent('push.receiveMessage', this.receiveMessage)
//			}
//		},
//		receiveNotificationLaunceAppIniOSCallback: function (data) {
//			if (plus.os.name == 'iOS') {
//				data = JSON.stringify(data)
//				var jsonObj = JSON.parse(data)
//				this.receiveMessage = jsonObj
//				this.fireDocumentEvent('push.receiveNotificationLaunchApp', this.receiveMessage)
//			}
//		},
//		//接收IOS后台（静默）推送消息
//		receiveNotificationBackgroundIniOSCallback: function (data) {
//			//alert("静默消息：" + data);
//			if (plus.os.name == 'iOS') {
//				var jsonObj = JSON.parse(data)
//				this.receiveMessage = jsonObj
//				this.fireDocumentEvent('push.receiveNotificationBackground', this.receiveMessage)
//			}
//		},
//		// iOS methods
//		//设置角标数字
//		setBadgeNumber: function (value) {
//			if (plus.os.name == 'iOS') {
//				try {
//					this.callNative('setBadgeNumber', [value], null)
//				} catch (exception) {
//					console.log(exception)
//				}
//			}
//		},
//		getDeviceToken: function () {
//			if (plus.os.name == 'iOS') {
//				try {
//					return this.callNative('getDeviceToken', [], null)
//				} catch (exception) {
//					console.log(exception)
//				}
//			}
//		},
//		setApplicationIconBadgeNumber: function (badge) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('setApplicationIconBadgeNumber', [badge], null)
//			}
//		},
//		getApplicationIconBadgeNumber: function (callback) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('getApplicationIconBadgeNumber', [], callback)
//			}
//		},
//		startLogPageView: function (pageName) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('startLogPageView', [pageName], null)
//			}
//		},
//		stopLogPageView: function (pageName) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('stopLogPageView', [pageName], null)
//			}
//		},
//		beginLogPageView: function (pageName, duration) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('beginLogPageView', [pageName, duration], null)
//			}
//		},
//		setLogOFF: function () {
//			if (plus.os.name == 'iOS') {
//				this.callNative('setLogOFF', [], null)
//			}
//		},
//		setCrashLogON: function () {
//			if (plus.os.name == 'iOS') {
//				this.callNative('crashLogON', [], null)
//			}
//		},
//		setLocation: function (latitude, longitude) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('setLocation', [latitude, longitude], null)
//			}
//		},
//		//		setTimeout(function() {
//		//			plus.Push.addLocalNotificationIniOS("2018-03-17 15:37:30", "通知于2018-03-17 15:37:30发", 1, "identifierKey", {
//		//				"hello": "你好"
//		//			});
//		//		}, 100)
//		addLocalNotificationIniOS: function (delayTime, content, badge, notificationID, extras) {
//			if (plus.os.name == 'iOS') {
//				var data = [delayTime, content, badge, notificationID, extras]
//				this.callNative('setLocalNotification', data, null)
//			}
//		},
//		deleteLocalNotificationWithIdentifierKeyIniOS: function (identifierKey) {
//			if (plus.os.name == 'iOS') {
//				var data = [identifierKey]
//				this.callNative('deleteLocalNotificationWithIdentifierKey', data, null)
//			}
//		},
//		clearAllLocalNotificationsIniOS: function () {
//			if (plus.os.name == 'iOS') {
//				this.callNative('clearAllLocalNotifications', [], null)
//			}
//		},
//		//ios视频播放
//		recordVideo: function (successCallback) {
//			if (plus.os.name == 'iOS') {
//				this.callNative('recordVideo', null, successCallback)
//			}
//		},
//		//图片裁剪
//		imageResizer: function (imagedata, successCallback) {
//			if (plus.os.name == 'iOS') {
//				var data = [imagedata];
//				this.callNative('imageResizer', data, successCallback)
//			}
//		},
//		//图片查看 imageList图片数据源 currentIndex 点击图片的索引
//		openImageBrowser: function (imageList, currentIndex, successCallback) {
//			if (plus.os.name == 'iOS') {
//				var data = [imageList, currentIndex];
//				this.callNative('openImageBrowser', data, successCallback)
//			}
//		},
//		//相册图片选取
//		pickImage: function(isMulti, successCallback) {
//			if(plus.os.name == 'iOS') {
//				var data = [isMulti];
//				this.callNative('pickImage', data, successCallback)
//			}
//		}
//	}
//	//调用java方法初始化
//	XGPushPlugin.init();
//	window.plus.Push = XGPushPlugin;
//}, true)

var metarial = {
	data: [{
			value: 1,
			text: "不锈钢"
		},
		{
			value: 2,
			text: "钢"
		},
		{
			value: 3,
			text: "铝"
		},
		{
			value: 4,
			text: "铝合金"
		},
		{
			value: 5,
			text: "尼龙"
		},
		{
			value: 6,
			text: "树脂"
		},
		{
			value: 7,
			text: "塑料"
		},
		{
			value: 8,
			text: "铜"
		},
		{
			value: 9,
			text: "铜合金"
		},
		{
			value: 10,
			text: "橡胶"
		},
		{
			value: 11,
			text: "铁"
		},
		{
			value: 12,
			text: "钛合金"
		},
		{
			value: 13,
			text: "多种材质"
		},
		{
			value: 14,
			text: "其他"
		},
	],
	getTextByID: function (id) {
		var name = "";
		var meterialData = this.data.filter(function (_item) {
			return _item.value == id;
		});
		if (meterialData.length > 0) {
			name = meterialData[0].text;
		}
		return name;
	}
};
/**
 * 组合省市地址
 * @param {Object} province
 * @param {Object} city
 * @param {Object} district
 * @param {Object} address
 */
function contractAddress(province, city, district, address, street) {
	province = province || "";
	city = city || "";
	district = district || "";
	address = address || "";
	street = street || "";

	if (province == city) {
		return province + " " + district + " " + address + " " + street;
	} else {
		return province + " " + city + " " + district + " " + address + " " + street;
	}
}