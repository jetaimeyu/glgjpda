//mui事件
var muiObj = {
	init: function() {
		mui.init({
			keyEventBind: {
				backbutton: true //打开back按键监听
			},
			gestureConfig: {
				drag: true
			},
			beforeback: function() {
				hideWaiting();
				plus.webview.currentWebview().close();
				return false;
			}
		});
		mapObj.init();

		muiObj.ready();
	},
	readyEvent: function() {

		dom.picker.init();

		user.ready(function() {});

		dom.event.initCustomTools();
	},
	ready: function() {
		mui.plusReady(muiObj.readyEvent);
	}
};

//地图
var mapObj = {
	map: "",
	properties: {
		_zoom: 11,
		zoom: 11,
		showCountZoom: 9
	},
	//初始化
	init: function() {
		//渲染地图
		mapObj.renderMap();

		//地图事件
		mapObj.event.init();

	},
	//渲染地图
	renderMap: function() {
		mapObj.map = new AMap.Map('gdMap', {
			resizeEnable: true,
			zoom: mapObj.properties._zoom
		});
	},
	//事件 
	event: {
		//加载地图事件
		init: function() {
			this.complate.init();
			//初始化zoom事件
			mapObj.event.zoom.init();
			mapObj.event.move.init();

			mapObj.map.on("click", function() {
				mapObj.ui.markerList.clearSelected();
			})
			this.location();
		},
		complate: {
			init: function() {
				mapObj.map.on('complete', function() {

					//加载地图插件
					mapObj.plugin.load();

					//加载ui
					mapObj.ui.load();
				});
			}
		},
		zoom: {
			canZoom: true,
			init: function() {
				mapObj.map.on("zoomend", function(e, h) {
					var zoom = mapObj.map.getZoom();

					if(mapObj.event.zoom.canZoom) {
						if(mapObj.properties.zoom < mapObj.properties.showCountZoom && zoom >= mapObj.properties.showCountZoom) {
							curData.isLoadData = true;
						} else if(mapObj.properties.zoom >= mapObj.properties.showCountZoom && zoom < mapObj.properties.showCountZoom) {
							curData.isLoadCount = true;
						} else if(zoom >= mapObj.properties.showCountZoom) {
							mapObj.ui.markerList.reRender();
						}
					} else {
						mapObj.event.zoom.canZoom = true;
					}

					curData.loadData();

					mapObj.properties.zoom = zoom;

				});
			}
		},
		move: {
			caneMove: true,
			init: function() {
				mapObj.event.move.start();
				mapObj.event.move.end();
			},
			start: function() {
				mapObj.map.on("movestart", function() {
					if(mapObj.properties.zoom < mapObj.properties.showCountZoom) {
						return;
					}

				});
			},
			end: function() {
				mapObj.map.on("moveend", function(e) {
					if(!vm.curPosition.isLocation) {
						return;
					}

					if(mapObj.properties.zoom < mapObj.properties.showCountZoom) {
						mapObj.event.move.caneMove = false;
					}

					if(mapObj.event.move.caneMove) {
						mapObj.plugin.location.cityInfo();
						mapObj.ui.markerList.clearSelected();
					} else {
						mapObj.event.move.caneMove = true;
					}
				});
			}
		},
		location: function() {
			mui("body").on("tap", ".location_self", function() {
				if(vm.curPosition.isLocation) {
					mapObj.map.setZoomAndCenter(10, vm.curPosition.position)
				} else {
					mui.toast("正在定位...");
				}
			});
		}
	},
	tools: {
		marker: {
			data: [],
			event: {
				click: function(event) {
					mapObj.event.zoom.canZoom = false;
					//mapObj.ui.markerList.autoView = true;

					var data = event.target.getExtData();

					vm.curPosition.province = data.province;
					vm.curPosition.city = data.city;

					event.target.setLabel({
						offset: new AMap.Pixel(3, 2),
						content: "<div class='point_comp'><div class='div_count '><div class='mui-spinner' style='margin-top:10px;'></div><div></div>"
					});
					curData.isLoadData = true;
					curData.loadData();
					mapObj.ui.markerList.autoView = true;
					mapObj.map.setCity(data.city, function() {
						setTimeout(function() {
							mapObj.map.setZoom(mapObj.properties._zoom);
						}, 200)
					});

					//mapObj.map.setZoomAndCenter(10, [event.lnglat.getLng(), event.lnglat.getLat()]);
				}
			},
			render: function(data) {
				//清空markerlist
				mapObj.ui.markerList.clearData();

				//清空汇总图标
				this.clearData();

				//if(data.length != mapObj.tools.marker.data.length) {
				mapObj.tools.marker.data = [];
				//}

				if(mapObj.tools.marker.data.length > 0) {
					for(var i = 0; i < mapObj.tools.marker.data.length; i++) {
						var marker = mapObj.tools.marker.data[i];
						var data = marker.getExtData();
						marker.setLabel({
							offset: new AMap.Pixel(3, 2),
							content: "<div class='point_comp'><div class='div_count' >" + (data.Count > 99 ? "99+" : data.Count) + "</div></div></div>"
						});

						marker.setMap(mapObj.map);
					}
					hideWaiting();
				} else {
					mapObj.tools.marker.create(data);
				}
			},
			clearData: function() {
				for(var i = 0; i < mapObj.tools.marker.data.length; i++) {
					mapObj.tools.marker.data[i].setMap(null);
				}
			},
			getMarker: function(data, position) {
				var content = "<div class='point_comp'><div class='div_count' >" + (data.Count > 99 ? "99+" : data.Count) + "<div class='div_count_tips'></div></div></div>";

				var marker = new AMap.Marker({
					map: mapObj.map,
					position: [position.location.getLng(), position.location.getLat()],
					label: {
						offset: new AMap.Pixel(3, 2),
						content: content
					},
					topWhenClick: true,
					extData: data,
					icon: new AMap.Icon({
						size: new AMap.Size(40, 25), //图标大小
						image: "images/map/point_count_tips.png",
						imageSize: new AMap.Size(40, 25),
						imageOffset: new AMap.Pixel(-1222, 2)
					}),
					offset: new AMap.Pixel(-20, -30)
				});
				marker.on('click', mapObj.tools.marker.event.click);
				mapObj.tools.marker.data.push(marker);
			},
			create: function(data) {
				for(var i = 0; i < data.length; i++) {
					mapObj.plugin.geocoder.getPointByAddr(data[i], function(dt, position) {
						mapObj.tools.marker.getMarker(dt, position);
					});
				}
				hideWaiting();
			}
		}
	},
	//插件
	plugin: {
		load: function() {
			//加载定位插件
			mapObj.plugin.location.load();

			mapObj.plugin.geocoder.load();
		},
		location: {
			obj: "",
			load: function() {
				mapObj.map.plugin('AMap.Geolocation', function() {
					mapObj.plugin.location.obj = new AMap.Geolocation({
						enableHighAccuracy: true, //是否使用高精度定位，默认:true
						timeout: 10000, //超过10秒后停止定位，默认：无穷大
						buttonOffset: new AMap.Pixel(10, 20), //定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
						zoomToAccuracy: false, //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
						buttonPosition: 'LB',
						showButton: false,
						panToLocation: true,
						showCircle: false,
						GeoLocationFirst: true,
					});
					mapObj.map.addControl(mapObj.plugin.location.obj);

					AMap.event.addListener(mapObj.plugin.location.obj, 'complete', onComplete); //返回定位信息
					AMap.event.addListener(mapObj.plugin.location.obj, 'error', onError); //返回定位出错信息

					//解析定位结果
					function onComplete(data) {
						console.log(JSON.stringify(data));

						var address = data.addressComponent;

						var bdPosition = mapObj.pointTrasnForm.gcj02tobd09(data.position.lng, data.position.lat);
						vm.curPosition.position = bdPosition;
						if(vm.curPosition.city != address.city) {
							vm.curPosition.province = address.province;
							vm.curPosition.city = address.city;
							vm.curPosition.district = address.district;
							if(mapObj.properties.zoom >= mapObj.properties.showCountZoom) {
								curData.isLoadData = true;
							}
						}
						vm.curPosition.isLocation = true;
						curData.loadData();

					}

					//解析定位错误信息
					function onError(data) {
						//定位失败后加载城市信息
						mapObj.plugin.location.cityInfo(true);
					}

					mapObj.plugin.location.obj.getCurrentPosition();
				});
			},
			//获取当前城市的信息
			cityInfo: function(isPoint) {
				mapObj.map.getCity(function(res) {
					if(isPoint) {
						var center = mapObj.map.getCenter();
						var bdPosition = mapObj.pointTrasnForm.gcj02tobd09(center.lng, center.lat);
						vm.curPosition.position = bdPosition;
						vm.curPosition.isLocation = true;
						//添加定位地点

						var marker = new AMap.Marker({
							map: mapObj.map,
							position: [center.lng, center.lat],
							icon: new AMap.Icon({
								size: new AMap.Size(23, 23), //图标大小
								image: "http://webapi.amap.com/theme/v1.3/markers/b/loc.png",
								imageSize: new AMap.Size(23, 23),
								imageOffset: new AMap.Pixel(2, 2)
							})
						});
					}
					if(res.city || res.province) {
						if(vm.curPosition.city != (res.city || res.province)) {
							vm.curPosition.province = res.province;
							vm.curPosition.city = res.city || res.province;
							vm.curPosition.district = res.district;
							if(mapObj.properties.zoom >= mapObj.properties.showCountZoom) {
								curData.isLoadData = true;
							}
						} else if(mapObj.properties.zoom >= mapObj.properties.showCountZoom) {
							mapObj.ui.markerList.reRender();
						}

						curData.loadData();
					}

				});
			}
		},
		geocoder: {
			obj: "",
			load: function() {
				mapObj.map.plugin('AMap.Geocoder', function() {

					mapObj.plugin.geocoder.obj = new AMap.Geocoder({
						radius: 1000 //范围，默认：500
					});
				});
			},
			getPointByAddr: function(data, callback) {
				mapObj.plugin.geocoder.obj.getLocation(data.province + data.city, function(status, result) {
					if(status === 'complete' && result.info === 'OK') {

						var geocode = result.geocodes;
						if(geocode.length > 0) {
							if(typeof callback == "function") {
								callback(data, geocode[0])
							}
						}
					}
				})
			}
		}
	},
	ui: {
		load: function() {
			mapObj.ui.markerList.load();
			mapObj.ui.control.load();
		},
		control: {
			load: function() {
				AMapUI.loadUI(['control/BasicControl'], function(BasicControl) {
					//添加一个缩放控件
					mapObj.map.addControl(new BasicControl.Zoom({
						position: "lt",
						theme: 'my',
						showZoomNum: false
					}));
				});
			}
		},
		markerList: {
			obj: "",
			autoView: false,
			properties: {},
			list: document.querySelector(".map_comp_list"),
			showList: function() {
				if(mapObj.ui.markerList.list.style.visibility == "hidden") {
					mapObj.ui.markerList.list.style.visibility = "visible";
				}
			},
			hideList: function() {
				mapObj.ui.markerList.list.style.visibility = "hidden";
			},
			selected: null,
			markers: [],
			//获取普通节点的样式
			getSimplePoint: function(id, data) {
				if((mapObj.map.getBounds().contains(data.position) && mapObj.ui.markerList.markers.length < 10) || mapObj.ui.markerList.markers.indexOf(data.id) >= 0) {

					if(mapObj.ui.markerList.markers.indexOf(data.id) < 0) {
						mapObj.ui.markerList.markers.push(data.id);
					}

					var content = "<div class='point_comp'><div class='simple_point'>" + (mapObj.ui.markerList.markers.indexOf(data.id) + 1) + "</div></div>";
					var offset = new AMap.Pixel(-28, -55);

					return [content, offset, 200 + data.index];
				} else {
					var content = "<div class='point_comp' ><div class='red_point'></div></div>";
					var offset = new AMap.Pixel(-13, -17);
					return [content, offset, 100];
				}
			},
			//获取选中节点的样式
			getSelectedPoint: function(id, data) {

				var content = "<div class='point_comp'><div class='selected_point'><img class='bigPoint' src='http://pic.maidiyun.com/Y29tcC9sb2dv_" + id + "_69x69.png'/></div></div>";

				var offset = null;
				if(mapObj.ui.markerList.markers.indexOf(data.id) >= 0) {
					offset = new AMap.Pixel(-50, -110);
				} else {
					offset = new AMap.Pixel(-45, -90)
				}

				return [content, offset];
			},
			load: function() {
				AMapUI.loadUI(['misc/MarkerList'], function(MarkerList) {
					mapObj.ui.markerList.obj = new MarkerList({
						map: mapObj.map,
						autoSetFitView: false,
						listContainer: "map_comp_list",
						getListElement: function(data, context, recycledListElement) {
							if(mapObj.map.getBounds().contains(context.position)) {

								var innerHtml = MarkerList.utils.template(
									'<div class="swiper-slide needsclick">' +
									'<div class="comp_row">' +
									'<div class="comp_info">' +
									'<img src="http://pic.maidiyun.com/Y29tcC9sb2dv_<%-data.CompID%>_40x40.png" class="comp_info_logo" />' +

									'<div class="comp_info_box">' +
									'<div class="comp_item_kefu" data-id="<%-data.CompID%>"><img src="../../images/industry/kefux2.png" /></div>' +
									'<div class="box_title"><%-data.CompName%></div>' +
									'<div class="box_distance">距您：<span><%-(data.Distance / 1000).toFixed(2)%>km</span></div>' +
									'<div class="box_content  <%-data.Tags.length>0?"":"noTag"%>">主营：<%-data.MainProduct%></div>' +
									'</div>' +
									'</div>' +
									'<div class="comp_tag" style="display:<%-data.Tags.length>0?"block":"none"%>">' +
									'<% for (var i=0;i<data.Tags.length;i++){%>' +
									'<span><%-data.Tags[i].CName%>(<%-data.Tags[i].Count%>)</span>' +
									'<%}%>' +
									'</div>' +
									'</div>', {
										data: data
									}
								);
								return innerHtml;
							} {
								return null
							}
						},
						getDataId: function(dataItem, index) {
							//返回数据项的Id
							return index;
						},
						getPosition: function(dataItem) {
							//返回数据项的经纬度，AMap.LngLat实例或者经纬度数组
							var position = mapObj.pointTrasnForm.bd09togcj02(dataItem.MapLng, dataItem.MapLat);
							return position;
						},
						getMarker: function(dataItem, context, recycledMarker) {

							var markerData = mapObj.ui.markerList.getSimplePoint(dataItem.CompID, context);

							//							if(recycledMarker) {
							//								//存在可回收利用的marker,直接setLabel返回
							//								recycledMarker.setLabel(markerData[0]);
							//								recycledMarker.setIcon(markerData[1]);
							//								recycledMarker.setOffset(markerData[2]);
							//								return recycledMarker;
							//							}

							//返回一个新的Marker
							return new AMap.Marker({
								content: markerData[0],
								topWhenClick: true,
								zIndex: markerData[2],
								offset: markerData[1]
							});
						},
						getInfoWindow: function() {
							return null;
						},
						onSelected: function(event, info) {

							if(!info.selected) {
								return;
							}
							mapObj.event.move.caneMove = false;
							mapObj.ui.markerList.selectedData(info.selected)
						}
					});

					mapObj.ui.markerList.obj.on('selectedChanged', function(event, info) {

						//						if(!info.selected) {
						//							return;
						//						}
						//
						//						setTimeout(function() {
						//							mapObj.ui.markerList.selectedData(info.selected);
						//						}, 50);

					});

					mapObj.ui.markerList.obj.on("renderComplete", function() {
						if(dom.plugin.swiper.obj) {
							dom.plugin.swiper.obj.destroy(true, true);
							dom.plugin.swiper.obj = "";
						}
						dom.plugin.swiper.init();
						var markers = mapObj.ui.markerList.obj.getAllMarkers();
						if(mapObj.ui.markerList.autoView && markers.length > 0) {

							var isHave = false;

							for(var i = 0; i < markers.length; i++) {
								if(mapObj.map.getBounds().contains(markers[i].getPosition())) {
									isHave = true;
									break;
								}
							}

							if(!isHave && markers.length > 0) {
								mapObj.map.setCenter(markers[0].getPosition());
							}
							mapObj.ui.markerList.autoView = false;
						}
						hideWaiting();
					});
				});
			},
			selectedData: function(selectedData) {
				if(mapObj.ui.markerList.selected && mapObj.ui.markerList.selected.index == selectedData.index) {
					return;
				}
				selectedData.marker.setTop(true);

				if(mapObj.ui.markerList.selected) {
					var markerData = mapObj.ui.markerList.getSimplePoint(mapObj.ui.markerList.selected.data.CompID, mapObj.ui.markerList.selected);

					mapObj.ui.markerList.selected.marker.setContent(markerData[0]);
					mapObj.ui.markerList.selected.marker.setOffset(markerData[1]);
					mapObj.ui.markerList.selected.marker.setTop(false);

				}

				mapObj.ui.markerList.selected = selectedData;

				dom.plugin.swiper.isSwiper = false;
				dom.plugin.swiper.obj.slideTo(selectedData.index, 0);

				mapObj.ui.markerList.showList();

				var markerData = mapObj.ui.markerList.getSelectedPoint(selectedData.data.CompID, selectedData);
				mapObj.ui.markerList.selected.marker.setContent(markerData[0]);
				mapObj.ui.markerList.selected.marker.setOffset(markerData[1]);

				dom.plugin.swiper.isSwiper = true;

				setTimeout(function() {
					mapObj.event.move.caneMove = true;
				}, 500);
			},
			clearSelected: function() {
				if(mapObj.ui.markerList.selected) {
					var markerData = mapObj.ui.markerList.getSimplePoint(mapObj.ui.markerList.selected.data.CompID, mapObj.ui.markerList.selected);

					mapObj.ui.markerList.selected.marker.setContent(markerData[0]);
					mapObj.ui.markerList.selected.marker.setOffset(markerData[1]);
					mapObj.ui.markerList.selected = null;

					mapObj.ui.markerList.hideList();
				}
			},
			clearData: function() {
				mapObj.ui.markerList.obj.clearData();
				mapObj.ui.markerList.clearSelected();
			},
			renderData: function(data) {
				!data && (data=[]);
				if(!mapObj.event.zoom.canZoom) {
					mapObj.event.zoom.canZoom = true;
				}

				var center = mapObj.map.getCenter();

				var newData = data.map(function(_item) {
					var _data = _item;
					_item["cc"] = center.distance([_item.MapLng, _item.MapLat]);
					return _item;
				});

				newData.sort(compare("cc"));

				mapObj.ui.markerList.markers = [];
				mapObj.tools.marker.clearData();
				mapObj.ui.markerList.clearData();
				mapObj.ui.markerList.obj.render(newData);
			},
			reRender: function() {

				var data = mapObj.ui.markerList.obj.getData();

				mapObj.ui.markerList.renderData(data);
			}
		}
	},
	//坐标转换
	pointTrasnForm: {
		x_PI: 3.14159265358979324 * 3000.0 / 180.0,
		PI: 3.1415926535897932384626,
		//百度坐标转高德坐标
		bd09togcj02: function(bd_lon, bd_lat) {
			var x = bd_lon - 0.0065;
			var y = bd_lat - 0.006;
			var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * mapObj.pointTrasnForm.x_PI);
			var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * mapObj.pointTrasnForm.x_PI);
			var gg_lng = z * Math.cos(theta);
			var gg_lat = z * Math.sin(theta);
			return [gg_lng, gg_lat]
		},
		//高德坐标转百度坐标
		gcj02tobd09: function(lng, lat) {
			var z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * mapObj.pointTrasnForm.x_PI);
			var theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * mapObj.pointTrasnForm.x_PI);
			var bd_lng = z * Math.cos(theta) + 0.0065;
			var bd_lat = z * Math.sin(theta) + 0.006;
			return [bd_lng, bd_lat]
		}
	}
};

