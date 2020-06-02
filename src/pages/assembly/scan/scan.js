﻿
var ws = null,
	wo = null;
var scan = null;

mui.plusReady(function() {
	if(query("from") == "addfriend") {
		document.body.querySelector(".mui-icon-more").style.display = "none";
	}
	try {
		// 获取窗口对象
		ws = plus.webview.currentWebview();
		wo = ws.opener();
		// 开始扫描
		ws.addEventListener('show', function() {
			scan = new plus.barcode.Barcode('bcid');
			scan.onmarked = onmarked;
			scan.start();
		});
		// 显示页面并关闭等待框
		ws.show("pop-in");
	} catch(e) {
		plus.nativeUI.toast(e.message);
	}
	//打开/关闭闪光灯
	var isturnon = false;
	document.getElementById("turnlight").addEventListener("tap", function() {
		this.innerText = isturnon ? "开灯" : "关灯";
		isturnon = !isturnon;
		scan.setFlash(isturnon);
	});
});

//弹出菜单
var btns = [{
	title: "手工输入迈迪国标通用物联码"
}, mui.os.ios && {
	title: "从相册选择二维码"
}];

document.body.querySelector('header .icon-more').addEventListener('tap', function() {
	plus.nativeUI.actionSheet({
		cancel: "取消",
		buttons: btns
	}, function(e) {
		if(e.index == 2) {
			scanPicture();
		} else if(e.index == 1) {
			showPrompt();
		}
	});
}, true);

//从相册中选择二维码图片
function scanPicture() {
	plus.gallery.pick(function(path) {
		plus.barcode.scan(path, onmarked, function(error) {
			plus.nativeUI.alert("无法识别此图片");
		});
	}, function(err) {
		//		plus.nativeUI.alert("Failed: " + err.message);
	});
}

//手工录入迈迪国标通用物联码
function showPrompt() {
	var bts = ["确认", "取消"];
	plus.nativeUI.prompt("当迈迪国标通用物联码难以正常扫描时，可以手工录入码值，进行识别。", function(e) {
		if(e.index == 0) {
			fireCallback('QR', e.value);
		}
	}, "请输入迈迪国标通用物联码", "", bts);
}

//二维码扫描成功
function onmarked(type, result, file) {
	switch(type) {
		case plus.barcode.QR:
			type = "QR";
			break;
		case plus.barcode.EAN13:
			type = "EAN13";
			break;
		case plus.barcode.EAN8:
			type = "EAN8";
			break;
		default:
			type = "其它" + type;
			break;
	}
	result = result.replace(/\n/g, '');

	fireCallback(type, result);
}

//返回码值
function fireCallback(codeType, codeValue) {
	if(ws.callback) {
		if(codeValue.indexOf('?') >= 0) {
			codeValue = codeValue.split('?')[1];
		}
		if(ws.callback == "scanCG") {
			if(codeValue.indexOf('CG') == 0) {
				scan.close();
				wo.evalJS(ws.callback + "('" + codeType + "', '" + codeValue + "');");
				ws.close("none");
			} else {
				mui.toast("请扫描正确的生产令号");
				scan.start();
			}
			return;
		}
		if(codeValue.indexOf("MDGY") > -1) {
			scan.close();
			wo.evalJS(ws.callback + "('" + codeType + "', '" + codeValue + "');");
			ws.close("none");
			return;
		}
		//这里需要验证下22位长度的迈迪国标通用物联码是否已经绑定
		if(codeValue) {
			//验证迈迪国标通用物联码
			scan.close();
			wo.evalJS(ws.callback + "('" + codeType + "', '" + codeValue + "');");
			ws.close("none");
		}
	} else {
		document.body.querySelector('header a:last-child').style.display = 'none';
		scan.close();
		checkCode(codeType, codeValue);
	}
}

//验证扫码规则
var m_url = 'http://m.maidiyun.com';
var my_url = 'http://m.my3dparts.com';

