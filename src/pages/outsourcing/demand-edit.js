var muiObj = {
	init: function() {
		mui.init();
		muiObj.plusreadyInit()
	},
	plusreadyInit: function() {
		mui.plusReady(muiObj.plusReadyCallback)
	},
	plusReadyCallback: function() {

		dom.event.init();

		user.ready(function() {
			vm.userCompID = user.CompID
			if(vm.id) {
				curData.GetDemandInfo();
			} else {
				curData.getDefautAddr();
				vm.data.PostAddrModel.RecvUserName = user.RealName;
				vm.data.PostAddrModel.LinkPhone = user.Phone;
			}

		});
	}
};

var dom = {
	init: function() {
		dom.picker.init();
	},
	event: {
		init: function() {
			dom.event.initRadio();

			//dom.event.initMetarial();

			dom.event.initDatePicker();

			dom.event.initAddressPicker();

			dom.event.initPhotoPick();

			dom.event.initBtns();

			dom.event.initProcess();
		},
		initRadio: function() {
			mui(".demand-ex").on("tap", ".mui-table-view-cell", function() {
				var dataName = this.getAttribute("data-name");
				var dataValue = this.getAttribute("data-value");

				vm.data[dataName] = dataValue;
			});
		},
		initMetarial: function() {
			mui(".metarial").on("tap", ".body,.opt", function() {
				document.activeElement.blur();
				setTimeout(function() {
					dom.picker.metarial.obj.show(function(items) {
						vm.data.MaterialID = items[0].value;
						vm.data.MaterialName = items[0].text;
					});
				}, 300);

			});
		},
		initDatePicker: function() {
			mui(".date-pick").on("tap", ".body,.opt", function() {
				var value = this.parentElement.getAttribute("data-value");
				var name = this.parentElement.getAttribute("data-name");

				document.activeElement.blur();

				setTimeout(function() {
					dom.picker.dtPicker.show(value.split(" ")[0], name);
				}, 300)

			})
		},
		initAddressPicker: function() {
			mui(".add-pick").on("tap", ".body,.opt", function() {
				var province = this.parentElement.getAttribute("province");
				var city = this.parentElement.getAttribute("city");
				var district = this.parentElement.getAttribute("district");
				var maplng = this.parentElement.getAttribute("maplng");
				var maplat = this.parentElement.getAttribute("maplat");
				var address = this.parentElement.getAttribute("address");
				var street = this.parentElement.getAttribute("street");
				var dataname = this.parentElement.getAttribute("data-name");

				dom.picker.address.show(province, city, district, address, street, maplng, maplat, dataname);
			});
		},
		initPhotoPick: function() {

			mui(".d_photos").on("tap", ".add_photo", function() {
					document.activeElement.blur();
					if(vm.tempPhotos.length>=9){
						mui.toast("上传图纸数量最多为9张");
						return;
					}
					setTimeout(function() {
						plus.nativeUI.actionSheet({
							title: "添加照片",
							cancel: "取消",
							buttons: [{
								title: "拍照"
							}, {
								title: "从相册选择照片"
							}]
						}, function(e) {
							if(e.index == 1) { //拍摄照片
								dom.picker.photo.takePictrue();
							} else if(e.index == 2) { //相册选取
								dom.picker.photo.show();
							}
						});
					}, 300);

					//dom.picker.photo.show();
				}).on("tap", "img", function() {
					document.activeElement.blur();
				})
				.on("tap", "i", function(_event) {
					_event.stopPropagation();
					var type = this.parentElement.getAttribute("data-type");
					var index = this.parentElement.getAttribute("data-idx");
					if(type == "temp") {
						vm.tempPhotos.splice(index, 1);
					} else {
						vm.deletePhotos.push(vm.data.AttachmentList[index]);
						vm.data.AttachmentList.splice(index, 1);
					}
				})
		},
		initBtns: function() {
			mui(".btns").on("tap", ".btn_release", function() {
				document.activeElement.blur();
				if(!dom.form.check()) {
					return;
				}
				if(vm.userCompID == 0 && (user.CompName == "" || /^\d+?.*$/.test(user.RealName) || user.RealName =="")) {
					vm.popupType = true;
					if(/^\d+?.*$/.test(user.RealName)){
						vm.data.RealName;
					}else{
						vm.data.RealName = user.RealName;
					}
					vm.data.CompName = user.CompName;
					mui(".name_submit").on("tap", ".name_submit_y", function() {
						if(!dom.form.nameCheck()) {
							return;
						} else {
							curData.getNameInfo();
							//用户提交后  不重新登陆就获取最新信息！
							var users = localGet("user");
							users.CompName = vm.data.CompName;
							users.RealName = vm.data.RealName;
							localSave("user", users);
							curData.save();
							//保存完刷新首页webview
//							plus.webview.getWebviewById("demand-list.html").reload()
							RpcClient.invoke("demand-list.html", "RPC_Refresh_demand_list");
							return;
						}

					}).on("tap", ".name_submit_n", function() {
						vm.data.RealName = "";
						vm.data.CompName = "";
						vm.popupType = false;
						return;
					});
				} else {
					if(vm.joinCompID) {
						mui.confirm('发布后对方将直接中标，是否发布？', '提醒', ['取消', '确认'], function(e) {
							if(e.index == 1) {
								curData.save();
								//保存完刷新首页webview
//								plus.webview.getWebviewById("demand-list.html").reload();
RpcClient.invoke("demand-list.html", "RPC_Refresh_demand_list");
							}
						});
					} else {
						curData.save();
						//保存完刷新首页webview
//						plus.webview.getWebviewById("demand-list.html").reload();
RpcClient.invoke("demand-list.html", "RPC_Refresh_demand_list");

					}
				}

			}).on("tap", ".btn_draft", function() {
				document.activeElement.blur();
				if(!dom.form.check()) {
					return;
				}
				curData.saveDraft();
			});
		},
		initProcess: function() {
			//重试、在线沟通、返回
			mui(".notice")
				.on("tap", ".btn-col.success", function() {
					mui.back();
				})
				.on("tap", ".btn-col.close", function() {
					document.body.querySelector(".notice").style.display = "none";
					app.Process.SaveState = 0;
				}).on("tap", ".retry", function() {
					var step = this.getAttribute("data-step");
					if(step == 1) {
						curData.savePhotos();
					} else if(step == 2) {
						curData.saveInfo();
					} else if(step == 3) {
						curData.deletePhotos();
					}
				});
		}
	},
	plugin: {
		mescroll: function() {

		}
	},
	picker: {
		init: function() {
			dom.picker.metarial.init();
		},
		photo: {
			show: function() {
				pickImage(function(res) {
					if(res) {
						var imgTotal=vm.tempPhotos.length+res.length;
						if(imgTotal>9){
							mui.toast("上传图纸数量最多为9张");
							return false;
						}
						vm.tempPhotos.pushArray(res);
					}

				}, true);
			},
			takePictrue: function() {
				captureImage(function(res) {
					
					if(res) {
						vm.tempPhotos.push(res);
					}
				});
			}
		},
		address: {
			callback: function(addr, type) {
				if(addr) {
					vm.data.PostAddrModel.Province = addr.Province;
					vm.data.PostAddrModel.City = addr.City;
					vm.data.PostAddrModel.District = addr.District;
					vm.data.PostAddrModel.Address = addr.Address;
					vm.data.PostAddrModel.Street = addr.Street;
					vm.data.PostAddrModel.MapLng = addr.MapLng;
					vm.data.PostAddrModel.MapLat = addr.MapLat;
					vm.data.PostAddrModel.LinkPhone = addr.LinkPhone;
					vm.data.PostAddrModel.RecvUserName = addr.RecvUserName;
					vm.data.PostAddrModel.PostID = addr.ID;
				} else {
					if(type == "del" || !vm.data.PostAddrModel.ID) {
						curData.getDefautAddr();
					} else {
						curData.getAddrInfo();
					}

				}

			},
			show: function(province, city, district, address, street, maplng, maplat, dataname) {
				openWindow("pick_user_addr.html?id=" + user.UserID, {
					callback: "dom.picker.address.callback",
					data: vm.data.PostAddrModel
				}, "pick_user_addr.html.html");
				//openWindow("../shop/select-address.html?id="+user.UserID, {callback: "dom.picker.address.callback"	}, "pick_user_addr.html.html");
			}
		},
		dtPicker: {
			show: function(curValue, dataName) {

				var date = new Date();

				var curYear = date.getFullYear();
				var curMonth = date.getMonth() + 1;
				var curDay = date.getDate();

				var options = {
					value: curValue ? curValue : curYear + "-" + curMonth + "-" + curDay,
					beginYear: curYear,
					type: "date"
				};
				var picker = new mui.DtPicker(options)
				picker.show(function(rs) {
					vm.data[dataName] = rs.text + " 00:00:00";
					picker.dispose();
				})
			}
		},
		metarial: {
			obj: "",
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
			init: function() {
				dom.picker.metarial.obj = new mui.PopPicker();
				dom.picker.metarial.obj.setData(dom.picker.metarial.data);
			}

		}
	},
	form: {
		check: function() {
			if(/^\s*$/g.test(vm.data.DemandName)) {
				mui.toast("请讲述下你的需求");
				return false;
			}

			if(vm.data.DemandName.length > 50) {
				mui.toast("需求不能超过50个字");
				return false;
			}

			//			if(/^\s*$/g.test(vm.data.Budget)) {
			//				mui.toast("请输入您的预算");
			//				return false;
			//			}
			//

			//			if(vm.data.Budget && parseFloat(vm.data.Budget) <= 0) {
			//				mui.toast("预算必须大于0");
			//				return false;
			//			}
			if(!(/^\d+(\.\d{1,2})?$/.test(vm.data.Budget))) {
				if(!(/^\s*$/g.test(vm.data.Budget))) {
					mui.toast("预算最多保留两位小数");
					return false;
				} 
			}
			if(vm.data.Budget && parseInt(vm.data.Budget) > 9999999) {
				mui.toast("预算不能超过千万");
				return false;
			}

			if(/^\s*$/g.test(vm.data.Amount)) {
				mui.toast("请输入您的加工数量");
				return false;
			}

			if(parseInt(vm.data.Amount) <= 0) {
				mui.toast("加工数量必须大于0的整数");
				return;
			}

			if(parseInt(vm.data.Amount) > 9999999) {
				mui.toast("加工数量不能超过千万");
				return;
			}

			if(/^\s*$/g.test(vm.data.BidEndDate)) {
				mui.toast("请选择投标截止日期");
				return false;
			}

			if(/^\s*$/g.test(vm.data.BidEndDate)) {
				mui.toast("请选择投标截止日期");
				return false;
			}

			if(vm.data.BidEndDate.split(" ")[0] < getCurrentTime().split(" ")[0]) {
				mui.toast("投标截止日期不能小于当前日期！");
				return false;
			}

			if(/^\s*$/g.test(vm.data.PreDeliveryDate)) {
				mui.toast("请选择计划交货日期");
				return false;
			}

			if(vm.data.PreDeliveryDate <= vm.data.BidEndDate) {
				mui.toast("计划交货日期不能小于或等于投标截止日期");
				return false;
			}

			if(/^\s*$/g.test(vm.data.PostAddrModel.Province)) {
				mui.toast("请选择收货地址");
				return false;
			}

			//			if(vm.tempPhotos.length == 0 && vm.data.AttachmentList.length == 0) {
			//				mui.toast("请上传图纸");
			//				return false;
			//			}

			if(/^\s*$/g.test(vm.data.MaterialName)) {
				mui.toast("请填写主要材质");
				return false;
			}

			if(vm.data.MaterialName.length > 50) {
				mui.toast("主要材质的长度不能超过50个字");
				return;
			}

			if(vm.data.BidEndDate.split(" ").length == 1) {
				vm.data.BidEndDate += " 00:00:00"
			}

			if(vm.data.PreDeliveryDate.split(" ").length == 1) {
				vm.data.PreDeliveryDate += " 00:00:00"
			}

			return true;

		},
		nameCheck: function() {
			if(vm.data.RealName.length > 10) {
				mui.toast("姓名不能超过10个字");
				return false;
			}
			if(vm.data.CompName.length > 40) {
				mui.toast("企业名称不能超过40个字");
				return false;
			}
			if(/^\s*$/g.test(vm.data.RealName)) {
				mui.toast("请输入您的姓名");
				return false;
			}
			if(/^\d+?.*$/.test(vm.data.RealName)){
				mui.toast("姓名不能以数字开头")
				return false;
			}
//			if(/^\s*$/g.test(vm.data.CompName)) {
//				mui.toast("请输入您的企业名称");
//				return false;
//			}
			return true;
		}
	},
	RefreshParent: function() {
		var view = plus.webview.currentWebview();

		if(view.opener().id.indexOf("demand-list.html" >= 0)) {
			view.opener().evalJS("dom.Refresh()");
			//20171104,张强说发布完需要刷新首页外协需求，故加上此调用，上面的refresh没有刷新首页外协需求
			view.opener().evalJS("curData.demand.load()");
		} else if(view.opener().id == "index.html" && vm.data.State == "1") {
			view.opener().evalJS("dom.plugin.mescroll.obj.triggerDownScroll()");
		}
	}
};