var compare = function(prop) {
	return function(obj1, obj2) {
		var val1 = obj1[prop];
		var val2 = obj2[prop];
		if(!isNaN(Number(val1)) && !isNaN(Number(val2))) {
			val1 = Number(val1);
			val2 = Number(val2);
		}
		if(val1 < val2) {
			return -1;
		} else if(val1 > val2) {
			return 1;
		} else {
			return 0;
		}
	}
}

var dom = {
	properties: {
		isOpenKeFu: false
	},
	event: {
		init: function() {
			dom.event.initChoosePicker();

			dom.event.initSearch();

			dom.event.initComps();
		},
		initChoosePicker: function() {
			document.querySelector("#address_text").addEventListener("tap", function() {

				if(vm.curPosition.isLocation) {
					dom.picker.show();
				} else {
					mui.toast("正在定位...");
				}
			});
		},
		initSearch: function() {

			document.querySelector(".search-class").addEventListener("tap", function() {
				openWindow("search-condition.html", {
					callback: "dom.event.searchCallback",
					search_title: vm.search.key,
					search_classList: vm.search.class
				}, "search-condition.html");
			});

			mui(".search-box")
				.on("tap", "input", function() {
					if(vm.curPosition.isLocation) {
						openWindow("search-condition.html", {
							callback: "dom.event.searchCallback",
							search_title: vm.search.key,
							search_classList: vm.search.class
						}, "search-condition.html");
					} else {
						mui.toast("正在定位...");
					}
				}).on("tap", ".clear-input", function() {
					vm.search.key = "";
					vm.search.class = {};
					dom.event.search();
				});
		},
		searchCallback: function(data) {
			if(typeof data == "string") {
				data = JSON.parse(data);
			}

			vm.search.key = data.search_title;
			if(!vm.search.key) {
				vm.search.class = data.search_classList;
			} else {
				vm.search.class = {};
			}

			dom.event.search();
		},
		search: function() {
			mapObj.ui.markerList.autoView = true;
			if(mapObj.properties.zoom < mapObj.properties.showCountZoom) {
				curData.loadMapCount();
			} else {
				curData.loadMapData();
			}
		},
		openCompInfo: function(data) {
			openWindow("comp-info.html?id=" + data.CompID, {
				data: data
			})
		},
		initComps: function() {
			mui(".map_comp_list").on("tap", ".comp_item_kefu", function(e) {
				//				e.stopPropagation();
				//				var compID = this.getAttribute("data-id");
				//
				//				openWindow("../company/compconsulting.html?id=" + compID);
			})
		},
		initCustomTools: function() {
			mui(".custom-tools").on("tap", ".tools-item-body", function() {
				var url = this.getAttribute("data-url");
				var nl = this.getAttribute("nl");
				var userType = this.getAttribute("user-type");
				dom.event.openWindow(url, userType, nl);
			});
		},
		openWindow: function(href, userType, nl) {
			if(nl == "1" && user.Token) {
				if(userType && user.UserType != userType) {
					mui.toast("此操作是企业用户行为，请升级成为企业用户！");
					return;
				}
				openWindow(href);
			} else if(nl == "" || nl == "0" || nl == null) {
				openWindow(href);
			} else {
				dom.event.openLogin(function() {
					user.ready(function() {
						if(user.Token && user.UserID > 0) {
							if(userType && user.UserType != userType) {
								mui.toast("此操作是企业用户行为，请升级成为企业用户！");
								return;
							}
							openWindow(href);
						}
					});
				});
			}
		},
		openLogin: function(callback) {
			var loginView = muiOpenWindow("../login/login.html");
			loginView.addEventListener("close", function() {
				if(typeof callback == "function") {
					callback();
				}
			})
		}
	},
	plugin: {
		swiper: {
			isSwiper: false,
			obj: "",
			init: function() {
				dom.plugin.swiper.obj = new Swiper('.swiper-container', {
					//					roundLengths: true,
					//					speed: 600,
					//					initialSlide: 2,
					//					slidesPerView: "auto",
					//					centeredSlides: true,
					//					followFinger: false,
					//					watchSlidesProgress: true,
					loop: false,
					onProgress: function(swiper) {
						//						for(var i = 0; i < swiper.slides.length; i++) {
						//							var slide = swiper.slides[i];
						//							var progress = slide.progress;
						//							scale = 1 - Math.min(Math.abs(progress * 0.2), 1);
						//
						//							es = slide.style;
						//							es.opacity = 1 - Math.min(Math.abs(progress / 2), 1);
						//							es.webkitTransform = es.MsTransform = es.msTransform = es.MozTransform = es.OTransform = es.transform = 'translate3d(0px,0,' + (-Math.abs(progress * 150)) + 'px)';
						//
						//						}
					},
					onTap: function(swiper, event) {
						var selectedidx = mapObj.ui.markerList.selected ? mapObj.ui.markerList.selected.index : "";

						if(swiper.activeIndex == selectedidx) {
							dom.event.openCompInfo(mapObj.ui.markerList.selected.data)

						}
					},
					onInit: function(swiper) {
						swiper.update(true);
					},
					onSetTransition: function(swiper, speed) {
						//						for(var i = 0; i < swiper.slides.length; i++) {
						//							es = swiper.slides[i].style;
						//							es.webkitTransitionDuration = es.MsTransitionDuration = es.msTransitionDuration = es.MozTransitionDuration = es.OTransitionDuration = es.transitionDuration = speed + 'ms';
						//						}
					},
					onTransitionEnd: function(swiper) {
						var selectedidx = mapObj.ui.markerList.selected ? mapObj.ui.markerList.selected.index : "";
						if(swiper.activeIndex != selectedidx) {
							mapObj.ui.markerList.obj.selectByDataIndex(swiper.activeIndex)
						}
					}
				});
			}
		}
	},
	picker: {
		obj: "",
		properties: {
			path: "../common/pickareas.html",
			id: "comp-map-pickareas"
		},
		init: function() {
			if(plus.webview.getWebviewById(dom.picker.properties.id)) {
				plus.webview.getWebviewById(dom.picker.properties.id).close();
			}

			//创建选型界面
			dom.picker.obj = plus.webview.create(dom.picker.properties.path, dom.picker.properties.id, {
				height: "400px",
				margin: "auto",
				scrollIndicator: 'none',
				scalable: false,
				bottom: '0',
				background: 'transparent',
				popGesture: 'none'
			}, {
				callback: "dom.picker.callback",
				opener: plus.webview.currentWebview().id
			});

			//选型界面隐藏事件
			dom.picker.obj.addEventListener("hide", function() {
				plus.webview.currentWebview().setStyle({
					mask: "none"
				});
			});

			//当前窗口关闭事件
			plus.webview.currentWebview().addEventListener("close", function() {
				dom.picker.obj.close("none");
			});

			//遮罩点击事件
			//遮罩点击事件
			plus.webview.currentWebview().addEventListener("maskClick", function() {
				dom.picker.hide();
			}, false);

		},
		callback: function(province, city, district) {
			mapObj.ui.markerList.clearData();
			mapObj.event.zoom.canZoom = false;
			mapObj.ui.markerList.autoView = true;
			mapObj.map.setCity(city, function() {
				setTimeout(function() {
					mapObj.map.setZoom(mapObj.properties._zoom);
				}, 200)
			});

			dom.picker.hide();
		},
		show: function() {
			dom.picker.obj.show('slide-in-bottom', 300);
			dom.picker.obj.evalJS("loadData('" + vm.curPosition.province + "','" + vm.curPosition.city + "','',2)")
			plus.webview.currentWebview().setStyle({
				mask: "rgba(0,0,0,0.2)"
			});
		},
		hide: function() {
			dom.picker.obj.hide("slide-out-bottom", 200);
			plus.webview.currentWebview().setStyle({
				mask: "none"
			});
		}
	}
};

