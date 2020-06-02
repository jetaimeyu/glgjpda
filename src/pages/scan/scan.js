app.controller("ScanController", ["$scope", "ApiService", "DataService", "UtilsService", "CacheService", "Loading", "RPCObserver", function($scope, ApiService, DataService, UtilsService, CacheService, Loading, RPCObserver) {
	var ws = null,
		wo = null;
	var scan = null;
	var action = query("actionType") || "";
	$scope.iconmoreClose = null;
	if(!checkPermission("CAMERA")) {
		return false;
	}
	var user = CacheService.get('user');

	function createScan() {
		scan = new plus.barcode.Barcode('bcid');
		scan.onmarked = onmarked;
		scan.start();
	}
	//弹出菜单
	var btns = [{
		title: "手工输入迈迪国标通用物联码"
	}, {
		title: "从相册选择二维码"
	}];

	document.body.querySelector('header .icon-more').addEventListener('tap', function() {
		$scope.iconmoreClose = plus.nativeUI.actionSheet({
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
		var time = new Date().getTime();
		plus.gallery.pick(function(path) {
			var newTime = new Date().getTime();

			if((newTime - time) > 1200) {
				plus.barcode.scan(path, onmarked, function(error) {
					plus.nativeUI.alert("无法识别此图片");
				});
			} else {
				mui.toast("请返回重新选择相册！");
			}

		}, function(err) {
			//		plus.nativeUI.alert("Failed: " + err.message);
		}, {
			filter: "image"
		});
	}

	//手工录入迈迪国标通用物联码
	function showPrompt() {
		var bts = ["确认", "取消"];
		plus.nativeUI.prompt("当迈迪国标通用物联码难以正常扫描时，可以手工录入码值，进行识别。", function(e) {
			if(e.index == 0) {
				var _val = e.value || "";
				_val = _val.replace(/(^\s+)|(\s+$)/ig, "");
				if(_val == "") {
					mui.alert("请输入迈迪国标通用物联码!");
				} else {
					fireCallback('QR', _val);
				}
			}
		}, "请输入迈迪国标通用物联码", "", bts);
	}

	//二维码扫描成功
	function onmarked(type, result, file) {
		if(file && type == "QR_CODE" && mui.os.android) {
			type = 0;
			result = result.substring(1, (result.length - 1));
		}
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
		//result = result.replace(/[\r\n]/g,"");
		//串号记录保存
		SaveDealerStock(result);
		fireCallback(type, result);
	}

	//串号记录保存
	function SaveDealerStock(mdcode) {
		if(mdcode.indexOf('?') >= 0) {
			mdcode = mdcode.split('?')[1];
		}
		//位置定位
		UtilsService.getLocation(true).then(function(location) {
			var url = ApiService.Api50 + "/api/v1/Suppliers/SaveDealerStock?mdCode=" + mdcode + "&province=" + encodeURIComponent(location.province) + "&city=" + encodeURIComponent(location.city) + "&district=" + encodeURIComponent(location.district) + "&lng=" + location.lng + "&lat=" + location.lat + "&userId=" + user.UserID;
			DataService.get(url).then(function(res) {});
		});
	}

	//返回码值
	function fireCallback(codeType, codeValue) {
		document.getElementById('compname').style.display = "none";
		document.getElementById('tip').style.display = "none";
		if(ws.callback) {
			if(codeValue.indexOf('?') >= 0) {
				codeValue = codeValue.split('?')[1];
			}
			if(ws.type == 'bindnewcode') {
				scan.close();
				wo.evalJS(ws.callback + "('" + codeValue + "');");
				ws.close("none");
				return;
			}
			if(ws.type == "scan_addfriend") {
				if(codeValue.indexOf('MDU') == 0) {
					scan.close();
					wo.evalJS(ws.callback + "('" + codeValue.substr(3) + "');");
					ws.close("none");
					return;
				} else {
					mui.alert("请扫描正确的二维码名片", function() {
						scan.start();
					});
					return;
				}
			}
			if(ws.type == "scan_addOutstock") {
				var prodinfo = {
					"codeValue": codeValue,
					"codeType": codeType
				}
				scan.close();
				wo.evalJS(ws.callback + "('" + JSON.stringify(prodinfo) + "');");
				ws.close("none");
				return;

			}
			//加工工艺
			if(ws.type == "scan_technics") {
				scan.close();
				wo.evalJS(ws.callback + "('" + codeType + "', '" + codeValue + "');");
				ws.close("none");
				return;
			}
			//加工工艺
			if(ws.type == "scan_technics_trace") {
				scan.close();
				wo.evalJS(ws.callback + "('" + codeType + "', '" + codeValue + "');");
				ws.close("none");
				return;
			}
			//兼容老设备
			if(codeValue.indexOf('GZ') == 0) {
				var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + codeValue.substr(2);
				DataService.get(url).then(function(res) {
					if(res) {
						if(user.CompID == res.CompID) {
							scan.close();
							var obj = {
								codeType: codeType, //二维码类型
								codeValue: codeValue, //码值
								resType: 2, //设备2、产品1
								isEmpty: false, //是否空码
								resInfo: res //设备或产品详情
							}
							var param = JSON.stringify(obj).replace(/\\/g, "\\\\");
							wo.evalJS(ws.callback + "('" + param + "');");
							ws.close("none");
						} else {
							scan.cancel();
							mui.back();
							mui.toast('非本企业设备');
						}
					}
				}, function(e) {
					scan.start();
					mui.toast("请扫描正确的设备码");
				})
				return;
			}
			//这里需要验证下22位长度的迈迪国标通用物联码是否已经绑定
			if(codeValue) {
				//验证迈迪国标通用物联码
				var url = ApiService.Api50 + '/api/v1/MdCode/CheckMdCode?code=' + codeValue;
				ws.type != "prod" && (url += "&compid=" + user.CompID);
				DataService.get(url).then(function(e) {
					//					console.log(JSON.stringify(e))
					if(e.State == 1 || !isNetWorkCanUse()) {
						if(e.Data.Type) {
							scan.close();
							var obj = {
								codeType: codeType, //二维码类型
								codeValue: codeValue, //码值
								resType: e.Data.Type, //设备2、产品1
								isEmpty: false, //是否空码
								resInfo: "" //设备或产品详情
							}
							var localSaveData = {};
							localSaveData.type = e.Data.Type; //产品1、设备2
							//通过设备码获取设备详情
							if(e.Data.Type == 2) {
								//获取设备详情
								var url = ApiService.Api50 + "/api/v1/MdCode/GetEqInfoByCode?MDCode=" + codeValue;
								DataService.get(url).then(function(reData) {
									if(user.CompID == reData.CompID || (ws.type == 'search_part' && user.CompID == reData.CompID)) {
										//										reData.Params.forEach(function(p){
										//											p.ParamName = encodeURIComponent(p.ParamName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@"))
										//											p.ParamValue = encodeURIComponent(p.ParamValue.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@"))
										//										})
										obj.resInfo = reData;
										var localSaveData = {
											type: 2,
											scanTime: getCurrentTime(),
											mdCode: codeValue,
											ID: reData.ID,
											SkuID: reData.SkuID,
											Name: reData.EqName,
											CompID: reData.CompID,
											CompName: reData.CompName,
											LogoIsExist: reData.LogoIsExist || false,
											SkuName: reData.SkuName,
											CodeCreateUserName: reData.CodeCreateUserName,
											EqIdentifier: reData.EqIdentifier,
											InnerCodeName: user.InnerCodeName || "出厂编号"
										}
										saveScanHistory(localSaveData);
										var param = JSON.stringify(obj).replace(/\\/g, "\\\\");
										wo.evalJS(ws.callback + "('" + param + "');");
										ws.close("none");
									} else {
										scan.cancel();
										mui.back();
										mui.toast('非本企业设备');
									}
								}, function(res) {
									scan.cancel();
									mui.back();
								});
							} else {

								//获取产品详情
								var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + codeValue + "&CompID=" + user.CompID;
								DataService.get(url).then(function(reData) {
									if(((user.CompID == reData.CompID || (ws.type == 'search_part' && user.CompID == reData.CompID) || ws.type == 'eq') && user.CompID > 0) || user.CompID == 0) {
										//替换单引号,双引号
										var localSaveData = {
											type: 1,
											scanTime: getCurrentTime(),
											mdCode: codeValue,
											ID: reData.ProdID,
											SkuID: reData.SkuID,
											Name: reData.ProdName,
											CompID: reData.CompID,
											CompName: reData.CompName,
											SkuName: reData.SkuName,
											CodeCreateUserName: reData.CodeCreateUserName,
											LogoIsExist: reData.LogoIsExist || false,
											InnerCode: obj.resInfo.InnerCode,
											InnerCodeName: user.InnerCodeName || "出厂编号"
										}
										saveScanHistory(localSaveData);
										reData.SkuName = encodeURIComponent(reData.SkuName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@"));
										reData.ProdName = encodeURIComponent(reData.ProdName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@"));
										reData.InnerCode = encodeURIComponent(reData.InnerCode.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@"));
										delete reData.ProdBrief;
										delete reData.VideoInstructions;
										obj.resInfo = reData;
										var param = JSON.stringify(obj);
										wo.evalJS(ws.callback + "('" + param + "');");
										ws.close("none");
									} else {
										scan.cancel();
										mui.back();
										mui.toast('非本企业产品');
									}
								}, function(res) {
									scan.cancel();
									mui.back();
								});
							}
						} else {
							scan.close();
							var obj = {
								codeType: codeType, //二维码类型
								codeValue: codeValue, //码值
								resType: e.Data.Type || '', //设备2、产品1
								isEmpty: false, //是否空码
								resInfo: "" //设备或产品详情
							}
							wo.evalJS(ws.callback + "('" + JSON.stringify(obj) + "');");
							ws.close("none");
						}
					} else if(e.State == 2) { //疑似假冒产品
						scan.cancel();
						var btnArray = ['重新扫描', '返回'];
						mui.confirm('该产品疑似假冒产品', '疑似假冒', btnArray, function(e) {
							if(e.index == 1) {
								scan.close();
								mui.back();
							} else {
								scan.start();
							}
						});
					} else if(e.State == 3) { //未绑定的迈迪国标通用物联码
						scan.cancel();
						//判断是否是当前企业的迈迪码
						if((checkMdt(codeValue) || user.CompID == e.Data.CompID) && ws.type == "eq") {
							//如果是绑定设备则直接返回
							scan.close();
							var obj = {
								codeType: codeType, //二维码类型
								codeValue: codeValue, //码值
								resType: e.Data.Type || '', //设备2、产品1
								isEmpty: true, //是否空码
								resInfo: "" //设备或产品详情
							}
							wo.evalJS(ws.callback + "('" + JSON.stringify(obj) + "');");
							ws.close("none");

						} else {
							//不是本企业的迈迪码
							var btnArray = ['重新扫描', '返回'];
							mui.confirm('该迈迪国标通用物联码未绑定任何产品或设备', "提示", btnArray, function(e) {
								if(e.index == 1) {
									scan.close();
									mui.back();
								} else {
									scan.start();
								}
							});
						}
					} else { //不是产品码
						scan.cancel();
						//查询：零配件
						if(ws.type == "search_part") {
							var obj = {
								codeType: codeType, //二维码类型
								codeValue: codeValue, //码值
								resType: '', //设备2、产品1
								isEmpty: false, //是否空码
								resInfo: "" //设备或产品详情
							}
							wo.evalJS(ws.callback + "('" + JSON.stringify(obj) + "');");
							ws.close("none");
							return;
						}
						mui.alert("此二维码不是正确的迈迪国标通用物联码或尚未绑定任何产品", function() {
							scan.start();
						});
					}
				});
			}
		} else {
			document.body.querySelector('header a:last-child').style.display = 'none';
			//scan.close();
			checkCode(codeType, codeValue);
		}
	}

	//验证扫码规则
	var m_url = 'http://m.maidiyun.com';
	var m_url_1 = 'https://m.maidiyun.com';
	var m_url_2 = "http://md9.vc";
	var my_url = 'http://m.my3dparts.com';

	function checkCode(codeType, codeValue) {
		if(codeValue.match(/^http(|s):\/\//g)) {
			//如果是带有m.maidiyun.com或m.my3dparts.com标识的网址，说明是迈迪的专有码
			if(codeValue.indexOf(m_url) >= 0 || codeValue.indexOf(m_url_1) >= 0 || codeValue.indexOf(my_url) >= 0 || codeValue.indexOf(m_url_2) >= 0) {
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
			scan.close();
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
			var url = ApiService.Api50 + "/api/v1/Equipment/GetEqInfoById/" + code.substr(2);
			DataService.get(url).then(function(res) {
				var localSaveData = {
					type: 2,
					scanTime: getCurrentTime(),
					mdCode: codeValue,
					ID: res.ID,
					SkuID: res.SkuID,
					Name: res.EqName,
					CompID: res.CompID,
					CompName: res.CompName,
					CodeCreateUserName: res.CodeCreateUserName,
					LogoIsExist: res.LogoIsExist || false,
					SkuName: res.SkuName,
					EqIdentifier: res.EqIdentifier,
					InnerCodeName: user.InnerCodeName || "出厂编号"
				}
				saveScanHistory(localSaveData);
				if(user.CompID == res.CompID) {
					if(action == "eq-Log") {
						loadInnerUrl("../eqmentlib/equ-logs.html?equid=" + code.substr(2));
					} else {
						loadInnerUrl("../eqmentlib/equ-details.html?equid=" + code.substr(2));
					}

				} else {
					scan.cancel();
					mui.back();
					mui.alert(action.indexOf("eq-") == 0 ? '请扫描本企业设备!' : '非本企业设备,无权查看');
				}
			});
		} else if(code.indexOf('MDQ') == 0) {
			if(ws.type == "eq") {
				mui.alert("请扫描设备码", function() {
					scan.start();
				});
				return;
			} else if(ws.type == "addscan") {
				loadInnerUrl("../complib/addRes.html?compid=" + code.substr(3))
				return;
			}

			//打开关注企业的页面			
			loadInnerUrl("../complib/index.html?compid=" + code.substr(3));
		} else if(code.indexOf('MDU') == 0) {
			if(ws.type == "eq") {
				mui.alert("请扫描设备码", function() {
					scan.start();
				});
				return;
			}
			//打开加用户好友的页面
			loadInnerUrl("../contact/personal-info.html?userid=" + code.substr(3));
		} else if((code.length == 33 || code.length == 35 && code.charAt(0) == "E")) { //code.length == 33 || (code.length == 35 && code.charAt(0) == "E")
			//判断如果是33位，则需要判断是不是ecode，并返回迈迪国标通用物联码，type:1通过ecode获取迈迪国标通用物联码,2通过迈迪国标通用物联码获取ecode
			if(code.length == 35 && code.charAt(0) == "E") {
				code = code.substring(2);
			}
			checkMdCodeToServer(code);
		} else {
			checkMdCodeToServer(code);
		}
	}

	//前往服务器获取是否是正确的迈迪国标通用物联码
	function checkMdCodeToServer(code) {
		var fromtype = plus.webview.currentWebview().type || action.indexOf("eq-") == 0 ? "eq" : "";
		if(code.length == 31 && code.substr(13, 4) == "Z001" && fromtype != "eq") {
			var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + code + "&CompID=" + user.CompID;
			DataService.get(url).then(function(reData) {
				var localSaveData = {
					type: 1,
					scanTime: getCurrentTime(),
					mdCode: code,
					ID: reData.ProdID,
					SkuID: reData.SkuID,
					Name: reData.ProdName,
					SkuName: reData.SkuName,
					CompID: reData.CompID,
					CompName: reData.CompName,
					CodeCreateUserName: reData.CodeCreateUserName,
					LogoIsExist: reData.LogoIsExist || false,
					InnerCode: reData.InnerCode,
					InnerCodeName: user.InnerCodeName || "出厂编号"
				}
				saveScanHistory(localSaveData);
				reData.SkuName = encodeURIComponent(reData.SkuName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/%/g, "@percent@"));
				reData.ProdName = encodeURIComponent(reData.ProdName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/%/g, "@percent@"));
				reData.CompName = encodeURIComponent(reData.CompName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
				if(user.CompID == reData.CompID) {
					loadInnerUrl("../problib/scanDetails.html?MDCode=" + code + "&ProdID=" + reData.ProdID + "&ProdName=" + reData.ProdName + "&SkuID=" + reData.SkuID + "&SkuName=" + reData.SkuName + "&ProdInnerCode=" + reData.InnerCode + "&LogoIsExist=" + reData.LogoIsExist + "&CompID=" + reData.CompID + "&CompName=" + reData.CompName); //正品
				} else {
					//loadOtherUrl(ApiService.M + "?" + code + "&ismdt=1");
					loadInnerUrl("../problib/prod-info.html?mdcode=" + code + "&prodid=" + reData.ProdID + "&skuid=" + reData.SkuID)
				}
			}, function(res) {});
			return;
		}
		//验证迈迪国标通用物联码
		var url = ApiService.Api50 + '/api/v1/MdCode/CheckMdCode?code=' + code;
		ws.type == 'eq' && (url += "&compid=" + user.CompID);
		//console.log("294:"+url)
		DataService.get(url).then(function(e) {
			//console.log("296:"+JSON.stringify(e))
			if(e.State == 1) {
				if(e.Data && e.Data.Type == 2) {
					//调用接口，获取迈迪国标通用物联码的对应的记录ID 和企业ID
					var url = ApiService.Api50 + "/api/v1/MdCode/GetEqInfoByCode?MDCode=" + code;
					DataService.get(url).then(function(reData) {
						//判断是否是设备录入企业的用户，如果是，则跳转至台账，否则跳转至设备详情(注：此版本都跳转设备详情)
						var localSaveData = {
							type: 2,
							scanTime: getCurrentTime(),
							mdCode: code,
							ID: reData.ID,
							SkuID: reData.SkuID,
							Name: reData.EqName,
							SkuName: reData.SkuName,
							CompID: reData.CompID,
							CompName: reData.CompName,
							CodeCreateUserName: reData.CodeCreateUserName,
							LogoIsExist: reData.LogoIsExist || false,
							EqIdentifier: reData.EqIdentifier,
							InnerCodeName: user.InnerCodeName || "出厂编号"
						}
						saveScanHistory(localSaveData);
						if(user.CompID == reData.CompID) {
							if(action == "eq-Log") {
								var innerWs = openWindow("../eqmentlib/equ-logs.html?equid=" + reData.ID, null, "equ-logs.html", true);
								innerWs.addEventListener('show', function() {
									innerWs.opener().close("none");
								}, false);
							} else {
								var innerWs = openWindow("../eqmentlib/equ-details.html?equid=" + reData.ID, null, "equ-details.html", true);
								innerWs.addEventListener('show', function() {
									innerWs.opener().close("none");
								}, false);
							}

						} else {
							if(reData.ID == 0) {
								scan.close();
								document.body.querySelector('#detail button').style.display = 'none';
								document.body.querySelector('#detail p').innerText = "未找到该设备的信息！";
								document.getElementById('detail').classList.add('to-top');
							} else {
								scan.cancel();
								mui.back();
								mui.alert(action.indexOf("eq-") == 0 ? '请扫描本企业设备!' : '非本企业设备,无权查看');
							}
						}
					}, function(res) {
						scan.cancel();
						mui.back();
					});
				} else {
					if(fromtype != "eq") {
						var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + code + "&CompID=" + user.CompID;
						DataService.get(url).then(function(reData) {
							var localSaveData = {
								type: 1,
								scanTime: getCurrentTime(),
								mdCode: code,
								ID: reData.ProdID,
								SkuID: reData.SkuID,
								Name: reData.ProdName,
								SkuName: reData.SkuName,
								InnerCode: reData.InnerCode,
								CodeCreateUserName: reData.CodeCreateUserName,
								CompID: reData.CompID,
								CompName: reData.CompName,
								LogoIsExist: reData.LogoIsExist || false,
								InnerCodeName: user.InnerCodeName || "出厂编号"
							}
							saveScanHistory(localSaveData);
							reData.InnerCode = encodeURIComponent(reData.InnerCode.replace(/&/g, "@and@").replace(/#/g, "@hash@"));
							reData.SkuName = encodeURIComponent(reData.SkuName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
							reData.ProdName = encodeURIComponent(reData.ProdName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
							reData.CompName = encodeURIComponent(reData.CompName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
							reData.CodeCreateUserName = encodeURIComponent(reData.CodeCreateUserName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
							if(user.CompID == reData.CompID) {
								loadInnerUrl("../problib/scanDetails.html?MDCode=" + code + "&ProdID=" + reData.ProdID + "&ProdName=" + reData.ProdName + "&SkuID=" + reData.SkuID + "&SkuName=" + reData.SkuName + "&ProdInnerCode=" + reData.InnerCode + "&LogoIsExist=" + reData.LogoIsExist + "&CompID=" + reData.CompID + "&CompName=" + reData.CompName + "&EqJane=" + reData.EqJane + "&CodeCreateUserName=" + reData.CodeCreateUserName);
							} else {
								//loadOtherUrl(ApiService.M + "?" + code + "&ismdt=1");
								loadInnerUrl("../problib/prod-info.html?mdcode=" + code + "&prodid=" + reData.ProdID + "&skuid=" + reData.SkuID)
							}
						}, function(res) {});
					} else {
						scan.close();
						mui.toast('请扫描设备码');
						document.body.querySelector('#detail button').style.display = 'none';
						document.body.querySelector('#detail p').innerText = code;
						document.getElementById('detail').classList.add('to-top');
					}
				}
			} else if(e.State == 2 && fromtype != "eq") {
				mui.toast("疑似假冒产品");
				var url = ApiService.Api50 + "/api/v1/MdCode/GetProdInfoByMdCode?code=" + code + "&CompID=" + user.CompID;
				DataService.get(url).then(function(reData) {
					var localSaveData = {
						type: 1,
						scanTime: getCurrentTime(),
						mdCode: code,
						ID: reData.ProdID,
						SkuID: reData.SkuID,
						Name: reData.ProdName,
						SkuName: reData.SkuName,
						LogoIsExist: reData.LogoIsExist || false,
						CodeCreateUserName: reData.CodeCreateUserName,
						CompID: reData.CompID,
						CompName: reData.CompName,
						InnerCode: reData.InnerCode,
						InnerCodeName: user.InnerCodeName || "出厂编号"
					}
					saveScanHistory(localSaveData);
					reData.SkuName = encodeURIComponent(reData.SkuName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
					reData.ProdName = encodeURIComponent(reData.ProdName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
					reData.CompName = encodeURIComponent(reData.CompName.replace(/\'/g, "@squotes@").replace(/\"/g, "@dquotes@").replace(/\%/g, "@percent@"));
					if(user.CompID == reData.CompID) {
						loadInnerUrl("../problib/scanDetails.html?MDCode=" + code + "&ProdID=" + reData.ProdID + "&ProdName=" + reData.ProdName + "&SkuID=" + reData.SkuID + "&SkuName=" + reData.SkuName + "&ProdInnerCode=" + reData.InnerCode + "&LogoIsExist=" + reData.LogoIsExist + "&CompID=" + reData.CompID + "&CompName=" + reData.CompName); //正品
					} else {
						// loadOtherUrl(ApiService.M + "?" + code + "&ismdt=1");
						loadInnerUrl("../problib/prod-info.html?mdcode=" + code + "&prodid=" + reData.ProdID + "&skuid=" + reData.SkuID)
					}
				}, function(res) {});
			} else if(e.State == 3) {
				if(fromtype != "eq") {
					if(e.Data.CompID == user.CompID || (e.Data.CompID == 11 && user.CompID > 0)) {
						loadInnerUrl("../problib/scanDetails.html?MDCode=" + code);
					} else {
						scan.close();
						document.body.querySelector('#detail button').style.display = 'none';
						document.body.querySelector('#detail p').innerText = code;
						document.getElementById('detail').classList.add('to-top');
						document.getElementById('compname').style.display = "block";
						document.getElementById('compname').innerText = "所属企业：" + e.Data.CompName;
						document.getElementById('tip').style.display = "block";
					}
				} else {
					//绑定设备
					if(e.Data.CompID == user.CompID) {
						loadInnerUrl("../eqmentlib/equ-edit.html?mdcode=" + code);
					} else {
						var btnArray = ['重新扫描', '返回'];
						mui.confirm('该迈迪国标通用物联码未绑定任何产品或设备', "提示", btnArray, function(e) {
							if(e.index == 1) {
								scan.close();
								mui.back();
							} else {
								scan.start();
							}
						});
					}

				}

			} else if(e.State == 6) { //已经报废
				scan.close();
				document.body.querySelector('#detail button').style.display = 'none';
				document.body.querySelector('#detail p').innerText = code;
				document.getElementById('detail').classList.add('to-top');
			} else {
				scan.close();
				e.State != 3 && mui.toast("此二维码不是正确的迈迪国标通用物联码");
				document.body.querySelector('#detail button').style.display = 'none';
				document.body.querySelector('#detail p').innerText = code;
				document.getElementById('detail').classList.add('to-top');
			}
		});
	}
	//迈迪通号判定
	function checkMdt(code) {
		var mdt = user.CompMdt;
		while(mdt.length < 8) {
			mdt = '0' + mdt;
		}
		//个人用户直接返回
		if(user.CompID == 0) {
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
		getSiteNameByDomain(url);
	}

	//打开内部链接地址
	function loadInnerUrl(url, data) {
		var winid = url.substring(url.lastIndexOf('/') + 1, url.indexOf('?'));
		var innerWs = openWindow(url, data || {}, winid, true);
		innerWs.addEventListener('show', function() {
			innerWs.opener().close("none");
		}, false);
	}
	//获取外部网站名称
	function getSiteNameByDomain(_url) {
		var urlReg = /[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
		var urls = urlReg.exec(_url);
		var url = "https://www.sojson.com/api/beian/" + urls[0];
		getAjaxData(url, function(reData) {
			var innerWs = openWindow('template.html', {
				author: reData.sitename,
				title: '分享',
				url: _url
			});

			innerWs.addEventListener('show', function() {
				innerWs.opener().close("none");
			}, false);
		});
	};

	//保存扫描迈迪国标通用物联码记录{type:1,scanTime:'',mdCode:'',parameters:''}   type 1 产品扫码2,设备扫码 3 关注企业  4 加好友····
	//parameters 地址后跟的参数 串  多个 mdCode=" + code + "&state=2" + "&ecode=" + ecode
	function saveScanHistory(key) {
		var searchHistory = localGet("Scan_History" + user.UserID);
		if(searchHistory) {
			var index = duplicateChecking(searchHistory, key);
			if(index > -1) {
				//已有记录--移动到最前
				searchHistory.splice(index, 1);
				searchHistory.splice(0, 0, key);
				localSave("Scan_History" + user.UserID, searchHistory);
			} else {
				var seaLength = searchHistory.length;
				if(seaLength < 21) {
					searchHistory.splice(0, 0, key);
					localSave("Scan_History" + user.UserID, searchHistory);
				} else {
					searchHistory.splice(19, 1);
					searchHistory.splice(0, 0, key);
					localSave("Scan_History" + user.UserID, searchHistory);
				}
			}
		} else {
			var arr = [];
			arr.push(key);
			localSave("Scan_History" + user.UserID, arr)
		}
	};
	//查重
	function duplicateChecking(arr, key) {
		for(var i = 0; i < arr.length; i++) {
			if(arr[i].mdCode == key.mdCode) {
				return i;
			}
		}
		return -1;
	};
	init();
	//初始化
	function init() {
		try {
			// 获取窗口对象
			ws = plus.webview.currentWebview();
			wo = ws.opener();

			// 开始扫描
			ws.addEventListener('show', function() {
				createScan();
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

	};
	//刷新关闭popover
	RPCObserver.on('close_popover', 'close_popover');
	window.close_popover = function() {
		$scope.iconmoreClose && $scope.iconmoreClose.close();
	}
}]);
mui.plusReady(function() {
	angular.bootstrap(document.getElementById("MdTong"), ["MdTong"]);
});