var curData = {
	GetDemandInfo: function() {
		var url = MdAppUrl.Api45 + "/api/v1/EpDemand/GetDemandInfo?demandId=" + vm.id;
		getAjaxData(url, function(res) {
			
			if(res && res.State > 0) {
				vm.data = res.Data;
				//保证草稿箱预算为0的时候显示为空；
				if(vm.data.Budget == 0) {
					vm.data.Budget = "";
				}
				var meterialData = dom.picker.metarial.data.filter(function(_item) {
					return _item.value == res.Data.MaterialID;
				});
				if(meterialData.length > 0) {
					vm.data.MaterialName = meterialData[0].text;
				}
			} else {
				mui.toast("获取需求信息失败！" + res.ErrorMessage)
			}
		});
	},
	save: function() {
		vm.data.State = 1;
		curData.saveToService();
	},
	saveDraft: function() {
		vm.data.State = 0;
		curData.saveToService();
	},
	deletePhotos: function() {

		if(vm.deletePhotos.length > 0 && vm.Process.ProcessList[0].State != 2) {
			vm.Process.ProcessList[0].State = 1;
			curData.photos.delete(vm.Process.ProcessList[0].Index);
		} else {
			vm.Process.ProcessList[0].State = 2;
			curData.savePhotos();
		}
	},
	savePhotos: function() {
		var idx = vm.id ? 1 : 0;
		if(vm.tempPhotos.length > 0 && vm.Process.ProcessList[idx].State != 2) {
			vm.Process.ProcessList[idx].State = 1;
			curData.photos.upload(vm.Process.ProcessList[idx].Index);
		} else {
			vm.Process.ProcessList[idx].State = 2;
			curData.saveInfo();
		}
	},
	photos: {
		datas: [],
		delDatas: [],
		upload: function(idx) {
			var processIdx = vm.id ? 1 : 0;
			var url = MdAppUrl.Api45 + "/api/v1/EpDemand/DemandFileUpload";
			//首先压缩照片
			zipImage(vm.tempPhotos[idx], function(src, dst, status) {
				//压缩完毕后，不管成功与否，都上传图片
				uploadFile(url, dst, idx, function(index, t, status) {
					if(status) { //上传成功，加入到成功队列
						var data = JSON.parse(t.responseText);

						curData.photos.datas.push({
							ID: 0,
							UUID: data.Data,
							FileName: ""
						});

						vm.Process.ProcessList[processIdx].Index += 1;
					}
					//全部传了一遍后，判断是否全部上传成功了。
					if((vm.Process.ProcessList[processIdx].Index) == vm.tempPhotos.length) {
						if(curData.photos.datas.length == vm.tempPhotos.length) {
							vm.Process.ProcessList[processIdx].State = 2;
							vm.data.AttachmentList.pushArray(curData.photos.datas);
							curData.saveInfo();
						} else {
							vm.Process.ProcessList[processIdx].State = 3;
							vm.Process.SaveState = 3;
						}
					} else {
						curData.photos.upload(vm.Process.ProcessList[processIdx].Index);
					}
				});
			}, "50%", "phone" + vm.tempPhotos[idx]);

		},
		delete: function(idx) {
			var url = MdAppUrl.Api45 + "/api/v1/EpDemand/DeleteDemandFile?fileId=" + vm.deletePhotos[idx].ID;

			getAjaxData(url, function(res) {
				if(res && res.State > 0) {
					vm.Process.ProcessList[0].Index += 1;
					curData.photos.delDatas.push(vm.deletePhotos[idx]);

					if((vm.Process.ProcessList[0].Index) == vm.deletePhotos.length) {
						if(curData.photos.delDatas.length == vm.deletePhotos.length) {
							vm.Process.ProcessList[0].State = 2;
							curData.savePhotos();
						} else {
							vm.Process.ProcessList[0].State = 3;
							vm.Process.SaveState = 3;
						}
					} else {
						curData.photos.delete(vm.Process.ProcessList[0].Index);
					}

				} else {
					vm.Process.ProcessList[0].State = 3;
					vm.Process.SaveState = 3;
				}
			}, true)
		}
	},
	saveInfo: function() {
		var idx = vm.id ? 2 : 1;
		vm.Process.ProcessList[idx].State = 1;

		//判断是否是指定外协企业
		if(vm.joinCompID) {
			vm.data.IsAssignComp = 1;
			vm.data.JoinCompID = vm.joinCompID;
		}

		var url = MdAppUrl.Api45 + "/api/v1/EpDemand/SaveDemandInfo";

		postAjaxData(url, vm.data.$model, function(res) {
			if(res && res.State > 0) {
				vm.Process.ProcessList[idx].State = 2;
				vm.Process.SaveState = 1;

				dom.RefreshParent();

			} else {
				mui.toast(res.ErrorMessage);
				vm.Process.ProcessList[idx].State = 3;
				vm.Process.ProcessList[idx].State = 3;
			}
		}, true);

	},
	saveToService: function() {
		vm.Process.SaveSate = 2;
		document.querySelector(".notice").style.display = "block";
		if(vm.id) {
			curData.deletePhotos();
		} else {
			curData.savePhotos();
		}

	},
	getDefautAddr: function() {
		var url = MdAppUrl.Api45 + "/api/v1.0/Trade/GetDefaultAddr";
		getAjaxData(url, function(data) {
			if(data.Data && data.State == 1) {
				vm.data.PostAddrModel.Province = data.Data.Province;
				vm.data.PostAddrModel.City = data.Data.City;
				vm.data.PostAddrModel.District = data.Data.District;
				vm.data.PostAddrModel.Address = data.Data.Address;
				vm.data.PostAddrModel.Street = data.Data.Street;
				vm.data.PostAddrModel.MapLng = data.Data.MapLng;
				vm.data.PostAddrModel.MapLat = data.Data.MapLat;
				vm.data.PostAddrModel.LinkPhone = data.Data.LinkPhone;
				vm.data.PostAddrModel.RecvUserName = data.Data.RecvUserName;
				vm.data.PostAddrModel.PostID = data.Data.ID;
			}
		}, true);
	},
	getAddrInfo: function() {
		var url = MdAppUrl.Api42 + "/api/PostAddr/GetByID?addrID=" + vm.data.PostAddrModel.PostID;
		getAjaxData(url, function(data) {
			if(data.Data && data.State == 1) {
				vm.data.PostAddrModel.Province = data.Data.Province;
				vm.data.PostAddrModel.City = data.Data.City;
				vm.data.PostAddrModel.District = data.Data.District;
				vm.data.PostAddrModel.Address = data.Data.Address;
				vm.data.PostAddrModel.Street = data.Data.Street;
				vm.data.PostAddrModel.MapLng = data.Data.MapLng;
				vm.data.PostAddrModel.MapLat = data.Data.MapLat;
				vm.data.PostAddrModel.LinkPhone = data.Data.LinkPhone;
				vm.data.PostAddrModel.RecvUserName = data.Data.RecvUserName;
				vm.data.PostAddrModel.PostID = data.Data.ID;
			}
		}, true);
	},
	getNameInfo: function() {
		var url = MdAppUrl.Api45 + "/api/v1.0/User/SetUserForName?RealName=" + vm.data.RealName + "&CompName=" + vm.data.CompName;
		getAjaxData(url, function(data) {
			if(data.Data) {
				vm.popupType = false;
			}
		}, true);
	}
};
var vm = avalon.define({
	$id: "myCtl",
	id: query("id"),
	joinCompID: query("compId") || "",
	joinCompName: decodeURI(query("compName") || ""),
	contractAddress: contractAddress,
	tempPhotos: [],
	deletePhotos: [],
	userCompID: 0,
	popupType: false,
	renderPhotosComplate: function() {
		//查看产品大图
		mui.previewImage();
	},
	isPicture: function(ext) {
		if(['.temp', '.bmp', '.jpg', '.png', '.tiff', '.gif', '.pcx', '.tga', '.exif', '.fpx', '.svg', '.psd', '.cdr', '.pcd', '.dxf', '.ufo', '.eps', '.ai', '.raw', '.WMF'].indexOf(ext.toLowerCase()) >= 0) {
			return true;
		} else {
			return false;
		}
	},
	getPicture: function(id, ex, ext) {
		return MdAppUrl.Api45 + "/api/v1.0/epdemand/" + id + "_" + ex + ext;
	},
	data: {
		ID: 0,
		DemandName: "",
		Budget: "",
		Amount: "",
		BidEndDate: "",
		PreDeliveryDate: "",
		RealName: "",
		CompName: "",
		PostAddrModel: {
			ID: 0,
			PostID: 0,
			Province: "",
			City: "",
			District: "",
			Address: "",
			Street: "",
			MapLng: 0,
			MapLat: 0,
			RecvUserName: "",
			LinkPhone: ""
		},
		AttachmentList: [],
		DemandType: 1,
		IsHasPenalty: 1,
		IsHasWarranty: 0,
		IsHasTransferFee: 0,
		IsHasTax: 0,
		DemandFrom: 3, //1云平台 2设计宝 3迈迪通 3迈迪网
		MaterialName: "",
		State: 0,
		IsAssignComp: 0,
		JoinCompID: 0

	},
	Process: {
		SaveState: 0, //0未保存 1保存成功 2保存中 3保存失败
		ProcessList: [{
			Text: "删除图片",
			State: 0,
			Index: 0
		}, {
			Text: "上传图片",
			State: 0, //0未执行 1执行中 2完成 3失败
			Index: 0
		}, {
			Text: "保存需求",
			State: 0,
		}]
	}
});

muiObj.init();
dom.init();
var muiback = mui.back
mui.back = function() {
	if(vm.popupType) {
		vm.popupType = false;
		return;
	} else {
		muiback();
	}
}