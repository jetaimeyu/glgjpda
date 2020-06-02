if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (prefix) {
		return this.slice(0, prefix.length) === prefix;
	};
}
if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function (suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}
/**
 * 类型示意
 * **/
//let text=[1,"文本内容",["12","#ffff"]];
//let icon =[2,"iconkey"];
//let link=[3,"连接文本","连接地址"];
//let image =[4,"图片路径","最大宽度","最大高度"];
//let attachment=[5,"附件文件名","附件大小 字节为单位","guid"];
//let voice =[6,"音频时长，秒为单位","guid"]==>[6,'路径','音频时长，秒为单位'];
//let event =[7,"eventName","logo_url","标题","简介",["参数1","参数2"]];
//let simpleEvent =[8,"eventName","标题",["参数1","参数2"]];
//
//let normal=[0,["上述的组合"]];
//for example =[0,[[8,"user","张三",[205],[1,"请来一下"]]];
//let groupNotice=[1,["上述组合"]];
//for example=[4,[[8,"user","张三",[205]],[1,"邀请您加入了群"],[8,"group","技术服务群"]]];

var transMessage = {
	eventNames: [],
	//解析结构类型
	trans: function (text, transType, isSend) {
		if (!text)
			return "";
		var msg = JSON.parse(text);

		var type = msg[0];
		var html = "";
		switch (type) {
			case 0: //普通消息
			case 1: //系统消息
			case 2: //工作通知
			case 3: //设计圈
			case 4: //群通知
				var content = msg[1];
				html = transMessage.transTextArray(msg[1], transType, isSend);
				break;
		}

		return html;
	},
	transTextArray: function (item, transType, isSend) {
		var html = "";
		if (angular.isNumber(item[0])) {
			html += this.trasnsByType(item, transType, isSend)
		} else if (angular.isArray(item)) {
			for (var i = 0; i <= item.length - 1; i++) {
				html += transMessage.transTextArray(item[i], transType, isSend)
			}
		}
		return html
	},
	trasnsByType: function (item, transType, isSend) {
		switch (item[0]) {
			case 1:
				return transMessage.transText(item, transType, isSend);
				break;
			case 2:
				return transMessage.transEmotion(item, transType, isSend);
				break;
			case 4:
				return transMessage.transImage(item, transType, isSend);
				break;
			case 6:
				return transMessage.transVoice(item, transType, isSend);
				break;
			case 7:
				return transMessage.transEvent(item, transType, isSend);
				break;
			case 5:
				return transMessage.transAttach(item, transType, isSend);
				break;
			case 99:
				var msg = "";
				if (isSend) {
					msg = "<span style='color:#ccc'>您抖了对方一下</span>"
				} else {
					msg = "<span style='color:#ccc'>对方抖了您一下</span>";
				}
				return msg;
				break;
		}
	},
	/**
	 * transType=1:解析表情 不解析图片
	 * transType=2:只解析文字 图片使用文本显示,图片也使用文本
	 * transType==3:不解析图片
	 * **/
	transText: function (item, transType, isSend) {

		var _dom = document.getElementById("tmep_trans");

		var _text = "";
		if (_dom && transType) {
			try {
				var obj = angular.element(item[1]);
				switch (obj[0].tagName) {
					case "IFRAME":
						_text = "[网页]";
						break;
					default:
						_text = obj[0].innerText;
						break;
				}
			} catch (e) {
				_dom.innerHTML = item[1];
				_text = replaceHTML(item[1]);
			}
		} else {
			_text = item[1];
		}

		if (!transType && item.length == 3) {
			var style = "";
			if (item[2][0]) {
				style += "font-size:" + item[2][0] + "px;";
			}
			if (item[2][1]) {
				style += "color:" + item[2][1] + ";";
			}

			_text = "<span style='" + style + "'>" + _text + "</span>";
		}

		return _text;
	},
	/*
	 *
	 * */
	transEmotion: function (item, transType, isSend) {
		if (transType != 2) {
			var img = "<img  style='margin-right:0px;' src='../../images/Emotion/" + emotionData[item[1]] + ".gif' value='" + item[1] + "' class='chatFace'/>";
			return img;
		} else {
			return item[1];
		}
	},
	transImage: function (item, transType, isSend) {
		if (transType > 1) {
			return "[图片]";
		} else {
			item[1] = item[1].replace(/\\/g, "/").replace(/(http?:)?(https?:)?\/\/mdbox.maidiyun.com\/50/g, dom.properties.ApiService.Api50);
			var _file = mui.os.android ? item[1].replace("file://", "") : item[1];
			if ((/^(file|https?):\/\//ig).test(item[1])) {
				return "<img class='imageview-native' src='" + item[1] + "' fullpath='" + _file + "' style='max-width:" + (parseInt(window.screen.width-150)) + "px' data-preview-group='1' /> <p class='attach-process'></p>"
			} else {
				var imgWidth = "";
				var imgHeight = "";
				if (item[3] > parseInt(window.screen.width-150 )) {
					imgWidth = parseInt(window.screen.width-150);
					imgHeight = parseInt(item[3] * imgWidth / item[2])
				} else {
					imgWidth = item[3];
					imgHeight = item[2]
				}

				var img = "";
				var imgStyle = "";
				var orgImgSrc = dom.properties.ApiService.Api50 + "/api/v1/File/DownLoadPic?filePath=" + item[1];
				if (item[1].endsWith(".gif")) {
					imgSrc = orgImgSrc;
					imgStyle = "max-width:" + imgWidth + "px";
					imgStyle = "height:" + imgHeight + "px";
				} else {
					imgSrc = orgImgSrc + "&w=" + imgWidth;
					imgStyle = "height:" + imgHeight + "px";
				}

				return "<img class='imageview-native'   src='" + imgSrc + "' style='" + imgStyle + "' fullpath='" + orgImgSrc + "' data-preview-group='1' /> ";
			}
		}
	},
	transVoice: function (item, transType, isSend) {
		if (transType > 1) {
			return "[语音]";
		} else {
			var html = "";
			html += "<div class='voice-item' data-file='" + item[1] + "' data-isSend='" + isSend + "' style='width:" + ((item[2] - 1) * 2 + 50) + "px;'>";
			if (isSend) {
				html += "<span>" + item[2] + "''</span>";
				html += "<img src='../../images/voice-record_r.png' />";
			} else {
				html += "<img src='../../images/voice.png' />";
				html += "<span>" + item[2] + "''</span>";
			}
			return html + "</div>  <p class='attach-process'></p> ";
		}
	},
	//解析event
	transEvent: function (item, transType, isSend) {
		if (transType > 1) {
			return item[3];
		} else {
			var html = [];
			var params = "";
			//			for(var i = 5; i < item.length; i++) {
			//				params += item[i] + ",";
			//			}

			params = item[5].join(",");

			html.push("<div class='ev-item' style='min-height:65px' data-name='" + item[1] + "' data-params='" + params + "'> ");

			if (item[2].indexOf(item[1]) > 0) {
				html.push("<img src='" + item[2] + "' />");
			} else {
				if (item[1].indexOf("user") >= 0) {
					if (item[5][item[5].length - 1] == true) {
						html.push("<img src='" + item[2] + "' style='border-radius: 50%;border: 1px solid #efefef;' />");
					} else {
						html.push('	<div class="md-userCustomLogo"  data-user="{{chatData.chatID}}">' + (item[3] && item[3].substring(0, 1)) + '</div>')
					}
				} else if (item[2]) {
					html.push("<div class='left-img' style='background-image:url(" + item[2].replace(/\\/g, "/") + ")'></div>");
				}
			}

			html.push("<div class='ev-body'>");
			html.push("<div class='ev-title'>" + item[3] + "</div>");
			html.push("<div class='ev-desc'>" + item[4] + "</div>");
			switch (item[1]) {
				case "prod-scan-sign":
					if (item[5][1]) {
						html.push("<div class='ev-desc'>" + item[5][1] + "</div>");
					}
					break;
				case "equ-apply":
				case "equ-scraping":
					if (item[5].length == 4) {
						html.push("<div " + (item[5][3] == '1' ? "class='ev-state color-green-light'" : "class='ev-state color-red-md'") + ">" + (item[5][3] == '1' ? '同意' : '驳回') + "</div>");
					}
					break;

				case "mddrive":
					var isDownload = false;

					var dirName = "",
						fileName = item[3];

					var filePath = item[5][0].split("/");
					filePath = filePath[filePath.length - 1].split(".")[0]
					dirName = "_doc/downloads/" + filePath + "/";
					fileName = fileName.replace(/\'/g, "\\'")

					plus.io.resolveLocalFileSystemURL(dirName + fileName, function (entry) {
						var _fileName = entry.fullPath.split('/');
						_fileName = _fileName[_fileName.length - 2];
						var _dom = document.getElementById("ev-attach_" + _fileName);

						if (_dom) {
							_dom.innerText = "已下载";
							_dom.setAttribute("data-value", "true");
						}
					}, function (e) {
						//console.log(e);
					});

					html.push("<div class='ev-attach-desc'><span>" + item[5][1] + "</span> <span id='ev-attach_" + item[5][2] + "' class='attach-isdown' data-value='" + isDownload + "'>" + (isDownload ? '已下载' : '未下载') + "</span></div>");
					html.push("<p class='attach-process'></p>")
					break;
			}
			html.push("</div>");
			html.push("</div>");
			return html.join("");
		}
	},
	transAttach: function (item, transType, isSend) {
		if (transType > 1) {
			if(item[4] && item[4][0]==3)
			{
				return "[短视频]";
			}
			return "[文件]";
		} else {
			var html = [];

			var isDownload = false;

			var dirName = "",
				fileName = item[1];

			var filePath = item[3].split("\\");
			filePath = filePath[filePath.length - 1].split(".")[0]
			dirName = "_doc/downloads/" + filePath + "/";

			if (item[3].startsWith("file://")) {
				isDownload = true;
				dirName = "";
				fileName = item[3];
			}

			if (!item[3].startsWith("file://")) {
				fileName = fileName.replace(/\'/g, "\\'")
				plus.io.resolveLocalFileSystemURL(dirName + fileName, function (entry) {

					var _fileName = entry.fullPath.split('/');
					_fileName = _fileName[_fileName.length - 2];
					var _dom = document.getElementById("attach_" + _fileName);

					if (_dom) {
						_dom.innerText = "已下载";
						_dom.setAttribute("data-value", "true");
					}
				}, function () {});
			}

			if(item[4] && item[4][0]==3)
			{
				html.push("<div class='svideo-item' style='margin-top: -20px;margin-bottom: -10px;' data-file='" + item[3] + "'> ");
				html.push("<div style='text-align:center;'>")
				html.push("<img src='../../images/chat/wqdsp.jpg' />");
				html.push("</div>");
				html.push("</div>");
			}
			else
			{
				html.push("<div class='attach-item' style='min-height:65px' data-file='" + item[3] + "'> ");

				var names = item[1].split('.');
				var imgKey = transMessage.getImgKey('.' + names[names.length - 1]);

				html.push("<div class='left-img' style='background-image:url(http://down.maidiyun.com/chat/" + imgKey + ".png)'></div>");

				html.push("<div class='attach-body'>");
				html.push("<div class='attach-title'>" + item[1] + "</div>");
				html.push("<div class='attach-desc'><span>" + item[2] + "</span> <span id='attach_" + filePath + "' class='attach-isdown' data-value='" + isDownload + "'>" + (isDownload ? '已下载' : '未下载') + "</span></div>");
				html.push("<p class='attach-process'></p>");
				html.push("</div>");
				html.push("</div>");
			}

			
			return html.join("");
		}
	},
	//组装普通聊天消息
	packSimple: function (packData, transData) {
		var msg = {
			MsgID: UUID(),
			ReceiveID: packData.chatId,
			ReceiveName: packData.chatName,
			ReceiveCompID: packData.chatCompId,
			chatLogo: packData.hasLogo,
			ULogoIsExist: packData.chatLogo,
			RemarkName: packData.reName || packData.userName,
			SendName: packData.userName,
			SendTime: new Date().Format("yyyy-MM-dd HH:mm:ss"),
			SendID: packData.userId,
			SendState: 0,
			IsUpload: false,
			Content: transData,
			MsgType: 0,
			RealType: packData.type,
			UpLoadCallBack: ""
		};
		if (!transData) {
			var text = [0, this.getContent(packData.content, packData.type)];

			msg.Content = JSON.stringify(text);
		}

		return msg;
	},
	//组装群聊天消息
	packGroupSimple: function (packData,transData) {
		var msg = {
			MsgID: UUID(),
			ReceiveID: packData.GroupCode,
			GroupCode: packData.GroupCode,
			GroupName: packData.GroupName,
			RemarkName: packData.reName || packData.userName,
			SendName: packData.userName,
			SendTime: new Date().Format("yyyy-MM-dd HH:mm:ss"),
			SendID: packData.userId,
			SendState: 0,
			IsUpload: false,
			Content: transData,
			MsgType: 0,
			RealType: packData.type,
			UpLoadCallBack: "",
			isGroup: true
		};
		if (!transData) {
			var text = [0, this.getContent(packData.content, packData.type)];

			msg.Content = JSON.stringify(text);
		}

		return msg;
	},
	getContent: function (content, msgType) {
		switch (msgType) {
			case 1: //普通消息 可能包含 文字、表情、连接、富文本
				var _last_index = 0;
				var contents = [];
				content.replace(/<img(\s+[^=\s]+\s*=\s*['"][^'"]*['"])*\s*>/ig, function ($0, $1, _index) {
					if (_last_index !== _index) {
						contents.push(content.substring(_last_index, _index))
					}
					contents.push($0);
					_last_index = _index + $0.length;
					return "";
				});
				if (_last_index !== content.length) {
					contents.push(content.substr(_last_index));
				}

				var result = [];
				contents.forEach(function (x) {
					//判断是不是表情
					if (x.match(/<img.*?(?:>|\/>)/gi)) {
						var values = x.match(/[\[][\u4e00-\u9fa5A-Za-z0-9]{1,10}[\]]/g)
						if (values) {
							result.push([2, values[0]]);
						} else {
							result.push([1, x]);
						}
					} else {
						result.push([1, x]);
					}
				});

				return result;
				break;
			case 4: //图片
			case -4:
				var result = [];
				result.push([4, content]);
				return result;
				break;
			case 5: //附件
				var result = [];
				result.push([5, content.fileName, content.fileSize, content.filePath,[content.fileType || 0 ]]);
				return result;
				break;
			case 6:
				var result = [];
				result.push([6, content.file, content.time]);
				return result;
				break;
			case 7:
				var result = [];
				result.push(7);
				result.push(content.eventName);
				result.push(content.logo);
				result.push(content.title);
				result.push(content.desc);
				result.push(content.params);
				return [result];
				break;
			default:
				return "";
				break;
		}
	},
	//获取相应类型的img key
	getImgKey: function (fileExt) {
		var imgKey = "";
		switch (fileExt) {
			case ".doc":
			case ".docx":
				imgKey = "word";
				break;
			case ".xlsx":
			case ".xls":
				imgKey = "excel";
				break;
			case ".pdf":
				imgKey = "pdf";
				break;
			case ".ppt":
			case ".pptx":
				imgKey = "ppt";
				break;
			case ".rar":
			case ".zip":
			case ".7z":
				imgKey = "zip";
				break;
			case ".igs":
			case ".iges":
			case ".step":
			case ".stp":
			case ".sldprt":
			case ".sldasm":
			case ".catpart":
			case ".captroduct":
			case ".prt":
			case ".asm":
			case ".ipt":
			case ".iam":
			case ".z3":
			case ".ipt":
				imgKey = "3d";
				break;
			case ".dwg":
			case ".dxf":
			case ".drw":
			case ".slddrw":
			case ".catdrawing":
			case ".idw":
			case ".exb":
				imgKey = "2d";
				break;
			case ".mp4":
			case ".3gp":
			case ".mpg":
			case ".mpeg":
			case ".avi":
			case ".rm":
			case ".rmvb":
			case ".mov":
			case ".wkv":
			case ".flv":
				imgKey = "viceo";
				break;
			case ".jpg":
			case ".jpeg":
			case ".gif":
			case ".png":
				imgKey = "img";
				break;
			default:
				imgKey = "other";
				break;
		}

		return imgKey;
	},
	saveToDrive: function (attachId, fielGuid, fileName,dirId) {

		var url = dom.properties.ApiService.Pan + "/api/v1/DriveAttach/FileSaveAsDriveFile?dirId="+(dirId || 0);
		if (attachId) {
			url += "&attachFileGuid=" + (attachId || "");
		} else {
			url += "&fileGuid=" + (fielGuid || "");
			url += "&fileName=" + (fileName || "");
		}

		dom.properties.DataService.post(url, {}).then(function (res) {
			mui.toast("文件已转存", {
				duration: 1300,
				type: 'div'
			});
		}, function (res) {})
	}
};