function searchReLoad(key) {
	if(vm.search.key == key) {
		plus.webview.getWebviewById("comp-map-search.html").close();
	}
	vm.search.key = key;
}

var curData = {
	MapData: {},
	isLoadData: false,
	isLoadCount: false,
	loadData: function() {
		if(this.isLoadData) {
			this.isLoadData = false;
			this.loadMapData();
		} else if(this.isLoadCount) {
			this.isLoadCount = false;
			this.loadMapCount();
		}
	},
	loadMapData: function() {
		if(curData.MapData[vm.curPosition.city] && !vm.search.key && !vm.search.class.name) {
			mapObj.ui.markerList.renderData(curData.MapData[vm.curPosition.city])
		} else {
			curData.loadMapDataToService();
		}
	},
	loadMapDataToService: function() {
		showWaiting();
		//		var paths = vm.search.class.map(function(_item) {
		//			return _item.path;
		//		})
		var url = MdAppUrl.Api45 + "/api/v1.1/EpDemand/GetCompMap?mapLng=" + vm.curPosition.position[0] + "&mapLat=" + vm.curPosition.position[1] + "&province=" + vm.curPosition.province + "&city=" + vm.curPosition.city + "&district=" + vm.curPosition.district + "&key=" + (vm.search.key || "") + "&path=" + (vm.search.class.path || "");
		getAjaxData(url, function(res) {
			console.log(JSON.stringify(res))
			if(res && res.State > 0) {
				if(!vm.search.key && !vm.search.class.name) {
					curData.MapData[vm.curPosition.city] = res.Data.Rows;
				}

				mapObj.ui.markerList.renderData(res.Data.Rows)
			} else {

			}
		})
	},
	loadMapCount: function() {
		if(curData.MapData["count"] && !vm.search.key && !vm.search.class.name) {
			mapObj.tools.marker.render(curData.MapData["count"]);
		} else {
			curData.loadMapCountToService();
		}
	},
	loadMapCountToService: function() {
		showWaiting();
		//		var paths = vm.search.class.map(function(_item) {
		//			return _item.path;
		//		})
		var url = MdAppUrl.Api45 + "/api/v1.1/EpDemand/GetCompMapCount?key=" + (vm.search.key || "") + "&path=" + (vm.search.class.path || "");
		getAjaxData(url, function(res) {
//			console.log(JSON.stringify(res))
			if(res && res.State > 0) {
				if(!vm.search.key && !vm.search.class.name) {
					curData.MapData["count"] = res.Data;
				}
				mapObj.tools.marker.render(res.Data);
			} else {

			}
		})
	}
};

//avalon事件
var vm = avalon.define({
	$id: "myCtl",
	isShowCustom: false,
	//当前选择地点
	curPosition: {
		province: "",
		city: "定位中",
		district: "",
		isLocation: false,
		position: []
	},
	search: {
		key: "",
		class: {}
	}
});
mui.plusReady(function() {
	muiObj.init();
	dom.event.init();
});