function checkCode(codeType, codeValue) {
	if(codeValue.match(/^http(|s):\/\//g)) {
		//如果是带有m.maidiyun.com或m.my3dparts.com标识的网址，说明是迈迪的专有码
		if(codeValue.indexOf(m_url) >= 0 || codeValue.indexOf(my_url) >= 0) {
			var params = codeValue.split('?');

			if(params.length > 1) {
				var codeValue = params[1];
				//验证是否是工业商城
				if(codeValue.indexOf("mdt=") == 0 && codeValue.length == 12) {
					if(user.Token) {
						loadInnerUrl(MdAppUrl.Mobile + "/shop.html?isMdt=true&isMdtLogin=true&mdt=" + codeValue.split('=')[1]);
					} else {
						loadInnerUrl(MdAppUrl.Mobile + "/shop.html?isMdt=true&isMdtLogin=false&mdt=" + codeValue.split('=')[1]);
					}
					return;
				}
				checkMdCode(codeValue);
				return;
			}
		}
		//网址需要确认后打开
		document.body.querySelector('#detail p').innerText = codeValue;
		document.getElementById('detail').classList.add('to-top');
	} else { //不带网址的码，需要验证是不是迈迪国标通用物联码，不是的仅显示
		checkMdCode(codeValue);
	}
}

//验证迈迪国标通用物联码正确性，并执行相关操作
function checkMdCode(code) {
	if(code.indexOf('GZ') == 0) { //打开设备详情页面
		//改为 之前保存 设备扫码记录  2017年7月13日 14:28:05

		var equId = code.substr(2);
		var par = "equipmentId=" + equId;
		var canres = {
			type: 2,
			isView: true,
			scanTime: getCurrentTime(),
			mdCode: equId,
			parameters: par
		};
		saveScanHistory(canres);
		var url = MdAppUrl.Api45 + "/api/v1.0/Equipment/GetEqCompID?equipmentId=" + equId;
		getAjaxData(url, function(reData) {
			if(reData && reData.State == 1) {
				//判断是否是设备录入企业的用户，如果是，则跳转至台账，否则跳转至设备详情
				if(user.CompID == reData.Data) {

					var innerWs = openWindow("../equ-manage/equ-view.html?equipmentId=" + equId, null, "equ-view.html");
					innerWs.addEventListener('show', function() {
						innerWs.opener().close("none");
					}, false);
				} else {
					loadInnerUrl("../industry-service/equipment-detail.html?id=" + equId);
				}
			} else {
				document.body.querySelector('#detail button').style.display = 'none';
				document.body.querySelector('#detail p').innerText = code;
				document.getElementById('detail').classList.add('to-top');
			}
		});
	} else if(code.indexOf('MDQ') == 0) { //打开关注企业的页面
		loadInnerUrl("../company/enterprisescard.html?compid=" + code.substr(3));
	} else if(code.indexOf('MDU') == 0) { //打开加用户好友的页面
		loadInnerUrl("../my/add-friend.html?id=" + code.substr(3));
	} else if((code.length == 35 && code.charAt(0) == "E")) { //code.length == 33 || (code.length == 35 && code.charAt(0) == "E")
		//判断如果是33位，则需要判断是不是ecode，并返回迈迪国标通用物联码，type:1通过ecode获取迈迪国标通用物联码,2通过迈迪国标通用物联码获取ecode
		if(code.length == 35 && code.charAt(0) == "E") {
			code = code.substring(2);
		}
		var url = MdAppUrl.Api4 + "/api/Service/GetMdcodeOrEcode?code=" + code + "&type=1";
		getAjaxData(url, function(reData) {
			if(reData && reData.State == 1 && reData.Data) {
				checkMdCodeToServer(reData.Data, code);
			} else {
				document.body.querySelector('#detail button').style.display = 'none';
				document.body.querySelector('#detail p').innerText = code;
				document.getElementById('detail').classList.add('to-top');
			}
		}, false);
	} else {
		checkMdCodeToServer(code);
	}
}

//前往服务器获取是否是正确的迈迪国标通用物联码
function checkMdCodeToServer(code, ecode) {
	if(code.length == 31 && code.substr(13, 4) == "Z001") {
		loadInnerUrl("scanDetails.html?mdCode=" + code);
		return;
	}
	//验证迈迪国标通用物联码
	var url = MdAppUrl.Api45 + '/api/v1.0/MdCode/CheckMdCode?code=' + code;

	getAjaxData(url, function(e) {
		if(e.State == 1) {
			loadInnerUrl("scanDetails.html?mdCode=" + code + "&ecode=" + ecode); //正品
		} else if(e.State == 2) {
			loadInnerUrl("scanDetails.html?mdCode=" + code + "&state=2" + "&ecode=" + ecode); //疑似假冒产品
		} else if(e.State == 3 && checkMdt(code) || e.State == 3 && e.Data.CompID == user.CompID) { //未绑定的迈迪国标通用物联码
			scan.cancel();
			var btnArray = ['重新扫描', '返回'];
			mui.confirm('该迈迪国标通用物联码未绑定任何产品', "提示", btnArray, function(e) {
				if(e.index == 1) {
					scan.close();
					mui.back();
				} else {
					scan.start();
				}
			});
			//loadInnerUrl('../binding-code/binding-prod.html?mdCode=' + code);
		} else { //不是产品码，直接显示码值
			document.body.querySelector('#detail button').style.display = 'none';
			document.body.querySelector('#detail p').innerText = code;
			document.getElementById('detail').classList.add('to-top');
		}
	}, false);
}
//迈迪通号判定
function checkMdt(code) {
	var mdt = user.CompMdt;
	while(mdt.length < 8) {
		mdt = '0' + mdt;
	}
	//个人用户直接返回
	if(user.UserType == 1) {
		return false;
	}
	if(code.substring(2, 10) == (user.CompMdt.length == 8 ? user.CompMdt : mdt)) {
		return true;
	} else {
		return false;
	}
};
//打开第三方网址
document.body.querySelector('#detail button').addEventListener('tap', function() {
	loadOtherUrl(document.body.querySelector('#detail p').innerText);
}, false);

//打开外部链接地址
function loadOtherUrl(url) {
	var innerWs = openWindow('../../template.html', {
		author: '-',
		title: '分享',
		url: url
	});

	innerWs.addEventListener('show', function() {
		innerWs.opener().close("none");
	}, false);
}

//打开内部链接地址
function loadInnerUrl(url) {
	var innerWs = openWindow(url);
	innerWs.addEventListener('show', function() {
		innerWs.opener().close("none");
	}, false);
}