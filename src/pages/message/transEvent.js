//type:
//7:事件 
//	equ-fault：设备故障
//  fault: 故障工单
//  repair-log：维修日志
//  user-card : 名片
//  custom：用户
//  suuplier：供应商
//  equ-insp：设备检修
//  equ-preserve：设备保养
//  equ-insp-remind：设备检修提醒
//  equ-repair：设备维修
//  repair：故障维修
//  repair-req:领料单
//  question：设计圈
//  standard：标准件
//  currency:通用件
//  comp:企业
//  equInfo:设备详情
//  other-service:其他服务
// anti-fake：方位报警
// fleeing-goods：窜货预警 dataFrom 19
// jr-equ-maintain 佳润定制--设备保养
// crm-follow 跟进记录
// crm-task 任务
//crm-customer
//crm-order
//设备购置申请 equ-apply
//设备报废申请 equ-scraping
//设备盘点 equ-inventory
//设备保养equ-mainten
var transEvent = {

	rpcArray: ['equ-fault', 'fault', 'repair-log', 'equ-insp', 'equ-repair', 'repair', 'equInfo', 'debug'],
	dataFrom: {
		'equ-fault': 1,
		'fault': 4,
		'repair-log': 8,
		'equ-insp': 3,
		'equ-repair': 2,
		'repair': 6,
		'equInfo': 9,
		'debug': 5
	},
	trigger: function(type, options) {
		switch(type) {
			case 7:
				transEvent.event(options.name, options.params, options.curId);
				break;
			case 8:
				break;
		}
	},
	rpcSend: function(evName, logid) {
		RpcClient.invoke("msg-all.html", 'RPC_SetReadedStateForChat', logid);
		RpcClient.invoke("msg-list.html", 'RPC_UnreadRefreshForChat', this.dataFrom[evName]);
	},
	event: function(evName, params, curId) {
		var _params = params.split(",");
//		console.log(JSON.stringify(_params))
		var _this = this;
		_this.rpcArray.indexOf(evName) >= 0 && (_this.rpcSend(evName, _params[1]));

		switch(evName) {
			case "equ-fault":
				// var url = "../eqmentlib/fault-info.html";
				transEvent.getAuth(_params[0], _params[1]);
				// transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'fault-info.html');
				break;
			case "fault":
				// var url = "../aftersale/mat-fault-info.html";
				// transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'mat-fault-info.html');
				transEvent.getAuth(_params[0], _params[1]);
				break;
			case "repair-log":
			case "log-eval":
				var url = "../aftersale/work-info.html?id=" + _params[0];
				_params[1] && (url += "&logid=" + _params[1]);
				transEvent.openWindow(url, 'work-info.html');
				break;
			case "user-card":
				var url = "";
				if(curId == _params[0]) {
					url = "../mine/personal-information.html";
				} else {
					url = "../contact/personal-info.html?userId=" + _params[0];
				}
				transEvent.openWindow(url, 'personal-info.html');
				break;
			case "equ-insp":
//				var url = "../eqmentlib/equ-maintenanceView.html";
//				transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'equ-maintenanceView.html');
				var url = "../eqmentlib/equ-patrol-all-info.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&planId=" + _params[1] + "&eqId=" + _params[2] + "&planLogId=" + _params[3] + "&isEdit=true&done=false", 'equ-patrol-all-info.html');
				break;
			case "equ-preserve":
				var url = "../eqmentlib/equ-preserveView.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'equ-preserveView.html');
				break;
			case "equ-insp-remind":
				var url = "../eqmentlib/equ-details.html";
				transEvent.openWindow(url + "?equid=" + _params[0] + "&logid=" + _params[1], 'equ-details.html');
				break;
			case "equ-repair":
				var url = "../eqmentlib/equ-repairView.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'equ-repairView.html');
				break;
			case "repair":
				var url = "../aftersale/mat-repairView.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'mat-repairView.html');
				break;
			case "repair-req":
				var url = "../aftersale/pick-detailsList.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&logid=" + _params[1], 'pick-detailsList.html');
				break;
			case "comp":
				var url = "../complib/index.html?compid=" + _params[0]
				transEvent.openWindow(url, 'complib/index.html');
				break;
			case "supplier":
				dom.properties.BillService.openView("mdt-supplier-manage", _params[0]);
				break;
			case "custom":
				transEvent.openWindow("../customer/customer-info.html?customerid=" + _params[0], 'customer-info.html');
				break;
			case "equInfo":
				var url = "../eqmentlib/equ-details.html?equid=" + _params[0] + "&logid=" + _params[1];

				transEvent.openWindow(url, "equ-details.html");
				break;
			case "debug":
				var url = "../aftersale/debug-info.html?id=" + _params[0] + "&logid=" + _params[1];
				transEvent.openWindow(url, "debug-info.html");
				break;
			case "other-service":
				var url = "../aftersale/service-info.html?id=" + _params[0];
				transEvent.openWindow(url, "service-info.html");
				break;
			case "currency": //打开产品
				dom.properties.TapService.openProdInfo(_params[0], _params[2]);
				break;
			case "anti-fake": //方位报警
				var url = "../problib/scan-abnormal-info.html?id=" + _params[0] + "&logid=" + (_params[1] || "");
				transEvent.openWindow(url, "scan-abnormal-info.html");
				break;
			case "fleeing-goods": //窜货预警
				var url = "../problib/scan-cabnormal-info.html?id=" + _params[0] + "&logid=" + (_params[1] || "");
				transEvent.openWindow(url, "scan-cabnormal-info.html");
				break;
			case "question":
				var url = "../ing/ing-info.html?id=" + _params[0];
				transEvent.openWindow(url, "ing-info.html");
				break;
			case "jr-equ-maintain": //佳润定制
				var url = "../customized/JiaRun/J-repair-info.html?id=" + _params[0];
				transEvent.openWindow(url, "J-repair-info.html");
				break;
			case "crm-follow":
				transEvent.openWindow("../crm/index.html#/followDetails/" + _params[0] + "?backIndex=1")
				break;
			case "crm-task":
				transEvent.openWindow("../crm/index.html#/TaskInfo?id=" + _params[0] + "&backIndex=1")
				break;
			case "crm-customer":
				transEvent.openWindow("../crm/index.html#/client/clientDetails?id=" + _params[0] + "&backIndex=1")
				break;
			case "crm-order":
				transEvent.openWindow("../crm/index.html#/orderInfo?id=" + _params[0] + "&backIndex=1")
				break;
			case "equ-apply":
				//审核人的ID _params[2]
				//对方id dom.properties.scope.chatData.chatID
				//当前登录人dom.properties.CacheService.get("user")
				//提交人暨发送方--打开进入购置详情equ-purchase-info.html
				//审核人暨接收方--打开进入审核详情equ-approve-info.html

				if(curId == _params[2]) {
					//当前登录人是审核人
					var url = "../eqmentlib/equ-approve-info.html?applyId=" + _params[0] + "&applyType=1";
					transEvent.openWindow(url, "equ-approve-info.html");
				} else {
					//当前登录人是提交人
					var url = "../eqmentlib/equ-purchase-info.html?id=" + _params[0];
					transEvent.openWindow(url, "equ-purchase-info.html");
				}
				break;
			case "equ-scraping":
				//提交人、审核人--打开进入报废审核详情
				//审核人的ID _params[1]
				var url = "../eqmentlib/equ-approve-info.html?applyId=" + _params[0] + "&applyType=2";
				transEvent.openWindow(url, "equ-approve-info.html");
				break;
			case "equ-inventory":
				var url = "../eqmentlib/equ-inventoryEqu-list.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&message=true", 'equ-inventoryEqu-list.html');
				//				var url = "../eqmentlib/equ-inventory-info.html";
				//				transEvent.openWindow(url + "?planId=" + _params[0] + "&cId=", 'equ-inventory-info.html');
				break;
			case "equ-mainten":
				var url = "../eqmentlib/equ-mainten-info.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&planId=" + _params[1] + "&eqId=" + _params[2]+'&planLogId='+_params[3] + "&isEdit=true" + "&done=true&hasdone=true", 'equ-mainten-info');
				break;
			case "inventory-detail":
				var url = "../eqmentlib/equ-check-all-info.html";
				transEvent.openWindow(url + "?id=" + _params[0] + "&planId=" + _params[1] + "&eqId=" + _params[2] + "&isEdit=true" + "&done=true", 'equ-check-all-info.html');
				break;
			case "demand":
				var url = "../outsourcing/demand_details.html";
				transEvent.openWindow(url + "?demandId=" + _params[0], 'demand_details.html');
				break;
			case "prod-scan-sign":
				var url = "../aftersale/prodSignInfo.html";
				transEvent.openWindow(url + "?id=" + _params[0], 'prodSignInfo.html');
				break;
			default:
				mui.toast("敬请期待！")
				break;

		}
	},
	getAuth: function(id, logId) {
		var url = dom.properties.ApiService.Api50 + "/api/v2/MatWorkOrder/GetWorkOrderSimpleInfo?id=" + id;
		var _data = dom.properties.scope.chatData;
		dom.properties.DataService.get(url).then(function(res) {
			if(res.WorkOrderType == 1) {
				if((_data.CompID > 0 && res.ReportCompID == _data.CompID && res.ProdCompID != _data.CompID) || (_data.CompID == 0 && _data.UserID == res.CreateUserID && res.JobFrom == 2)) {
					transEvent.openWindow("../mine/fault-info.html?id=" + id, 'fault-info.html');
				} else {
					transEvent.openWindow("../aftersale/mat-fault-info.html?id=" + id + "&logid=" + logId, 'mat-fault-info.html');
				}
			} else if(res.WorkOrderType == 2) {
				if(res.JobFrom == 1) {
					transEvent.openWindow("../eqmentlib/fault-info.html?id=" + id + "&logid=" + logId, 'fault-info.html');
				} else if(res.JobFrom == 2) {
					transEvent.openWindow("../mine/fault-info.html?id=" + id, 'fault-info.html');
				}
			}
		});
	},
	openWindow: function(url, id) {
		dom.properties.UtilsService.openWindow({
			needLogin: true,
			url: url,
			id: id,
			extras: {}
		});

		setTimeout(function() {
			dom.properties.UtilsService.clearWindow();
		}, 500);
	}
};