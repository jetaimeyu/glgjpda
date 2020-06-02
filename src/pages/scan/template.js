var aniShow = "pop-in";
//只有ios支持的功能需要在Android平台隐藏；
if(mui.os.android) {
	aniShow = "slide-in-right";
}

var ws, embed, author, title, url, newsOroem;
//获取URL参数
function query(name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
	var r = decodeURI(window.location.search).substr(1).match(reg);
	if(r != null) return unescape(r[2]);
};

//初始化
var isWaitingClosed = false;
mui.init({
	beforeback: function() {
		if(!isWaitingClosed) {
			plus.nativeUI.closeWaiting();
		}
	}
});
mui.plusReady(function() {
	ws = plus.webview.currentWebview();
	console.log(JSON.stringify(ws))
	title = ws.title || query('title');
	url = ws.url || query('url');
	author = ws.author || query('author');
	newsOroem = ws.newsOroem;
	document.getElementById("title").innerText = author || title;

	if(!author) {
		document.body.querySelector("header>.icon-more-3")&&(document.body.querySelector("header>.icon-more-3").style.display = "none");
	}
	if(newsOroem == "oem") {
		document.querySelector(".mui-bar.mui-bar-nav.bg-white").className="mui-bar mui-bar-nav";
		document.querySelector(".force-black").className+="force-white";
		document.getElementById("title").className+="temp-title-white";
	}
	setTimeout(function() {
		plus.nativeUI.showWaiting('', {
			style: 'black',
			modal: false,
			background: 'rgba(0,0,0,0)'
		});

		embed = plus.webview.create(url, 'embed', {
			top: '44px',
			bottom: '0',
			scalable: true
		});
		ws.append(embed);

		var old_back = mui.back;
		mui.back = function(){
			embed.canBack(function(event) {
				var canBack = event.canBack;
				if(canBack) {
					embed.back();
				} else {
					old_back();
				}
			});
		}
		
		mui('body').on('tap','.icon-back',function(){
			if(mui.os.ios){
				mui.back();
			}else{
				old_back();
			}
		});

		embed.addEventListener('loaded', function() {
			if(!isWaitingClosed) {
				isWaitingClosed = true;
				plus.nativeUI.closeWaiting();
			}
		}, false);

		updateSerivces();

		setTimeout(function() {
			if(!isWaitingClosed) {
				isWaitingClosed = true;
				plus.nativeUI.closeWaiting();
			}
		}, 1500);

	}, 300);
});

/**
 * 更新分享服务
 */
function updateSerivces() {
	plus.share.getServices(function(s) {
		shares = {};
		for(var i in s) {
			var t = s[i];
			shares[t.id] = t;
		}
	}, function(e) {
		//		console.log( "获取分享服务列表失败："+e.message );
	});
}
/**
 * 分享操作
 * @param {JSON} sb 分享操作对象s.s为分享通道对象(plus.share.ShareService)
 * @param {Boolean} bh 是否分享链接
 */
function shareAction(sb, bh) {
	//	console.log( "分享操作：" );
	if(!sb || !sb.s) {
		//		console.log( "无效的分享服务！" );
		return;
	}
	var msg = {
		content: url,
		extra: {
			scene: sb.x
		}
	};
	if(bh) {
		msg.href = url;
		msg.title = title;
		msg.content = url;
		//		msg.thumbs=["_www/logo.png"];
		//		msg.pictures=["_www/logo.png"];
	} else {
		if(pic && pic.realUrl) {
			msg.pictures = [pic.realUrl];
		}
	}
	// 发送分享
	if(sb.s.authenticated) {
		//		console.log( "---已授权---" );
		shareMessage(msg, sb.s);
	} else {
		//		console.log( "---未授权---" );
		sb.s.authorize(function() {
			shareMessage(msg, sb.s);
		}, function(e) {
			//			console.log( "认证授权失败："+e.code+" - "+e.message );
		});
	}
}
/**
 * 发送分享消息
 * @param {JSON} msg
 * @param {plus.share.ShareService} s
 */
function shareMessage(msg, s) {
	//	console.log(JSON.stringify(msg));
	s.send(msg, function() {
		//		console.log( "分享到\""+s.description+"\"成功！ " );
	}, function(e) {
		//		console.log( "分享到\""+s.description+"\"失败: "+JSON.stringify(e) );
	});
}

function shareSystem() {
	var shareBts = [];
	// 更新分享列表
	var ss = shares['weixin'];
	if(navigator.userAgent.indexOf('qihoo') < 0) { //在360流应用中微信不支持分享图片
		ss && ss.nativeClient && (shareBts.push({
				title: '微信朋友圈',
				s: ss,
				x: 'WXSceneTimeline'
			}),
			shareBts.push({
				title: '微信好友',
				s: ss,
				x: 'WXSceneSession'
			}));
	}
	//	ss=shares['sinaweibo'];
	//	ss&&shareBts.push({title:'新浪微博',s:ss});
	ss = shares['qq'];
	ss && ss.nativeClient && shareBts.push({
		title: 'QQ',
		s: ss
	});
	// 弹出分享列表
	shareBts.length > 0 ? plus.nativeUI.actionSheet({
		title: '分享',
		cancel: '取消',
		buttons: shareBts
	}, function(e) {
		(e.index > 0) && shareAction(shareBts[e.index - 1], true);
	}) : plus.nativeUI.alert('当前环境无法支持分享操作!');

}